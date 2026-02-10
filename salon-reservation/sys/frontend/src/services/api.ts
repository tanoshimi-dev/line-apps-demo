import { getAccessToken } from './liff';
import type {
  MemberInfo,
  ServiceInfo,
  StaffInfo,
  AvailabilityResponse,
  ReservationInfo,
  MessageInfo,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken() || 'dev_test_token';

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  return response;
}

// Snake_case to camelCase transform
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? toCamelCase(item as Record<string, unknown>)
          : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

function transformResponse<T>(data: unknown): T {
  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === 'object' && item !== null
        ? toCamelCase(item as Record<string, unknown>)
        : item
    ) as T;
  }
  if (typeof data === 'object' && data !== null) {
    return toCamelCase(data as Record<string, unknown>) as T;
  }
  return data as T;
}

// Member
export async function getMemberInfo(): Promise<MemberInfo | null> {
  const res = await apiRequest('/member');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to get member info');
  return transformResponse<MemberInfo>(await res.json());
}

export async function registerMember(data?: {
  phone?: string;
  email?: string;
}): Promise<MemberInfo> {
  const res = await apiRequest('/member/register', {
    method: 'POST',
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw new Error('Failed to register');
  return transformResponse<MemberInfo>(await res.json());
}

// Services
export async function getServices(): Promise<ServiceInfo[]> {
  const res = await apiRequest('/services');
  if (!res.ok) throw new Error('Failed to get services');
  return transformResponse<ServiceInfo[]>(await res.json());
}

// Staff
export async function getStaff(serviceId?: string): Promise<StaffInfo[]> {
  const params = serviceId ? `?service_id=${serviceId}` : '';
  const res = await apiRequest(`/staff${params}`);
  if (!res.ok) throw new Error('Failed to get staff');
  return transformResponse<StaffInfo[]>(await res.json());
}

export async function getStaffAvailability(
  staffId: string,
  date: string,
  serviceId: string
): Promise<AvailabilityResponse> {
  const res = await apiRequest(
    `/staff/${staffId}/availability?date=${date}&service_id=${serviceId}`
  );
  if (!res.ok) throw new Error('Failed to get availability');
  return transformResponse<AvailabilityResponse>(await res.json());
}

// Reservations
export async function getReservations(
  status?: 'upcoming' | 'past'
): Promise<ReservationInfo[]> {
  const params = status ? `?status=${status}` : '';
  const res = await apiRequest(`/reservations${params}`);
  if (!res.ok) throw new Error('Failed to get reservations');
  return transformResponse<ReservationInfo[]>(await res.json());
}

export async function getReservation(id: string): Promise<ReservationInfo> {
  const res = await apiRequest(`/reservations/${id}`);
  if (!res.ok) throw new Error('Failed to get reservation');
  return transformResponse<ReservationInfo>(await res.json());
}

export async function createReservation(data: {
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  notes?: string;
}): Promise<ReservationInfo> {
  const res = await apiRequest('/reservations', {
    method: 'POST',
    body: JSON.stringify({
      service_id: data.serviceId,
      staff_id: data.staffId,
      date: data.date,
      start_time: data.startTime,
      notes: data.notes,
    }),
  });
  if (res.status === 409) throw new Error('選択した時間枠は既に予約されています');
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create reservation');
  }
  return transformResponse<ReservationInfo>(await res.json());
}

export async function cancelReservation(
  id: string,
  reason?: string
): Promise<void> {
  const res = await apiRequest(`/reservations/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to cancel reservation');
}

// Messages
export async function getMessages(): Promise<MessageInfo[]> {
  const res = await apiRequest('/messages');
  if (!res.ok) throw new Error('Failed to get messages');
  return transformResponse<MessageInfo[]>(await res.json());
}

export async function sendMessage(content: string): Promise<MessageInfo> {
  const res = await apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return transformResponse<MessageInfo>(await res.json());
}
