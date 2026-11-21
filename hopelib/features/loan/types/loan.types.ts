import { AlertFeedback } from "@/components/ui";

export type LoanStatus =
  | "PENDING"
  | "BORROWED"
  | "RETURNED"
  | "OVERDUE"
  | "CANCELLED"
  | "EXPIRED";

export type LoanItemStatus =
  | "BORROWED"
  | "RETURNED"
  | "OVERDUE"
  | "LOST"
  | "DAMAGED";

export interface CreateLoanItemInput {
  bookCopyId: string;
  status?: LoanItemStatus;
}

export interface CreateLoanInput {
  userId: string;
  loanDate?: string;
  dueDate: string;
  pickupDeadline?: string;
  status?: LoanStatus;
  notes?: string;
  items: CreateLoanItemInput[];
}

export interface ReserveBookInput {
  bookCopyIds: string[];
  notes?: string;
}

export interface SelectedBookCopyForLoan {
  bookCopyId: string;
  barcode: string;
  shelfLocation?: string | null;
  bookId?: string;
  bookTitle?: string;
  bookIsbn?: string | null;
  bookUrl?: string | null;
  status: LoanItemStatus;
}

export interface LoanItemResponseData {
  id: string;
  loanId: string;
  bookCopyId: string;
  title?: string | null;
  url?: string | null;
  status: LoanItemStatus;
  returnedDate?: string | null;
  createdAt?: string;
  bookCopy?: {
    id: string;
    barcode: string;
    shelfLocation?: string | null;
    status: string;
    bookId?: string;
  };
}

export type FineStatus = "UNPAID" | "PAID" | "WAIVED";

export interface LoanFineResponseData {
  id: string;
  loanId: string;
  amount: number;
  reason?: string | null;
  status: FineStatus | string;
  paidAt?: string | null;
  createdAt?: string;
}

export interface LoanUserInfo {
  id: string;
  code?: string | null;
  username?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
}

export interface LoanResponseData {
  id: string;
  userId: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string | null;
  pickupDeadline?: string | null;
  status: LoanStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  user?: LoanUserInfo | null;
  fines?: LoanFineResponseData[];
  unpaidFineAmount?: number;
}

export interface LoanDetailResponseData extends LoanResponseData {
  items: LoanItemResponseData[];
}

export interface PaginatedLoanData {
  items: LoanResponseData[];
  page: number;
  size: number;
  total: number;
  totalItems?: number;
  totalPages: number;
  totalUnpaidFineAmount?: number;
  unpaidFineLoansCount?: number;
}

export interface MyLoansQueryParams {
  page?: number;
  size?: number;
  status?: LoanStatus | "ALL";
  search?: string;
}

export interface LoansQueryParams extends MyLoansQueryParams {
  userId?: string;
}

export interface UpdateLoanItemInput {
  id?: string;
  bookCopyId: string;
  status?: LoanItemStatus;
  returnedDate?: string | null;
}

export interface UpdateLoanInput {
  userId?: string;
  loanDate?: string;
  dueDate?: string;
  returnDate?: string | null;
  notes?: string | null;
  items?: UpdateLoanItemInput[];
}

export interface FulfillLoanInput {
  dueDate: string;
  notes?: string;
  bookCopyIds?: string[];
  barcodes?: string[];
}

export interface SelectedBorrowerInfo {
  userId: string;
  code?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  status?: string;
  borrowedBooksCount?: number;
  expiredLoansCount?: number;
  totalFineAmount?: number;
}

export type LoanFeedback = AlertFeedback;
