/**
 * Validator Node - 부적합 서비스 감지
 * 
 * 전동보장구 사용자에게 적합하지 않은 서비스를 감지하고
 * 재요청이 필요한지 판단합니다.
 */

// 부적합 서비스 키워드 목록
const INVALID_KEYWORDS = [
  'LPG',
  'lpg',
  '차량',
  '자동차',
  '승용차',
  '자가용',
  '운전',
  '면허',
  '주차',
];

// 부적합 서비스 패턴 (정규식)
const INVALID_PATTERNS = [
  /LPG.*세금/i,
  /자동차.*보험/i,
  /차량.*구입/i,
  /운전.*면허/i,
];

/**
 * 단일 서비스가 부적합한지 검사
 * @param {Object} service - { name: string, reason: string }
 * @returns {{ isInvalid: boolean, reason?: string }}
 */
function checkService(service) {
  const text = `${service.name} ${service.reason}`;
  
  // 키워드 검사
  for (const keyword of INVALID_KEYWORDS) {
    if (text.includes(keyword)) {
      return {
        isInvalid: true,
        reason: `부적합 키워드 감지: "${keyword}" in "${service.name}"`
      };
    }
  }
  
  // 패턴 검사
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isInvalid: true,
        reason: `부적합 패턴 감지: ${pattern} in "${service.name}"`
      };
    }
  }
  
  return { isInvalid: false };
}

/**
 * LLM 응답 전체를 검증
 * @param {Object} llmResult - LLM 응답 결과
 * @returns {{ isValid: boolean, invalidServices: Array, validServices: Array }}
 */
function validateLLMResult(llmResult) {
  const invalidServices = [];
  const validServices = [];
  
  if (!llmResult.services || !Array.isArray(llmResult.services)) {
    return { isValid: true, invalidServices: [], validServices: [] };
  }
  
  for (const service of llmResult.services) {
    const check = checkService(service);
    if (check.isInvalid) {
      invalidServices.push({
        service,
        reason: check.reason
      });
    } else {
      validServices.push(service);
    }
  }
  
  return {
    isValid: invalidServices.length === 0,
    invalidServices,
    validServices
  };
}

/**
 * Validator Node 실행
 * LangGraph 상태를 받아서 검증 결과를 반환
 * 
 * @param {Object} state - LangGraph 상태
 * @returns {Object} 업데이트된 상태
 */
async function validatorNode(state) {
  const { llmResult, retryCount = 0 } = state;
  
  if (!llmResult) {
    return {
      ...state,
      validationResult: { isValid: false, error: 'No LLM result to validate' }
    };
  }
  
  const validation = validateLLMResult(llmResult);
  
  console.log(`[Validator] isValid: ${validation.isValid}, invalid count: ${validation.invalidServices.length}`);
  
  if (!validation.isValid) {
    console.log('[Validator] Invalid services detected:');
    validation.invalidServices.forEach(({ service, reason }) => {
      console.log(`  - ${service.name}: ${reason}`);
    });
  }
  
  return {
    ...state,
    validationResult: validation,
    retryCount: validation.isValid ? retryCount : retryCount + 1,
    // 부적합 서비스 제거된 결과
    filteredResult: validation.isValid ? llmResult : {
      ...llmResult,
      services: validation.validServices
    }
  };
}

/**
 * 라우팅 결정 함수
 * 검증 결과에 따라 다음 노드를 결정
 * 
 * @param {Object} state - LangGraph 상태
 * @returns {string} 다음 노드 이름
 */
function shouldRetry(state) {
  const { validationResult, retryCount = 0 } = state;
  const MAX_RETRIES = 2;
  
  // 유효하면 종료
  if (validationResult?.isValid) {
    return 'end';
  }
  
  // 재시도 횟수 초과하면 필터링된 결과로 종료
  if (retryCount >= MAX_RETRIES) {
    console.log(`[Validator] Max retries (${MAX_RETRIES}) reached, using filtered result`);
    return 'end';
  }
  
  // 재시도
  return 'retry';
}

module.exports = {
  validatorNode,
  validateLLMResult,
  checkService,
  shouldRetry,
  INVALID_KEYWORDS,
  INVALID_PATTERNS
};
