import { fetchApi } from './api';
import { db, ensureFirebaseAuth } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

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
      const useFirestore = process.env.REACT_APP_USE_FIRESTORE === 'true';

      if (useFirestore) {
        await ensureFirebaseAuth();
        const vehiclesCol = collection(db, 'vehicles');
        const q = query(vehiclesCol, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        const vehicles: Vehicle[] = snapshot.docs.map((docSnap) => {
          const data: any = docSnap.data();
          return {
            _id: (data._id as string) || docSnap.id,
            vehicleId: data.vehicleId || '',
            userId: data.userId || userId,
            model: data.model,
            purchasedAt: data.purchasedAt,
            registeredAt: data.registeredAt,
          };
        });

        console.log(`[Firestore] Loaded ${vehicles.length} vehicles for user ${userId}`);
        return { success: true, vehicles };
      }

      const response = await fetchApi(`/admin/vehicles/${userId}`);
      return Array.isArray(response) 
        ? { success: true, vehicles: response } 
        : response;
    } catch (error) {
      console.error('Error fetching vehicles for user:', error);
      return { success: false, vehicles: [] };
    }
  },

  // Get all vehicles by fetching vehicles for all users
  getAllVehicles: async (users: any[]): Promise<VehiclesResponse> => {
    try {
      const allVehicles: Vehicle[] = [];
      
      for (const user of users) {
        try {
          const userVehiclesResponse = await vehiclesService.getVehiclesForUser(user._id);
          if (userVehiclesResponse.success && userVehiclesResponse.vehicles) {
            allVehicles.push(...userVehiclesResponse.vehicles);
          }
        } catch (error) {
          console.error(`Error fetching vehicles for user ${user._id}:`, error);
        }
      }
      
      return { success: true, vehicles: allVehicles };
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
      return { success: false, vehicles: [] };
    }
  },

  // Get a single vehicle by ID
  getVehicle: async (vehicleId: string): Promise<Vehicle> => {
    return fetchApi(`/vehicles/${vehicleId}`);
  }
}; 
