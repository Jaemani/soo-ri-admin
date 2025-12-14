/**
 * Check user and welfare report in Firestore
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'soo-ri'
});
const db = admin.firestore();

async function checkUserReport() {
  try {
    const phoneNumbers = ['01012341233', '01012341234'];
    
    console.log('🔍 Searching for users with phone numbers:', phoneNumbers.join(', '));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const phoneNumber of phoneNumbers) {
      console.log(`\n📱 Checking phone: ${phoneNumber}\n`);
      
      // Find user by phone number
      const usersSnap = await db.collection('users')
        .where('phoneNumber', '==', phoneNumber)
        .get();

      if (usersSnap.empty) {
        console.log(`❌ No user found with phone: ${phoneNumber}\n`);
        continue;
      }

      usersSnap.forEach(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        console.log(`✅ Found user: ${userData.name || '이름없음'}`);
        console.log(`   UID: ${userId}`);
        console.log(`   Phone: ${userData.phoneNumber}`);
        console.log(`   Sensor ID: ${userData.sensorId || '❌ Not set'}\n`);

        // Check if welfare report exists
        const reportDoc = await db.collection('user_welfare_reports').doc(userId).get();
        
        if (reportDoc.exists) {
          const reportData = reportDoc.data();
          console.log('📊 Welfare Report Found:');
          console.log(`   Summary: ${reportData.summary?.substring(0, 50)}...`);
          console.log(`   Services: ${reportData.services?.length || 0} services`);
          console.log(`   Created: ${reportData.createdAt?.toDate?.() || reportData.createdAt}`);
          console.log(`   Weekly KM: ${reportData.metadata?.weeklyKm || 0}km`);
          console.log(`   Trend: ${reportData.metadata?.trend || 'N/A'}`);
          console.log(`   Is Fallback: ${reportData.isFallback || false}\n`);
          
          console.log('📄 Full Report Data:');
          console.log(JSON.stringify(reportData, null, 2));
        } else {
          console.log('❌ No welfare report found for this user\n');
          console.log('💡 You can generate a report by:');
          console.log(`   1. Using the app's "리포트 생성하기" button`);
          console.log(`   2. Running: node scripts/create-sample-report.js ${userId}\n`);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      });
    }

    // Also list all welfare reports
    console.log('\n📋 All Welfare Reports in Database:\n');
    const allReportsSnap = await db.collection('user_welfare_reports').get();
    
    if (allReportsSnap.empty) {
      console.log('❌ No welfare reports found in database\n');
    } else {
      console.log(`✅ Found ${allReportsSnap.size} report(s):\n`);
      allReportsSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`- User ID: ${doc.id}`);
        console.log(`  Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
        console.log(`  Weekly KM: ${data.metadata?.weeklyKm || 0}km\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure you are authenticated with Firebase CLI:');
    console.error('   firebase login\n');
    process.exit(1);
  }
}

checkUserReport();
