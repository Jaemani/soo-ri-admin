import { fetchApi } from './api';
import { User } from './users';
import { vehiclesService } from './vehicles';
import { repairService, Repair } from './repairs';
import { repairStationService, RepairStation } from './repairStation';

export interface UserAidInfo {
  userId: string;
  totalAidAmount: number;
  usedAidAmount: number;
  remainingAidAmount: number;
  recipientType: string;
  repairStationCode?: string;
}

// Cache for bulk data
let stationsCache: RepairStation[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const aidCalculationService = {
  // Calculate remaining aid for multiple users efficiently
  calculateMultipleUsersRemainingAid: async (
    users: User[], 
    onProgress?: (message: string) => void,
    existingRepairs?: Repair[] // Optional: pass existing repairs to avoid duplicate API calls
  ): Promise<{ [userId: string]: UserAidInfo }> => {
    console.log(`Starting efficient aid calculation for ${users.length} users`);
    const results: { [userId: string]: UserAidInfo } = {};
    
    try {
      // 1. Fetch all repair stations once
      onProgress?.('수리소 정보 로딩 중...');
      console.log('Fetching repair stations...');
      const stationsResponse = await repairStationService.getAllRepairStationsAid();
      const stations = stationsResponse.stations || [];
      console.log(`Loaded ${stations.length} repair stations`);
      
      // Create station lookup map
      const stationLookup: { [code: string]: RepairStation } = {};
      stations.forEach(station => {
        stationLookup[station.code] = station;
      });
      
      // 2. Get repairs data (use existing or fetch new)
      let allRepairs: Repair[];
      if (existingRepairs && existingRepairs.length > 0) {
        onProgress?.('기존 수리 데이터 사용 중...');
        allRepairs = existingRepairs;
        console.log(`Using ${existingRepairs.length} existing repairs`);
      } else {
        onProgress?.('수리 기록 로딩 중...');
        console.log('Fetching all repairs...');
        const allRepairsResponse = await repairService.getAllRepairs({
          page: 1,
          limit: 5000, // Get a large number of repairs
        });
        allRepairs = allRepairsResponse.repairs || [];
        console.log(`Loaded ${allRepairs.length} total repairs`);
      }
      
      // 3. Fetch all vehicles for all users in parallel
      onProgress?.('차량 정보 로딩 중...');
      console.log('Fetching vehicles for all users...');
      const vehiclePromises = users.map(user => 
        vehiclesService.getVehiclesForUser(user._id).then(response => ({
          userId: user._id,
          vehicles: response.vehicles || []
        }))
      );
      
      const userVehicles = await Promise.all(vehiclePromises);
      console.log('Loaded vehicles for all users');
      
      // Create user vehicle lookup
      const userVehicleLookup: { [userId: string]: any[] } = {};
      userVehicles.forEach(({ userId, vehicles }) => {
        userVehicleLookup[userId] = vehicles;
      });
      
      // 4. Group repairs by user based on vehicle ownership
      onProgress?.('데이터 연결 중...');
      console.log('Grouping repairs by user...');
      const userRepairs: { [userId: string]: any[] } = {};
      
      // Create vehicle to user lookup
      const vehicleToUserMap: { [vehicleId: string]: string } = {};
      users.forEach(user => {
        const vehicles = userVehicleLookup[user._id] || [];
        vehicles.forEach(vehicle => {
          if (vehicle._id) {
            vehicleToUserMap[vehicle._id] = user._id;
          }
        });
      });
      
      // Group repairs by user
      allRepairs.forEach((repair: Repair) => {
        if (repair.vehicleId) {
          const userId = vehicleToUserMap[repair.vehicleId];
          if (userId) {
            if (!userRepairs[userId]) {
              userRepairs[userId] = [];
            }
            userRepairs[userId].push(repair);
          }
        }
      });
      
      console.log(`Grouped repairs for ${Object.keys(userRepairs).length} users`);
      
      // 5. Calculate aid for each user
      onProgress?.('지원금 계산 중...');
      
      // Get current year start date (January 1st of current year)
      const currentYear = new Date().getFullYear();
      const currentYearStart = new Date(currentYear, 0, 1); // January 1st of current year
      
      users.forEach(user => {
        const repairs = userRepairs[user._id] || [];
        
        // Filter repairs to only include current year repairs (from January 1st)
        const currentYearRepairs = repairs.filter((repair: Repair) => {
          const repairDate = new Date(repair.repairedAt);
          return repairDate >= currentYearStart;
        });
        
        const totalRepairAmount = currentYearRepairs.reduce((sum, repair) => sum + (repair.billingPrice || 0), 0);
        
        // Find station for aid calculation
        let station: RepairStation | undefined;
        let repairStationCode: string | undefined;
        
        // Try to get station from repairs first (use all repairs, not just current year)
        if (repairs.length > 0) {
          repairStationCode = repairs[0].repairStationCode;
          if (repairStationCode) {
            station = stationLookup[repairStationCode];
          }
        }
        
        // If no station from repairs, try to find by district
        if (!station) {
          station = stations.find(s => s.region === user.supportedDistrict && s.aid && s.aid.some(val => val > 0));
          if (station) {
            repairStationCode = station.code;
          }
        }
        
        // Fallback to first station with aid
        if (!station) {
          station = stations.find(s => s.aid && s.aid.some(val => val > 0));
          if (station) {
            repairStationCode = station.code;
          }
        }
        
        // Calculate aid amount
        let totalAidAmount = 0;
        if (station && station.aid) {
          const aidIndex = getAidIndexForRecipientType(user.recipientType);
          if (aidIndex !== -1) {
            totalAidAmount = station.aid[aidIndex] || 0;
          }
        }
        
        results[user._id] = {
          userId: user._id,
          totalAidAmount,
          usedAidAmount: totalRepairAmount,
          remainingAidAmount: Math.max(0, totalAidAmount - totalRepairAmount),
          recipientType: user.recipientType,
          repairStationCode,
        };
        
        console.log(`${user.name}: aid=${totalAidAmount}, used=${totalRepairAmount}, remaining=${Math.max(0, totalAidAmount - totalRepairAmount)}`);
      });
      
      onProgress?.('계산 완료');
      console.log('Aid calculation completed for all users');
      return results;
      
    } catch (error) {
      console.error('Error in bulk aid calculation:', error);
      onProgress?.('계산 실패');
      // Return default values for all users
      users.forEach(user => {
        results[user._id] = {
          userId: user._id,
          totalAidAmount: 0,
          usedAidAmount: 0,
          remainingAidAmount: 0,
          recipientType: user.recipientType,
        };
      });
      return results;
    }
  },

  // Calculate remaining aid for a single user (legacy method, now uses bulk calculation)
  calculateUserRemainingAid: async (user: User): Promise<UserAidInfo> => {
    const results = await aidCalculationService.calculateMultipleUsersRemainingAid([user]);
    return results[user._id] || {
      userId: user._id,
      totalAidAmount: 0,
      usedAidAmount: 0,
      remainingAidAmount: 0,
      recipientType: user.recipientType,
    };
  },
};

// Helper function to map recipient type to aid array index
function getAidIndexForRecipientType(recipientType: string): number {
  switch (recipientType) {
    case '일반':
      return 0;
    case '차상위':
      return 1;
    case '수급':
      return 2;
    case '미등록':
    default:
      return -1; // No aid
  }
} 