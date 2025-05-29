import { fetchApi } from './api';

export interface SelfCheck {
  _id: string;
  vehicleId: string;
  motorNoise: boolean;
  abnormalSpeed: boolean;
  batteryBlinking: boolean;
  chargingNotStart: boolean;
  breakDelay: boolean;
  breakPadIssue: boolean;
  tubePunctureFrequent: boolean;
  tireWearFrequent: boolean;
  batteryDischargeFast: boolean;
  incompleteCharging: boolean;
  seatUnstable: boolean;
  seatCoverIssue: boolean;
  footRestLoose: boolean;
  antislipWorn: boolean;
  frameNoise: boolean;
  frameCrack: boolean;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    _id: string;
    vehicleId: string;
    model?: string;
  };
  user?: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
}

export interface SelfChecksResponse {
  success?: boolean;
  selfChecks: SelfCheck[];
  currentPage?: number;
  totalPages?: number;
  total?: number;
}

export interface SelfCheckFilters {
  page?: number;
  limit?: number;
  userId?: string;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  checkResultSearch?: string;
  hasIssues?: boolean;
}

export const selfCheckService = {
  // Get all self checks with pagination and filters
  getSelfChecks: async (params?: SelfCheckFilters): Promise<SelfChecksResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    return fetchApi(`/selfChecks?${queryParams.toString()}`);
  },

  // Get all self checks for admin with pagination and filters
  getAllSelfChecks: async (params?: SelfCheckFilters): Promise<SelfChecksResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const response = await fetchApi(`/admin/selfChecks?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching all self checks:', error);
      return { selfChecks: [], totalPages: 1, currentPage: 1, total: 0 };
    }
  },

  // Get a single self check by ID
  getSelfCheck: async (vehicleId: string, selfCheckId: string): Promise<SelfCheck> => {
    return fetchApi(`/vehicles/${vehicleId}/selfCheck/${selfCheckId}`);
  },

  // Get self checks for a specific vehicle
  getVehicleSelfChecks: async (vehicleId: string): Promise<SelfChecksResponse> => {
    try {
      const response = await fetchApi(`/admin/selfChecks?vehicleId=${vehicleId}`);
      // Handle both possible API response structures
      if (Array.isArray(response)) {
        return { selfChecks: response };
      } else if (response.selfChecks) {
        return response;
      }
      return { selfChecks: [] };
    } catch (error) {
      console.error('Error fetching self checks:', error);
      return { selfChecks: [] };
    }
  },

  // Get self checks for a specific user
  getUserSelfChecks: async (userId: string): Promise<SelfChecksResponse> => {
    return fetchApi(`/selfChecks/user/${userId}`);
  },

  // Get statistics for self checks
  getStats: async (params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    return fetchApi(`/selfChecks/stats?${queryParams.toString()}`);
  }
}; 