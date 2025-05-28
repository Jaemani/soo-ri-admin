import { Repair, DiagnosticReport } from '../types';
import { User, UsersResponse } from './users';
import { handleAuthFailure } from './auth';

// Correctly using backticks for template literals to evaluate environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export interface ApiError {
  message: string;
  status?: number;
}

export class ApiErrorImpl extends Error implements ApiError {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('🌐 Making request to:', url);
  console.log('🔑 Headers:', headers);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      // Handle authentication failures
      if (response.status === 401) {
        console.error('❌ Authentication failed - redirecting to login');
        handleAuthFailure();
        throw new ApiErrorImpl('인증이 만료되었습니다. 다시 로그인해주세요.', response.status);
      }
      
      // Handle forbidden access
      if (response.status === 403) {
        console.error('❌ Access forbidden');
        throw new ApiErrorImpl('접근 권한이 없습니다.', response.status);
      }
      
      // Try to get error message from response
      let errorMessage = '서버 오류가 발생했습니다.';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use default message
        console.warn('Could not parse error response:', parseError);
      }
      
      console.error('❌ API Error Response:', errorMessage);
      throw new ApiErrorImpl(errorMessage, response.status);
    }

    const data = await response.json();
    console.log('✅ API Response Data:', data);
    return data;
  } catch (error) {
    console.error('🔥 API Call Failed:', error);
    
    // If it's already our custom error, re-throw it
    if (error instanceof ApiErrorImpl) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiErrorImpl('네트워크 연결을 확인해주세요.');
    }
    
    // Handle other errors
    throw new ApiErrorImpl('알 수 없는 오류가 발생했습니다.');
  }
};

export const userService = {
  getUsers: async () => {
    return fetchApi('/users') as Promise<UsersResponse>;
  },

  getUserById: async (id: string) => {
    return fetchApi(`/users/${id}`) as Promise<User>;
  },
};

export const repairService = {
  getRepairs: async (vehicleId: string) => {
    return fetchApi(`/repairs/${vehicleId}`);
  },

  addRepairs: async (vehicleId: string, repairs: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    return fetchApi(`/repairs/${vehicleId}`, {
      method: 'POST',
      body: JSON.stringify(repairs),
    });
  },
};

export const diagnosticService = {
  getDiagnostics: async (userId: string) => {
    return fetchApi(`/diagnostics/${userId}`) as Promise<DiagnosticReport[]>;
  },
}; 
