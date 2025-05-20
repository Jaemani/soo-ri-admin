import { repairService } from '../repairs';
import { fetchApi } from '../api';

// Mock the fetchApi function
jest.mock('../api');
const mockedFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

describe('repairService', () => {
  const mockVehicleId = 'test-vehicle-id';
  const mockRepair = {
    troubleInfo: '고장 정보',
    repairDetail: '수리 상세',
    repairType: '수리 유형',
    billedAmount: 50000,
    requestedAmount: 45000,
    isAccident: false,
  };

  beforeEach(() => {
    // Clear mock before each test
    mockedFetchApi.mockClear();
  });

  describe('getRepairs', () => {
    it('should fetch repairs for a vehicle', async () => {
      const mockResponse = {
        success: true,
        repairs: [{ ...mockRepair, _id: '1' }],
      };

      mockedFetchApi.mockResolvedValueOnce(mockResponse);

      const result = await repairService.getRepairs(mockVehicleId);

      expect(mockedFetchApi).toHaveBeenCalledWith(`/repairs/${mockVehicleId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching repairs', async () => {
      const mockError = new Error('Failed to fetch repairs');
      mockedFetchApi.mockRejectedValueOnce(mockError);

      await expect(repairService.getRepairs(mockVehicleId)).rejects.toThrow('Failed to fetch repairs');
    });
  });

  describe('addRepairs', () => {
    it('should add new repairs for a vehicle', async () => {
      const mockResponse = {
        success: true,
        repairs: [{ ...mockRepair, _id: '1' }],
      };

      mockedFetchApi.mockResolvedValueOnce(mockResponse);

      const result = await repairService.addRepairs(mockVehicleId, [mockRepair]);

      expect(mockedFetchApi).toHaveBeenCalledWith(
        `/repairs/${mockVehicleId}`,
        {
          method: 'POST',
          body: JSON.stringify([mockRepair]),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when adding repairs', async () => {
      const mockError = new Error('Failed to add repairs');
      mockedFetchApi.mockRejectedValueOnce(mockError);

      await expect(repairService.addRepairs(mockVehicleId, [mockRepair])).rejects.toThrow('Failed to add repairs');
    });
  });
}); 