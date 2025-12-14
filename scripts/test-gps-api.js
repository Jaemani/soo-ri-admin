/**
 * Test GPS API with real sensor IDs
 * This script tests the actual GPS API call to verify it works
 */

const axios = require('../functions/node_modules/axios').default || require('../functions/node_modules/axios');

const GPS_API_URL = 'https://test-web2.star-pickers.com/v2/vehicle/mileage';

// Test sensor IDs from 사용자센서정보.csv
const TEST_SENSOR_IDS = [
  '450088830181480',
  '450088830181618',
  '450088830181747',
  '450088830181754',
  '450088830181755'
];

async function testGPSAPI() {
  console.log('🧪 Testing GPS API...\n');
  console.log(`API Endpoint: ${GPS_API_URL}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get today's date
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`📅 Testing with date: ${dateStr}\n`);

  // Test 1: Get all data for today
  console.log('Test 1: Fetch all data for today (no sensor filter)\n');
  try {
    const response = await axios.post(GPS_API_URL, {
      RD_DT: dateStr
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (response.data.STATUS === 'SUCCESS') {
      const results = response.data.RESULT;
      console.log(`✅ Success! Found ${results.length} records\n`);
      
      if (results.length > 0) {
        console.log('Sample data (first 3 records):\n');
        results.slice(0, 3).forEach((record, index) => {
          console.log(`${index + 1}. Sensor: ${record.SNR_ID}`);
          console.log(`   Distance: ${record.TOT_DTN} km`);
          console.log(`   Time: ${record.TOT_TM} hours\n`);
        });
      }
    } else {
      console.log('⚠️  API returned non-success status:', response.data);
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 2: Get data for specific sensor
  console.log('Test 2: Fetch data for specific sensor\n');
  const testSensorId = TEST_SENSOR_IDS[0];
  console.log(`Testing with sensor ID: ${testSensorId}\n`);

  try {
    const response = await axios.post(GPS_API_URL, {
      RD_DT: dateStr,
      SNR_ID: testSensorId
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (response.data.STATUS === 'SUCCESS') {
      const results = response.data.RESULT;
      console.log(`✅ Success! Found ${results.length} records\n`);
      
      if (results.length > 0) {
        results.forEach((record, index) => {
          console.log(`${index + 1}. Sensor: ${record.SNR_ID}`);
          console.log(`   Date: ${record.RD_DT}`);
          console.log(`   Distance: ${record.TOT_DTN} km`);
          console.log(`   Time: ${record.TOT_TM} hours\n`);
        });
      } else {
        console.log('⚠️  No data found for this sensor on this date');
        console.log('   This might be normal if there was no activity today\n');
      }
    } else {
      console.log('⚠️  API returned non-success status:', response.data);
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 3: Test with past dates (since data starts from 2025-08-07)
  console.log('Test 3: Fetch data from past week\n');
  
  const promises = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const pastDateStr = date.toISOString().split('T')[0];
    promises.push(
      axios.post(GPS_API_URL, {
        RD_DT: pastDateStr,
        SNR_ID: testSensorId
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }).catch(err => ({ error: err.message, date: pastDateStr }))
    );
  }

  try {
    const responses = await Promise.all(promises);
    let totalRecords = 0;
    let totalDistance = 0;

    responses.forEach((response, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - index);
      const dateStr = date.toISOString().split('T')[0];

      if (response.error) {
        console.log(`${dateStr}: ❌ Error - ${response.error}`);
      } else if (response.data && response.data.STATUS === 'SUCCESS') {
        const results = response.data.RESULT;
        if (results.length > 0) {
          const distance = parseFloat(results[0].TOT_DTN || 0);
          totalRecords += results.length;
          totalDistance += distance;
          console.log(`${dateStr}: ✅ ${distance.toFixed(2)} km`);
        } else {
          console.log(`${dateStr}: ⚪ No data`);
        }
      }
    });

    console.log(`\n📊 Summary for sensor ${testSensorId}:`);
    console.log(`   Total records: ${totalRecords}`);
    console.log(`   Total distance (7 days): ${totalDistance.toFixed(2)} km`);
    console.log(`   Average daily: ${(totalDistance / 7).toFixed(2)} km\n`);

  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎉 GPS API test completed!\n');
}

testGPSAPI();
