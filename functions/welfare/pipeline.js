const admin = require('firebase-admin');
const { loadServices } = require('./csvLoader');
const { normalizeService } = require('./normalizer');
const { buildUserContext } = require('./userContext');
const { selectCandidates } = require('./candidateFilter');
const { generateReport } = require('./llmNode');
const { runWelfareGraph } = require('./welfareGraph');

// Lazy initialization
let db = null;

function getDb() {
  if (!db) {
    db = admin.firestore();
  }
  return db;
}

// 캐싱을 위한 전역 변수 (Cold start 시에만 로드)
let cachedServices = null;

exports.runWelfarePipeline = async (userId) => {
  try {
    // 1. Load & Normalize Services
    if (!cachedServices) {
      console.log('Loading CSV data...');
      const rawServices = loadServices();
      cachedServices = rawServices.map(normalizeService);
    }
    const services = cachedServices;

    // 2. Build User Context
    console.log(`Building context for user: ${userId}`);
    const userContext = await buildUserContext(userId, getDb());

    // 3. Select Candidates (Rule-based)
    const candidates = selectCandidates(userContext, services);
    console.log(`Selected ${candidates.length} candidates`);

    if (candidates.length === 0) {
      console.log('No candidates found. Generating fallback report.');
      const fallback = createFallbackReport(userContext);
      await saveReport(userId, fallback);
      return { success: true, report: fallback };
    }

    // 4. LLM Reasoning with LangGraph Validation Loop
    let reportData;
    try {
      console.log('Calling LangGraph Pipeline...');
      reportData = await runWelfareGraph(userContext, candidates);
      
      // Post-validation: Ensure service names exist in candidates & Add Links
      reportData.services = reportData.services
        .map(s => {
          const original = candidates.find(c => c.name === s.name);
          if (original) {
            return {
              ...s,
              link: original.link || '' // 링크 추가
            };
          }
          return null;
        })
        .filter(s => s !== null);
      
      reportData.isFallback = false;
    } catch (llmError) {
      console.warn(`LangGraph Failed for user ${userId}, using fallback. Reason: ${llmError.message}`);
      reportData = createFallbackReport(userContext, candidates);
    }

    // 5. Save Report
    console.log('Saving report to Firestore...');
    await saveReport(userId, { ...reportData, metadata: userContext.stats });
    
    return { success: true, report: reportData };

  } catch (error) {
    console.error(`Pipeline Fatal Error for user ${userId}:`, error);
    return { success: false, error: error.message };
  }
};

// Fallback Logic (Deterministic)
function createFallbackReport(ctx, candidates = []) {
  const top3 = candidates.slice(0, 3);
  
  let riskMsg = '안정적인 이동 패턴을 보이고 있습니다.';
  if (ctx.stats.trend === 'decrease') {
    riskMsg = '최근 이동량이 줄어들어 외부 활동 지원이나 점검이 필요할 수 있습니다.';
  } else if (ctx.stats.trend === 'increase') {
    riskMsg = '이동량이 늘어나고 있습니다. 기기 점검에 유의하세요.';
  }

  return {
    summary: `최근 활동 데이터를 분석한 결과, 이동 추세는 '${ctx.stats.trend}' 상태입니다.`,
    risk: riskMsg,
    services: top3.map(s => ({
      name: s.name,
      reason: '사용자 프로필(연령, 장애여부) 및 이동 패턴을 기반으로 추천된 서비스입니다.'
    })),
    isFallback: true
  };
}

async function saveReport(userId, data) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  const raw = {
    ...data,
    userId,
    createdAt: now,
    period: {
      // 임시: 오늘 기준 주간
      start: admin.firestore.Timestamp.now(), 
      end: admin.firestore.Timestamp.now()
    }
  };

  const cleanData = sanitizeForFirestore(raw);

  // 리포트 저장 (덮어쓰기)
  await getDb().collection('user_welfare_reports').doc(userId).set(cleanData);
}

function sanitizeForFirestore(value) {
  if (value === undefined) return null;
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value.map(v => sanitizeForFirestore(v));
  }

  if (typeof value === 'object') {
    const cleaned = {};
    for (const [key, val] of Object.entries(value)) {
      cleaned[key] = sanitizeForFirestore(val);
    }
    return cleaned;
  }

  return value;
}
