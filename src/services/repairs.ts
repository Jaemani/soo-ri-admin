import { fetchApi } from './api';

export interface RepairInput {
  troubleInfo: string;
  repairDetail: string;
  repairType: string;
  billedAmount: number;
  requestedAmount: number;
  isAccident: boolean;
}

export interface Repair {
  _id: string;
  vehicleId: string;
  repairedAt: string;
  billingPrice: number;
  isAccident: boolean;
  repairStationCode: string;
  repairStationLabel: string;
  repairer: string;
  repairCategories: string[];
  batteryVoltage?: number;
  etcRepairParts?: string;
  memo?: string;
  status?: 'pending' | 'in_progress' | 'completed';
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

export interface RepairCreateInput {
  vehicleId: string;
  repairedAt: string;
  billingPrice: number;
  isAccident: boolean;
  repairStationCode: string;
  repairStationLabel: string;
  repairer: string;
  repairCategories: string[];
  batteryVoltage?: number;
  etcRepairParts?: string;
  memo?: string;
}

export interface RepairUpdateInput extends Partial<RepairCreateInput> {}

export interface RepairsResponse {
  success?: boolean;
  repairs: Repair[];
  totalPages?: number;
  currentPage?: number;
  total?: number;
}

export interface RepairFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  repairStationCode?: string;
  isAccident?: boolean;
  repairType?: string;
  minAmount?: string;
  maxAmount?: string;
  vehicleId?: string;
}

export const repairService = {
  // Get all repairs with filters and pagination
  getRepairs: async (params?: RepairFilters): Promise<RepairsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const response = await fetchApi(`/repairs?${queryParams.toString()}`);
      return Array.isArray(response) 
        ? { repairs: response } 
        : response;
    } catch (error) {
      console.error('Error fetching repairs:', error);
      return { repairs: [] };
    }
  },

  // Get all repairs for admin with filters and pagination
  getAllRepairs: async (params?: RepairFilters): Promise<RepairsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const response = await fetchApi(`/admin/repairs?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching all repairs:', error);
      return { repairs: [], totalPages: 1, currentPage: 1, total: 0 };
    }
  },

  // Get a single repair by ID
  getRepair: async (vehicleId: string, repairId: string): Promise<Repair> => {
    return fetchApi(`/vehicles/${vehicleId}/repairs/${repairId}`);
  },

  // Get repairs for a specific vehicle
  getVehicleRepairs: async (vehicleId: string): Promise<RepairsResponse> => {
    try {
      const response = await fetchApi(`/admin/repairs?vehicleId=${vehicleId}`);
      // Handle both possible API response structures
      if (Array.isArray(response)) {
        return { repairs: response };
      } else if (response.repairs) {
        return response;
      }
      return { repairs: [] };
    } catch (error) {
      console.error('Error fetching repairs:', error);
      return { repairs: [] };
    }
  },

  // Create a new repair for a vehicle
  createRepair: async (vehicleId: string, data: RepairCreateInput): Promise<Repair> => {
    return fetchApi(`/vehicles/${vehicleId}/repairs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a repair
  updateRepair: async (vehicleId: string, repairId: string, data: RepairUpdateInput): Promise<Repair> => {
    return fetchApi(`/vehicles/${vehicleId}/repairs/${repairId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete a repair
  deleteRepair: async (vehicleId: string, repairId: string): Promise<void> => {
    return fetchApi(`/vehicles/${vehicleId}/repairs/${repairId}`, {
      method: 'DELETE',
    });
  },

  // Get repair statistics
  getStats: async (params?: {
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
    return fetchApi(`/repairs/stats?${queryParams.toString()}`);
  },

  // Get repairs for a vehicle
  getRepairsForVehicle: async (vehicleId: string): Promise<RepairsResponse> => {
    return fetchApi(`/repairs/${vehicleId}`);
  },

  // Add new repair(s) for a vehicle
  addRepairs: async (vehicleId: string, repairs: RepairInput[]): Promise<RepairsResponse> => {
    return fetchApi(`/repairs/${vehicleId}`, {
      method: 'POST',
      body: JSON.stringify(repairs),
    });
  },
}; 