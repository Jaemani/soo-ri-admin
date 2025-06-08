import React from 'react';
import Card from '../components/common/Card';
import './Statistics.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Data
const yearlyStats = [
  { year: '2021', count: 52, total: 4403200 },
  { year: '2022', count: 89, total: 6110200 },
  { year: '2023', count: 100, total: 8545200 },
  { year: '2024', count: 256, total: 7664617 },
  { year: '2025', count: 45, total: 969080 },
];

const recipientStats = [
  { type: '비수급', count: 19, avg: 83368, total: 1584000 },
  { type: '수급', count: 6, avg: 23667, total: 142000 },
  { type: '수급자', count: 245, avg: 69205, total: 16955187 },
  { type: '일반', count: 207, avg: 29086, total: 6020700 },
  { type: '차상위', count: 65, avg: 46006, total: 2990410 },
];

const deviceStats = [
  { type: '수동휠체어', count: 105, total: 3802600 },
  { type: '전동스쿠터', count: 266, total: 15896660 },
  { type: '전동휠체어', count: 170, total: 7594437 },
];

const partStats = [
  { part: '타이어&튜브', freq: 262 },
  { part: '기타', freq: 126 },
  { part: '배터리', freq: 46 },
  { part: '구동장치', freq: 30 },
  { part: '프레임', freq: 10 },
  { part: '발걸이', freq: 8 },
  { part: '제동장치', freq: 7 },
];

const disabilityStats = [
  { type: '기타', count: 20 },
  { type: '뇌병변 심하지않은', count: 20 },
  { type: '뇌병변 심한', count: 139 },
  { type: '지체 심하지않은', count: 107 },
  { type: '지체 심한', count: 256 },
];

const monthlyStats = [
  { month: '1월', count: 48 },
  { month: '2월', count: 53 },
  { month: '3월', count: 39 },
  { month: '4월', count: 60 },
  { month: '5월', count: 57 },
  { month: '6월', count: 66 },
  { month: '7월', count: 38 },
  { month: '8월', count: 35 },
  { month: '9월', count: 39 },
  { month: '10월', count: 36 },
  { month: '11월', count: 30 },
  { month: '12월', count: 42 },
];

const disabilityAvgStats = [
  { type: '기타', avg: 115777 },
  { type: '뇌병변 심하지않은', avg: 52583 },
  { type: '뇌병변 심한', avg: 53416 },
  { type: '지체 심하지않은', avg: 106485 },
  { type: '지체 심한', avg: 52092 },
];

const generationYearTotal = [
  { gen: '20대', total: 22000 },
  { gen: '30대', total: 278900 },
  { gen: '40대', total: 152950 },
  { gen: '50대', total: 400854 },
  { gen: '60대', total: 974118 },
  { gen: '70대', total: 672963 },
  { gen: '80대', total: 362284 },
  { gen: '90대', total: 35333 },
];

const generationYearAvg = [
  { gen: '20대', avg: 13833 },
  { gen: '30대', avg: 71300 },
  { gen: '40대', avg: 54571 },
  { gen: '50대', avg: 61038 },
  { gen: '60대', avg: 82492 },
  { gen: '70대', avg: 70572 },
  { gen: '80대', avg: 68931 },
  { gen: '90대', avg: 33667 },
];

const recipientYearAvg = [
  { type: '비수급', avg: 100266 },
  { type: '수급자', avg: 97579 },
  { type: '일반', avg: 25602 },
  { type: '차상위', avg: 71648 },
];

const over300k = [
  { name: '강필수', year: 2022, total: 395000 },
  { name: '한경식', year: 2021, total: 617000 },
];

