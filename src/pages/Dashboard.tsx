import React, { useEffect, useState } from 'react';
import MetricCard from '../components/features/dashboard/MetricCard';
import { useUsers } from '../contexts/UserContext';
import { User } from '../services/users';
import { repairService } from '../services/repairs';
import { repairStationService, RepairStation } from '../services/repairStation';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Dashboard.css';

// SVG Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const RepairsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ToolIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const Dashboard: React.FC = () => {
  const { users, loading, error, totalUsers } = useUsers();
  const [totalRepairs, setTotalRepairs] = useState<number>(0);
  const [recentRepairs, setRecentRepairs] = useState<number>(0);
  const [repairStation, setRepairStation] = useState<RepairStation | null>(null);
  const [aidValues, setAidValues] = useState<number[]>([0, 0, 0]);
  const [isEditingAid, setIsEditingAid] = useState(false);
  const [editingAidValues, setEditingAidValues] = useState<number[]>([0, 0, 0]);
  const [editingAidInputs, setEditingAidInputs] = useState<string[]>(['0', '0', '0']);
  const [aidLoading, setAidLoading] = useState(false);
  const [repairStationLoading, setRepairStationLoading] = useState(true);
  const [repairStationError, setRepairStationError] = useState<string | null>(null);

  const recipientTypeLabels = ['일반', '차상위', '수급'];

  useEffect(() => {
    // Fetch total repairs
    repairService.getAllRepairs({ page: 1, limit: 1 }).then(res => {
      setTotalRepairs(res.total || 0);
    });
    // Fetch repairs in the last 7 days (inclusive)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startDate = weekAgo.toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);
    repairService.getAllRepairs({
      page: 1,
      limit: 1,
      startDate,
      endDate
    }).then(res => {
      setRecentRepairs(res.total || 0);
    });

    // Fetch repair station aid values
    setRepairStationLoading(true);
    repairStationService.getRepairStation().then(res => {
      console.log('Repair station response:', res);
      if (res.success && res.repairStation) {
        setRepairStation(res.repairStation);
        setAidValues(res.repairStation.aid);
        setEditingAidValues(res.repairStation.aid);
        setEditingAidInputs(res.repairStation.aid.map(val => val.toString()));
        console.log('Repair station loaded:', res.repairStation);
        setRepairStationError(null);
      } else {
        console.error('Failed to get repair station:', res.message);
        setRepairStationError(res.message || 'Failed to load repair station');
      }
    }).catch(err => {
      console.error('Error fetching repair station:', err);
      setRepairStationError('Error fetching repair station data');
    }).finally(() => {
      setRepairStationLoading(false);
    });
  }, []);

  const handleAidEdit = () => {
    setEditingAidValues([...aidValues]);
    setEditingAidInputs(aidValues.map(val => val.toString()));
    setIsEditingAid(true);
  };

  const handleAidCancel = () => {
    setEditingAidValues([...aidValues]);
    setEditingAidInputs(aidValues.map(val => val.toString()));
    setIsEditingAid(false);
  };

  const handleAidSave = async () => {
    setAidLoading(true);
    try {
      // Convert string inputs to numbers for saving
      const numericValues = editingAidInputs.map(val => Math.max(0, parseInt(val) || 0));
      console.log('Saving aid values:', numericValues);
      
      const response = await repairStationService.updateAid(numericValues);
      console.log('Update response:', response);
      
      if (response.success && response.repairStation) {
        setAidValues(numericValues);
        setEditingAidValues(numericValues);
        setEditingAidInputs(numericValues.map(val => val.toString()));
        setRepairStation(response.repairStation);
        setIsEditingAid(false);
        
        // Refresh data from server to verify the update
        console.log('Refreshing data from server...');
        const refreshResponse = await repairStationService.getRepairStation();
        if (refreshResponse.success && refreshResponse.repairStation) {
          console.log('Refreshed data:', refreshResponse.repairStation);
          setRepairStation(refreshResponse.repairStation);
          setAidValues(refreshResponse.repairStation.aid);
        }
      } else {
        alert('Error updating aid values: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating aid values:', error);
      alert('Error updating aid values');
    } finally {
      setAidLoading(false);
    }
  };

  const handleAidValueChange = (index: number, value: string) => {
    // Allow empty string, numbers, and handle properly
    const newInputs = [...editingAidInputs];
    
    // Only allow numeric characters (and empty string)
    if (value === '' || /^\d+$/.test(value)) {
      newInputs[index] = value;
      setEditingAidInputs(newInputs);
      
      // Update numeric values for validation
      const newNumericValues = [...editingAidValues];
      newNumericValues[index] = value === '' ? 0 : parseInt(value);
      setEditingAidValues(newNumericValues);
    }
  };

  const handleAidInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when input is focused
    e.target.select();
  };

  const getInactiveUsers = (users: User[]) => {
    return users.filter(user => user.role === 'user' && !user.updatedAt).length;
  };

  // Calculate metrics based on users data
  const metrics = {
    totalUsers,
    totalRepairs,
    recentRepairs,
    alertUsers: getInactiveUsers(users)
  };

  if (loading) {
    return <div className="dashboard-loading">
      <div className="spinner"></div>
      <p>데이터를 불러오는 중...</p>
    </div>;
  }

  if (error) {
    return <div className="dashboard-error">
      <div className="error-icon"><WarningIcon /></div>
      <h3>오류가 발생했습니다</h3>
      <p>{error}</p>
    </div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <div className="date-picker">
          <button className="btn btn-secondary">
            <span>최근 30일</span>
            <span className="icon">▼</span>
          </button>
        </div>
      </div>
      
      <div className="metrics-grid">
        <MetricCard
          title="총 사용자 수"
          value={metrics.totalUsers}
          icon={<UsersIcon />}
          variant="info"
        />
        <MetricCard
          title="전체 수리 이력 건수"
          value={metrics.totalRepairs}
          icon={<RepairsIcon />}
          variant="success"
        />
      </div>

      {/* Aid Management Section */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>지원금 관리</h3>
              {repairStation && (
                <p style={{ margin: '0.5rem 0 0', color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                  {repairStation.label} ({repairStation.code})
                </p>
              )}
            </div>
            {!isEditingAid && repairStation && (
              <Button onClick={handleAidEdit} variant="primary" size="small">
                편집
              </Button>
            )}
          </div>
          
          {repairStationLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p>정비소 정보를 불러오는 중...</p>
            </div>
          ) : repairStationError ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--red-600)', background: 'var(--red-50)', borderRadius: '0.5rem' }}>
              <p>정비소 정보를 불러올 수 없습니다.</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--red-500)' }}>{repairStationError}</p>
            </div>
          ) : repairStation ? (
            <>
              <div className="aid-grid">
                {recipientTypeLabels.map((label, index) => (
                  <div key={label} className="aid-item">
                    <div className="aid-label">{label}</div>
                    {isEditingAid ? (
                      <input
                        type="text"
                        className="aid-input"
                        value={editingAidInputs[index]}
                        onChange={(e) => handleAidValueChange(index, e.target.value)}
                        placeholder="0"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onFocus={handleAidInputFocus}
                      />
                    ) : (
                      <div className="aid-value">
                        {aidValues[index].toLocaleString()}원
                      </div>
                    )}
                  </div>
                ))}
                <div className="aid-item">
                  <div className="aid-label">미등록</div>
                  <div className="aid-value aid-disabled">지원 없음</div>
                </div>
              </div>

              {isEditingAid && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                  <Button 
                    onClick={handleAidCancel} 
                    variant="secondary" 
                    size="small"
                    disabled={aidLoading}
                  >
                    취소
                  </Button>
                  <Button 
                    onClick={handleAidSave} 
                    variant="primary" 
                    size="small"
                    disabled={aidLoading}
                  >
                    {aidLoading ? '저장 중...' : '저장'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
              <p>정비소 정보가 연결되지 않았습니다.</p>
            </div>
          )}
        </div>
      </Card>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>수리 부위별 요청 빈도 (Top 5)</h3>
            <div className="chart-actions">
              <button className="btn-icon">⋮</button>
            </div>
          </div>
          <div className="chart-content">
            {/* Placeholder for chart */}
            <div className="chart-placeholder">
              <div className="bar-chart">
                <div className="bar" style={{ height: '60%', backgroundColor: 'var(--primary-400)' }}></div>
                <div className="bar" style={{ height: '80%', backgroundColor: 'var(--primary-500)' }}></div>
                <div className="bar" style={{ height: '40%', backgroundColor: 'var(--primary-600)' }}></div>
                <div className="bar" style={{ height: '70%', backgroundColor: 'var(--primary-500)' }}></div>
                <div className="bar" style={{ height: '30%', backgroundColor: 'var(--primary-400)' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3>월별 수리 요청 추이</h3>
            <div className="chart-actions">
              <button className="btn-icon">⋮</button>
            </div>
          </div>
          <div className="chart-content">
            {/* Placeholder for chart */}
            <div className="chart-placeholder">
              <div className="line-chart">
                <svg viewBox="0 0 300 100" preserveAspectRatio="none">
                  <polyline
                    points="0,70 50,65 100,40 150,30 200,50 250,45 300,20"
                    fill="none"
                    stroke="var(--primary-600)"
                    strokeWidth="2"
                  />
                  <path
                    d="M0,70 50,65 100,40 150,30 200,50 250,45 300,20 L300,100 L0,100 Z"
                    fill="var(--primary-50)"
                    opacity="0.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <div className="section-header">
          <h3>최근 활동</h3>
          <a href="/activities" className="view-all">전체보기</a>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <ToolIcon />
            </div>
            <div className="activity-content">
              <div className="activity-title">새로운 수리 요청</div>
              <div className="activity-desc">김철수님이 새로운 수리를 요청했습니다.</div>
            </div>
            <div className="activity-time">10분 전</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon" style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
              <CheckIcon />
            </div>
            <div className="activity-content">
              <div className="activity-title">수리 완료</div>
              <div className="activity-desc">이영희님의 수리가 완료되었습니다.</div>
            </div>
            <div className="activity-time">1시간 전</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon" style={{ backgroundColor: 'var(--warning-50)', color: 'var(--warning-600)' }}>
              <WarningIcon />
            </div>
            <div className="activity-content">
              <div className="activity-title">자가진단 경고</div>
              <div className="activity-desc">박지민님의 자가진단에서 이상이 감지되었습니다.</div>
            </div>
            <div className="activity-time">3시간 전</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 