import React, { useEffect, useState, useCallback, useRef } from 'react';
import { selfCheckService, SelfCheck } from '../services/selfChecks';
import { formatDate } from '../utils/dateFormat';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FilterPanel, { FilterOption } from '../components/common/FilterPanel';
import './SelfChecks.css';

interface FilterState {
  search: string;
  checkResults: string[];
  startDate: string;
  endDate: string;
  [key: string]: string | string[];
}

const initialFilter: FilterState = {
  search: '',
  checkResults: [],
  startDate: '',
  endDate: ''
};

const SelfChecks: React.FC = () => {
  const [allSelfChecks, setAllSelfChecks] = useState<SelfCheck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterState>(initialFilter);
  const [itemsPerPage] = useState(10);
  const [selectedSelfCheck, setSelectedSelfCheck] = useState<SelfCheck | null>(null);

  // Ref to prevent duplicate API calls in StrictMode
  const fetchInProgress = useRef(false);

  const fetchAllSelfChecks = useCallback(async (page = currentPage, filterParams = filters) => {
    // Prevent duplicate calls
    if (fetchInProgress.current) {
      console.log('SelfChecks fetch already in progress, skipping...');
      return;
    }

    fetchInProgress.current = true;
    setLoading(true);
    
    try {
      const response = await selfCheckService.getAllSelfChecks({
        page,
        limit: itemsPerPage,
        startDate: filterParams.startDate,
        endDate: filterParams.endDate,
        search: filterParams.search,
        checkResults: filterParams.checkResults.join(',')
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
      fetchInProgress.current = false;
    }
  }, [currentPage, itemsPerPage]);

  // Initial fetch
  useEffect(() => {
    fetchAllSelfChecks();
  }, [fetchAllSelfChecks]);

  // Separate effect to handle page changes
  useEffect(() => {
    if (currentPage > 1) { // Only fetch if not on first page (avoid duplicate initial call)
      fetchAllSelfChecks(currentPage, filters);
    }
  }, [currentPage]); // This will only trigger when page changes

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = (name: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    // Don't reset page or trigger search automatically
  };

  const handleFilterReset = () => {
    setFilters(initialFilter);
    setCurrentPage(1);
    // Only fetch after reset - this is manual action
    fetchAllSelfChecks(1, initialFilter);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAllSelfChecks(1, filters);
  };

  const handleSelfCheckClick = (selfCheck: SelfCheck) => {
    setSelectedSelfCheck(selfCheck);
  };

  const handleCloseDetail = () => {
    setSelectedSelfCheck(null);
  };

  // Get current page of selfChecks
  const displayData = allSelfChecks;
  const currentSelfChecks = displayData;

  // Function to truncate QR ID for table display
  const truncateQRId = (qrId: string, maxLength: number = 15): string => {
    if (!qrId || qrId === '미상') return qrId;
    if (qrId.length <= maxLength) return qrId;
    return qrId.substring(0, maxLength) + '...';
  };

  // Render the status badge for an issue
  const renderIssueBadge = (value: boolean) => (
    <span className={`issue-tag ${value ? 'true' : 'false'}`}>
      {value ? '문제 있음' : '정상'}
    </span>
  );

  // Create filter options
  const filterOptions: FilterOption[] = [
    {
      name: 'search',
      label: '검색어',
      type: 'text',
      placeholder: '사용자명, QR ID 검색'
    },
    {
      name: 'checkResults',
      label: '점검결과 검색',
      type: 'multiselect',
      options: [
        { value: '모터', label: '모터' },
        { value: '배터리', label: '배터리' },
        { value: '제동', label: '제동' },
        { value: '타이어', label: '타이어' },
        { value: '시트', label: '시트' },
        { value: '프레임', label: '프레임' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      name: 'startDate',
      label: '시작일',
      type: 'date'
    },
    {
      name: 'endDate',
      label: '종료일',
      type: 'date'
    }
  ];

  return (
    <div className="selfchecks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">자가진단 모니터링</h1>
          <p className="page-description">사용자가 제출한 자가진단 결과를 관리합니다.</p>
        </div>
      </div>
      
      <FilterPanel
        filters={filters}
        options={filterOptions}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onSearch={handleSearch}
      />
      
      <Card className="selfchecks-table-card">
        <table className="selfchecks-table">
          <thead>
            <tr>
              <th>자가진단 일시</th>
              <th>사용자</th>
              <th>QR ID</th>
              <th>점검결과</th>
              <th>상세보기</th>
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
            ) : currentSelfChecks.length > 0 ? (
              currentSelfChecks.map(selfCheck => {
                // Determine troubled parts - remove "문제 있음" text
                const issues: string[] = [];
                if (selfCheck.motorNoise || selfCheck.abnormalSpeed) issues.push('모터');
                if (selfCheck.breakDelay || selfCheck.breakPadIssue) issues.push('제동');
                if (
                  selfCheck.batteryBlinking ||
                  selfCheck.chargingNotStart ||
                  selfCheck.batteryDischargeFast ||
                  selfCheck.incompleteCharging
                ) issues.push('배터리');
                if (selfCheck.frameNoise || selfCheck.frameCrack) issues.push('프레임');
                if (selfCheck.tubePunctureFrequent || selfCheck.tireWearFrequent) issues.push('타이어');
                if (selfCheck.seatUnstable || selfCheck.seatCoverIssue) issues.push('시트');
                if (selfCheck.footRestLoose || selfCheck.antislipWorn) issues.push('기타');
                return (
                  <tr key={selfCheck._id}>
                    <td>{formatDate(selfCheck.createdAt)}</td>
                    <td>{selfCheck.user?.name || '미상'}</td>
                    <td title={selfCheck.vehicle?.vehicleId || '미상'}>{truncateQRId(selfCheck.vehicle?.vehicleId || '미상')}</td>
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
        {!loading && displayData.length > 0 && totalPages > 1 && (
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
        <div className="selfcheck-modal" onClick={handleCloseDetail}>
          <div className="selfcheck-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="selfcheck-modal-header">
              <h2 className="selfcheck-modal-title">자가진단 상세정보</h2>
              <button onClick={handleCloseDetail} className="selfcheck-modal-close">×</button>
            </div>
            
            {/* Basic Information Section */}
            <div className="selfcheck-section">
              <h3 className="selfcheck-section-title">기본정보</h3>
              <div className="selfcheck-basic-info">
                <div className="selfcheck-info-card">
                  <span className="selfcheck-info-label">사용자</span>
                  <span className="selfcheck-info-value" style={{ fontSize: '0.925rem' }}>{selectedSelfCheck.user?.name || '미상'}</span>
                </div>
                <div className="selfcheck-info-card">
                  <span className="selfcheck-info-label">QR ID</span>
                  <span className="selfcheck-info-value">{selectedSelfCheck.vehicle?.vehicleId || '미상'}</span>
                </div>
                <div className="selfcheck-info-card">
                  <span className="selfcheck-info-label">자가진단 일시</span>
                  <span className="selfcheck-info-value">{formatDate(selectedSelfCheck.createdAt)}</span>
                </div>
                <div className="selfcheck-info-card">
                  <span className="selfcheck-info-label">ID</span>
                  <span className="selfcheck-info-value" style={{ fontSize: '0.925rem', fontFamily: 'monospace' }}>{selectedSelfCheck._id}</span>
                </div>
              </div>
            </div>

            {/* Check Results Section */}
            <div className="selfcheck-section">
              <h3 className="selfcheck-section-title">점검결과</h3>
              <div className="selfcheck-categories">
                
                {/* Motor Section */}
                <div className="selfcheck-category">
                  <h4 className="selfcheck-category-title">모터</h4>
                  <div className="selfcheck-category-items">
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">모터 소음 또는 진동</span>
                      {renderIssueBadge(selectedSelfCheck.motorNoise)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">속도가 느리거나 빠름</span>
                      {renderIssueBadge(selectedSelfCheck.abnormalSpeed)}
                    </div>
                  </div>
                </div>

                {/* Battery Section */}
                <div className="selfcheck-category">
                  <h4 className="selfcheck-category-title">배터리</h4>
                  <div className="selfcheck-category-items">
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">계기판 배터리 점멸</span>
                      {renderIssueBadge(selectedSelfCheck.batteryBlinking)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">충전 안됨</span>
                      {renderIssueBadge(selectedSelfCheck.chargingNotStart)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">배터리 방전 잦음</span>
                      {renderIssueBadge(selectedSelfCheck.batteryDischargeFast)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">완충이 안됨</span>
                      {renderIssueBadge(selectedSelfCheck.incompleteCharging)}
                    </div>
                  </div>
                </div>

                {/* Brake Section */}
                <div className="selfcheck-category">
                  <h4 className="selfcheck-category-title">제동</h4>
                  <div className="selfcheck-category-items">
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">브레이크 지연</span>
                      {renderIssueBadge(selectedSelfCheck.breakDelay)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">브레이크 패드 마모 또는 금</span>
                      {renderIssueBadge(selectedSelfCheck.breakPadIssue)}
                    </div>
                  </div>
                </div>

                {/* Tire Section */}
                <div className="selfcheck-category">
                  <h4 className="selfcheck-category-title">타이어</h4>
                  <div className="selfcheck-category-items">
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">타이어 펑크 잦음</span>
                      {renderIssueBadge(selectedSelfCheck.tubePunctureFrequent)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">타이어 마모 잦음</span>
                      {renderIssueBadge(selectedSelfCheck.tireWearFrequent)}
                    </div>
                  </div>
                </div>

                {/* Seat Section */}
                <div className="selfcheck-category">
                  <h4 className="selfcheck-category-title">시트</h4>
                  <div className="selfcheck-category-items">
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">시트 느슨함</span>
                      {renderIssueBadge(selectedSelfCheck.seatUnstable)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">시트 커버 손상</span>
                      {renderIssueBadge(selectedSelfCheck.seatCoverIssue)}
                    </div>
                  </div>
                </div>

                {/* Frame Section */}
                <div className="selfcheck-category">
                  <h4 className="selfcheck-category-title">프레임</h4>
                  <div className="selfcheck-category-items">
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">프레임 소음</span>
                      {renderIssueBadge(selectedSelfCheck.frameNoise)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">프레임 깨지거나 금 가거나 휘어짐</span>
                      {renderIssueBadge(selectedSelfCheck.frameCrack)}
                    </div>
                  </div>
                </div>

                {/* Others Section */}
                <div className="selfcheck-category">
                  <h4 className="selfcheck-category-title">기타</h4>
                  <div className="selfcheck-category-items">
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">발걸이 느슨함</span>
                      {renderIssueBadge(selectedSelfCheck.footRestLoose)}
                    </div>
                    <div className="selfcheck-check-item">
                      <span className="selfcheck-check-label">미끄럼 방지 고무 패드 마모</span>
                      {renderIssueBadge(selectedSelfCheck.antislipWorn)}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfChecks; 