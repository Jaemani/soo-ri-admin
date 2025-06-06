import { mockLogin, mockVerifyToken } from './mockAuth';

interface LoginResponse {
  success: boolean;
  token: string;
  admin: {
    id: string;
    label: string;
  };
}

interface LoginCredentials {
  id: string;
  password: string;
}

// Set this to false when you want to use the real API
const USE_MOCK = false;
const API_BASE_URL = `${process.env.REACT_APP_API_URL}/admin/login`;

// Centralized function to handle authentication failures
export const handleAuthFailure = () => {
  // Clear all authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('adminId');
  localStorage.removeItem('stationLabel');
  
  // Redirect to login page
  window.location.href = '/login';
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  if (USE_MOCK) {
    return mockLogin(credentials);
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials),
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '로그인에 실패했습니다.');
  }

  const data = await response.json();
  return data;
};

export const verifyToken = async (): Promise<boolean> => {
  if (USE_MOCK) {
    return mockVerifyToken();
  }

  const token = localStorage.getItem('token');
  const adminId = localStorage.getItem('adminId');
  const stationLabel = localStorage.getItem('stationLabel');
  
  // Check if we have all required auth data
  return !!(token && adminId && stationLabel);
};

// Utility to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const adminId = localStorage.getItem('adminId');
  const stationLabel = localStorage.getItem('stationLabel');
  
  return !!(token && adminId && stationLabel);
};

// Utility to get current admin info
export const getCurrentAdmin = () => {
  return {
    id: localStorage.getItem('adminId'),
    label: localStorage.getItem('stationLabel'),
    token: localStorage.getItem('token')
  };
};

// Utility to logout
export const logout = () => {
  handleAuthFailure();
};
