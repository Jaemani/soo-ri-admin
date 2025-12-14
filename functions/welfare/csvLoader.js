const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// CSV 파일 경로 (상대 경로 주의)
const CSV_PATH = path.join(__dirname, '../data/한국사회보장정보원_복지서비스정보_20250722.csv');

exports.loadServices = () => {
  try {
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // 데이터 매핑
    return records.map(record => ({
      serviceId: record['서비스아이디'],
      name: record['서비스명'],
      link: record['서비스URL'],
      summary: record['서비스요약'],
      ministry: record['소관부처명'],
      organization: record['소관조직명'],
      year: parseInt(record['기준연도'], 10) || 2025
    }));
  } catch (error) {
    console.error('Failed to load CSV:', error);
    throw error;
  }
};
