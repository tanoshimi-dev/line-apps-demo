export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface MemberInfo {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export interface StaffInfo {
  id: string;
  name: string;
  specialty?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponse {
  staffId: string;
  date: string;
  serviceId: string;
  slots: TimeSlot[];
}

export interface ReservationInfo {
  id: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: string;
  staff: StaffInfo;
  service: {
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
  };
  createdAt: string;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface MessageInfo {
  id: string;
  direction: 'salon_to_member' | 'member_to_salon';
  content: string;
  createdAt: string;
}
