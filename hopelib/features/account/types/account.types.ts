import { AlertFeedback } from "@/components/ui";

export interface AccountRoleItem {
  id: string;
  name: string;
  description?: string | null;
}

export interface AccountUser {
  id: string;
  code?: string;
  username: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "INACTIVE" | "LOCKED" | string;
  roles?: string[];
  roleList?: AccountRoleItem[];
  roleDetails?: AccountRoleItem[];
  createdAt: string;
  avatarUrl?: string | null;
  avartarUrl?: string | null;
}

export interface AccountQuery {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  role?: string;
}

export interface PaginatedAccountResponse {
  items: AccountUser[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface CreateAccountInput {
  code?: string;
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  status?: string;
  role?: string;
  roles?: string[];
  avatarUrl?: string;
  avatarFile?: File | null;
  avatar?: File | null;
}

export interface BorrowerSummaryUser extends AccountUser {
  borrowedBooksCount: number;
  expiredLoansCount: number;
  totalFineAmount: number;
}

export interface BorrowerSummaryQuery {
  page?: number;
  size?: number;
  search?: string;
  code?: string;
  status?: string;
  role?: string;
}

export interface PaginatedBorrowerSummaryResponse {
  items: BorrowerSummaryUser[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export type AccountFeedback = AlertFeedback;
