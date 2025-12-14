/**
 * Setup test users with sensor IDs and generate welfare reports
 * 1. Fetch 5 users from Firestore
 * 2. Assign sensor IDs from 사용자센서정보.csv
 * 3. Generate test welfare reports for each
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with project ID
admin.initializeApp({
  projectId: 'soo-ri'
});
const db = admin.firestore();

// Sensor IDs from 사용자센서정보.csv
const SENSOR_IDS = [
  '450088830181480',
  '450088830181618',
  '450088830181747',
  '450088830181754',
  '450088830181755'
];

async function setupTestUsers() {
  try {
    console.log('🔍 Fetching users from Firestore...\n');
    
    // Get first 5 users
    const usersSnap = await db.collection('users').limit(5).get();
    
    if (usersSnap.empty) {
      console.log('❌ No users found in Firestore');
      return;
    }

    console.log(`✅ Found ${usersSnap.size} users\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const users = [];
    usersSnap.forEach((doc, index) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        name: userData.name || '이름없음',
        phoneNumber: userData.phoneNumber || '',
        sensorId: SENSOR_IDS[index]
      });
    });

    // Display users
    console.log('📋 Users to be updated:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.uid})`);
      console.log(`   Phone: ${user.phoneNumber}`);
      console.log(`   → Will assign sensor ID: ${user.sensorId}\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Update users with sensor IDs
    console.log('📝 Updating users with sensor IDs...\n');
    
    for (const user of users) {
      await db.collection('users').doc(user.uid).update({
        sensorId: user.sensorId
      });
      console.log(`✅ Updated ${user.name} with sensor ID: ${user.sensorId}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Generate sample welfare reports
    console.log('📊 Generating sample welfare reports...\n');

    for (const user of users) {
      const report = {
        userId: user.uid,
        summary: `최근 7일간 평균 ${(Math.random() * 15 + 10).toFixed(1)}km를 이동하셨습니다. 주로 오전 시간대에 활동이 많으며, 전동보장구 사용 빈도가 꾸준합니다.`,
        risk: '배터리 잔량 관리와 정기적인 점검이 필요합니다. 장거리 이동 전 충전 상태를 확인하시기 바랍니다.',
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
          weeklyKm: parseFloat((Math.random() * 50 + 30).toFixed(2)),
          trend: ['increase', 'decrease', 'stable'][Math.floor(Math.random() * 3)],
          recentRepairs: Math.floor(Math.random() * 3),
          recentSelfChecks: Math.floor(Math.random() * 5)
        },
        isFallback: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('user_welfare_reports').doc(user.uid).set(report);
      console.log(`✅ Created report for ${user.name}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 All done!\n');
    console.log('📱 You can now test the app with these users:\n');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (UID: ${user.uid})`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupTestUsers();
