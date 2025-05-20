import React, { useState, useEffect } from 'react';
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
  startDate: string;
  endDate: string;
  repairType: string;
  repairStationCode: string;
  status: string;
  minAmount: string;
  maxAmount: string;
  [key: string]: string;
}

const initialFilter: FilterState = {
  searchTerm: '',
  startDate: '',
  endDate: '',
  repairType: '',
  repairStationCode: '',
  status: '',
  minAmount: '',
  maxAmount: ''
};

const filterOptions: FilterOption[] = [
  {
    name: 'searchTerm',
    label: '검색어',
    type: 'text',
    placeholder: '차량번호, 정비소, 내용 검색'
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
      { value: 'maintenance', label: '정기점검' },
      { value: 'repair', label: '수리' }
    ]
  },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    options: [
      { value: 'pending', label: '대기중' },
      { value: 'in_progress', label: '진행중' },
      { value: 'completed', label: '완료' }
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
    type: 'number'
  }
];

const TABS = [
  { key: 'all', label: '전체 수리이력' },
  { key: 'user', label: '선택한 사용자 수리이력' }
];

const Repairs: React.FC = () => {
  const [tab, setTab] = useState<'user' | 'all'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [filteredRepairs, setFilteredRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch users for user selector
  useEffect(() => {
    if (tab === 'user') {
      userService.getUsers({ page: 1, limit: 100 }).then(res => setUsers(res.users));
    }
  }, [tab]);

  // Fetch vehicles for selected user
  useEffect(() => {
    if (tab === 'user' && selectedUserId) {
      setVehicles([]);
      setSelectedVehicleId('');
      vehiclesService.getVehiclesForUser(selectedUserId).then(res => {
        setVehicles(res.vehicles);
        if (res.vehicles.length > 0) {
          setSelectedVehicleId(res.vehicles[0].vehicleId);
        }
      });
    } else {
      setVehicles([]);
      setSelectedVehicleId('');
    }
  }, [tab, selectedUserId]);

  // Fetch repairs
  useEffect(() => {
    if (tab === 'all') {
      // Force the skeleton loader to show briefly before fetching data
      setLoading(true);
      const timer = setTimeout(() => {
        fetchRepairs();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      fetchRepairs();
    }
  }, [tab, selectedVehicleId]);

  useEffect(() => {
    filterRepairs();
  }, [repairs, filters]);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      // Add small initial delay to ensure loading state is applied in the UI
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Add a minimum loading time to ensure the shimmer effect is visible
      const loadingStartTime = Date.now();
      
      let response;
      if (tab === 'user' && selectedVehicleId) {
        response = await repairService.getRepairsForVehicle(selectedVehicleId);
      } else if (tab === 'all') {
        response = await repairService.getRepairs();
      } else {
        setRepairs([]);
        setTotalPages(1);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
      
      // Ensure loading state is shown for at least 1200ms for better UX
      const loadingTime = Date.now() - loadingStartTime;
      if (loadingTime < 1200) {
        await new Promise(resolve => setTimeout(resolve, 1200 - loadingTime));
      }
      
      setRepairs(response.repairs);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(1);
    } catch (e) {
      setRepairs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const filterRepairs = () => {
    let filtered = [...repairs];
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(repair => 
        repair.vehicleId.toLowerCase().includes(searchLower) ||
        repair.repairStationLabel.toLowerCase().includes(searchLower) ||
        repair.memo?.toLowerCase().includes(searchLower)
      );
    }
    if (filters.startDate) {
      filtered = filtered.filter(repair => 
        new Date(repair.repairedDate) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(repair => 
        new Date(repair.repairedDate) <= new Date(filters.endDate)
      );
    }
    if (filters.repairType) {
      filtered = filtered.filter(repair => 
        repair.isAccident === (filters.repairType === 'accident')
      );
    }
    if (filters.repairStationCode) {
      filtered = filtered.filter(repair => 
        repair.repairStationCode === filters.repairStationCode
      );
    }
    if (filters.status) {
      filtered = filtered.filter(repair => 
        repair.status === filters.status
      );
    }
    if (filters.minAmount) {
      filtered = filtered.filter(repair => 
        repair.billingPrice >= parseInt(filters.minAmount)
      );
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(repair => 
        repair.billingPrice <= parseInt(filters.maxAmount)
      );
    }
    setFilteredRepairs(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const totalFilteredPages = Math.ceil(filteredRepairs.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRepairs.slice(indexOfFirstItem, indexOfLastItem);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleFilterReset = () => setFilters(initialFilter);

  const handleTabChange = (newTab: 'user' | 'all') => {
    setTab(newTab);
    setFilters(initialFilter);
    setSelectedUserId('');
    setSelectedVehicleId('');
  };

  return (
    <div className="repairs-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">수리 관리</h1>
          <p className="page-description">차량 수리 이력을 조회하고 관리합니다.</p>
        </div>
      </div>
      
      <div className="repairs-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`repairs-tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => handleTabChange(t.key as 'user' | 'all')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'user' && (
        <Card className="repairs-user-selector-card">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              className="repairs-user-selector"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
            >
              <option value="">사용자 선택</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.phoneNumber})</option>
              ))}
            </select>
            {vehicles.length > 0 && (
              <select
                className="repairs-vehicle-selector"
                value={selectedVehicleId}
                onChange={e => setSelectedVehicleId(e.target.value)}
              >
                {vehicles.map(v => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {v.model ? `${v.model} (${v.vehicleId})` : v.vehicleId}
                  </option>
                ))}
              </select>
            )}
            {selectedUserId && vehicles.length === 0 && (
              <span style={{ color: 'var(--gray-600)' }}>등록된 차량이 없습니다.</span>
            )}
          </div>
        </Card>
      )}

      <Card className="repairs-filter-card">
        <FilterPanel
          filters={filters}
          options={filterOptions}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />
      </Card>

      <Card className="repairs-table-card">
        <table className="repairs-table">
          <thead>
            <tr>
              <th>수리일자</th>
              <th>차량번호</th>
              <th>정비소</th>
              <th>수리 유형</th>
              <th>수리 내용</th>
              <th>수리 금액</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: `${75 - (i % 3) * 5}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${70 + (i % 4) * 5}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${80 - (i % 3) * 8}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${50 + (i % 4) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${65 - (i % 2) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${60 + (i % 5) * 8}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${40 + (i % 3) * 15}%` }}></div></td>
                </tr>
              ))
            ) : currentItems.length > 0 ? (
              currentItems.map(repair => (
                <tr key={repair._id}>
                  <td>{new Date(repair.repairedDate).toLocaleDateString('ko-KR')}</td>
                  <td>{repair.vehicleId}</td>
                  <td>{repair.repairStationLabel}</td>
                  <td>{repair.isAccident ? '사고' : '정기점검'}</td>
                  <td>{repair.memo}</td>
                  <td>{repair.billingPrice.toLocaleString()}원</td>
                  <td>
                    <span className={`tag tag-${repair.status}`}>
                      {repair.status === 'pending' ? '대기중' : 
                       repair.status === 'in_progress' ? '진행중' : '완료'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  {tab === 'user' && (!selectedUserId || !selectedVehicleId)
                    ? '사용자와 차량을 선택하세요.'
                    : '수리 이력이 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!loading && totalFilteredPages > 1 && (
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
              {currentPage} / {totalFilteredPages}
            </span>
            <Button 
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalFilteredPages}
              variant="secondary"
              size="small"
            >
              다음
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Repairs;