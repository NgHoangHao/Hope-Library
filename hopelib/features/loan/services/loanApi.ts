import { apiFetch } from "@/features/auth";
import {
  CreateLoanInput,
  FineStatus,
  FulfillLoanInput,
  LoanDetailResponseData,
  LoanFineResponseData,
  LoansQueryParams,
  MyLoansQueryParams,
  PaginatedLoanData,
  ReserveBookInput,
  UpdateLoanInput,
} from "../types/loan.types";

/**
 * Gọi API GET /loans để lấy danh sách phiếu mượn có phân trang, tìm kiếm và lọc (Thủ thư / Quản trị)
 */
export async function getLoansApi(
  params: LoansQueryParams = {},
  token?: string
): Promise<PaginatedLoanData> {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null) {
    query.append("page", String(params.page));
  }
  if (params.size !== undefined && params.size !== null) {
    query.append("size", String(params.size));
  }
  if (params.status && params.status !== "ALL") {
    query.append("status", params.status);
  }
  if (params.search && params.search.trim()) {
    query.append("search", params.search.trim());
  }
  if (params.userId && params.userId.trim()) {
    query.append("userId", params.userId.trim());
  }

  const queryString = query.toString();
  const endpoint = `/loans${queryString ? `?${queryString}` : ""}`;

  const data = await apiFetch<PaginatedLoanData>(endpoint, {
    method: "GET",
    token,
  });

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: data?.page || 1,
    size: data?.size || 10,
    total: data?.total || 0,
    totalItems: data?.totalItems ?? data?.total ?? 0,
    totalPages: data?.totalPages || 1,
    totalUnpaidFineAmount: data?.totalUnpaidFineAmount,
    unpaidFineLoansCount: data?.unpaidFineLoansCount,
  };
}

/**
 * Gọi API GET /loans/me để lấy danh sách phiếu mượn của độc giả đang đăng nhập
 */
export async function getMyLoansApi(
  params: MyLoansQueryParams = {},
  token?: string
): Promise<PaginatedLoanData> {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null) {
    query.append("page", String(params.page));
  }
  if (params.size !== undefined && params.size !== null) {
    query.append("size", String(params.size));
  }
  if (params.status && params.status !== "ALL") {
    query.append("status", params.status);
  }
  if (params.search && params.search.trim()) {
    query.append("search", params.search.trim());
  }

  const queryString = query.toString();
  const endpoint = `/loans/me${queryString ? `?${queryString}` : ""}`;

  const data = await apiFetch<PaginatedLoanData>(endpoint, {
    method: "GET",
    token,
  });

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: data?.page || 1,
    size: data?.size || 10,
    total: data?.total || 0,
    totalItems: data?.totalItems ?? data?.total ?? 0,
    totalPages: data?.totalPages || 1,
    totalUnpaidFineAmount: data?.totalUnpaidFineAmount,
    unpaidFineLoansCount: data?.unpaidFineLoansCount,
  };
}

/**
 * Gọi API GET /loans/:id để lấy chi tiết phiếu mượn
 */
export async function getLoanDetailApi(
  id: string,
  token?: string
): Promise<LoanDetailResponseData> {
  return apiFetch<LoanDetailResponseData>(`/loans/${id}`, {
    method: "GET",
    token,
  });
}

/**
 * Gọi API POST /loans/reserve để độc giả đặt mượn giữ chỗ sách trực tuyến (trạng thái PENDING, giữ chỗ 48h)
 */
export async function reserveBooksApi(
  input: ReserveBookInput,
  token?: string
): Promise<LoanDetailResponseData> {
  return apiFetch<LoanDetailResponseData>("/loans/reserve", {
    method: "POST",
    token,
    body: JSON.stringify({
      bookCopyIds: input.bookCopyIds.map((id) => id.trim()),
      notes: input.notes?.trim() || undefined,
    }),
  });
}

/**
 * Gọi API POST /loans/:id/cancel để độc giả hủy phiếu đặt mượn đang ở trạng thái PENDING
 */
export async function cancelLoanReservationApi(
  id: string,
  token?: string
): Promise<LoanDetailResponseData> {
  return apiFetch<LoanDetailResponseData>(`/loans/${id}/cancel`, {
    method: "POST",
    token,
  });
}

/**
 * Gọi API POST /loans để tạo mới phiếu mượn sách bởi thủ thư
 */
export async function createLoanApi(
  input: CreateLoanInput,
  token?: string
): Promise<LoanDetailResponseData> {
  return apiFetch<LoanDetailResponseData>("/loans", {
    method: "POST",
    token,
    body: JSON.stringify({
      userId: input.userId.trim(),
      loanDate: input.loanDate || undefined,
      dueDate: input.dueDate,
      pickupDeadline: input.pickupDeadline || undefined,
      status: input.status || "BORROWED",
      notes: input.notes?.trim() || undefined,
      items: input.items.map((item) => ({
        bookCopyId: item.bookCopyId.trim(),
        status: item.status || "BORROWED",
      })),
    }),
  });
}

/**
 * Gọi API PUT /loans/:id để cập nhật phiếu mượn và danh sách mục mượn
 */
export async function updateLoanApi(
  id: string,
  input: UpdateLoanInput,
  token?: string
): Promise<LoanDetailResponseData> {
  return apiFetch<LoanDetailResponseData>(`/loans/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify({
      userId: input.userId?.trim() || undefined,
      loanDate: input.loanDate || undefined,
      dueDate: input.dueDate || undefined,
      returnDate: input.returnDate !== undefined ? input.returnDate : undefined,
      notes: input.notes !== undefined ? input.notes : undefined,
      items: input.items?.map((item) => ({
        id: item.id || undefined,
        bookCopyId: item.bookCopyId.trim(),
        status: item.status || undefined,
        returnedDate: item.returnedDate !== undefined ? item.returnedDate : undefined,
      })),
    }),
  });
}

/**
 * Gọi API POST /loans/:id/fulfill để thủ thư xác nhận giao sách tại quầy (PENDING -> BORROWED)
 */
export async function fulfillLoanApi(
  id: string,
  input: FulfillLoanInput,
  token?: string
): Promise<LoanDetailResponseData> {
  return apiFetch<LoanDetailResponseData>(`/loans/${id}/fulfill`, {
    method: "POST",
    token,
    body: JSON.stringify({
      dueDate: input.dueDate,
      notes: input.notes?.trim() || undefined,
      bookCopyIds: input.bookCopyIds,
      barcodes: input.barcodes,
    }),
  });
}

/**
 * Gọi API DELETE /loans/:id để xóa cứng phiếu mượn cùng các mục mượn và tiền phạt liên quan
 */
export async function deleteLoanApi(
  id: string,
  token?: string
): Promise<void> {
  await apiFetch<null>(`/loans/${id}`, {
    method: "DELETE",
    token,
  });
}

/**
 * Gọi API PATCH /fines/:id/status để cập nhật trạng thái khoản tiền phạt (UNPAID, PAID, WAIVED)
 */
export async function updateFineStatusApi(
  fineId: string,
  status: FineStatus,
  token?: string
): Promise<LoanFineResponseData> {
  return apiFetch<LoanFineResponseData>(`/fines/${fineId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
}
