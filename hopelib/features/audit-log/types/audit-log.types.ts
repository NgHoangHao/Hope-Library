import { AlertFeedback } from "@/components/ui";

export type AuditLogAction = "POST" | "PUT" | "DELETE" | string;

export interface AuditLogUser {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  roles?: string[];
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: AuditLogAction;
  targetResource: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: AuditLogUser | null;
}

export interface AuditLogQuery {
  page?: number;
  size?: number;
  search?: string;
  action?: string;
}

export interface PaginatedAuditLogResponse {
  items: AuditLogItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export type AuditLogFeedback = AlertFeedback;
