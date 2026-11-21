import {
  Author,
  AuthorDetail,
  CreateAuthorDto,
  UpdateAuthorDto,
} from "../types/author.types";
import { apiFetch } from "@/features/auth";

/**
 * Gọi API GET /authors: Lấy danh sách tất cả tác giả
 */
export async function getAuthorsApi(token?: string): Promise<Author[]> {
  try {
    const data = await apiFetch<Author[]>("/authors", {
      method: "GET",
      token,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách tác giả");
  }
}

/**
 * Gọi API GET /authors/:id: Lấy thông tin chi tiết tác giả kèm danh sách sách sáng tác
 */
export async function getAuthorByIdApi(
  id: string,
  token?: string
): Promise<AuthorDetail> {
  try {
    return await apiFetch<AuthorDetail>(`/authors/${encodeURIComponent(id)}`, {
      method: "GET",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy chi tiết tác giả");
  }
}

/**
 * Gọi API POST /authors: Thêm mới tác giả
 */
export async function createAuthorApi(
  payload: CreateAuthorDto,
  token?: string
): Promise<Author> {
  try {
    return await apiFetch<Author>("/authors", {
      method: "POST",
      token,
      body: JSON.stringify({
        name: payload.name.trim(),
        biography: payload.biography ? payload.biography.trim() : undefined,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để tạo mới tác giả");
  }
}

/**
 * Gọi API PUT /authors/:id: Cập nhật thông tin tác giả
 */
export async function updateAuthorApi(
  id: string,
  payload: UpdateAuthorDto,
  token?: string
): Promise<Author> {
  try {
    return await apiFetch<Author>(`/authors/${encodeURIComponent(id)}`, {
      method: "PUT",
      token,
      body: JSON.stringify({
        name: payload.name !== undefined ? payload.name.trim() : undefined,
        biography:
          payload.biography !== undefined ? payload.biography.trim() : undefined,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để cập nhật tác giả");
  }
}

/**
 * Gọi API DELETE /authors/:id: Xóa tác giả
 */
export async function deleteAuthorApi(
  id: string,
  token?: string
): Promise<void> {
  try {
    await apiFetch<void>(`/authors/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để xóa tác giả");
  }
}
