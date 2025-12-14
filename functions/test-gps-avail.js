const axios = require('axios');

const GPS_API_URL = 'https://test-web2.star-pickers.com/v2/vehicle/mileage';

async function checkDataAvailability(sensorId) {
  console.log(`🔍 Checking GPS data availability for sensor: ${sensorId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Check range of dates: from 2024-01-01 to 2025-12-31
  
  const checkPoints = [
    '2024-12-07', // Today (Real)
    '2025-05-27', // User updated at
    '2025-08-07', // Data start date mentioned
    '2025-11-17', // From API Spec Example (Should have data)
    '2025-12-07', // Today (Scenario)
  ];

  // Also check last 7 days from today (Real)
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!checkPoints.includes(dateStr)) {
      checkPoints.push(dateStr);
    }
  }

  console.log(`📅 Checking dates: ${checkPoints.join(', ')}`);

  for (const date of checkPoints) {
    try {
      const response = await axios.post(GPS_API_URL, {
        RD_DT: date,
        SNR_ID: sensorId
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      console.log(`\n📡 [${date}] Status: ${response.data.STATUS}`);
      
      if (response.data.STATUS === 'SUCCESS') {
        let result = response.data.RESULT;
        const isArray = Array.isArray(result);
        console.log(`   Type: ${isArray ? 'Array' : typeof result}`);
        
        if (!isArray) {
            result = [result];
        }
        
        console.log(`   Count: ${result.length}`);
        if (result.length > 0) {
            console.log(`   First Record:`, JSON.stringify(result[0]));
            const totalDist = result.reduce((sum, r) => sum + parseFloat(r.TOT_DTN || 0), 0);
            console.log(`   Total Dist: ${totalDist.toFixed(2)}km`);
        }
      } else {
        console.log(`   Message: ${response.data.MESSAGE || 'Unknown error'}`);
      }
    } catch (error) {
        if (error.response) {
            console.log(`❌ [${date}] HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`❌ [${date}] Request Failed: ${error.message}`);
        }
    }
  }
}

const args = process.argv.slice(2);
const sensorId = args[0] || '450088830181480';

checkDataAvailability(sensorId);
