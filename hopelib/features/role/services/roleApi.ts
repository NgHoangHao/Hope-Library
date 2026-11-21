import {
  RoleItem,
  CreateRoleDto,
  UpdateRoleDto,
} from "../types/role.types";
import { apiFetch } from "@/features/auth";

/**
 * Gọi API GET /roles: Lấy danh sách tất cả vai trò
 */
export async function getAllRolesApi(token?: string): Promise<RoleItem[]> {
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
 * Gọi API GET /roles/:id: Lấy chi tiết vai trò theo ID
 */
export async function getRoleByIdApi(
  id: string,
  token?: string
): Promise<RoleItem> {
  try {
    return await apiFetch<RoleItem>(`/roles/${encodeURIComponent(id)}`, {
      method: "GET",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy chi tiết vai trò");
  }
}

/**
 * Gọi API POST /roles: Thêm mới vai trò (name, description)
 */
export async function createRoleApi(
  payload: CreateRoleDto,
  token?: string
): Promise<RoleItem> {
  try {
    return await apiFetch<RoleItem>("/roles", {
      method: "POST",
      token,
      body: JSON.stringify({
        name: payload.name.trim(),
        description: payload.description ? payload.description.trim() : undefined,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để tạo mới vai trò");
  }
}

/**
 * Gọi API PUT /roles/:id: Cập nhật thông tin vai trò
 */
export async function updateRoleApi(
  id: string,
  payload: UpdateRoleDto,
  token?: string
): Promise<RoleItem> {
  try {
    return await apiFetch<RoleItem>(`/roles/${encodeURIComponent(id)}`, {
      method: "PUT",
      token,
      body: JSON.stringify({
        name: payload.name !== undefined ? payload.name.trim() : undefined,
        description:
          payload.description !== undefined ? payload.description.trim() : undefined,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để cập nhật vai trò");
  }
}

/**
 * Gọi API DELETE /roles/:id: Xóa vai trò
 */
export async function deleteRoleApi(
  id: string,
  token?: string
): Promise<void> {
  try {
    await apiFetch<void>(`/roles/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để xóa vai trò");
  }
}
