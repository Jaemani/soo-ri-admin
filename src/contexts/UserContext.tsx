import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UsersResponse } from '../services/users';
import { userService } from '../services/users';

interface UserContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const refreshUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers();
      setUsers(response.users);
      setTotalUsers(response.total);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUsers();
    }
  }, []);

  return (
    <UserContext.Provider value={{ 
      users, 
      loading, 
      error, 
      totalUsers,
      currentPage,
      totalPages,
      refreshUsers 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
}; 