const top10Recipients = [
  { rank: 1, name: '한창희', total: 838400 },
  { rank: 2, name: '심우혈', total: 808000 },
  { rank: 3, name: '김윤성', total: 644000 },
  { rank: 4, name: '김혜숙', total: 600000 },
  { rank: 5, name: '김귀남', total: 570000 },
  { rank: 6, name: '장상균', total: 516000 },
  { rank: 7, name: '김종대', total: 470000 },
  { rank: 8, name: '최원희', total: 451000 },
  { rank: 9, name: '권분화', total: 449600 },
  { rank: 10, name: '김해운', total: 433270 },
];

const monthlyAmountStats = [
  { month: '1월', amount: 1397310 },
  { month: '2월', amount: 2453000 },
  { month: '3월', amount: 1944900 },
  { month: '4월', amount: 2303480 },
  { month: '5월', amount: 2632000 },
  { month: '6월', amount: 4843217 },
  { month: '7월', amount: 1920000 },
  { month: '8월', amount: 2881120 },
  { month: '9월', amount: 1955200 },
  { month: '10월', amount: 1848900 },
  { month: '11월', amount: 2090600 },
  { month: '12월', amount: 1526070 },
];

const COLORS = ['#4F8CFF', '#FFB347', '#FF6961', '#7ED957', '#A28CFF', '#FFD966'];

function formatMoney(value: number) {
  if (!value) return '-';
  return value.toLocaleString('ko-KR') + '원';
}

