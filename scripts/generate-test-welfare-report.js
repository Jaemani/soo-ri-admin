/**
 * Test script to generate welfare reports for existing users
 * Usage: node scripts/generate-test-welfare-report.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function generateTestReports() {
  try {
    console.log('🔍 Fetching users from Firestore...');
    
    // Get first 3 users
    const usersSnap = await db.collection('users').limit(3).get();
    
    if (usersSnap.empty) {
      console.log('❌ No users found in Firestore');
      return;
    }

    console.log(`✅ Found ${usersSnap.size} users`);

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      console.log(`\n📝 Generating report for user: ${userId}`);

      // Create a sample welfare report
      const report = {
        userId: userId,
        summary: `최근 7일간 평균 ${Math.floor(Math.random() * 20 + 10)}km를 이동하셨습니다. 주로 오전 시간대에 활동이 많으며, 전동보장구 사용 빈도가 높습니다.`,
        risk: '배터리 잔량이 낮은 상태로 장거리 이동을 하는 경우가 있어 주의가 필요합니다. 정기적인 점검을 권장드립니다.',
        services: [
          {
            name: '장애인 이동지원 서비스',
            reason: '활동 반경이 넓어 이동 지원이 필요할 수 있습니다.'
          },
          {
            name: '전동보장구 배터리 지원 사업',
            reason: '배터리 교체 주기가 다가와 지원 대상이 될 수 있습니다.'
          },
          {
            name: '장애인 활동 지원 서비스',
            reason: '일상생활 활동량이 많아 활동 지원이 도움이 될 수 있습니다.'
          }
        ],
        metadata: {
          weeklyKm: Math.floor(Math.random() * 50 + 30),
          trend: ['increase', 'decrease', 'stable'][Math.floor(Math.random() * 3)],
          recentRepairs: Math.floor(Math.random() * 3),
          recentSelfChecks: Math.floor(Math.random() * 5)
        },
        isFallback: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Save to Firestore
      await db.collection('user_welfare_reports').doc(userId).set(report);
      console.log(`✅ Report created for ${userId}`);
    }

    console.log('\n🎉 All test reports generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating reports:', error);
    process.exit(1);
  }
}

generateTestReports();
