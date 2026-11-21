import {
  PermissionItem,
  RoleItem,
  CreatePermissionDto,
  UpdatePermissionDto,
} from "../types/permission.types";
import { apiFetch } from "@/features/auth";

/**
 * Gọi API GET /permissions: Lấy toàn bộ danh sách quyền hạn trong hệ thống
 */
export async function getAllPermissionsApi(token?: string): Promise<PermissionItem[]> {
  try {
    const data = await apiFetch<PermissionItem[]>("/permissions", {
      method: "GET",
      token,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách quyền hạn");
  }
}

/**
 * Gọi API GET /permissions?roleId=:roleId: Lấy danh sách quyền hạn đã gán cho vai trò
 */
export async function getPermissionsByRoleIdApi(
  roleId: string,
  token?: string
): Promise<PermissionItem[]> {
  try {
    const data = await apiFetch<PermissionItem[]>(
      `/permissions?roleId=${encodeURIComponent(roleId)}`,
      {
        method: "GET",
        token,
      }
    );
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy quyền hạn của vai trò");
  }
}

/**
 * Gọi API GET /roles: Lấy danh sách toàn bộ các vai trò
 */
export async function getRolesApi(token?: string): Promise<RoleItem[]> {
  try {
    const data = await apiFetch<RoleItem[]>("/roles", {
      method: "GET",
      token,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách vai trò");
  }
}

/**
 * Gọi API POST /auth/roles/permissions: Gán quyền hạn cho vai trò
 */
export async function assignPermissionToRoleApi(
  roleId: string,
  permissionId: string,
  token?: string
): Promise<unknown> {
  try {
    return await apiFetch("/auth/roles/permissions", {
      method: "POST",
      token,
      body: JSON.stringify({ roleId, permissionId }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ khi gán quyền hạn");
  }
}

/**
 * Gọi API DELETE /auth/roles/permissions: Xóa bỏ quyền hạn khỏi vai trò
 */
export async function removePermissionFromRoleApi(
  roleId: string,
  permissionId: string,
  token?: string
): Promise<unknown> {
  try {
    return await apiFetch("/auth/roles/permissions", {
      method: "DELETE",
      token,
      body: JSON.stringify({ roleId, permissionId }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ khi xóa quyền hạn");
  }
}

/**
 * Gọi API GET /permissions/:id: Lấy chi tiết quyền hạn theo ID
 */
export async function getPermissionByIdApi(
  id: string,
  token?: string
): Promise<PermissionItem> {
  try {
    return await apiFetch<PermissionItem>(`/permissions/${encodeURIComponent(id)}`, {
      method: "GET",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy chi tiết quyền hạn");
  }
}

/**
 * Gọi API POST /permissions: Thêm mới quyền hạn (code, description)
 */
export async function createPermissionApi(
  payload: CreatePermissionDto,
  token?: string
): Promise<PermissionItem> {
  try {
    return await apiFetch<PermissionItem>("/permissions", {
      method: "POST",
      token,
      body: JSON.stringify({
        code: payload.code.trim().toUpperCase(),
        description: payload.description ? payload.description.trim() : undefined,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để tạo mới quyền hạn");
  }
}

/**
 * Gọi API PUT /permissions/:id: Cập nhật thông tin quyền hạn
 */
export async function updatePermissionApi(
  id: string,
  payload: UpdatePermissionDto,
  token?: string
): Promise<PermissionItem> {
  try {
    return await apiFetch<PermissionItem>(`/permissions/${encodeURIComponent(id)}`, {
      method: "PUT",
      token,
      body: JSON.stringify({
        code: payload.code !== undefined ? payload.code.trim().toUpperCase() : undefined,
        description:
          payload.description !== undefined ? payload.description.trim() : undefined,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để cập nhật quyền hạn");
  }
}

/**
 * Gọi API DELETE /permissions/:id: Xóa quyền hạn
 */
export async function deletePermissionApi(
  id: string,
  token?: string
): Promise<void> {
  try {
    await apiFetch<void>(`/permissions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để xóa quyền hạn");
  }
}
