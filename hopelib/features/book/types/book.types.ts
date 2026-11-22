export interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  coverBg: string;
  textColor: string;
  subtextColor: string;
  description: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  availableCopies: number;
  totalCopies: number;
  featured?: boolean;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  title: string;
  author: string;
  coverBg: string;
  textColor: string;
  subtextColor: string;
  borrowDate: string;
  dueDate: string;
  daysRemaining: number;
  barcode: string;
  shelfLocation: string;
  status: "borrowing" | "due_soon" | "overdue";
}

/* =========================================================
   Book Management Types (Backend Controller DTO Contract)
   ========================================================= */

export type BookStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type BookCopyStatus =
  | "AVAILABLE"
  | "BORROWED"
  | "RESERVED"
  | "MAINTENANCE"
  | "LOST"
  | "DAMAGED";

export type EditableBookCopyStatus = "AVAILABLE" | "RESERVED" | "LOST" | "DAMAGED";

export const EDITABLE_BOOK_COPY_STATUS_OPTIONS: {
  value: EditableBookCopyStatus;
  label: string;
}[] = [
    { value: "AVAILABLE", label: "Có sẵn" },
    { value: "LOST", label: "Thất lạc" },
    { value: "DAMAGED", label: "Hư hỏng" },
  ];

export interface BookCopyInput {
  id?: string;
  barcode: string;
  shelfLocation?: string;
  status?: BookCopyStatus;
}

export interface BookCopyItem {
  id: string;
  barcode: string;
  shelfLocation?: string | null;
  status: BookCopyStatus | string;
}

export interface BookEntity {
  id: string;
  title: string;
  isbn?: string | null;
  authorId?: string | null;
  categoryId?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  edition?: string | null;
  description?: string | null;
  totalCopies: number;
  availableCopies: number;
  bookUrl?: string | null;
  pdfUrl?: string | null;
  status: BookStatus;
  author?: {
    id: string;
    name: string;
    biography?: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  copies?: BookCopyItem[];
}

export interface PaginatedBookData {
  items: BookEntity[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface BookQueryParams {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: string;
  authorId?: string;
  author?: string;
}

export interface BookFormData {
  title: string;
  isbn?: string;
  authorId?: string;
  categoryId?: string;
  publisher?: string;
  publicationYear?: number | "";
  edition?: string;
  description?: string;
  status?: BookStatus;
  image?: File | null;
  pdf?: File | null;
  copies?: BookCopyInput[];
  initialBarcode?: string;
  initialShelfLocation?: string;
}

export interface BookManagementFeedback {
  type: "success" | "error" | "info";
  message: string;
}

/**
 * Bản sao sách được độc giả thêm vào giỏ đặt mượn (có thể gồm nhiều đầu sách khác nhau trong 1 phiếu mượn)
 */
export interface ReservationCartItem {
  bookCopyId: string;
  barcode: string;
  shelfLocation?: string | null;
  bookId: string;
  bookTitle: string;
  bookUrl?: string | null;
  authorName?: string;
}

export const MAX_RESERVATION_CART_ITEMS = 3;
