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
}

export const vehiclesService = {
  // Get vehicles for a user
  getVehiclesForUser: async (userId: string): Promise<VehiclesResponse> => {
    return fetchApi(`/vehicles?userId=${userId}`);
  },
}; 