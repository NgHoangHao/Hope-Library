import { apiFetch } from "@/features/auth";
import {
  AccountQuery,
  AccountUser,
  CreateAccountInput,
  PaginatedAccountResponse,
  AccountRoleItem,
  BorrowerSummaryQuery,
  PaginatedBorrowerSummaryResponse,
} from "../types/account.types";

/**
 * Gọi API GET /users/summary để lấy danh sách độc giả kèm thống kê số sách đang mượn, số phiếu quá hạn lấy (EXPIRED) và tổng tiền phạt
 */
export async function getUsersSummaryApi(
  query?: BorrowerSummaryQuery,
  token?: string
): Promise<PaginatedBorrowerSummaryResponse> {
  const params: Record<string, string | number> = {};

  if (query?.page) params.page = query.page;
  if (query?.size) params.size = query.size;
  const searchKeyword = (query?.search ?? query?.code)?.trim();
  if (searchKeyword) {
    params.search = searchKeyword;
  }
  if (query?.status && query.status !== "ALL") params.status = query.status;
  if (query?.role && query.role !== "ALL") params.role = query.role;

  return apiFetch<PaginatedBorrowerSummaryResponse>("/users/summary", {
    method: "GET",
    params,
    token,
  });
}

/**
 * Gọi API GET /users để lấy danh sách người dùng có phân trang, tìm kiếm và lọc
 */
export async function getAccountsApi(
  query?: AccountQuery,
  token?: string
): Promise<PaginatedAccountResponse> {
  const params: Record<string, string | number> = {};

  if (query?.page) params.page = query.page;
  if (query?.size) params.size = query.size;
  if (query?.search && query.search.trim()) params.search = query.search.trim();
  if (query?.status && query.status !== "ALL") params.status = query.status;
  if (query?.role && query.role !== "ALL") params.role = query.role;

  return apiFetch<PaginatedAccountResponse>("/users", {
    method: "GET",
    params,
    token,
  });
}

/**
 * Gọi API POST /users để thêm mới 1 người dùng vào hệ thống (hỗ trợ upload avatar)
 */
export async function createAccountApi(
  input: CreateAccountInput,
  token?: string
): Promise<AccountUser> {
  const avatarFile = input.avatarFile ?? input.avatar;

  if (avatarFile) {
    const formData = new FormData();
    formData.append("username", input.username.trim());
    formData.append("email", input.email.trim().toLowerCase());
    formData.append("password", input.password);
    if (input.fullName?.trim()) {
      formData.append("fullName", input.fullName.trim());
    }
    if (input.phone?.trim()) {
      formData.append("phone", input.phone.trim());
    }
    if (input.status) {
      formData.append("status", input.status);
    }
    if (input.role) {
      formData.append("role", input.role);
    }
    if (input.roles && input.roles.length > 0) {
      input.roles.forEach((r) => formData.append("roles[]", r));
    }
    formData.append("avatar", avatarFile);

    return apiFetch<AccountUser>("/users", {
      method: "POST",
      token,
      body: formData,
    });
  }

  return apiFetch<AccountUser>("/users", {
    method: "POST",
    token,
    body: JSON.stringify({
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      fullName: input.fullName?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      status: input.status || "ACTIVE",
      role: input.role || "BORROWER",
      roles: input.roles || (input.role ? [input.role] : ["BORROWER"]),
      avatarUrl: input.avatarUrl || undefined,
    }),
  });
}

/**
 * Gọi API DELETE /users/:id để xóa người dùng
 */
export async function deleteAccountApi(
  id: string,
  token?: string
): Promise<void> {
  return apiFetch<void>(`/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

/**
 * Lấy danh sách tất cả vai trò để hiển thị dropdown trong bộ lọc & form tạo
 */
export async function getAccountRolesApi(
  token?: string
): Promise<AccountRoleItem[]> {
  try {
    const roles = await apiFetch<AccountRoleItem[]>("/roles", {
      method: "GET",
      token,
    });
    return Array.isArray(roles) ? roles : [];
  } catch (error) {
    console.warn("Không thể tải danh sách vai trò:", error);
    return [
      { id: "1", name: "ADMIN", description: "Quản trị viên" },
      { id: "2", name: "LIBRARIAN", description: "Thủ thư" },
      { id: "3", name: "BORROWER", description: "Độc giả / Bạn đọc" },
    ];
  }
}
