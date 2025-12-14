const admin = require('firebase-admin');
const { fetchRecentMileage } = require('./gpsDataFetcher');

/**
 * 사용자 컨텍스트 생성 (Node 3)
 * GPS API 연동 포함
 * @param {string} userId
 * @param {admin.firestore.Firestore} db
 */
exports.buildUserContext = async (userId, db) => {
  try {
    // 1. 사용자 기본 정보 조회 (firebaseUid 필드로 쿼리)
    const userSnapshot = await db.collection('users')
      .where('firebaseUid', '==', userId)
      .limit(1)
      .get();
    
    let userData = {};
    if (userSnapshot.empty) {
      console.warn(`⚠️  User ${userId} not found in Firestore, using default data`);
      // Fallback: Create minimal user data
      userData = {
        name: '사용자',
        vehicleId: null,
        supportedDistrict: '',
        recipientType: 'general'
      };
    } else {
      userData = userSnapshot.docs[0].data();
    }
    
    // 센서 ID 매핑 (phoneNumber -> sensorId)
    // 실제로는 별도 매핑 테이블이나 users 컬렉션에 sensorId 필드가 있어야 함
    const sensorId = userData.sensorId || null;

    // 2. 활동 이력 조회 (최근 30일)
    // Note: 복합 인덱스 없이 단순 쿼리 사용
    let recentRepairs = 0;
    let recentSelfChecks = 0;
    
    try {
      if (userData.vehicleId) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const cutoffTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

        // Repairs count - 단일 필드 쿼리
        const repairsSnap = await db.collection('repairs')
          .where('vehicleId', '==', userData.vehicleId)
          .get();
        
        // 클라이언트 측에서 날짜 필터링
        recentRepairs = repairsSnap.docs.filter(doc => {
          const createdAt = doc.data().createdAt;
          return createdAt && createdAt >= cutoffTimestamp;
        }).length;

        // SelfChecks count - 단일 필드 쿼리
        const selfChecksSnap = await db.collection('selfChecks')
          .where('vehicleId', '==', userData.vehicleId)
          .get();
        
        // 클라이언트 측에서 날짜 필터링
        recentSelfChecks = selfChecksSnap.docs.filter(doc => {
          const createdAt = doc.data().createdAt;
          return createdAt && createdAt >= cutoffTimestamp;
        }).length;
      }
    } catch (queryError) {
      console.warn('⚠️  Failed to query activity history:', queryError.message);
      // Continue with default values
    }

    // 3. 컨텍스트 조합
    // recipientType 기반으로 사용자 특성 판단
    // 'general': 일반, 'disabled': 장애인, 'lowIncome': 저소득
    const recipientType = userData.recipientType || 'general'

    // 4. GPS 데이터 조회 (최근 7일)
    let gpsData = {
      totalDistance: 0,
      avgDailyDistance: 0,
      trend: 'stable'
    };
    
    if (sensorId) {
      console.log(`📍 Fetching GPS data for sensor: ${sensorId}`);
      gpsData = await fetchRecentMileage(sensorId, 7);
    } else {
      console.warn(`⚠️  No sensorId found for user ${userId}, using fallback data`);
    }

    return {
      userId,
      name: userData.name,
      district: userData.supportedDistrict || '',
      recipientType, // 'general', 'disabled', 'lowIncome'
      hasSensorId: !!sensorId, // GPS 데이터 수집 가능 여부
      stats: {
        recentRepairs: recentRepairs,
        recentSelfChecks: recentSelfChecks,
        weeklyKm: gpsData.totalDistance, // 실제 GPS 데이터
        trend: gpsData.trend, // GPS 기반 추세
        debug: gpsData.debug, // 디버그 정보
        supportedDistrict: userData.supportedDistrict || '성동구' // 지원 지역
      }
    };
  } catch (error) {
    console.error('buildUserContext error:', error);
    throw error;
  }
};
