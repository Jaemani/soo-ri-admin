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
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
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
  success: boolean;
  repairs: Repair[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface RepairFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  repairStationCode?: string;
  isAccident?: boolean;
}

export const repairService = {
  // Get repairs with filters and pagination
  getRepairs: async (params?: RepairFilters): Promise<RepairsResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    return fetchApi(`/repairs?${queryParams.toString()}`);
  },

  // Get a single repair by ID
  getRepair: async (id: string): Promise<Repair> => {
    return fetchApi(`/repairs/${id}`);
  },

  // Get repairs for a specific vehicle
  getVehicleRepairs: async (vehicleId: string) => {
    return fetchApi(`/repairs/vehicle/${vehicleId}`);
  },

  // Create a new repair
  createRepair: async (data: RepairCreateInput): Promise<Repair> => {
    return fetchApi('/repairs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a repair
  updateRepair: async (id: string, data: RepairUpdateInput): Promise<Repair> => {
    return fetchApi(`/repairs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete a repair
  deleteRepair: async (id: string): Promise<void> => {
    return fetchApi(`/repairs/${id}`, {
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