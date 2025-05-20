export interface User {
  id: string;
  name: string;
  birthDate: string;
  address: string;
  phoneNumber: string;
  qrId: string;
  status: 'active' | 'inactive' | 'pending';
  lastActivity: Date;
  registrationDate: Date;
}

export interface Repair {
  id: string;
  userId: string;
  vehicleId: string;
  repairType: string;
  troubleInfo: string;
  repairDetail: string;
  billedAmount: number;
  requestedAmount: number;
  isAccident: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosticReport {
  id: string;
  userId: string;
  qrId: string;
  diagnosisDate: Date;
  riskLevel: 'normal' | 'warning' | 'critical';
  issues: string[];
  nextCheckupDate: Date;
}

export interface Statistics {
  totalUsers: number;
  totalRepairs: number;
  recentRepairs: number;
  alertUsers: number;
  monthlyRepairCounts: Record<string, number>;
  repairTypeDistribution: Record<string, number>;
} 