import React, { useEffect, useState } from 'react';
import { selfCheckService, SelfCheck } from '../services/selfChecks';
import { userService, User } from '../services/users';
import { vehiclesService, Vehicle } from '../services/vehicles';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './SelfChecks.css';

const SelfChecks: React.FC = () => {
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
    // Load users on component mount
    fetchUsers();
  }, []);

  // Filter selfChecks whenever relevant state changes
  useEffect(() => {
    filterSelfChecks();
  }, [allSelfChecks, search, selectedVehicle, dateRange]);

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
      // Add small initial delay to ensure loading state is applied in the UI
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const loadingStartTime = Date.now();
      const response = await selfCheckService.getVehicleSelfChecks(vehicleId);
      
      // Ensure loading state is shown for at least 1200ms for better UX
      const loadingTime = Date.now() - loadingStartTime;
      if (loadingTime < 1200) {
        await new Promise(resolve => setTimeout(resolve, 1200 - loadingTime));
      }
      
      // Add vehicle and user information to self checks
      const selfChecks = response.selfChecks || [];
      const selectedVehicleInfo = vehicles.find(v => v._id === vehicleId);
      const enhancedSelfChecks = selfChecks.map(check => ({
        ...check,
        vehicleCode: selectedVehicleInfo?.vehicleId || 'Unknown',
        userName: users.find(u => u._id === selectedUser)?.name || 'Unknown'
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
        (selfCheck.userName && selfCheck.userName.toLowerCase().includes(searchLower)) ||
        (selfCheck.vehicleCode && selfCheck.vehicleCode.toLowerCase().includes(searchLower))
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
    updatePagination(filtered);
  };
  
  const updatePagination = (filtered: SelfCheck[]) => {
    setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterSelfChecks();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
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
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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
            <Button type="submit" variant="primary" size="medium">검색</Button>
          </div>
        </form>
      </Card>
      
      <Card className="selfchecks-table-card">
        <table className="selfchecks-table">
          <thead>
            <tr>
              <th>사용자</th>
              <th>차량번호</th>
              <th>자가진단 일시</th>
              <th>모터</th>
              <th>제동</th>
              <th>배터리</th>
              <th>프레임</th>
              <th>상세보기</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: `${70 + (i % 3) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${80 - (i % 4) * 5}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${60 + (i % 2) * 15}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${50 + (i % 5) * 8}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${40 + (i % 3) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${50 + (i % 5) * 8}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${40 + (i % 3) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${50 + (i % 5) * 8}%` }}></div></td>
                </tr>
              ))
            ) : !selectedUser ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                  사용자를 선택해주세요.
                </td>
              </tr>
            ) : !selectedVehicle ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                  {vehicles.length > 0 ? '차량을 선택해주세요.' : '등록된 차량이 없습니다.'}
                </td>
              </tr>
            ) : currentSelfChecks.length > 0 ? (
              currentSelfChecks.map(selfCheck => (
                <tr key={selfCheck.id}>
                  <td>{selfCheck.userName || '미상'}</td>
                  <td>{selfCheck.vehicleCode || '미상'}</td>
                  <td>{formatDate(selfCheck.createdAt)}</td>
                  <td>{renderIssueBadge(selfCheck.motorNoise || selfCheck.abnormalSpeed)}</td>
                  <td>{renderIssueBadge(selfCheck.breakDelay || selfCheck.breakPadIssue)}</td>
                  <td>{renderIssueBadge(selfCheck.batteryBlinking || selfCheck.chargingNotStart || selfCheck.batteryDischargeFast || selfCheck.incompleteCharging)}</td>
                  <td>{renderIssueBadge(selfCheck.frameNoise || selfCheck.frameCrack)}</td>
                  <td>
                    <Button
                      onClick={() => handleSelfCheckClick(selfCheck)}
                      variant="primary"
                      size="small"
                    >
                      상세보기
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
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
              <span className="selfcheck-detail-value">{selectedSelfCheck.userName || '미상'}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">차량번호</span>
              <span className="selfcheck-detail-value">{selectedSelfCheck.vehicleCode || '미상'}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">자가진단 일시</span>
              <span className="selfcheck-detail-value">{formatDate(selectedSelfCheck.createdAt)}</span>
            </div>
            <div className="selfcheck-detail-item">
              <span className="selfcheck-detail-label">ID</span>
              <span className="selfcheck-detail-value">{selectedSelfCheck.id}</span>
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