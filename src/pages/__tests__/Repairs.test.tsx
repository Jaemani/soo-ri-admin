import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { repairService } from '../../services/repairs';
import Repairs from '../Repairs';

// Mock the repairs service
jest.mock('../../services/repairs');
const mockedRepairService = repairService as jest.Mocked<typeof repairService>;

describe('Repairs Component', () => {
  const mockRepair = {
    _id: '1',
    troubleInfo: '고장 정보',
    repairDetail: '수리 상세',
    repairType: '수리 유형',
    billedAmount: 50000,
    requestedAmount: 45000,
    isAccident: false,
  };

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('renders the repairs page with initial empty state', () => {
    render(<Repairs />);
    
    expect(screen.getByText('수리 이력')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('차량 ID를 입력하세요')).toBeInTheDocument();
    expect(screen.getByText('새 수리 이력 추가')).toBeInTheDocument();
    expect(screen.getByText('등록된 수리 이력이 없습니다.')).toBeInTheDocument();
  });

  it('fetches and displays repairs when searching by vehicle ID', async () => {
    const mockResponse = {
      success: true,
      repairs: [mockRepair],
    };

    mockedRepairService.getRepairs.mockResolvedValueOnce(mockResponse);

    render(<Repairs />);

    // Enter vehicle ID and search
    const input = screen.getByPlaceholderText('차량 ID를 입력하세요');
    const searchButton = screen.getByText('검색');
    
    await userEvent.type(input, 'test-vehicle-id');
    fireEvent.click(searchButton);

    // Wait for repairs to be displayed
    await waitFor(() => {
      expect(screen.getByText('고장 정보')).toBeInTheDocument();
      expect(screen.getByText('수리 상세')).toBeInTheDocument();
      expect(screen.getByText('₩50,000')).toBeInTheDocument();
    });

    expect(mockedRepairService.getRepairs).toHaveBeenCalledWith('test-vehicle-id');
  });

  it('shows error message when fetching repairs fails', async () => {
    mockedRepairService.getRepairs.mockRejectedValueOnce(new Error('Failed to fetch repairs'));

    render(<Repairs />);

    // Enter vehicle ID and search
    const input = screen.getByPlaceholderText('차량 ID를 입력하세요');
    const searchButton = screen.getByText('검색');
    
    await userEvent.type(input, 'test-vehicle-id');
    fireEvent.click(searchButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch repairs')).toBeInTheDocument();
    });
  });

  it('adds a new repair successfully', async () => {
    const mockResponse = {
      success: true,
      repairs: [mockRepair],
    };

    mockedRepairService.addRepairs.mockResolvedValueOnce(mockResponse);
    mockedRepairService.getRepairs.mockResolvedValueOnce(mockResponse);

    render(<Repairs />);

    // Open the form
    fireEvent.click(screen.getByText('새 수리 이력 추가'));

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/고장 정보:/i), '고장 정보');
    await userEvent.type(screen.getByLabelText(/수리 상세:/i), '수리 상세');
    await userEvent.type(screen.getByLabelText(/수리 유형:/i), '수리 유형');
    await userEvent.type(screen.getByLabelText(/청구 금액:/i), '50000');
    await userEvent.type(screen.getByLabelText(/요청 금액:/i), '45000');
    
    // Enter vehicle ID (required for adding repair)
    const vehicleInput = screen.getByPlaceholderText('차량 ID를 입력하세요');
    await userEvent.type(vehicleInput, 'test-vehicle-id');

    // Submit the form
    fireEvent.click(screen.getByText('추가'));

    // Wait for success and refresh
    await waitFor(() => {
      expect(mockedRepairService.addRepairs).toHaveBeenCalledWith(
        'test-vehicle-id',
        [expect.objectContaining({
          troubleInfo: '고장 정보',
          repairDetail: '수리 상세',
          repairType: '수리 유형',
          billedAmount: 50000,
          requestedAmount: 45000,
          isAccident: false,
        })]
      );
    });
  });

  it('shows error when adding repair without vehicle ID', async () => {
    render(<Repairs />);

    // Open the form
    fireEvent.click(screen.getByText('새 수리 이력 추가'));

    // Fill in the form but don't enter vehicle ID
    await userEvent.type(screen.getByLabelText(/고장 정보:/i), '고장 정보');
    
    // Submit the form
    fireEvent.click(screen.getByText('추가'));

    // Check for error message
    expect(screen.getByText('차량 ID를 먼저 입력해주세요.')).toBeInTheDocument();
  });

  it('formats currency amounts correctly', async () => {
    const mockResponse = {
      success: true,
      repairs: [mockRepair],
    };

    mockedRepairService.getRepairs.mockResolvedValueOnce(mockResponse);

    render(<Repairs />);

    // Search for repairs
    const input = screen.getByPlaceholderText('차량 ID를 입력하세요');
    const searchButton = screen.getByText('검색');
    
    await userEvent.type(input, 'test-vehicle-id');
    fireEvent.click(searchButton);

    // Check currency formatting
    await waitFor(() => {
      expect(screen.getByText('₩50,000')).toBeInTheDocument();
      expect(screen.getByText('₩45,000')).toBeInTheDocument();
    });
  });
}); 