/**
 * Create a sample welfare report directly in Firestore
 * This bypasses the pipeline to test UI first
 */

const admin = require('firebase-admin');

// Get userId from command line
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Usage: node scripts/create-sample-report.js <userId>');
  process.exit(1);
}

// Initialize Firebase Admin (uses default credentials or GOOGLE_APPLICATION_CREDENTIALS)
admin.initializeApp();
const db = admin.firestore();

const sampleReport = {
  userId: userId,
  summary: '최근 7일간 평균 15.3km를 이동하셨습니다. 주로 오전 9시~11시 사이에 활동이 집중되어 있으며, 전동보장구 사용 빈도가 꾸준히 증가하는 추세입니다.',
  risk: '배터리 잔량이 20% 이하인 상태로 5km 이상 이동한 기록이 3회 발견되었습니다. 장거리 이동 전 충전 상태를 반드시 확인하시기 바랍니다.',
  services: [
    {
      name: '장애인 이동지원 서비스',
      reason: '주 3회 이상 5km 이상 이동하시는 패턴을 보이며, 대중교통 접근이 어려운 지역으로의 이동이 많아 이동 지원 서비스가 큰 도움이 될 것으로 판단됩니다.'
    },
    {
      name: '전동보장구 배터리 지원 사업',
      reason: '현재 사용 중인 배터리가 2년 이상 경과하였으며, 충전 효율이 저하되고 있습니다. 배터리 교체 지원 대상에 해당될 가능성이 높습니다.'
    },
    {
      name: '장애인 활동 지원 서비스',
      reason: '일상생활 활동량이 많고 외출 빈도가 높아, 활동 보조 인력 지원을 통해 더욱 안전하고 편리한 이동이 가능할 것입니다.'
    }
  ],
  metadata: {
    weeklyKm: 107.1,
    trend: 'increase',
    recentRepairs: 2,
    recentSelfChecks: 4
  },
  isFallback: false,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

async function createReport() {
  try {
    console.log(`📝 Creating sample report for user: ${userId}`);
    
    await db.collection('user_welfare_reports').doc(userId).set(sampleReport);
    
    console.log('✅ Sample report created successfully!');
    console.log('\n📊 Report Preview:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Summary: ${sampleReport.summary}`);
    console.log(`⚠️  Risk: ${sampleReport.risk}`);
    console.log('\n🎯 Recommended Services:');
    sampleReport.services.forEach((service, idx) => {
      console.log(`\n${idx + 1}. ${service.name}`);
      console.log(`   → ${service.reason}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📈 Metadata:`);
    console.log(`   - Weekly Distance: ${sampleReport.metadata.weeklyKm}km`);
    console.log(`   - Trend: ${sampleReport.metadata.trend}`);
    console.log(`   - Recent Repairs: ${sampleReport.metadata.recentRepairs}`);
    console.log(`   - Recent Self Checks: ${sampleReport.metadata.recentSelfChecks}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating report:', error);
    process.exit(1);
  }
}

createReport();
