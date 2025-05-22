import { Repair, DiagnosticReport } from '../types';
import { User, UsersResponse } from './users';

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
      const error = await response.json();
      console.error('❌ API Error Response:', error);
      throw new ApiErrorImpl(error.message || '서버 오류가 발생했습니다.', response.status);
    }

    const data = await response.json();
    console.log('✅ API Response Data:', data);
    return data;
  } catch (error) {
    console.error('🔥 API Call Failed:', error);
    if (error instanceof ApiErrorImpl) {
      throw error;
    }
    throw new ApiErrorImpl('네트워크 오류가 발생했습니다.');
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
