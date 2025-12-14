/**
 * Add sensor ID to a specific user by phone number
 * Usage: node scripts/add-sensor-id-to-user.js <phoneNumber> <sensorId>
 * Example: node scripts/add-sensor-id-to-user.js 01012341234 450088830181480
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'soo-ri'
});
const db = admin.firestore();

// Available sensor IDs
const AVAILABLE_SENSORS = [
  '450088830181480',
  '450088830181618',
  '450088830181747',
  '450088830181754',
  '450088830181755'
];

async function addSensorIdToUser(phoneNumber, sensorId) {
  try {
    console.log('🔍 Searching for user with phone:', phoneNumber);
    
    // Validate sensor ID
    if (!AVAILABLE_SENSORS.includes(sensorId)) {
      console.error('❌ Invalid sensor ID. Available sensors:');
      AVAILABLE_SENSORS.forEach((id, index) => {
        console.log(`   ${index + 1}. ${id}`);
      });
      process.exit(1);
    }

    // Find user by phone number
    const usersSnap = await db.collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .get();

    if (usersSnap.empty) {
      console.error(`❌ User not found with phone: ${phoneNumber}`);
      console.log('\n💡 Available users:');
      
      // List all users
      const allUsersSnap = await db.collection('users').limit(10).get();
      allUsersSnap.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name || 'No name'} (${data.phoneNumber || 'No phone'})`);
      });
      
      process.exit(1);
    }

    const userDoc = usersSnap.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`\n✅ Found user:`);
    console.log(`   Name: ${userData.name || 'No name'}`);
    console.log(`   UID: ${userId}`);
    console.log(`   Phone: ${userData.phoneNumber}`);
    console.log(`   Current Sensor ID: ${userData.sensorId || '❌ Not set'}`);

    // Update sensor ID
    await db.collection('users').doc(userId).update({
      sensorId: sensorId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`\n🎉 Successfully added sensor ID!`);
    console.log(`   New Sensor ID: ${sensorId}`);
    console.log(`\n📊 Next steps:`);
    console.log(`   1. Log in to the app with phone: ${phoneNumber}`);
    console.log(`   2. Go to "복지 리포트" page`);
    console.log(`   3. Click "리포트 생성하기" button`);
    console.log(`   4. GPS data will be fetched from the API`);
    console.log(`\n✨ You can now see real GPS data in the report!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('📝 Usage: node scripts/add-sensor-id-to-user.js <phoneNumber> <sensorId>');
  console.log('\n📋 Available sensor IDs:');
  AVAILABLE_SENSORS.forEach((id, index) => {
    console.log(`   ${index + 1}. ${id}`);
  });
  console.log('\n💡 Example:');
  console.log('   node scripts/add-sensor-id-to-user.js 01012341234 450088830181480');
  process.exit(1);
}

const [phoneNumber, sensorId] = args;
addSensorIdToUser(phoneNumber, sensorId);
