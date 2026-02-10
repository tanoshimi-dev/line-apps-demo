import type {
  AdminLoginResponse,
  AdminUser,
  DashboardStats,
  AdminReservation,
  AdminService,
  AdminStaffMember,
  AdminStaffDetail,
  AdminMember,
  AdminMemberDetail,
  AdminMessage,
  Operator,
  PaginatedResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
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

function transform<T>(data: unknown): T {
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

async function adminRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken() || 'dev_admin_token';

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    if (!window.location.pathname.includes('/admin/login')) {
      window.location.href = '/admin/login';
    }
  }

  return response;
}

// Auth
export async function adminLogin(
  username: string,
  password: string
): Promise<AdminLoginResponse> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Login failed');
  }
  return transform<AdminLoginResponse>(await res.json());
}

export async function adminVerify2fa(
  token: string,
  code: string
): Promise<AdminLoginResponse> {
  const res = await fetch(`${API_BASE}/admin/2fa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, code }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Verification failed');
  }
  return transform<AdminLoginResponse>(await res.json());
}

export async function adminLogout(): Promise<void> {
  await adminRequest('/admin/logout', { method: 'POST' });
  localStorage.removeItem('admin_token');
}

export async function getAdminMe(): Promise<AdminUser> {
  const res = await adminRequest('/admin/me');
  if (!res.ok) throw new Error('Failed to get admin user');
  return transform<AdminUser>(await res.json());
}

// Dashboard
export async function getDashboard(): Promise<DashboardStats> {
  const res = await adminRequest('/admin/dashboard');
  if (!res.ok) throw new Error('Failed to get dashboard');
  return transform<DashboardStats>(await res.json());
}

// Reservations
export async function getAdminReservations(params?: {
  date?: string;
  status?: string;
  staffId?: string;
  page?: number;
}): Promise<PaginatedResponse<AdminReservation>> {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.status) query.set('status', params.status);
  if (params?.staffId) query.set('staff_id', params.staffId);
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();

  const res = await adminRequest(`/admin/reservations${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Failed to get reservations');
  const raw = await res.json();
  return {
    ...raw,
    data: transform<AdminReservation[]>(raw.data),
  };
}

export async function getAdminReservation(
  id: string
): Promise<AdminReservation> {
  const res = await adminRequest(`/admin/reservations/${id}`);
  if (!res.ok) throw new Error('Failed to get reservation');
  return transform<AdminReservation>(await res.json());
}

export async function updateReservationStatus(
  id: string,
  status: string,
  cancelReason?: string
): Promise<void> {
  const res = await adminRequest(`/admin/reservations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, cancel_reason: cancelReason }),
  });
  if (!res.ok) throw new Error('Failed to update status');
}

// Services
export async function getAdminServices(): Promise<AdminService[]> {
  const res = await adminRequest('/admin/services');
  if (!res.ok) throw new Error('Failed to get services');
  return transform<AdminService[]>(await res.json());
}

export async function createService(
  data: Partial<AdminService>
): Promise<AdminService> {
  const res = await adminRequest('/admin/services', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      duration_minutes: data.durationMinutes,
      price: data.price,
      is_active: data.isActive ?? true,
      sort_order: data.sortOrder ?? 0,
    }),
  });
  if (!res.ok) throw new Error('Failed to create service');
  return transform<AdminService>(await res.json());
}

export async function updateService(
  id: string,
  data: Partial<AdminService>
): Promise<AdminService> {
  const res = await adminRequest(`/admin/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      duration_minutes: data.durationMinutes,
      price: data.price,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    }),
  });
  if (!res.ok) throw new Error('Failed to update service');
  return transform<AdminService>(await res.json());
}

