/**
 * GPS API Data Availability Check Script
 * 
 * Usage: node scripts/check-gps-data-availability.js <sensorId>
 * Example: node scripts/check-gps-data-availability.js 450088830181480
 */

const axios = require('axios');

const GPS_API_URL = 'https://test-web2.star-pickers.com/v2/vehicle/mileage';

async function checkDataAvailability(sensorId) {
  console.log(`🔍 Checking GPS data availability for sensor: ${sensorId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Check range of dates: from 2024-01-01 to 2025-12-31
  // But checking every day is too slow. Let's check specific points.
  
  const checkPoints = [
    '20241207', // Today (Real)
    '20250527', // User updated at
    '20250807', // Data start date mentioned
    '20251207', // Today (Scenario)
  ];

  // Also check last 7 days from today (Real)
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
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

      if (response.data.STATUS === 'SUCCESS') {
        const count = response.data.RESULT.length;
        const totalDist = response.data.RESULT.reduce((sum, r) => sum + (r.TOT_DTN || 0), 0);
        
        if (count > 0) {
          console.log(`✅ [${date}] Found ${count} records! Total Dist: ${totalDist.toFixed(2)}km`);
        } else {
          console.log(`❌ [${date}] No records (Success status but empty result)`);
        }
      } else {
        console.log(`⚠️ [${date}] API Error: ${response.data.MESSAGE || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ [${date}] Request Failed: ${error.message}`);
    }
  }
}

// Parse args
const args = process.argv.slice(2);
const sensorId = args[0] || '450088830181480';

checkDataAvailability(sensorId);
