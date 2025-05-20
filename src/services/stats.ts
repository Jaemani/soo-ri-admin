import { fetchApi } from './api';

export interface RepairStats {
  totalRepairs: number;
  totalCost: number;
  averageCost: number;
  repairsByCategory: {
    category: string;
    count: number;
    totalCost: number;
  }[];
  repairsByStation: {
    stationCode: string;
    stationLabel: string;
    count: number;
    totalCost: number;
  }[];
  monthlyStats: {
    month: string;
    count: number;
    totalCost: number;
  }[];
}

export interface UserStats {
  totalUsers: number;
  usersByType: {
    recipientType: string;
    count: number;
  }[];
  activeUsers: number;
  newUsersThisMonth: number;
}

export const statsService = {
  // Get overall statistics
  getOverallStats: async () => {
    return fetchApi('/stats/overall');
  },

  // Get repair statistics with filters
  getRepairStats: async (params?: {
    startDate?: string;
    endDate?: string;
    repairStationCode?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    return fetchApi(`/stats/repairs?${queryParams.toString()}`);
  },

  // Get user statistics
  getUserStats: async () => {
    return fetchApi('/stats/users');
  },

  // Get monthly comparison
  getMonthlyComparison: async (year: number, month: number) => {
    return fetchApi(`/stats/monthly/${year}/${month}`);
  },

  // Export statistics to Excel
  exportStats: async (params?: {
    startDate?: string;
    endDate?: string;
    type?: 'repairs' | 'users' | 'all';
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    return fetchApi(`/stats/export?${queryParams.toString()}`);
  },
}; 