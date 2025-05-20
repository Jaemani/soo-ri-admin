import React, { useEffect, useState } from 'react';
import { userService, User as BaseUser } from '../services/users';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Users.css';

// Extend the base User type to include guardians
interface User extends BaseUser {
  guardians?: {
    name: string;
    phoneNumber: string;
  }[];
}

const Users: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]); // All users from API
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // Filtered users for display
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Force the skeleton loader to show briefly before fetching data
    setLoading(true);
    const timer = setTimeout(() => {
      fetchAllUsers();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Filter users whenever search term changes
  useEffect(() => {
    filterUsers();
  }, [search, allUsers]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      // Add small initial delay to ensure loading state is applied in the UI
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const loadingStartTime = Date.now();
      const response = await userService.getUsers({ page: 1, limit: 1000 }); // Get all users at once
      
      // Ensure loading state is shown for at least 1200ms for better UX
      const loadingTime = Date.now() - loadingStartTime;
      if (loadingTime < 1200) {
        await new Promise(resolve => setTimeout(resolve, 1200 - loadingTime));
      }
      
      setAllUsers(response.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering function (similar to Repairs page)
  const filterUsers = () => {
    let filtered = [...allUsers];
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.phoneNumber.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredUsers(filtered);
    updatePagination(filtered);
  };
  
  const updatePagination = (filtered: User[]) => {
    setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterUsers();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Get current page of users
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">사용자 관리</h1>
          <p className="page-description">시스템에 등록된 모든 사용자를 관리합니다.</p>
        </div>
      </div>
      
      <Card className="users-filter-card">
        <form className="users-filter-form" onSubmit={handleSearch}>
          <input
            className="users-search-input"
            type="text"
            placeholder="이름, 전화번호 입력"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button type="submit" variant="primary" size="medium">검색</Button>
        </form>
      </Card>
      <Card className="users-table-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>전화번호</th>
              <th>유형</th>
              <th>보호자</th>
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
                </tr>
              ))
            ) : currentUsers.length > 0 ? (
              currentUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.phoneNumber}</td>
                  <td>{translateRecipientType(user.recipientType)}</td>
                  <td>{displayGuardians(user)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                  등록된 사용자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!loading && totalPages > 1 && (
          <div className="users-pagination">
            <Button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="small"
            >
              이전
            </Button>
            <span className="users-pagination-info">
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
          <div className="users-error">오류: {error}</div>
        )}
      </Card>
    </div>
  );
};

const translateRole = (role: User['role']) => {
  const roleMap: Record<User['role'], string> = {
    user: '사용자',
    admin: '관리자',
    repairer: '수리기사',
    guardian: '보호자'
  };
  return roleMap[role] || role;
};

const translateRecipientType = (type: User['recipientType']) => {
  const typeMap: Record<User['recipientType'], string> = {
    general: '일반',
    lowIncome: '저소득',
    welfare: '복지',
    unregistered: '미등록'
  };
  return typeMap[type] || type;
};

const displayGuardians = (user: User) => {
  if (!user.guardians || user.guardians.length === 0) {
    return '미등록';
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {user.guardians.map((guardian, index) => (
        <div key={index}>{guardian.name} ({guardian.phoneNumber})</div>
      ))}
    </div>
  );
};

export default Users; 