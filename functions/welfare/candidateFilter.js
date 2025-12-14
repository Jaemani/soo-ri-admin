/**
 * 추천 후보 필터링 (Node 4)
 * Rule-based Logic: LLM에게 가기 전 부적절한 서비스를 사전 차단
 * 
 * @param {object} userContext
 * @param {Array} services
 * @returns {Array} selectedServices
 */
exports.selectCandidates = (userContext, services) => {
  const filtered = services.filter(service => {
    const { tags } = service;

    // recipientType 기반 필터링
    // 'general': 일반, 'disabled': 장애인, 'lowIncome': 저소득
    
    // 1. 장애인 전용 서비스 필터링
    // 장애인 전용 서비스는 disabled 사용자에게만 추천
    if (tags.disability && userContext.recipientType !== 'disabled') return false;

    // 2. 저소득 전용 서비스 필터링
    // 저소득 전용 서비스는 lowIncome 사용자에게만 추천
    if (tags.lowIncome && userContext.recipientType !== 'lowIncome') return false;

    return true;
  });

  // 정렬 로직 (Scoring)
  // 1순위: 이동성(mobility) 관련 서비스 (앱의 핵심 가치)
  // 2순위: 최신 기준연도
  filtered.sort((a, b) => {
    // Mobility 우선
    if (a.tags.mobility && !b.tags.mobility) return -1;
    if (!a.tags.mobility && b.tags.mobility) return 1;

    // 최신 연도 우선
    return b.year - a.year;
  });

  // LLM Input Token 제한을 위해 상위 10개만 전달
  return filtered.slice(0, 10);
};