const Statistics: React.FC = () => {
  return (
    <div className="statistics-page">
      <div className="statistics-section">
        <Card className="statistics-card">
          <h2>연도별 수리 통계</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yearlyStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="year" />
              <YAxis yAxisId={0} />
              <YAxis yAxisId={1} orientation="right" />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Legend />
              <Bar dataKey="count" name="수리건수" fill="#4F8CFF" yAxisId={0} />
              <Bar dataKey="total" name="총비용(원)" fill="#FFB347" yAxisId={1} />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>연도</th><th>수리건수</th><th>총비용</th></tr>
            </thead>
            <tbody>
              {yearlyStats.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row.count}건</td>
                  <td>{formatMoney(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="statistics-section statistics-flex">
        <Card className="statistics-card">
          <h2>수급유형별 수리 통계</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={recipientStats} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={60} label>
                {recipientStats.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>수급유형</th><th>수리건수</th><th>평균비용 (원)</th><th>총비용 (원)</th></tr>
            </thead>
            <tbody>
              {recipientStats.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{row.count}건</td>
                  <td>{formatMoney(row.avg)}</td>
                  <td>{formatMoney(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="statistics-card">
          <h2>이동기기별 수리 통계</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={deviceStats} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={60} label>
                {deviceStats.map((entry, idx) => (
                  <Cell key={`cell-dev-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>이동기기종류</th><th>수리건수</th><th>총비용 (원)</th></tr>
            </thead>
            <tbody>
              {deviceStats.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{row.count}건</td>
                  <td>{formatMoney(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="statistics-section statistics-flex">
        <Card className="statistics-card">
          <h2>수리부위별 빈도 (상위 항목만 표시)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={partStats} layout="vertical" margin={{ left: 30, right: 30 }}>
              <XAxis type="number" />
              <YAxis dataKey="part" type="category" width={100} />
              <Tooltip formatter={(value: any, name: string) => [value, name === 'freq' ? '횟수' : name]} />
              <Bar dataKey="freq" fill="#4F8CFF" name="횟수" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>수리부위</th><th>빈도</th></tr>
            </thead>
            <tbody>
              {partStats.map((row) => (
                <tr key={row.part}>
                  <td>{row.part}</td>
                  <td>{row.freq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="statistics-card">
          <h2>장애유형 및 중증도별 수리건수</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={disabilityStats} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={60} label>
                {disabilityStats.map((entry, idx) => (
                  <Cell key={`cell-dis-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>명 및 정도</th><th>수리건수</th></tr>
            </thead>
            <tbody>
              {disabilityStats.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{row.count}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="statistics-section statistics-flex">
        <Card className="statistics-card">
          <h2>월별 수리건수 통계 (5년 합산)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyStats} margin={{ left: 30, right: 30 }}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Bar dataKey="count" fill="#4F8CFF" name="수리건수" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>수리월</th><th>수리건수</th></tr>
            </thead>
            <tbody>
              {monthlyStats.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{row.count}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="statistics-card">
          <h2>장애명 및 정도별 연도별 개인 평균 수리액</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={disabilityAvgStats} margin={{ left: 30, right: 30 }}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Bar dataKey="avg" fill="#FFB347" name="개인 평균 수리액" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>장애명 및 정도</th><th>개인 평균 수리액</th></tr>
            </thead>
            <tbody>
              {disabilityAvgStats.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{formatMoney(row.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="statistics-section statistics-flex">
        <Card className="statistics-card">
          <h2>세대별 연간 수리총액 5년 평균</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={generationYearTotal} margin={{ left: 30, right: 30 }}>
              <XAxis dataKey="gen" />
              <YAxis />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Bar dataKey="total" fill="#4F8CFF" name="연평균 수리액" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>세대</th><th>연평균 수리액</th></tr>
            </thead>
            <tbody>
              {generationYearTotal.map((row) => (
                <tr key={row.gen}>
                  <td>{row.gen}</td>
                  <td>{formatMoney(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="statistics-card">
          <h2>세대별 1인당 연평균 수리액</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={generationYearAvg} margin={{ left: 30, right: 30 }}>
              <XAxis dataKey="gen" />
              <YAxis />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Bar dataKey="avg" fill="#FFB347" name="세대별 개인 연평균 수리액" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>세대</th><th>세대별 개인 연평균 수리액</th></tr>
            </thead>
            <tbody>
              {generationYearAvg.map((row) => (
                <tr key={row.gen}>
                  <td>{row.gen}</td>
                  <td>{formatMoney(row.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="statistics-section statistics-flex">
        <Card className="statistics-card">
          <h2>수급유형별 연간 개인 평균 수리액</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={recipientYearAvg} margin={{ left: 30, right: 30 }}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Bar dataKey="avg" fill="#4F8CFF" name="개인 평균 수리액" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>수급유형</th><th>개인 평균 수리액</th></tr>
            </thead>
            <tbody>
              {recipientYearAvg.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{formatMoney(row.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="statistics-card">
          <h2>연도별 수리비 총액 30만 원 초과자</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={over300k} layout="vertical" margin={{ left: 30, right: 30 }}>
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Bar dataKey="total" fill="#FFB347" name="총 수리액" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>성명</th><th>수리년도</th><th>총 수리액</th></tr>
            </thead>
            <tbody>
              {over300k.map((row) => (
                <tr key={row.name + row.year}>
                  <td>{row.name}</td>
                  <td>{row.year}</td>
                  <td>{formatMoney(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="statistics-section statistics-flex">
        <Card className="statistics-card">
          <h2>수급자 상위 10명 수리비 합계</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top10Recipients} layout="vertical" margin={{ left: 30, right: 30 }}>
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Bar dataKey="total" fill="#4F8CFF" name="5년 총 수리액" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>순위</th><th>성명</th><th>5년 총 수리액 (원)</th></tr>
            </thead>
            <tbody>
              {top10Recipients.map((row) => (
                <tr key={row.rank}>
                  <td>{row.rank}</td>
                  <td>{row.name}</td>
                  <td>{formatMoney(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="statistics-card">
          <h2>월별 수리액 통계 (5년)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyAmountStats} margin={{ left: 30, right: 30 }}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
              <Bar dataKey="amount" fill="#FFB347" name="월별 수리액" />
            </BarChart>
          </ResponsiveContainer>
          <table className="statistics-table">
            <thead>
              <tr><th>수리월</th><th>월별 수리액 (원)</th></tr>
            </thead>
            <tbody>
              {monthlyAmountStats.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{formatMoney(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default Statistics; 