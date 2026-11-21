"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { PermissionItem } from "../types/auth.types";
import {
  STORAGE_PERMISSIONS_KEY,
  STORAGE_PERMISSION_DETAILS_KEY,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  fetchAndStorePermissions,
} from "../utils/permission.helper";
import { extractRoles } from "../utils/auth.helper";

export interface UsePermissionsReturn {
  permissions: string[];
  permissionDetails: PermissionItem[];
  roles: string[];
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasAllPermissions: (permissionCodes: string[]) => boolean;
  refreshPermissions: () => Promise<string[]>;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("permissionsUpdated", callback);
  window.addEventListener("storage", callback);
  window.addEventListener("hope_token_refreshed", callback);
  window.addEventListener("hope_session_expired", callback);
  return () => {
    window.removeEventListener("permissionsUpdated", callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener("hope_token_refreshed", callback);
    window.removeEventListener("hope_session_expired", callback);
  };
}

function getPermissionsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(STORAGE_PERMISSIONS_KEY) || "[]";
}

function getDetailsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(STORAGE_PERMISSION_DETAILS_KEY) || "[]";
}

function getRolesSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  const storedUser = localStorage.getItem("hope_user");
  const storedToken = localStorage.getItem("hope_access_token");
  let user: unknown = undefined;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      // ignore
    }
  }
  const roles = extractRoles(user, storedToken || undefined);
  return JSON.stringify(roles);
}

function getServerSnapshot(): string {
  return "[]";
}

/**
 * Hook tiện ích trong React component để kiểm tra quyền hạn của người dùng,
 * phục vụ cho việc ẩn/hiện nút (button) hoặc các khối giao diện theo permission.
 *
 * @example
 * const { hasPermission } = usePermissions();
 * return (
 *   <div>
 *     {hasPermission("BOOK_CREATE") && (
 *       <Button onClick={openCreateModal}>Thêm sách mới</Button>
 *     )}
 *   </div>
 * );
 */
export function usePermissions(): UsePermissionsReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Đọc đồng bộ từ external store và lắng nghe sự kiện permissionsUpdated
  const permissionsRaw = useSyncExternalStore(subscribe, getPermissionsSnapshot, getServerSnapshot);
  const detailsRaw = useSyncExternalStore(subscribe, getDetailsSnapshot, getServerSnapshot);
  const rolesRaw = useSyncExternalStore(subscribe, getRolesSnapshot, getServerSnapshot);

  const permissions = useMemo(() => {
    try {
      const parsed = JSON.parse(permissionsRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [permissionsRaw]);

  const permissionDetails = useMemo(() => {
    try {
      const parsed = JSON.parse(detailsRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [detailsRaw]);

  const roles = useMemo(() => {
    try {
      const parsed = JSON.parse(rolesRaw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }, [rolesRaw]);

  // Luôn đồng bộ dữ liệu quyền hạn mới nhất từ backend trong nền nếu có access token
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("hope_access_token")) {
      fetchAndStorePermissions().catch((err) => {
        console.warn("[usePermissions] Lỗi tự động đồng bộ quyền hạn:", err);
      });
    }
  }, []);

  const hasPermission = useCallback(
    (code: string) => checkPermission(code, { permissions, roles }),
    [permissions, roles]
  );

  const hasAnyPermission = useCallback(
    (codes: string[]) => checkAnyPermission(codes, { permissions, roles }),
    [permissions, roles]
  );

  const hasAllPermissions = useCallback(
    (codes: string[]) => checkAllPermissions(codes, { permissions, roles }),
    [permissions, roles]
  );

  const refreshPermissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const updated = await fetchAndStorePermissions();
      return updated;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const isAdmin = useMemo(
    () => roles.some((r) => (r || "").trim().toUpperCase() === "ADMIN"),
    [roles]
  );

  return {
    permissions,
    permissionDetails,
    roles,
    isAdmin,
    isLoading: isRefreshing,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };
}
