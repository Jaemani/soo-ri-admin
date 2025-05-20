import { fetchApi } from './api';

export interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  role: 'user' | 'admin' | 'repairer' | 'guardian';
  recipientType: 'general' | 'lowIncome' | 'welfare' | 'unregistered';
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface UserCreateInput {
  name: string;
  phoneNumber: string;
  role: User['role'];
  recipientType: User['recipientType'];
}

export interface UserUpdateInput extends Partial<UserCreateInput> {
  guardianIds?: string[];
}

export const userService = {
  // Get all users with pagination and filters
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: User['role'];
    recipientType?: User['recipientType'];
    search?: string;
  }): Promise<UsersResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    
    console.log('📍 Calling users endpoint:', `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    
    return fetchApi(`/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },

  // Get a single user by ID
  getUser: async (id: string): Promise<User> => {
    return fetchApi(`/users/${id}`);
  },

  // Create a new user
  createUser: async (data: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    return fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a user
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return fetchApi(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete a user
  deleteUser: async (id: string): Promise<void> => {
    return fetchApi(`/users/${id}`, {
      method: 'DELETE',
    });
  },
}; 