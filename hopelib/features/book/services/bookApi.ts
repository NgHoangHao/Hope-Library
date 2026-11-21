import {
  BookEntity,
  PaginatedBookData,
  BookQueryParams,
} from "../types/book.types";
import { apiFetch } from "@/features/auth";

/**
 * Gọi API GET /books: Lấy danh sách sách có phân trang, tìm kiếm và lọc
 */
export async function getBooksApi(
  params: BookQueryParams = {},
  token?: string
): Promise<PaginatedBookData> {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null) {
    query.append("page", String(params.page));
  }
  if (params.size !== undefined && params.size !== null) {
    query.append("size", String(params.size));
  }
  if (params.search && params.search.trim()) {
    query.append("search", params.search.trim());
  }
  if (params.categoryId && params.categoryId.trim() && params.categoryId !== "ALL") {
    query.append("categoryId", params.categoryId.trim());
  }
  if (params.authorId && params.authorId.trim() && params.authorId !== "ALL") {
    query.append("authorId", params.authorId.trim());
  } else if (params.author && params.author.trim() && params.author !== "ALL") {
    query.append("author", params.author.trim());
  }

  const queryString = query.toString();
  const endpoint = `/books${queryString ? `?${queryString}` : ""}`;

  try {
    const data = await apiFetch<PaginatedBookData>(endpoint, {
      method: "GET",
      token,
    });
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      page: data?.page || 1,
      size: data?.size || 10,
      total: data?.total || 0,
      totalPages: data?.totalPages || 1,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách sách");
  }
}

/**
 * Gọi API GET /books/top-returned: Lấy top sách có số lượng mượn trả (RETURNED) nhiều nhất
 */
export async function getTopReturnedBooksApi(
  limit: number = 8,
  token?: string
): Promise<BookEntity[]> {
  const query = new URLSearchParams();
  if (limit) {
    query.append("limit", String(limit));
  }

  const endpoint = `/books/top-returned?${query.toString()}`;

  try {
    const data = await apiFetch<BookEntity[]>(endpoint, {
      method: "GET",
      token,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách sách nổi bật");
  }
}

/**
 * Gọi API GET /books/:id: Lấy thông tin chi tiết cuốn sách
 */
export async function getBookByIdApi(
  id: string,
  token?: string
): Promise<BookEntity> {
  try {
    return await apiFetch<BookEntity>(`/books/${encodeURIComponent(id)}`, {
      method: "GET",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy chi tiết sách");
  }
}

/**
 * Gọi API POST /books: Tạo mới sách (multipart/form-data)
 */
export async function createBookApi(
  formData: FormData,
  token?: string
): Promise<BookEntity> {
  try {
    return await apiFetch<BookEntity>("/books", {
      method: "POST",
      token,
      body: formData,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để tạo mới sách");
  }
}

/**
 * Gọi API PUT /books/:id: Cập nhật sách (multipart/form-data)
 */
export async function updateBookApi(
  id: string,
  formData: FormData,
  token?: string
): Promise<BookEntity> {
  try {
    return await apiFetch<BookEntity>(`/books/${encodeURIComponent(id)}`, {
      method: "PUT",
      token,
      body: formData,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để cập nhật sách");
  }
}

/**
 * Gọi API DELETE /books/:id: Xóa sách
 */
export async function deleteBookApi(
  id: string,
  token?: string
): Promise<void> {
  try {
    await apiFetch<void>(`/books/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để xóa sách");
  }
}
