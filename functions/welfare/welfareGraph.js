/**
 * Welfare Report LangGraph Pipeline
 * 
 * 검증 루프가 포함된 복지 서비스 추천 파이프라인
 * 
 * Flow:
 * [Start] → [LLM Node] → [Validator] → (invalid) → [LLM Node] (retry)
 *                              ↓
 *                          (valid) → [End]
 */

const { validateLLMResult } = require('./validatorNode');

/**
 * 그래프 상태 스키마
 */
const graphState = {
  // 입력
  userContext: null,
  candidateServices: [],
  
  // LLM 결과
  llmResult: null,
  
  // 검증 결과
  validationResult: null,
  filteredResult: null,
  
  // 재시도 관리
  retryCount: 0,
  excludedServices: [], // 재시도 시 제외할 서비스
};

/**
 * LLM 노드 래퍼
 * LangGraph 상태를 받아서 LLM 호출 후 상태 업데이트
 */
async function llmNodeWrapper(state) {
  const { userContext, candidateServices, excludedServices = [], retryCount } = state;
  
  // 재시도 시 부적합 서비스 제외
  let filteredCandidates = candidateServices;
  if (excludedServices.length > 0) {
    filteredCandidates = candidateServices.filter(
      s => !excludedServices.some(ex => ex.name === s.name)
    );
    console.log(`[LLM Node] Retry ${retryCount}: Excluded ${excludedServices.length} services`);
  }
  
  try {
    const result = await runLLMNode(userContext, filteredCandidates);
    return {
      ...state,
      llmResult: result
    };
  } catch (error) {
    console.error('[LLM Node] Error:', error.message);
    return {
      ...state,
      llmResult: null,
      error: error.message
    };
  }
}

/**
 * Validator 노드 래퍼
 * 검증 후 재시도 필요 시 excludedServices 업데이트
 */
async function validatorNodeWrapper(state) {
  const result = await validatorNode(state);
  
  // 부적합 서비스를 excludedServices에 추가
  if (!result.validationResult.isValid) {
    const newExcluded = result.validationResult.invalidServices.map(i => i.service);
    result.excludedServices = [...(state.excludedServices || []), ...newExcluded];
  }
  
  return result;
}

/**
 * 라우팅 함수
 */
function routeAfterValidation(state) {
  const decision = shouldRetry(state);
  console.log(`[Router] Decision: ${decision}`);
  return decision;
}

/**
 * LangGraph 파이프라인 생성
 * 
 * 간소화된 버전: StateGraph 대신 직접 루프 구현
 */
async function runValidationLoop(userContext, candidateServices) {
  const MAX_RETRIES = 2;
  let retryCount = 0;
  let excludedServices = [];
  let lastResult = null;
  
  while (retryCount <= MAX_RETRIES) {
    // 제외된 서비스 필터링
    let filteredCandidates = candidateServices;
    if (excludedServices.length > 0) {
      filteredCandidates = candidateServices.filter(
        s => !excludedServices.some(ex => ex.name === s.name)
      );
      console.log(`[LangGraph] Retry ${retryCount}: Excluded ${excludedServices.length} services`);
    }
    
    // LLM 호출
    const { runLLMNode } = require('./llmNode');
    const llmResult = await runLLMNode(userContext, filteredCandidates);
    lastResult = llmResult;
    
    // 검증
    const validation = validateLLMResult(llmResult);
    console.log(`[Validator] isValid: ${validation.isValid}, invalid count: ${validation.invalidServices.length}`);
    
    if (validation.isValid) {
      console.log(`[LangGraph] Completed. Retries: ${retryCount}`);
      return llmResult;
    }
    
    // 부적합 서비스 로깅
    validation.invalidServices.forEach(({ service, reason }) => {
      console.log(`  - ${service.name}: ${reason}`);
    });
    
    // 부적합 서비스 제외 목록에 추가
    excludedServices = [...excludedServices, ...validation.invalidServices.map(i => i.service)];
    
    // 필터링된 결과 저장
    lastResult = {
      ...llmResult,
      services: validation.validServices
    };
    
    retryCount++;
  }
  
  console.log(`[LangGraph] Max retries reached, using filtered result`);
  return lastResult;
}

/**
 * 파이프라인 실행
 * 
 * @param {Object} userContext - 사용자 컨텍스트
 * @param {Array} candidateServices - 후보 서비스 목록
 * @returns {Object} 최종 결과
 */
async function runWelfareGraph(userContext, candidateServices) {
  console.log('[WelfareGraph] Starting pipeline...');
  
  try {
    const result = await runValidationLoop(userContext, candidateServices);
    return result;
  } catch (error) {
    console.error('[WelfareGraph] Pipeline error:', error);
    throw error;
  }
}

module.exports = {
  runWelfareGraph,
  runValidationLoop
};
