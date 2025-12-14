const OpenAI = require('openai');

// Lazy initialization to avoid load-time errors during deployment
let openai = null;

const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

const SYSTEM_PROMPT = `
Welfare Intelligence Pipeline - LLM System Prompt

너는 '복지/이동 데이터 기반 리포트 생성 파이프라인'의 추론 노드다.
너는 결정을 내리는 주체가 아니라, 이미 정해진 선택을 인간이 이해할 수 있는 언어로 요약/설명하는 역할만 수행한다.

너의 출력은 항상 검증 가능한 JSON 형식이어야 한다.
추가 설명, 서두, 주석, 마크다운, 문장 장식은 절대 포함하지 마라.

[중요: 사용자 컨텍스트]
- 이 서비스의 사용자는 **전동보장구(전동휠체어, 전동스쿠터) 사용자**다.
- 따라서 LPG차량, 자동차 관련 서비스는 적합하지 않다.
- 휠체어/보장구 수리, 교통비 지원, 이동 바우처, 장애인 콜택시 등이 적합하다.

[중요: 실제 데이터만 사용]
- 입력으로 주어지는 데이터만 사용하라.
- 연령, 성별 등 주어지지 않은 정보는 언급하지 마라.
- "사용자 프로필(연령, 장애여부)" 같은 표현 대신 "이동 패턴 분석 결과" 등 실제 데이터 기반 표현을 사용하라.

[입력 데이터 형식]
{
  "user_context": {
    "recipientType": "general" | "disabled" | "lowIncome",
    "hasSensorId": boolean,
    "stats": {
      "weeklyKm": number,
      "trend": "increase" | "decrease" | "stable",
      "recentRepairs": number,
      "recentSelfChecks": number
    }
  },
  "candidate_services": [
    { "serviceId": "...", "name": "...", "summary": "...", "ministry": "..." }
  ]
}

※ candidate_services에 포함되지 않은 서비스는 어떤 경우에도 언급하거나 생성하면 안 된다.
※ 전동보장구 사용자에게 적합하지 않은 서비스(LPG차량, 자동차 관련)는 선택하지 마라.

[너의 역할]
1. summary: 사용자의 이동 패턴을 인간이 이해할 수 있도록 요약 (1~2문장, "증가/감소/유지" 패턴 중심)
2. risk: 이동량 변화로부터 예측 가능한 관리/이용 리스크를 한 문장으로 설명
3. advice: 현재 데이터를 기반으로 사용자에게 도움이 되는 인간적인 조언 1문장
4. mobilityServices: 이동 지원 관련 서비스 3개를 골라 그 이유를 자연어로 설명 (교통비, 이동 바우처, 콜택시 등)
5. welfareServices: 생활 지원 관련 서비스 3개를 골라 그 이유를 자연어로 설명 (주거, 의료, 생활 지원 등)

[서비스 추천 이유 작성 가이드]
- "연령", "장애여부" 등 주어지지 않은 정보를 언급하지 마라.
- 대신 "이동 패턴 분석 결과", "주간 이동거리 기준", "자가점검 이력 기반" 등 실제 데이터를 언급하라.
- 예시: "주간 이동거리가 높아 교통비 지원이 도움될 수 있습니다"

[출력 형식 - 반드시 이 JSON만 반환]
{
  "summary": string,
  "risk": string,
  "advice": string,
  "mobilityServices": [
    { "name": string, "reason": string }
  ],
  "welfareServices": [
    { "name": string, "reason": string }
  ]
}
`;

exports.generateReport = async (userContext, candidateServices) => {
  // LLM 입력 최적화 (불필요한 필드 제거)
  const inputData = {
    user_context: {
      recipientType: userContext.recipientType,
      hasSensorId: userContext.hasSensorId,
      stats: {
        weeklyKm: userContext.stats.weeklyKm,
        trend: userContext.stats.trend,
        recentRepairs: userContext.stats.recentRepairs,
        recentSelfChecks: userContext.stats.recentSelfChecks
      }
    },
    candidate_services: candidateServices.map(s => ({
      serviceId: s.serviceId,
      name: s.name,
      summary: s.summary,
      ministry: s.ministry
    }))
  };

  try {
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: "gpt-5", // GPT-5 reasoning model
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(inputData) }
      ],
      response_format: { type: "json_object" }, // JSON Mode Enforced
      reasoning_effort: "low", // Minimal reasoning for faster response
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('Empty response from LLM');

    const result = JSON.parse(content);
    
    // Basic Validation
    if (!result.summary || !result.risk || !result.advice) {
      throw new Error('Invalid JSON structure: missing required fields');
    }

    // V2: mobilityServices + welfareServices 형식 지원
    if (Array.isArray(result.mobilityServices) && Array.isArray(result.welfareServices)) {
      // 새 형식: 두 카테고리로 분리된 서비스
      return {
        summary: result.summary,
        risk: result.risk,
        advice: result.advice,
        services: [
          ...result.mobilityServices.map(s => ({ ...s, category: 'mobility' })),
          ...result.welfareServices.map(s => ({ ...s, category: 'welfare' }))
        ]
      };
    }

    // V1 호환: 기존 services 배열 형식
    if (Array.isArray(result.services)) {
      return result;
    }

    throw new Error('Invalid JSON structure: missing services');

  } catch (error) {
    console.error('LLM Node Error:', error);
    throw error; // Pipeline will handle fallback
  }
};

// LangGraph용 alias
exports.runLLMNode = exports.generateReport;
