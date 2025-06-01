import React, { useEffect, useState, useCallback, useRef } from 'react';
import { userService, User as BaseUser } from '../services/users';
import { aidCalculationService, UserAidInfo } from '../services/aidCalculation';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Users.css';

// Extend the base User type to include guardians
interface User extends BaseUser {
  guardians?: {
    name: string;
  }[];
}

// Add new interface for editable user
interface EditableUser extends User {
  isEditing?: boolean;
  guardianText?: string; // Add field for text-based guardian editing
}

const Users: React.FC = () => {
  const [allUsers, setAllUsers] = useState<EditableUser[]>([]);
  const [userAidInfo, setUserAidInfo] = useState<{ [userId: string]: UserAidInfo }>({});
  const [loading, setLoading] = useState(false);
  const [aidCalculating, setAidCalculating] = useState(false);
  const [aidProgress, setAidProgress] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Ref to track if aid calculation is in progress (prevents StrictMode double calls)
  const aidCalculationInProgress = useRef(false);

  const calculateAidInBackground = useCallback(async (users: User[]) => {
    // Prevent duplicate calculations using ref (works across StrictMode double calls)
    if (aidCalculationInProgress.current) {
      console.log('Aid calculation already in progress (ref check), skipping...');
      return;
    }
    
    aidCalculationInProgress.current = true;
    setAidCalculating(true);
    setAidProgress('계산 시작...');
    
    try {
      const aidInfo = await aidCalculationService.calculateMultipleUsersRemainingAid(
        users, 
        (progressMessage: string) => {
          setAidProgress(progressMessage);
        }
      );
      setUserAidInfo(aidInfo);
      setAidProgress('계산 완료');
    } catch (aidError) {
      console.error('Error calculating aid info:', aidError);
      setAidProgress('계산 실패');
    } finally {
      setAidCalculating(false);
      aidCalculationInProgress.current = false;
      // Clear progress message after a short delay
      setTimeout(() => setAidProgress(''), 2000);
    }
  }, []); // No dependencies needed since we use refs for state

  const fetchUsers = useCallback(async (page = currentPage, searchTerm = search) => {
    setLoading(true);
    try {
      const response = await userService.getUsers({
        page,
        limit: itemsPerPage,
        search: searchTerm
      });
      setAllUsers(response.users || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.currentPage || 1);
      setError(null);
      
      // Start aid calculation in background after users are loaded
      if (response.users && response.users.length > 0) {
        calculateAidInBackground(response.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('사용자 데이터를 불러오는데 실패했습니다.');
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, itemsPerPage, calculateAidInBackground]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterReset = () => {
    setSearch('');
    setCurrentPage(1);
    // The fetchUsers will automatically be called by useEffect when search/currentPage changes
  };

  const handleSearch = () => {
    setCurrentPage(1);
    // The fetchUsers will automatically be called by useEffect when currentPage changes
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Edit row functionality
  const handleEditClick = (user: EditableUser) => {
    // Create guardianText from guardians array for editing
    const guardianText = user.guardians && user.guardians.length > 0
      ? user.guardians.map(g => g.name).join('\n')
      : '';
      
    setEditingUser({ 
      ...user,
      guardianText
    });
    
    // Update the allUsers array to mark this user as being edited
    const updatedUsers = allUsers.map(u => 
      u._id === user._id ? { ...u, isEditing: true } : u
    );
    setAllUsers(updatedUsers);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    
    // Update the allUsers array to clear editing state
    const updatedUsers = allUsers.map(u => ({ ...u, isEditing: false }));
    setAllUsers(updatedUsers);
  };

  const handleInputChange = (field: keyof User, value: string | boolean) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [field]: value });
    }
  };

  const handleGuardianTextChange = (value: string) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, guardianText: value });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      
      // Prepare the data for API update
      const updateData: any = {
        name: editingUser.name,
        phoneNumber: editingUser.phoneNumber,
        recipientType: editingUser.recipientType,
        supportedDistrict: editingUser.supportedDistrict,
        smsConsent: editingUser.smsConsent
      };
      
      // Add guardians if text is provided
      if (editingUser.guardianText !== undefined) {
        updateData.guardians = editingUser.guardianText;
      }
      
      console.log('Updating user:', editingUser, 'with data:', updateData);
      
      // Send update to the API
      await userService.updateUser(editingUser._id, updateData);
      
      // Clear editing state
      setEditingUser(null);
      
      // Refresh the data to get the updated guardians
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format aid amount display
  const formatAidAmount = (user: User): React.ReactNode => {
    const aidInfo = userAidInfo[user._id];
    if (!aidInfo) {
      if (aidCalculating) {
        return <div className="skeleton-cell" style={{ width: '80%', height: '20px' }}></div>;
      }
      return '정보 없음';
    }
    
    if (aidInfo.recipientType === '미등록') {
      return '지원 없음';
    }
    
    return `${aidInfo.remainingAidAmount.toLocaleString()}원`;
  };

  // Render user row based on edit state
  const renderUserRow = (user: EditableUser) => {
    if (user.isEditing) {
      return (
        <tr key={user._id} className="edit-row">
          <td>
            <input
              type="text"
              value={editingUser?.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="edit-input"
            />
          </td>
          <td>
            <input
              type="text"
              value={editingUser?.phoneNumber || ''}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="edit-input"
            />
          </td>
          <td>
            <select
              value={editingUser?.recipientType || ''}
              onChange={(e) => handleInputChange('recipientType', e.target.value)}
              className="edit-select"
            >
              <option value="일반">일반</option>
              <option value="차상위">차상위</option>
              <option value="수급자">수급자</option>
              <option value="미등록">미등록</option>
            </select>
          </td>
          <td>
            <select
              value={editingUser?.supportedDistrict || ''}
              onChange={(e) => handleInputChange('supportedDistrict', e.target.value)}
              className="edit-select"
            >
              <option value="강남구">강남구</option>
              <option value="강동구">강동구</option>
              <option value="강북구">강북구</option>
              <option value="강서구">강서구</option>
              <option value="관악구">관악구</option>
              <option value="광진구">광진구</option>
              <option value="구로구">구로구</option>
              <option value="금천구">금천구</option>
              <option value="노원구">노원구</option>
              <option value="도봉구">도봉구</option>
              <option value="동대문구">동대문구</option>
              <option value="동작구">동작구</option>
              <option value="마포구">마포구</option>
              <option value="서대문구">서대문구</option>
              <option value="서초구">서초구</option>
              <option value="성동구">성동구</option>
              <option value="성북구">성북구</option>
              <option value="송파구">송파구</option>
              <option value="양천구">양천구</option>
              <option value="영등포구">영등포구</option>
              <option value="용산구">용산구</option>
              <option value="은평구">은평구</option>
              <option value="종로구">종로구</option>
              <option value="중구">중구</option>
              <option value="중랑구">중랑구</option>
              <option value="서울 외">서울 외</option>
            </select>
          </td>
          <td>
            <div className="edit-checkbox-container">
              <input
                type="checkbox"
                checked={editingUser?.smsConsent || false}
                onChange={(e) => handleInputChange('smsConsent', e.target.checked)}
                className="edit-checkbox"
                id={`sms-consent-${user._id}`}
              />
              <label htmlFor={`sms-consent-${user._id}`}>동의</label>
            </div>
          </td>
          <td>{formatAidAmount(user as User)}</td>
          <td>
            <textarea
              value={editingUser?.guardianText || ''}
              onChange={(e) => handleGuardianTextChange(e.target.value)}
              className="edit-textarea"
              placeholder="홍길동&#10;김철수"
              rows={4}
            />
            <div className="edit-guardian-help">
              각 줄에 보호자 이름 입력 (예: 홍길동)
            </div>
            <div className="edit-actions">
              <Button
                onClick={handleSaveEdit}
                variant="success"
                size="small"
              >
                적용
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="secondary"
                size="small"
              >
                취소
              </Button>
            </div>
          </td>
        </tr>
      );
    } else {
      return (
        <tr key={user._id}>
          <td>{user.name}</td>
          <td>{user.phoneNumber}</td>
          <td>{user.recipientType}</td>
          <td>{user.supportedDistrict}</td>
          <td>{user.smsConsent ? '동의' : '미동의'}</td>
          <td>{formatAidAmount(user as User)}</td>
          <td>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>{displayGuardians(user as User)}</div>
              <Button
                onClick={() => handleEditClick(user)}
                variant="primary"
                size="small"
              >
                수정
              </Button>
            </div>
          </td>
        </tr>
      );
    }
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">사용자 관리</h1>
          <p className="page-description">시스템에 등록된 모든 사용자를 관리합니다.</p>
        </div>
      </div>
      
      <Card className="users-filter-card">
        <div className="users-filter-form">
          <input
            className="users-search-input"
            type="text"
            placeholder="이름, 전화번호 입력"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="button" variant="primary" size="medium" onClick={handleFilterReset}>필터초기화</Button>
            <Button type="button" variant="primary" size="medium" onClick={handleSearch}>검색</Button>
          </div>
        </div>
      </Card>
      <Card className="users-table-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>전화번호</th>
              <th>유형</th>
              <th>지원구</th>
              <th>SMS동의</th>
              <th>
                올해 잔여 지원금
                {aidCalculating && (
                  <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal', marginTop: '2px' }}>
                    {aidProgress}
                  </div>
                )}
              </th>
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
                  <td><div className="skeleton-cell" style={{ width: `${40 + (i % 3) * 10}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${50 + (i % 5) * 8}%` }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: `${50 + (i % 5) * 8}%` }}></div></td>
                </tr>
              ))
            ) : allUsers.length > 0 ? (
              allUsers.map(user => renderUserRow(user))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
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

const displayGuardians = (user: User) => {
  if (!user.guardians || user.guardians.length === 0) {
    return '미등록';
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {user.guardians.map((guardian, index) => (
        <div key={index}>{guardian.name}</div>
      ))}
    </div>
  );
};

export default Users; 