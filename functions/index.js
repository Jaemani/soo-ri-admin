const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { SolapiMessageService } = require("solapi");

// V2.1: LLM 프롬프트 업데이트 - 전동보장구 컨텍스트 + mobilityServices/welfareServices 분리
admin.initializeApp();

// --- CONFIGURATION ---
// It's recommended to store secrets in environment variables
// firebase functions:config:set solapi.key="YOUR_API_KEY" solapi.secret="YOUR_API_SECRET"
const cfg = (() => {
  try {
    return functions.config();
  } catch (e) {
    return {};
  }
})();
const solapiKey = process.env.SOLAPI_KEY || (cfg.solapi && cfg.solapi.key) || '';
const solapiSecret = process.env.SOLAPI_SECRET || (cfg.solapi && cfg.solapi.secret) || '';
const senderPhoneNumber = process.env.SENDER_PHONE || "01058922434"; // From your .env file

const messageService = (solapiKey && solapiSecret)
  ? new SolapiMessageService(solapiKey, solapiSecret)
  : null;

// Callable function to send SMS
exports.sendSms = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const to = data.to; // Phone number to send to
  const text = data.text; // Message content

  if (!to || !text) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with two arguments "to" and "text".'
    );
  }

  try {
    if (!messageService) {
      console.warn('SOLAPI credentials not configured; returning mocked success');
      return { success: true, result: { mocked: true } };
    }
    const result = await messageService.sendOne({
      to: to,
      from: senderPhoneNumber,
      text: text,
    });
    console.log("SMS sent successfully: ", result);
    return { success: true, result };
  } catch (error) {
    console.error("SMS sending failed: ", error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send SMS.',
      error
    );
  }
});

// Mount HTTP API (Express) from api.js, if present
try {
  const api = require('./api');
  exports.api = api.api; // functions.https.onRequest(app)
} catch (e) {
  console.warn('api.js not found or failed to load:', e.message);
}

// ============================================
// V2 Worker Function - Cloud Tasks에서 호출
// ============================================
const { processWelfareReport } = require('./welfare/v2');

/**
 * welfareWorker - Cloud Tasks에서 호출되는 Worker Function
 * 
 * Cloud Tasks가 이 함수를 HTTP POST로 호출합니다.
 * 타임아웃: 540초 (9분) - GPT 응답 시간 고려
 */
exports.welfareWorker = functions
  .region('asia-northeast3')
  .runWith({
    timeoutSeconds: 540,  // 9분 (최대 540초)
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    // Cloud Tasks는 POST로 호출
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Cloud Tasks에서 base64로 인코딩된 payload 파싱
      let payload;
      if (req.body && typeof req.body === 'object') {
        payload = req.body;
      } else if (req.body) {
        payload = JSON.parse(Buffer.from(req.body, 'base64').toString());
      } else {
        return res.status(400).json({ error: 'Missing payload' });
      }

      const { taskId, userId, requestedAt } = payload;

      if (!taskId || !userId) {
        return res.status(400).json({ error: 'taskId and userId are required' });
      }

      console.log(`🔧 Worker invoked: taskId=${taskId}, userId=${userId}`);

      // Worker 실행
      const result = await processWelfareReport(payload);

      // 성공 응답 (Cloud Tasks는 2xx를 성공으로 간주)
      res.status(200).json(result);

    } catch (error) {
      console.error('❌ Worker error:', error);
      
      // 5xx 응답 시 Cloud Tasks가 재시도
      res.status(500).json({ error: error.message });
    }
  });
