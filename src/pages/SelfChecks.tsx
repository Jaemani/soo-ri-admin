import React, { useEffect, useState } from 'react';
import { selfCheckService, SelfCheck } from '../services/selfChecks';
import { userService, User } from '../services/users';
import { vehiclesService, Vehicle } from '../services/vehicles';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './SelfChecks.css';

const TABS = [
  { key: 'all', label: '전체 자가진단' },
  { key: 'user', label: '선택한 사용자 자가진단' }
];

const SelfChecks: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'user'>('all');
  const [allSelfChecks, setAllSelfChecks] = useState<SelfCheck[]>([]);
  const [filteredSelfChecks, setFilteredSelfChecks] = useState<SelfCheck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [itemsPerPage] = useState(10);
  const [selectedSelfCheck, setSelectedSelfCheck] = useState<SelfCheck | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (tab === 'user') {
    fetchUsers();
    } else {
      fetchAllSelfChecks();
    }
  }, [tab]);

  // Filter selfChecks whenever relevant state changes
  useEffect(() => {
    if (tab === 'all') {
    filterSelfChecks();
    }
  }, [allSelfChecks, search, dateRange]);

  // Fetch vehicles when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchVehiclesForUser(selectedUser);
    } else {
      setVehicles([]);
      setSelectedVehicle('');
      setAllSelfChecks([]);
    }
  }, [selectedUser]);

  // Fetch self checks when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      fetchSelfChecksForVehicle(selectedVehicle);
    } else {
      setAllSelfChecks([]);
    }
  }, [selectedVehicle]);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers({ page: 1, limit: 1000 });
      setUsers(response.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('사용자 데이터를 불러오는데 실패했습니다.');
    }
  };

  const fetchAllSelfChecks = async () => {
    try {
      setLoading(true);
      const response = await selfCheckService.getAllSelfChecks({
        page: currentPage,
        limit: itemsPerPage,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        search
      });
      
      setAllSelfChecks(response.selfChecks || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.currentPage || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching all self checks:', err);
      setError('자가진단 데이터를 불러오는데 실패했습니다.');
      setAllSelfChecks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclesForUser = async (userId: string) => {
    try {
      if (!userId) {
        setVehicles([]);
        setSelectedVehicle('');
        return;
      }
      
      setLoading(true);
      const response = await vehiclesService.getVehiclesForUser(userId);
      setVehicles(response.vehicles);
      setSelectedVehicle('');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setVehicles([]);
      setError('차량 데이터를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const fetchSelfChecksForVehicle = async (vehicleId: string) => {
    try {
      setLoading(true);
      const response = await selfCheckService.getVehicleSelfChecks(vehicleId);
      
      const selfChecks = response.selfChecks || [];
      const selectedVehicleInfo = vehicles.find(v => v._id === vehicleId);
      const selectedUserInfo = users.find(u => u._id === selectedUser);
      
      const enhancedSelfChecks = selfChecks.map(check => ({
        ...check,
        vehicle: selectedVehicleInfo ? {
          _id: selectedVehicleInfo._id,
          vehicleId: selectedVehicleInfo.vehicleId
        } : undefined,
        user: selectedUserInfo ? {
          _id: selectedUserInfo._id,
          name: selectedUserInfo.name,
          phoneNumber: selectedUserInfo.phoneNumber
        } : undefined
      }));
      
      setAllSelfChecks(enhancedSelfChecks);
      setError(null);
    } catch (err) {
      console.error('Error fetching self checks:', err);
      setError('자가진단 데이터를 불러오는데 실패했습니다.');
      setAllSelfChecks([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering function
  const filterSelfChecks = () => {
    let filtered = [...allSelfChecks];
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(selfCheck => 
        (selfCheck.user?.name && selfCheck.user.name.toLowerCase().includes(searchLower)) ||
        (selfCheck.vehicle?.vehicleId && selfCheck.vehicle.vehicleId.toLowerCase().includes(searchLower))
      );
    }

    if (dateRange.startDate) {
      filtered = filtered.filter(selfCheck => 
        new Date(selfCheck.createdAt) >= new Date(dateRange.startDate)
      );
    }

    if (dateRange.endDate) {
      filtered = filtered.filter(selfCheck => 
        new Date(selfCheck.createdAt) <= new Date(dateRange.endDate + 'T23:59:59')
      );
    }
    
    setFilteredSelfChecks(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'all') {
      fetchAllSelfChecks();
    } else {
    filterSelfChecks();
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (tab === 'all') {
        fetchAllSelfChecks();
      }
    }
  };

  const handleTabChange = (newTab: 'all' | 'user') => {
    setTab(newTab);
    setSearch('');
    setDateRange({ startDate: '', endDate: '' });
    setSelectedUser('');
    setSelectedVehicle('');
    setCurrentPage(1);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUser(userId);
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVehicle(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterReset = () => {
    setSearch('');
    setDateRange({ startDate: '', endDate: '' });
    if (tab === 'all') {
      fetchAllSelfChecks();
    }
  };

  const handleSelfCheckClick = (selfCheck: SelfCheck) => {
    setSelectedSelfCheck(selfCheck);
  };

  const handleCloseDetail = () => {
    setSelectedSelfCheck(null);
  };

  // Get current page of selfChecks
  const indexOfLastSelfCheck = currentPage * itemsPerPage;
  const indexOfFirstSelfCheck = indexOfLastSelfCheck - itemsPerPage;
  const currentSelfChecks = filteredSelfChecks.slice(indexOfFirstSelfCheck, indexOfLastSelfCheck);

  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Render the status badge for an issue
  const renderIssueBadge = (value: boolean) => (
    <span className={`issue-tag ${value ? 'true' : 'false'}`}>
      {value ? '문제 있음' : '정상'}
    </span>
  );

  return (
    <div className="selfchecks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">자가진단 모니터링</h1>
          <p className="page-description">사용자가 제출한 자가진단 결과를 관리합니다.</p>
        </div>
      </div>
      
      <div className="selfchecks-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`selfchecks-tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => handleTabChange(t.key as 'all' | 'user')}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      {tab === 'user' && (
      <Card className="selfchecks-filter-card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
              사용자
            </label>
            <select 
              className="selfchecks-search-input"
              value={selectedUser}
              onChange={handleUserChange}
            >
              <option value="">사용자 선택</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
              차량
            </label>
            <select 
              className="selfchecks-search-input"
              value={selectedVehicle}
              onChange={handleVehicleChange}
              disabled={!selectedUser || vehicles.length === 0}
            >
              <option value="">차량 선택</option>
              {vehicles.map(vehicle => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.vehicleId || vehicle._id}
                </option>
              ))}
            </select>
          </div>
        </div>
        </Card>
      )}

      <Card className="selfchecks-filter-card">
        <form className="selfchecks-filter-form" onSubmit={handleSearch}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
              시작일
            </label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="selfchecks-search-input"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
              종료일
            </label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="selfchecks-search-input"
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
              검색어
            </label>
            <input
              className="selfchecks-search-input"
              type="text"
              placeholder="사용자 이름, 차량번호 입력"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="button" variant="primary" size="medium" onClick={handleFilterReset}>필터초기화</Button>
          </div>
        </form>
      </Card>
      
      <Card className="selfchecks-table-card">
        <table className="selfchecks-table">
          <thead>
            <tr>
              <th>자가진단 일시</th>
              <th>사용자</th>
              <th>차량번호</th>
              <th>점검결과</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: `${70 + (i % 3) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${75 - (i % 3) * 5}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${70 + (i % 4) * 5}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${80 - (i % 3) * 8}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `60%` }}></div></td>
                </tr>
              ))
            ) : !selectedUser && tab === 'user' ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                  사용자를 선택해주세요.
                </td>
              </tr>
            ) : !selectedVehicle && tab === 'user' ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                  {vehicles.length > 0 ? '차량을 선택해주세요.' : '등록된 차량이 없습니다.'}
                </td>
              </tr>
            ) : currentSelfChecks.length > 0 ? (
              currentSelfChecks.map(selfCheck => {
                // Determine troubled parts
                const issues: string[] = [];
                if (selfCheck.motorNoise || selfCheck.abnormalSpeed) issues.push('모터 문제 있음');
                if (selfCheck.breakDelay || selfCheck.breakPadIssue) issues.push('제동 문제 있음');
                if (
                  selfCheck.batteryBlinking ||
                  selfCheck.chargingNotStart ||
                  selfCheck.batteryDischargeFast ||
                  selfCheck.incompleteCharging
                ) issues.push('배터리 문제 있음');
                if (selfCheck.frameNoise || selfCheck.frameCrack) issues.push('프레임 문제 있음');
                if (selfCheck.tubePunctureFrequent || selfCheck.tireWearFrequent) issues.push('타이어 문제 있음');
                if (selfCheck.seatUnstable || selfCheck.seatCoverIssue) issues.push('시트 문제 있음');
                if (selfCheck.footRestLoose || selfCheck.antislipWorn) issues.push('기타 문제 있음');
                return (
                  <tr key={selfCheck._id}>
                    <td>{formatDate(selfCheck.createdAt)}</td>
                    <td>{selfCheck.user?.name || '미상'}</td>
                    <td>{selfCheck.vehicle?.vehicleId || '미상'}</td>
                    <td>
                      {issues.length > 0 ? (
                        <div className="issue-tags">
                          {issues.map((issue, index) => (
                            <span key={index} className="issue-tag issue-tag-true">
                              {issue}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="issue-tags">
                          <span className="issue-tag normal">
                            정상
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => handleSelfCheckClick(selfCheck)}
                      >
                        상세보기
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                  등록된 자가진단 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!loading && filteredSelfChecks.length > 0 && totalPages > 1 && (
          <div className="selfchecks-pagination">
            <Button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="small"
            >
              이전
            </Button>
            <span className="selfchecks-pagination-info">
              {currentPage} / {totalPages}
            </span>
            <Button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="small"
            >
              다음
            </Button>
          </div>
        )}
        {error && (
          <div className="selfchecks-error">오류: {error}</div>
        )}
      </Card>

      {selectedSelfCheck && (
        <Card style={{ marginTop: '1rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>자가진단 상세정보</h2>
            <Button onClick={handleCloseDetail} variant="secondary" size="small">닫기</Button>
          </div>
          <div className="selfcheck-detail">
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">사용자</span>
              <span className="selfcheck-detail-value">{selectedSelfCheck.user?.name || '미상'}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">차량번호</span>
              <span className="selfcheck-detail-value">{selectedSelfCheck.vehicle?.vehicleId || '미상'}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">자가진단 일시</span>
              <span className="selfcheck-detail-value">{formatDate(selectedSelfCheck.createdAt)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">ID</span>
              <span className="selfcheck-detail-value">{selectedSelfCheck._id}</span>
            </div>

            <h3 style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0' }}>모터 관련</h3>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">모터 소음 또는 진동</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.motorNoise)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">속도가 느리거나 빠름</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.abnormalSpeed)}</span>
            </div>

            <h3 style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0' }}>배터리 관련</h3>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">계기판 배터리 점멸</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.batteryBlinking)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">충전 안됨</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.chargingNotStart)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">배터리 방전 잦음</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.batteryDischargeFast)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">완충이 안됨</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.incompleteCharging)}</span>
            </div>

            <h3 style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0' }}>제동 관련</h3>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">브레이크 지연</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.breakDelay)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">브레이크 패드 마모 또는 금</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.breakPadIssue)}</span>
            </div>

            <h3 style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0' }}>타이어 관련</h3>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">타이어 펑크 잦음</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.tubePunctureFrequent)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">타이어 마모 잦음</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.tireWearFrequent)}</span>
            </div>

            <h3 style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0' }}>시트 관련</h3>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">시트 느슨함</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.seatUnstable)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">시트 커버 손상</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.seatCoverIssue)}</span>
            </div>

            <h3 style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0' }}>기타</h3>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">발걸이 느슨함</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.footRestLoose)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">미끄럼 방지 고무 패드 마모</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.antislipWorn)}</span>
            </div>

            <h3 style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0' }}>프레임 관련</h3>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">프레임 소음</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.frameNoise)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">프레임 깨지거나 금 가거나 휘어짐</span>
              <span className="selfcheck-detail-value">{renderIssueBadge(selectedSelfCheck.frameCrack)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SelfChecks; 