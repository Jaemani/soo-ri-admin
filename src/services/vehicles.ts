import { fetchApi } from './api';

export interface Vehicle {
  _id: string;
  vehicleId: string;
  userId: string;
  model?: string;
  purchasedAt?: string;
  registeredAt?: string;
}

export interface VehiclesResponse {
  success: boolean;
  vehicles: Vehicle[];
  totalPages?: number;
  currentPage?: number;
  total?: number;
}

export const vehiclesService = {
  // Get vehicles for a user
  getVehiclesForUser: async (userId: string): Promise<VehiclesResponse> => {
    try {
      const response = await fetchApi(`/admin/vehicles/${userId}`);
      return Array.isArray(response) 
        ? { success: true, vehicles: response } 
        : response;
    } catch (error) {
      console.error('Error fetching vehicles for user:', error);
      return { success: false, vehicles: [] };
    }
  },

  // Get a single vehicle by ID
  getVehicle: async (vehicleId: string): Promise<Vehicle> => {
    return fetchApi(`/vehicles/${vehicleId}`);
  }
}; 