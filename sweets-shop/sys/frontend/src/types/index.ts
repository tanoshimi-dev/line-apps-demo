export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface MemberInfo {
  registered: boolean;
  member?: Member;
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
}

export interface Member {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface SweetsCategory {
  id: string;
  name: string;
  description: string | null;
  imagePath: string | null;
  sortOrder: number;
  isActive: boolean;
  itemsCount?: number;
  items?: SweetsItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SweetsItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imagePath: string | null;
  stock: number;
  isActive: boolean;
  sortOrder: number;
  category?: SweetsCategory;
  createdAt: string;
  updatedAt: string;
}

export interface PointTransaction {
  id: string;
  memberId: string;
  type: 'earn' | 'spend';
  points: number;
  balanceAfter: number;
  qrToken: string | null;
  staffId: string | null;
  staff?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface QrRedeemResponse {
  message: string;
  pointsEarned?: number;
  pointsSpent?: number;
  balance?: number;
  transaction?: PointTransaction;
  ticket?: ReviewTicket;
}

export interface ReviewTicket {
  id: string;
  memberId: string;
  qrToken: string;
  issuedBy: string;
  isUsed: boolean;
  usedAt: string | null;
  review?: Review;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  memberId: string;
  reviewTicketId: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShopNews {
  id: string;
  title: string;
  content: string;
  imagePath: string | null;
  isPublished: boolean;
  publishedAt: string | null;
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
