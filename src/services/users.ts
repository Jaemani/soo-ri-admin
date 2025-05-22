import { fetchApi } from './api';

export interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  role: 'user' | 'admin' | 'repairer' | 'guardian';
  recipientType: '일반' | '차상위' | '수급자' | '미등록';
  supportedDistrict: '강남구' | '강동구' | '강북구' | '강서구' | '관악구' | '광진구' | '구로구' | '금천구' | '노원구' | '도봉구' | '동대문구' | '동작구' | '마포구' | '서대문구' | '서초구' | '성동구' | '성북구' | '송파구' | '양천구' | '영등포구' | '용산구' | '은평구' | '종로구' | '중구' | '중랑구' | '서울 외';
  smsConsent: boolean;
  guardians?: { name: string }[];
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
  supportedDistrict: User['supportedDistrict'];
  smsConsent: boolean;
}

export interface UserUpdateInput extends Partial<UserCreateInput> {
  guardians?: string; // Now expects a newline-separated string of guardian names
}

export const userService = {
  // Get all users with pagination and filters
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: User['role'];
    recipientType?: User['recipientType'];
    supportedDistrict?: User['supportedDistrict'];
    search?: string;
  }): Promise<UsersResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) queryParams.append(key, value.toString());
        });
      }
      
      const response = await fetchApi(`/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
      
      // Handle different response formats from API
      if (!response.users && Array.isArray(response)) {
        return {
          success: true,
          users: response.map((user: any) => ({
            ...user,
            supportedDistrict: user.supportedDistrict || '',
            smsConsent: Boolean(user.smsConsent),
            guardians: user.guardians || []
          })),
          totalPages: 1,
          currentPage: 1,
          total: response.length
        };
      }
      
      // Ensure all fields are properly typed
      return {
        ...response,
        users: response.users.map((user: Partial<User>) => ({
          ...user,
          supportedDistrict: user.supportedDistrict || '',
          smsConsent: Boolean(user.smsConsent),
          guardians: user.guardians || []
        }))
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, users: [], totalPages: 0, currentPage: 1, total: 0 };
    }
  },

  // Get a single user by ID
  getUser: async (id: string): Promise<User> => {
    try {
      const response = await fetchApi(`/users/${id}`);
      const user = response.user || response; // Handle both response formats
      
      return {
        ...user,
        supportedDistrict: user.supportedDistrict || '',
        smsConsent: Boolean(user.smsConsent),
        guardians: user.guardians || []
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Create a new user
  createUser: async (data: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    return fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a user
  updateUser: async (id: string, data: Partial<User> & { guardians?: string }): Promise<User> => {
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