export async function deleteService(id: string): Promise<void> {
  const res = await adminRequest(`/admin/services/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete service');
}

// Staff
export async function getAdminStaff(): Promise<AdminStaffMember[]> {
  const res = await adminRequest('/admin/staff');
  if (!res.ok) throw new Error('Failed to get staff');
  return transform<AdminStaffMember[]>(await res.json());
}

export async function getAdminStaffDetail(
  id: string
): Promise<AdminStaffDetail> {
  const res = await adminRequest(`/admin/staff/${id}`);
  if (!res.ok) throw new Error('Failed to get staff detail');
  return transform<AdminStaffDetail>(await res.json());
}

export async function updateStaffProfile(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const res = await adminRequest(`/admin/staff/${id}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
}

export async function updateStaffSchedule(
  id: string,
  schedules: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }[]
): Promise<void> {
  const res = await adminRequest(`/admin/staff/${id}/schedule`, {
    method: 'PUT',
    body: JSON.stringify({ schedules }),
  });
  if (!res.ok) throw new Error('Failed to update schedule');
}

export async function addStaffException(
  id: string,
  data: {
    date: string;
    start_time?: string;
    end_time?: string;
    is_available: boolean;
    reason?: string;
  }
): Promise<void> {
  const res = await adminRequest(`/admin/staff/${id}/exceptions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add exception');
}

export async function removeStaffException(
  staffId: string,
  exceptionId: string
): Promise<void> {
  const res = await adminRequest(
    `/admin/staff/${staffId}/exceptions/${exceptionId}`,
    { method: 'DELETE' }
  );
  if (!res.ok) throw new Error('Failed to remove exception');
}

// Members
export async function getAdminMembers(
  search?: string,
  page?: number
): Promise<PaginatedResponse<AdminMember>> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (page) query.set('page', String(page));
  const qs = query.toString();

  const res = await adminRequest(`/admin/members${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Failed to get members');
  const raw = await res.json();
  return {
    ...raw,
    data: transform<AdminMember[]>(raw.data),
  };
}

export async function getAdminMemberDetail(
  id: string
): Promise<AdminMemberDetail> {
  const res = await adminRequest(`/admin/members/${id}`);
  if (!res.ok) throw new Error('Failed to get member');
  return transform<AdminMemberDetail>(await res.json());
}

// Messages
export async function sendAdminMessage(
  memberId: string,
  content: string
): Promise<void> {
  const res = await adminRequest('/admin/messages', {
    method: 'POST',
    body: JSON.stringify({ member_id: memberId, content }),
  });
  if (!res.ok) throw new Error('Failed to send message');
}

export async function getMessageHistory(
  memberId: string
): Promise<AdminMessage[]> {
  const res = await adminRequest(`/admin/messages/${memberId}`);
  if (!res.ok) throw new Error('Failed to get messages');
  return transform<AdminMessage[]>(await res.json());
}

// 2FA
export async function setup2fa(): Promise<{
  secret: string;
  provisioningUri: string;
}> {
  const res = await adminRequest('/admin/2fa/setup');
  if (!res.ok) throw new Error('Failed to setup 2FA');
  return transform(await res.json());
}

export async function confirm2fa(
  code: string
): Promise<{ recoveryCodes: string[] }> {
  const res = await adminRequest('/admin/2fa/confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('Failed to confirm 2FA');
  return transform(await res.json());
}

export async function disable2fa(password: string): Promise<void> {
  const res = await adminRequest('/admin/2fa', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Failed to disable 2FA');
}

export async function get2faStatus(): Promise<{ enabled: boolean }> {
  const res = await adminRequest('/admin/2fa/status');
  if (!res.ok) throw new Error('Failed to get 2FA status');
  return await res.json();
}

// Operators
export async function getOperators(): Promise<Operator[]> {
  const res = await adminRequest('/admin/operators');
  if (!res.ok) throw new Error('Failed to get operators');
  return transform<Operator[]>(await res.json());
}

export async function createOperator(data: {
  username: string;
  password: string;
  name: string;
  specialty?: string;
}): Promise<void> {
  const res = await adminRequest('/admin/operators', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create operator');
}

export async function updateOperator(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const res = await adminRequest(`/admin/operators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update operator');
}

export async function deleteOperator(id: string): Promise<void> {
  const res = await adminRequest(`/admin/operators/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete operator');
}
