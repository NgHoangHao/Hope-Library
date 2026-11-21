import { PermissionItem } from "../types/auth.types";
import { getPermissionsByRoleApi } from "../services/authApi";
import { extractRoles } from "./auth.helper";

export const STORAGE_PERMISSIONS_KEY = "hope_permissions";
export const STORAGE_PERMISSION_DETAILS_KEY = "hope_permission_details";

/**
 * Lấy danh sách quyền hạn (PermissionItem[]) từ backend theo role của user,
 * trích xuất danh sách mã quyền (string[]) và lưu vào localStorage.
 * Đồng thời phát sự kiện 'permissionsUpdated' để các component đang mount tự động cập nhật.
 */
export async function fetchAndStorePermissions(
  token?: string,
  roleId?: string
): Promise<string[]> {
  try {
    const permissions = await getPermissionsByRoleApi(token, roleId);
    const permissionCodes = permissions
      .map((p) => p.code?.trim().toUpperCase())
      .filter((code): code is string => Boolean(code));

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          STORAGE_PERMISSIONS_KEY,
          JSON.stringify(permissionCodes)
        );
        localStorage.setItem(
          STORAGE_PERMISSION_DETAILS_KEY,
          JSON.stringify(permissions)
        );
        // Phát sự kiện để cập nhật reactive trong React components
        window.dispatchEvent(
          new CustomEvent("permissionsUpdated", {
            detail: { permissions: permissionCodes, details: permissions },
          })
        );
      } catch (err) {
        console.warn("[permission.helper] Không thể lưu quyền hạn vào localStorage:", err);
      }
    }

    return permissionCodes;
  } catch (error) {
    console.error("[permission.helper] Lỗi khi tải quyền hạn theo vai trò:", error);
    // Nếu có lỗi, vẫn trả về danh sách quyền đã lưu trước đó nếu có
    return getStoredPermissions();
  }
}

/**
 * Lấy danh sách các mã quyền (permission code) đã lưu trong localStorage
 */
export function getStoredPermissions(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_PERMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách đầy đủ chi tiết các quyền hạn đã lưu trong localStorage
 */
export function getStoredPermissionDetails(): PermissionItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_PERMISSION_DETAILS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Xóa danh sách quyền hạn trong localStorage (dùng khi logout)
 */
export function clearStoredPermissions(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_PERMISSIONS_KEY);
    localStorage.removeItem(STORAGE_PERMISSION_DETAILS_KEY);
    window.dispatchEvent(
      new CustomEvent("permissionsUpdated", {
        detail: { permissions: [], details: [] },
      })
    );
  } catch {
    // ignore
  }
}

interface CheckPermissionOptions {
  permissions?: string[];
  roles?: string[];
}

/**
 * Kiểm tra xem người dùng hiện tại có vai trò ADMIN hay không
 */
export function isUserAdmin(explicitRoles?: string[]): boolean {
  const roles = explicitRoles || extractRoles();
  return roles.some((r) => (r || "").trim().toUpperCase() === "ADMIN");
}

/**
 * Kiểm tra xem người dùng có quyền cụ thể (permissionCode) hay không.
 * 
 * @example
 * if (hasPermission("BOOK_CREATE")) {
 *   // Hiển thị nút Thêm sách
 * }
 */
export function hasPermission(
  permissionCode: string,
  options?: CheckPermissionOptions
): boolean {
  if (!permissionCode) return false;

  const currentPermissions = options?.permissions || getStoredPermissions();
  const targetCode = permissionCode.trim().toUpperCase();
  return currentPermissions.some((c) => c.trim().toUpperCase() === targetCode);
}

/**
 * Kiểm tra người dùng có ÍT NHẤT MỘT trong các quyền truyền vào hay không.
 * 
 * @example
 * if (hasAnyPermission(["BOOK_CREATE", "BOOK_UPDATE"])) { ... }
 */
export function hasAnyPermission(
  permissionCodes: string[],
  options?: CheckPermissionOptions
): boolean {
  if (!permissionCodes || permissionCodes.length === 0) return false;

  const currentPermissions = options?.permissions || getStoredPermissions();
  const set = new Set(currentPermissions.map((c) => c.trim().toUpperCase()));
  return permissionCodes.some((code) => set.has(code.trim().toUpperCase()));
}

/**
 * Kiểm tra người dùng có ĐẦY ĐỦ TẤT CẢ các quyền truyền vào hay không.
 * 
 * @example
 * if (hasAllPermissions(["BOOK_READ", "BOOK_UPDATE"])) { ... }
 */
export function hasAllPermissions(
  permissionCodes: string[],
  options?: CheckPermissionOptions
): boolean {
  if (!permissionCodes || permissionCodes.length === 0) return false;

  const currentPermissions = options?.permissions || getStoredPermissions();
  const set = new Set(currentPermissions.map((c) => c.trim().toUpperCase()));
  return permissionCodes.every((code) => set.has(code.trim().toUpperCase()));
}
