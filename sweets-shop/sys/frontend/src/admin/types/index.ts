export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginResponse {
  token: string;
  twoFactorRequired: boolean;
  user: AdminUser;
  expiresAt: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalPointsIssued: number;
  totalPointsSpent: number;
  totalReviews: number;
  totalItems: number;
  pendingReviewTickets: number;
  recentTransactions: AdminPointTransaction[];
  recentReviews: AdminReview[];
}

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  imagePath: string | null;
  sortOrder: number;
  isActive: boolean;
  itemsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imagePath: string | null;
  stock: number;
  isActive: boolean;
  sortOrder: number;
  category?: AdminCategory;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMember {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMemberDetail extends AdminMember {
  pointTransactions: AdminPointTransaction[];
  reviewTickets: AdminReviewTicket[];
  reviews: AdminReview[];
}

export interface AdminPointTransaction {
  id: string;
  memberId: string;
  type: 'earn' | 'spend';
  points: number;
  balanceAfter: number;
  qrToken: string | null;
  staffId: string | null;
  member?: { id: string; displayName: string };
  staff?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdminQrCode {
  id: string;
  adminUserId: string;
  type: 'earn_points' | 'spend_points' | 'review_ticket';
  token: string;
  pointsAmount: number | null;
  isUsed: boolean;
  usedByMemberId: string | null;
  expiresAt: string;
  adminUser?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewTicket {
  id: string;
  memberId: string;
  qrToken: string;
  issuedBy: string;
  isUsed: boolean;
  usedAt: string | null;
  member?: { id: string; displayName: string };
  issuedByAdmin?: { id: string; name: string };
  review?: AdminReview;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReview {
  id: string;
  memberId: string;
  reviewTicketId: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  member?: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdminNews {
  id: string;
  title: string;
  content: string;
  imagePath: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Operator {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}
