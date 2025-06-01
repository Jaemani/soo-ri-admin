import { fetchApi } from './api';

export interface RepairStation {
  _id?: string;
  id?: string;
  code: string;
  label?: string;
  state?: string;
  city?: string;
  region?: string;
  aid: number[]; // [일반, 차상위, 수급]
}

export interface RepairStationResponse {
  success: boolean;
  repairStation: RepairStation;
  message?: string;
}

export const repairStationService = {
  // Get current admin's repair station aid values
  getRepairStation: async (): Promise<{ success: boolean; repairStation?: RepairStation; message?: string }> => {
    try {
      const response = await fetchApi('/repairStations?admin=current');
      return response;
    } catch (error) {
      console.error('Error fetching repair station:', error);
      return { success: false, message: 'Failed to fetch repair station' };
    }
  },

  // Get all repair stations aid data
  getAllRepairStationsAid: async (): Promise<{ success: boolean; stations?: RepairStation[]; message?: string }> => {
    try {
      const response = await fetchApi('/repairStations');
      if (response.stations) {
        return { success: true, stations: response.stations };
      } else {
        return { success: false, message: 'No stations data found' };
      }
    } catch (error) {
      console.error('Error fetching all repair stations:', error);
      return { success: false, message: 'Failed to fetch repair stations' };
    }
  },

  // Update current admin's repair station aid values
  updateAid: async (aid: number[]): Promise<{ success: boolean; repairStation?: RepairStation; message?: string }> => {
    try {
      const response = await fetchApi('/repairStations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aid }),
      });
      return response;
    } catch (error) {
      console.error('Error updating aid values:', error);
      return { success: false, message: 'Failed to update aid values' };
    }
  },
}; 