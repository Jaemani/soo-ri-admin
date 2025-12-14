/**
 * Generate mock welfare reports data
 * This creates JSON data that can be manually added to Firestore
 * or used for testing
 */

// Mock user IDs (replace with actual user IDs from Firestore)
const MOCK_USERS = [
  { uid: 'user1', name: '김철수', sensorId: '450088830181480' },
  { uid: 'user2', name: '이영희', sensorId: '450088830181618' },
  { uid: 'user3', name: '박민수', sensorId: '450088830181747' },
  { uid: 'user4', name: '정수진', sensorId: '450088830181754' },
  { uid: 'user5', name: '최동욱', sensorId: '450088830181755' }
];

function generateMockReport(user) {
  const weeklyKm = parseFloat((Math.random() * 50 + 30).toFixed(2));
  const trends = ['increase', 'decrease', 'stable'];
  const trend = trends[Math.floor(Math.random() * trends.length)];
  
  const trendText = {
    increase: '증가하는',
    decrease: '감소하는',
    stable: '안정적인'
  };

  return {
    userId: user.uid,
    summary: `최근 7일간 평균 ${(weeklyKm / 7).toFixed(1)}km를 이동하셨습니다. 주로 오전 9시~11시 사이에 활동이 집중되어 있으며, 전동보장구 사용 빈도가 ${trendText[trend]} 추세입니다.`,
    risk: '배터리 잔량이 20% 이하인 상태로 장거리 이동을 하는 경우가 있어 주의가 필요합니다. 정기적인 점검을 권장드립니다.',
    services: [
      {
        name: '장애인 이동지원 서비스',
        reason: '활동 반경이 넓어 이동 지원이 필요할 수 있습니다. 대중교통 접근이 어려운 지역으로의 이동이 많습니다.'
      },
      {
        name: '전동보장구 배터리 지원 사업',
        reason: '배터리 교체 주기가 다가와 지원 대상이 될 수 있습니다. 충전 효율이 저하되고 있습니다.'
      },
      {
        name: '장애인 활동 지원 서비스',
        reason: '일상생활 활동량이 많아 활동 지원이 도움이 될 수 있습니다. 외출 빈도가 높습니다.'
      }
    ],
    metadata: {
      weeklyKm: weeklyKm,
      trend: trend,
      recentRepairs: Math.floor(Math.random() * 3),
      recentSelfChecks: Math.floor(Math.random() * 5)
    },
    isFallback: false,
    createdAt: new Date().toISOString()
  };
}

console.log('📊 Mock Welfare Reports\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

MOCK_USERS.forEach((user, index) => {
  const report = generateMockReport(user);
  
  console.log(`\n${index + 1}. ${user.name} (${user.uid})`);
  console.log(`   Sensor ID: ${user.sensorId}`);
  console.log(`\n   📍 Summary:`);
  console.log(`   ${report.summary}`);
  console.log(`\n   ⚠️  Risk:`);
  console.log(`   ${report.risk}`);
  console.log(`\n   🎯 Recommended Services:`);
  report.services.forEach((service, idx) => {
    console.log(`   ${idx + 1}. ${service.name}`);
    console.log(`      → ${service.reason}`);
  });
  console.log(`\n   📈 Metadata:`);
  console.log(`      Weekly Distance: ${report.metadata.weeklyKm}km`);
  console.log(`      Trend: ${report.metadata.trend}`);
  console.log(`      Recent Repairs: ${report.metadata.recentRepairs}`);
  console.log(`      Recent Self Checks: ${report.metadata.recentSelfChecks}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

console.log('\n\n📝 Firestore Import Instructions:\n');
console.log('1. Go to Firebase Console → Firestore Database');
console.log('2. Create collection: user_welfare_reports');
console.log('3. For each user, create a document with:');
console.log('   - Document ID: <userId>');
console.log('   - Fields: copy from the JSON below\n');

console.log('\n📄 JSON Data for Firestore:\n');
MOCK_USERS.forEach(user => {
  const report = generateMockReport(user);
  console.log(`\n// Document ID: ${user.uid}`);
  console.log(JSON.stringify(report, null, 2));
});

console.log('\n\n✅ Mock data generation complete!\n');
