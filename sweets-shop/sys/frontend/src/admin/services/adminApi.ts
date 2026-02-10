import type {
  AdminLoginResponse,
  AdminUser,
  DashboardStats,
  AdminCategory,
  AdminItem,
  AdminMember,
  AdminMemberDetail,
  AdminPointTransaction,
  AdminQrCode,
  AdminReviewTicket,
  AdminReview,
  AdminNews,
  Operator,
  PaginatedResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';

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

async function adminJsonRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return adminRequest(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
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
  await adminJsonRequest('/admin/logout', { method: 'POST' });
  localStorage.removeItem('admin_token');
}

export async function getAdminMe(): Promise<AdminUser> {
  const res = await adminJsonRequest('/admin/me');
  if (!res.ok) throw new Error('Failed to get admin user');
  return transform<AdminUser>(await res.json());
}

// Dashboard
export async function getDashboard(): Promise<DashboardStats> {
  const res = await adminJsonRequest('/admin/dashboard');
  if (!res.ok) throw new Error('Failed to get dashboard');
  return transform<DashboardStats>(await res.json());
}

// Categories
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const res = await adminJsonRequest('/admin/categories');
  if (!res.ok) throw new Error('Failed to get categories');
  return transform<AdminCategory[]>(await res.json());
}

export async function createCategory(data: FormData): Promise<AdminCategory> {
  const res = await adminRequest('/admin/categories', {
    method: 'POST',
    body: data,
  });
  if (!res.ok) throw new Error('Failed to create category');
  return transform<AdminCategory>(await res.json());
}

