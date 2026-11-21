import { apiFetch } from "@/features/auth";
import {
  AuditLogItem,
  AuditLogQuery,
  PaginatedAuditLogResponse,
} from "../types/audit-log.types";

/**
 * Gọi API GET /audit-logs: Lấy danh sách nhật ký kiểm toán có phân trang, tìm kiếm và lọc
 */
export async function getAuditLogsApi(
  query?: AuditLogQuery,
  token?: string
): Promise<PaginatedAuditLogResponse> {
  const params: Record<string, string | number> = {};

  if (query?.page) params.page = query.page;
  if (query?.size) params.size = query.size;
  if (query?.search && query.search.trim()) params.search = query.search.trim();
  if (query?.action && query.action !== "ALL") params.action = query.action;

  const data = await apiFetch<PaginatedAuditLogResponse>("/audit-logs", {
    method: "GET",
    params,
    token,
  });

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: data?.page || 1,
    size: data?.size || 10,
    total: data?.total ?? (data as unknown as { totalItems?: number })?.totalItems ?? 0,
    totalPages: data?.totalPages || 1,
  };
}

/**
 * Gọi API GET /audit-logs/:id: Lấy chi tiết một bản ghi nhật ký kiểm toán
 */
export async function getAuditLogByIdApi(
  id: string,
  token?: string
): Promise<AuditLogItem> {
  return apiFetch<AuditLogItem>(`/audit-logs/${encodeURIComponent(id)}`, {
    method: "GET",
    token,
  });
}
