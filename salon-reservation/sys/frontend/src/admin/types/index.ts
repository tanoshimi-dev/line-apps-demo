export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  specialty?: string;
  bio?: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
}

export interface AdminLoginResponse {
  token: string;
  twoFactorRequired: boolean;
  user: AdminUser;
  expiresAt: string;
}

export interface DashboardStats {
  totalMembers: number;
  todayReservations: number;
  pendingReservations: number;
  weeklyReservations: number;
  reservationsByStatus: Record<string, number>;
  todaySchedule: TodayScheduleItem[];
}

export interface TodayScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  memberName: string;
  serviceName: string;
  staffName: string;
}

export interface AdminReservation {
  id: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  cancelReason?: string;
  member: {
    id: string;
    displayName: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
  };
  staff: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface AdminService {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminStaffMember {
  id: string;
  name: string;
  username: string;
  specialty?: string;
  bio?: string;
  avatarUrl?: string;
  isActive: boolean;
  services: { id: string; name: string }[];
}

export interface StaffSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface StaffException {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isAvailable: boolean;
  reason?: string;
}

export interface AdminStaffDetail extends AdminStaffMember {
  schedules: StaffSchedule[];
  exceptions: StaffException[];
}

export interface AdminMember {
  id: string;
  displayName: string;
  phone?: string;
  email?: string;
  pictureUrl?: string;
  createdAt: string;
}

export interface AdminMemberDetail extends AdminMember {
  lineUserId: string;
  reservations: {
    id: string;
    reservationDate: string;
    startTime: string;
    endTime: string;
    status: string;
    serviceName: string;
    staffName: string;
    createdAt: string;
  }[];
}

export interface AdminMessage {
  id: string;
  direction: 'salon_to_member' | 'member_to_salon';
  content: string;
  sentViaLine: boolean;
  adminUserName?: string;
  createdAt: string;
}

export interface Operator {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}