export async function updateCategory(id: string, data: FormData): Promise<AdminCategory> {
  const res = await adminRequest(`/admin/categories/${id}`, {
    method: 'POST',
    body: data,
  });
  if (!res.ok) throw new Error('Failed to update category');
  return transform<AdminCategory>(await res.json());
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await adminJsonRequest(`/admin/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
}

// Items
export async function getAdminItems(categoryId?: string): Promise<AdminItem[]> {
  const params = categoryId ? `?category_id=${categoryId}` : '';
  const res = await adminJsonRequest(`/admin/items${params}`);
  if (!res.ok) throw new Error('Failed to get items');
  return transform<AdminItem[]>(await res.json());
}

export async function createItem(data: FormData): Promise<AdminItem> {
  const res = await adminRequest('/admin/items', {
    method: 'POST',
    body: data,
  });
  if (!res.ok) throw new Error('Failed to create item');
  return transform<AdminItem>(await res.json());
}

export async function updateItem(id: string, data: FormData): Promise<AdminItem> {
  const res = await adminRequest(`/admin/items/${id}`, {
    method: 'POST',
    body: data,
  });
  if (!res.ok) throw new Error('Failed to update item');
  return transform<AdminItem>(await res.json());
}

export async function deleteItem(id: string): Promise<void> {
  const res = await adminJsonRequest(`/admin/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

export async function updateStock(id: string, stock: number): Promise<AdminItem> {
  const res = await adminJsonRequest(`/admin/items/${id}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ stock }),
  });
  if (!res.ok) throw new Error('Failed to update stock');
  return transform<AdminItem>(await res.json());
}

// News
export async function getAdminNews(): Promise<AdminNews[]> {
  const res = await adminJsonRequest('/admin/news');
  if (!res.ok) throw new Error('Failed to get news');
  return transform<AdminNews[]>(await res.json());
}

export async function createNews(data: FormData): Promise<AdminNews> {
  const res = await adminRequest('/admin/news', {
    method: 'POST',
    body: data,
  });
  if (!res.ok) throw new Error('Failed to create news');
  return transform<AdminNews>(await res.json());
}

export async function updateNews(id: string, data: FormData): Promise<AdminNews> {
  const res = await adminRequest(`/admin/news/${id}`, {
    method: 'POST',
    body: data,
  });
  if (!res.ok) throw new Error('Failed to update news');
  return transform<AdminNews>(await res.json());
}

export async function deleteNews(id: string): Promise<void> {
  const res = await adminJsonRequest(`/admin/news/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete news');
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

  const res = await adminJsonRequest(`/admin/members${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Failed to get members');
  const raw = await res.json();
  return {
    ...raw,
    data: transform<AdminMember[]>(raw.data),
  };
}

export async function getAdminMemberDetail(id: string): Promise<AdminMemberDetail> {
  const res = await adminJsonRequest(`/admin/members/${id}`);
  if (!res.ok) throw new Error('Failed to get member');
  return transform<AdminMemberDetail>(await res.json());
}

// Point Transactions
export async function getAdminPointTransactions(params?: {
  type?: string;
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}): Promise<PaginatedResponse<AdminPointTransaction>> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.memberId) query.set('member_id', params.memberId);
  if (params?.dateFrom) query.set('date_from', params.dateFrom);
  if (params?.dateTo) query.set('date_to', params.dateTo);
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();

  const res = await adminJsonRequest(`/admin/point-transactions${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Failed to get transactions');
  const raw = await res.json();
  return {
    ...raw,
    data: transform<AdminPointTransaction[]>(raw.data),
  };
}

// Review Tickets
export async function getAdminReviewTickets(params?: {
  isUsed?: boolean;
  page?: number;
}): Promise<PaginatedResponse<AdminReviewTicket>> {
  const query = new URLSearchParams();
  if (params?.isUsed !== undefined) query.set('is_used', String(params.isUsed));
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();

  const res = await adminJsonRequest(`/admin/review-tickets${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Failed to get review tickets');
  const raw = await res.json();
  return {
    ...raw,
    data: transform<AdminReviewTicket[]>(raw.data),
  };
}

// Reviews
export async function getAdminReviews(params?: {
  isVisible?: boolean;
  page?: number;
}): Promise<PaginatedResponse<AdminReview>> {
  const query = new URLSearchParams();
  if (params?.isVisible !== undefined) query.set('is_visible', String(params.isVisible));
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();

  const res = await adminJsonRequest(`/admin/reviews${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Failed to get reviews');
  const raw = await res.json();
  return {
    ...raw,
    data: transform<AdminReview[]>(raw.data),
  };
}

export async function updateReviewVisibility(id: string, isVisible: boolean): Promise<void> {
  const res = await adminJsonRequest(`/admin/reviews/${id}/visibility`, {
    method: 'PUT',
    body: JSON.stringify({ is_visible: isVisible }),
  });
  if (!res.ok) throw new Error('Failed to update visibility');
}

// QR Codes
export async function generateQrCode(type: string, pointsAmount?: number): Promise<AdminQrCode> {
  const res = await adminJsonRequest('/admin/qr/generate', {
    method: 'POST',
    body: JSON.stringify({ type, points_amount: pointsAmount }),
  });
  if (!res.ok) throw new Error('Failed to generate QR code');
  return transform<AdminQrCode>(await res.json());
}

export async function getActiveQrCodes(): Promise<AdminQrCode[]> {
  const res = await adminJsonRequest('/admin/qr/active');
  if (!res.ok) throw new Error('Failed to get active QR codes');
  return transform<AdminQrCode[]>(await res.json());
}

// 2FA
export async function setup2fa(): Promise<{ secret: string; provisioningUri: string }> {
  const res = await adminJsonRequest('/admin/2fa/setup', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to setup 2FA');
  return transform(await res.json());
}

export async function confirm2fa(code: string): Promise<{ recoveryCodes: string[] }> {
  const res = await adminJsonRequest('/admin/2fa/confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('Failed to confirm 2FA');
  return transform(await res.json());
}

export async function disable2fa(password: string): Promise<void> {
  const res = await adminJsonRequest('/admin/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Failed to disable 2FA');
}

export async function get2faStatus(): Promise<{ enabled: boolean }> {
  const res = await adminJsonRequest('/admin/2fa/status');
  if (!res.ok) throw new Error('Failed to get 2FA status');
  return await res.json();
}

// Operators
export async function getOperators(): Promise<Operator[]> {
  const res = await adminJsonRequest('/admin/operators');
  if (!res.ok) throw new Error('Failed to get operators');
  return transform<Operator[]>(await res.json());
}

export async function createOperator(data: {
  username: string;
  password: string;
  name: string;
  role: string;
}): Promise<void> {
  const res = await adminJsonRequest('/admin/operators', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create operator');
}

export async function updateOperator(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const res = await adminJsonRequest(`/admin/operators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update operator');
}

export async function deleteOperator(id: string): Promise<void> {
  const res = await adminJsonRequest(`/admin/operators/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete operator');
}
