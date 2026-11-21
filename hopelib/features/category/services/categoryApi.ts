import {
  Category,
  CategoryDetail,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category.types";
import { apiFetch } from "@/features/auth";

/**
 * Gọi API GET /categories: Lấy danh sách tất cả các thể loại
 */
export async function getCategoriesApi(token?: string): Promise<Category[]> {
  try {
    const data = await apiFetch<Category[]>("/categories", {
      method: "GET",
      token,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách thể loại");
  }
}

/**
 * Gọi API GET /categories/:id: Lấy thông tin chi tiết thể loại kèm danh sách sách liên kết
 */
export async function getCategoryByIdApi(
  id: string,
  token?: string
): Promise<CategoryDetail> {
  try {
    return await apiFetch<CategoryDetail>(`/categories/${encodeURIComponent(id)}`, {
      method: "GET",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy chi tiết thể loại");
  }
}

/**
 * Gọi API POST /categories: Tạo mới thể loại
 */
export async function createCategoryApi(
  payload: CreateCategoryDto,
  token?: string
): Promise<Category> {
  try {
    return await apiFetch<Category>("/categories", {
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
    throw new Error("Không thể kết nối đến máy chủ để tạo thể loại mới");
  }
}

/**
 * Gọi API PUT /categories/:id: Cập nhật thông tin thể loại
 */
export async function updateCategoryApi(
  id: string,
  payload: UpdateCategoryDto,
  token?: string
): Promise<Category> {
  try {
    return await apiFetch<Category>(`/categories/${encodeURIComponent(id)}`, {
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
    throw new Error("Không thể kết nối đến máy chủ để cập nhật thể loại");
  }
}

/**
 * Gọi API DELETE /categories/:id: Xóa thể loại
 */
export async function deleteCategoryApi(
  id: string,
  token?: string
): Promise<void> {
  try {
    await apiFetch<void>(`/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để xóa thể loại");
  }
}
