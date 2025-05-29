import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { repairService, Repair } from '../services/repairs';
import { userService, User } from '../services/users';
import { vehiclesService, Vehicle } from '../services/vehicles';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FilterPanel, { FilterOption } from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import './Repairs.css';

interface FilterState {
  searchTerm: string;
  repairTypeSearch: string;
  startDate: string;
  endDate: string;
  repairType: string;
  repairStationCode: string;
  minAmount: string;
  maxAmount: string;
  [key: string]: string;
}

const initialFilter: FilterState = {
  searchTerm: '',
  repairTypeSearch: '',
  startDate: '',
  endDate: '',
  repairType: '',
  repairStationCode: '',
  minAmount: '',
  maxAmount: ''
};

// Function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
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

  // Fetch users on component mount
  useEffect(() => {
    userService.getUsers({ page: 1, limit: 100 }).then(res => setUsers(res.users));
    fetchRepairs();
  }, []);

  // Fetch repairs when page changes (server-side pagination)
  useEffect(() => {
    fetchRepairs();
  }, [currentPage]);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const response = await repairService.getAllRepairs({
        page: currentPage,
        limit: itemsPerPage,
        startDate: filters.startDate,
        endDate: filters.endDate,
        repairType: filters.repairType,
        repairStationCode: filters.repairStationCode,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        searchTerm: filters.searchTerm,
        repairTypeSearch: filters.repairTypeSearch
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
    }
  };

  // Pagination - using server-side pagination
  const currentItems = filteredRepairs;

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handleFilterReset = () => {
    setFilters(initialFilter);
    setCurrentPage(1);
    // Fetch unfiltered results
    repairService.getAllRepairs({
      page: 1,
      limit: itemsPerPage,
      startDate: '',
      endDate: '',
      repairType: '',
      repairStationCode: '',
      minAmount: '',
      maxAmount: '',
      searchTerm: '',
      repairTypeSearch: ''
    }).then(response => {
      setRepairs(response.repairs || []);
      setFilteredRepairs(response.repairs || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(1);
    }).catch(e => {
      console.error('Error fetching repairs:', e);
      setRepairs([]);
      setFilteredRepairs([]);
      setTotalPages(1);
    });
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
      placeholder: '사용자명, 차량번호 검색'
    },
    {
      name: 'repairTypeSearch',
      label: '수리 내용 검색',
      type: 'text',
      placeholder: '수리 유형(사고/정기점검), 수리 항목 검색'
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
        { value: '', label: '전체' },
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
        onSearch={fetchRepairs}
      />

      <Card className={`repairs-table-card ${loading ? 'loading' : ''}`}>
        <table className="repairs-table">
          <thead>
            <tr>
              <th>수리일자</th>
              <th>사용자</th>
              <th>차량번호</th>
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
                  <td>{repair.vehicle?.vehicleId || '미상'}</td>
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
            <div className="repair-detail-item"><span className="repair-detail-label">차량번호</span><span className="repair-detail-value">{selectedRepair.vehicle?.vehicleId || '미상'}</span></div>
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