import {
  NavigationItem,
  NavigationTreeItem,
  RoleItem,
  CreateNavigationDto,
  UpdateNavigationDto,
} from "../types/navigation.types";
import { apiFetch } from "@/features/auth";

/**
 * Gọi API GET /navigations/role trong backend NestJS (navigation.controller.ts)
 * Backend tự động lấy role từ Bearer Access Token trong Authorization header
 * và trả về cấu trúc cây phân cấp (hierarchical tree) cho role đó.
 */
export async function getNavigationTreeByRoleApi(token?: string): Promise<NavigationTreeItem[]> {
  try {
    const treeData = await apiFetch<NavigationTreeItem[]>("/navigations/role", {
      method: "GET",
      token,
    });
    return Array.isArray(treeData) ? treeData : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh mục điều hướng");
  }
}

/**
 * Gọi API GET /navigations/tree: Lấy toàn bộ cây điều hướng của hệ thống
 */
export async function getAllNavigationTreeApi(token?: string): Promise<NavigationTreeItem[]> {
  try {
    const treeData = await apiFetch<NavigationTreeItem[]>("/navigations/tree", {
      method: "GET",
      token,
    });
    return Array.isArray(treeData) ? treeData : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách cây menu");
  }
}

/**
 * Gọi API GET /navigations?roleId=:roleId: Lấy danh sách menu (dạng phẳng) đã gán cho vai trò
 */
export async function getNavigationsByRoleIdApi(
  roleId: string,
  token?: string
): Promise<NavigationItem[]> {
  try {
    const data = await apiFetch<NavigationItem[]>(
      `/navigations?roleId=${encodeURIComponent(roleId)}`,
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
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách menu theo vai trò");
  }
}

/**
 * Gọi API GET /roles: Lấy danh sách tất cả các vai trò
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
 * Gọi API POST /auth/roles/navigations: Gán menu điều hướng cho vai trò
 */
export async function assignNavigationToRoleApi(
  roleId: string,
  navigationId: string,
  token?: string
): Promise<unknown> {
  try {
    return await apiFetch("/auth/roles/navigations", {
      method: "POST",
      token,
      body: JSON.stringify({ roleId, navigationId }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ khi gán menu");
  }
}

/**
 * Gọi API DELETE /auth/roles/navigations: Xóa bỏ menu điều hướng khỏi vai trò
 */
export async function removeNavigationFromRoleApi(
  roleId: string,
  navigationId: string,
  token?: string
): Promise<unknown> {
  try {
    return await apiFetch("/auth/roles/navigations", {
      method: "DELETE",
      token,
      body: JSON.stringify({ roleId, navigationId }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ khi xóa menu");
  }
}

/**
 * Gọi API GET /navigations: Lấy danh sách toàn bộ các điều hướng theo dạng phẳng
 */
export async function getAllNavigationsApi(token?: string): Promise<NavigationItem[]> {
  try {
    const data = await apiFetch<NavigationItem[]>("/navigations", {
      method: "GET",
      token,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách điều hướng");
  }
}

/**
 * Gọi API GET /navigations/:id: Lấy chi tiết điều hướng theo ID
 */
export async function getNavigationByIdApi(
  id: string,
  token?: string
): Promise<NavigationItem> {
  try {
    return await apiFetch<NavigationItem>(`/navigations/${encodeURIComponent(id)}`, {
      method: "GET",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy thông tin điều hướng");
  }
}

/**
 * Gọi API POST /navigations: Thêm mới điều hướng
 */
export async function createNavigationApi(
  payload: CreateNavigationDto,
  token?: string
): Promise<NavigationItem> {
  try {
    return await apiFetch<NavigationItem>("/navigations", {
      method: "POST",
      token,
      body: JSON.stringify({
        code: payload.code.trim(),
        name: payload.name.trim(),
        path: payload.path ? payload.path.trim() : null,
        parentId: payload.parentId || null,
        icon: payload.icon ? payload.icon.trim() : null,
        sortOrder: payload.sortOrder !== undefined ? Number(payload.sortOrder) : 0,
        isVisible: payload.isVisible !== undefined ? payload.isVisible : true,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để tạo điều hướng mới");
  }
}

/**
 * Gọi API PUT /navigations/:id: Cập nhật điều hướng
 */
export async function updateNavigationApi(
  id: string,
  payload: UpdateNavigationDto,
  token?: string
): Promise<NavigationItem> {
  try {
    return await apiFetch<NavigationItem>(`/navigations/${encodeURIComponent(id)}`, {
      method: "PUT",
      token,
      body: JSON.stringify({
        code: payload.code !== undefined ? payload.code.trim() : undefined,
        name: payload.name !== undefined ? payload.name.trim() : undefined,
        path: payload.path !== undefined ? (payload.path ? payload.path.trim() : null) : undefined,
        parentId: payload.parentId !== undefined ? (payload.parentId || null) : undefined,
        icon: payload.icon !== undefined ? (payload.icon ? payload.icon.trim() : null) : undefined,
        sortOrder: payload.sortOrder !== undefined ? Number(payload.sortOrder) : undefined,
        isVisible: payload.isVisible,
        isActive: payload.isActive,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để cập nhật điều hướng");
  }
}

/**
 * Gọi API DELETE /navigations/:id: Xóa điều hướng
 */
export async function deleteNavigationApi(
  id: string,
  token?: string
): Promise<void> {
  try {
    await apiFetch<void>(`/navigations/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để xóa điều hướng");
  }
}
