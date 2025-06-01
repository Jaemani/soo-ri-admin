import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { repairService, Repair } from '../services/repairs';
import { userService, User } from '../services/users';
import { vehiclesService, Vehicle } from '../services/vehicles';
import { formatDate } from '../utils/dateFormat';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FilterPanel, { FilterOption } from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import './Repairs.css';

interface FilterState {
  searchTerm: string;
  repairCategories: string[];
  memo: string;
  startDate: string;
  endDate: string;
  repairType: string;
  repairStationCode: string;
  minAmount: string;
  maxAmount: string;
  [key: string]: string | string[];
}

const initialFilter: FilterState = {
  searchTerm: '',
  repairCategories: [],
  memo: '',
  startDate: '',
  endDate: '',
  repairType: '',
  repairStationCode: '',
  minAmount: '',
  maxAmount: ''
};

// Function to truncate QR ID for table display
const truncateQRId = (qrId: string, maxLength: number = 15): string => {
  if (!qrId || qrId === '미상') return qrId;
  if (qrId.length <= maxLength) return qrId;
  return qrId.substring(0, maxLength) + '...';
};

const Repairs: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [filteredRepairs, setFilteredRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

  // Refs to prevent duplicate API calls in StrictMode
  const fetchRepairsInProgress = useRef(false);
  const fetchUsersInProgress = useRef(false);

  const fetchUsers = useCallback(async () => {
    if (fetchUsersInProgress.current) {
      console.log('Users fetch already in progress, skipping...');
      return;
    }

    fetchUsersInProgress.current = true;
    try {
      const res = await userService.getUsers({ page: 1, limit: 100 });
      setUsers(res.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      fetchUsersInProgress.current = false;
    }
  }, []);

  const fetchRepairs = useCallback(async (page = currentPage, filterParams = filters) => {
    if (fetchRepairsInProgress.current) {
      console.log('Repairs fetch already in progress, skipping...');
      return;
    }

    fetchRepairsInProgress.current = true;
    setLoading(true);
    
    try {
      const response = await repairService.getAllRepairs({
        page,
        limit: itemsPerPage,
        startDate: filterParams.startDate,
        endDate: filterParams.endDate,
        repairType: filterParams.repairType,
        repairStationCode: filterParams.repairStationCode,
        minAmount: filterParams.minAmount,
        maxAmount: filterParams.maxAmount,
        searchTerm: filterParams.searchTerm,
        repairCategories: filterParams.repairCategories.join(','),
        memo: filterParams.memo
      });
      
      setRepairs(response.repairs || []);
      setFilteredRepairs(response.repairs || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.currentPage || 1);
    } catch (e) {
      console.error('Error fetching repairs:', e);
      setRepairs([]);
      setFilteredRepairs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      fetchRepairsInProgress.current = false;
    }
  }, [currentPage, itemsPerPage]);

  // Initial fetch - only fetch on mount, not on filter changes
  useEffect(() => {
    fetchUsers();
    fetchRepairs();
  }, [fetchUsers, fetchRepairs]);

  // Separate effect to handle page changes
  useEffect(() => {
    if (currentPage > 1) { // Only fetch if not on first page (avoid duplicate initial call)
      fetchRepairs(currentPage, filters);
    }
  }, [currentPage]); // This will only trigger when page changes

  // Pagination - using server-side pagination
  const currentItems = filteredRepairs;

  const handleFilterChange = (name: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    // Don't reset page or trigger search automatically
  };
  
  const handleFilterReset = () => {
    setFilters(initialFilter);
    setCurrentPage(1);
    // Only fetch after reset - this is manual action
    fetchRepairs(1, initialFilter);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRepairs(1, filters);
  };

  // Format repair categories
  const formatRepairCategories = (categories: string[]) => {
    if (!categories || categories.length === 0) return '없음';
    return categories.join(', ');
  };

  const handleRepairDetailClick = (repair: Repair) => {
    setSelectedRepair(repair);
  };

  const handleCloseRepairDetail = () => {
    setSelectedRepair(null);
  };

  // Create dynamic filter options including users and vehicles
  const filterOptions: FilterOption[] = [
    {
      name: 'searchTerm',
      label: '검색어',
      type: 'text',
      placeholder: '사용자명, QR ID 검색'
    },
    {
      name: 'repairCategories',
      label: '수리 항목',
      type: 'multiselect',
      options: [
        { value: '구동장치', label: '구동장치' },
        { value: '전자제어', label: '전자제어' },
        { value: '제동장치', label: '제동장치' },
        { value: '타이어&튜브', label: '타이어&튜브' },
        { value: '배터리', label: '배터리' },
        { value: '시트', label: '시트' },
        { value: '발걸이', label: '발걸이' },
        { value: '프레임', label: '프레임' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      name: 'memo',
      label: '메모 검색',
      type: 'text',
      placeholder: '메모 내용 검색'
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
    },
    {
      name: 'repairType',
      label: '수리 유형',
      type: 'select',
      options: [
        { value: 'accident', label: '사고' },
        { value: 'regular', label: '정기점검' }
      ]
    },
    {
      name: 'minAmount',
      label: '최소 금액',
      type: 'number',
      placeholder: '0'
    },
    {
      name: 'maxAmount',
      label: '최대 금액',
      type: 'number',
      placeholder: '300,000'
    }
  ];

  return (
    <div className="repairs-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">수리 관리</h1>
          <p className="page-description">차량 수리 이력을 조회하고 관리합니다.</p>
        </div>
      </div>
      
      <FilterPanel
        filters={filters}
        options={filterOptions}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onSearch={handleSearch}
      />

      <Card className={`repairs-table-card ${loading ? 'loading' : ''}`}>
        <table className="repairs-table">
          <thead>
            <tr>
              <th>수리일자</th>
              <th>사용자</th>
              <th>QR ID</th>
              <th>정비소</th>
              <th>수리 유형</th>
              <th>수리 항목</th>
              <th>금액</th>
              <th>메모</th>
              <th>상세보기</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: `${70 + (i % 3) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${75 - (i % 3) * 5}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${70 + (i % 4) * 5}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${80 - (i % 3) * 8}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${50 + (i % 4) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${65 - (i % 2) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${60 + (i % 5) * 8}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${40 + (i % 3) * 15}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${50 + (i % 4) * 10}%` }}></div></td>
                </tr>
              ))
            ) : currentItems.length > 0 ? (
              currentItems.map(repair => (
                <tr key={repair.id || repair._id}>
                  <td>{formatDate(repair.repairedAt)}</td>
                  <td>{repair.user?.name || '미상'}</td>
                  <td title={repair.vehicle?.vehicleId || '미상'}>{truncateQRId(repair.vehicle?.vehicleId || '미상')}</td>
                  <td>{repair.repairStationLabel}</td>
                  <td>
                    <span className={`tag ${repair.isAccident ? 'tag-accident' : 'tag-regular'}`}>
                      {repair.isAccident ? '사고' : '정기점검'}
                    </span>
                  </td>
                  <td>{formatRepairCategories(repair.repairCategories)}</td>
                  <td>{repair.billingPrice.toLocaleString()}원</td>
                  <td>{repair.memo || '-'}</td>
                  <td>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleRepairDetailClick(repair)}
                    >
                      상세보기
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  수리 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!loading && totalPages > 1 && (
          <div className="repairs-pagination">
            <Button 
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="small"
            >
              이전
            </Button>
            <span className="repairs-pagination-info">
              {currentPage} / {totalPages}
            </span>
            <Button 
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="small"
            >
              다음
            </Button>
          </div>
        )}
      </Card>

      {selectedRepair && (
        <Card style={{ marginTop: '1rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>수리 상세정보</h2>
            <Button onClick={handleCloseRepairDetail} variant="secondary" size="small">닫기</Button>
          </div>
          <div className="repair-detail">
            <div className="repair-detail-item"><span className="repair-detail-label">사용자</span><span className="repair-detail-value">{selectedRepair.user?.name || '미상'}</span></div>
            <div className="repair-detail-item"><span className="repair-detail-label">QR ID</span><span className="repair-detail-value">{selectedRepair.vehicle?.vehicleId || '미상'}</span></div>
            <div className="repair-detail-item"><span className="repair-detail-label">수리일자</span><span className="repair-detail-value">{formatDate(selectedRepair.repairedAt)}</span></div>
            <div className="repair-detail-item"><span className="repair-detail-label">정비소</span><span className="repair-detail-value">{selectedRepair.repairStationLabel}</span></div>
            <div className="repair-detail-item"><span className="repair-detail-label">수리 유형</span><span className="repair-detail-value">{selectedRepair.isAccident ? '사고' : '정기점검'}</span></div>
            <div className="repair-detail-item"><span className="repair-detail-label">수리 항목</span><span className="repair-detail-value">{formatRepairCategories(selectedRepair.repairCategories)}</span></div>
            <div className="repair-detail-item"><span className="repair-detail-label">금액</span><span className="repair-detail-value">{selectedRepair.billingPrice.toLocaleString()}원</span></div>
            <div className="repair-detail-item"><span className="repair-detail-label">메모</span><span className="repair-detail-value">{selectedRepair.memo || '-'}</span></div>
            <div className="repair-detail-item"><span className="repair-detail-label">ID</span><span className="repair-detail-value">{selectedRepair.id || selectedRepair._id}</span></div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Repairs;