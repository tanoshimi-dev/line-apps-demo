import { getAccessToken } from './liff';
import type {
  MemberInfo,
  SweetsCategory,
  SweetsItem,
  PointTransaction,
  QrRedeemResponse,
  ReviewTicket,
  Review,
  ShopNews,
  PaginatedResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';
const STORAGE_BASE = API_BASE.replace(/\/api$/, '') + '/storage';

export function getImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  return `${STORAGE_BASE}/${imagePath}`;
}

async function publicRequest(path: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

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

export async function registerMember(): Promise<MemberInfo> {
  const res = await apiRequest('/member', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to register');
  return transformResponse<MemberInfo>(await res.json());
}

// Categories (public)
export async function getCategories(): Promise<SweetsCategory[]> {
  const res = await publicRequest('/categories');
  if (!res.ok) throw new Error('Failed to get categories');
  return transformResponse<SweetsCategory[]>(await res.json());
}

export async function getCategory(id: string): Promise<SweetsCategory> {
  const res = await publicRequest(`/categories/${id}`);
  if (!res.ok) throw new Error('Failed to get category');
  return transformResponse<SweetsCategory>(await res.json());
}

// Items (public)
export async function getItems(categoryId?: string): Promise<SweetsItem[]> {
  const params = categoryId ? `?category_id=${categoryId}` : '';
  const res = await publicRequest(`/items${params}`);
  if (!res.ok) throw new Error('Failed to get items');
  return transformResponse<SweetsItem[]>(await res.json());
}

export async function getItem(id: string): Promise<SweetsItem> {
  const res = await publicRequest(`/items/${id}`);
  if (!res.ok) throw new Error('Failed to get item');
  return transformResponse<SweetsItem>(await res.json());
}

// News (public)
export async function getNews(): Promise<ShopNews[]> {
  const res = await publicRequest('/news');
  if (!res.ok) throw new Error('Failed to get news');
  return transformResponse<ShopNews[]>(await res.json());
}

export async function getNewsDetail(id: string): Promise<ShopNews> {
  const res = await publicRequest(`/news/${id}`);
  if (!res.ok) throw new Error('Failed to get news detail');
  return transformResponse<ShopNews>(await res.json());
}

// Points
export async function getPointBalance(): Promise<{ balance: number }> {
  const res = await apiRequest('/points/balance');
  if (!res.ok) throw new Error('Failed to get balance');
  return transformResponse<{ balance: number }>(await res.json());
}

export async function getPointTransactions(page?: number): Promise<PaginatedResponse<PointTransaction>> {
  const params = page ? `?page=${page}` : '';
  const res = await apiRequest(`/points/transactions${params}`);
  if (!res.ok) throw new Error('Failed to get transactions');
  const raw = await res.json();
  return {
    ...transformResponse<PaginatedResponse<PointTransaction>>(raw),
    data: transformResponse<PointTransaction[]>(raw.data),
  };
}

// QR code redemption
export async function redeemEarnPoints(token: string): Promise<QrRedeemResponse> {
  const res = await apiRequest('/qr/earn', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to earn points');
  }
  return transformResponse<QrRedeemResponse>(await res.json());
}

export async function redeemSpendPoints(token: string, points: number): Promise<QrRedeemResponse> {
  const res = await apiRequest('/qr/spend', {
    method: 'POST',
    body: JSON.stringify({ token, points }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to spend points');
  }
  return transformResponse<QrRedeemResponse>(await res.json());
}

export async function redeemReviewTicket(token: string): Promise<QrRedeemResponse> {
  const res = await apiRequest('/qr/review-ticket', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to get review ticket');
  }
  return transformResponse<QrRedeemResponse>(await res.json());
}

// Review tickets
export async function getReviewTickets(): Promise<ReviewTicket[]> {
  const res = await apiRequest('/review-tickets');
  if (!res.ok) throw new Error('Failed to get review tickets');
  return transformResponse<ReviewTicket[]>(await res.json());
}

// Reviews
export async function submitReview(reviewTicketId: string, rating: number, comment?: string): Promise<Review> {
  const res = await apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify({ review_ticket_id: reviewTicketId, rating, comment }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to submit review');
  }
  const data = await res.json();
  return transformResponse<Review>(data.review || data);
}

export async function getMyReviews(): Promise<Review[]> {
  const res = await apiRequest('/reviews/mine');
  if (!res.ok) throw new Error('Failed to get reviews');
  return transformResponse<Review[]>(await res.json());
}
