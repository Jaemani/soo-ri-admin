// Mock user data for testing
const MOCK_USERS = [
  {
    id: 'admin',
    password: 'admin123',
    label: '수리수리 본점',
  },
  {
    id: 'test',
    password: 'test123',
    label: '수리수리 지점',
  },
];

interface LoginResponse {
  success: boolean;
  token: string;
  admin: {
    id: string;
    label: string;
  };
}

interface LoginCredentials {
  id: string;
  password: string;
}

// Simulates API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockLogin = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  // Simulate API delay
  await delay(500);

  const user = MOCK_USERS.find(u => 
    u.id === credentials.id && 
    u.password === credentials.password
  );

  if (!user) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  // Generate a mock token
  const token = btoa(JSON.stringify({ id: user.id, label: user.label }));

  return {
    success: true,
    token,
    admin: {
      id: user.id,
      label: user.label,
    }
  };
};

export const mockVerifyToken = async (): Promise<boolean> => {
  await delay(200);
  const token = localStorage.getItem('token');
  const adminId = localStorage.getItem('adminId');
  const stationLabel = localStorage.getItem('stationLabel');
  return !!(token && adminId && stationLabel);
};