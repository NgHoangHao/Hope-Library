import {
  BookEntity,
  PaginatedBookData,
  BookQueryParams,
} from "../types/book.types";
import {
  apiFetch,
  refreshAccessToken,
  dispatchSessionExpired,
  SessionExpiredError,
} from "@/features/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

/**
 * Gọi API GET /books/:id/pdf: Tải nội dung file PDF (Blob) kèm Bearer token để hiển thị inline
 */
export async function getBookPdfBlobApi(
  id: string,
  token?: string,
  retryCount = 0
): Promise<Blob> {
  const url = `${API_BASE_URL}/books/${encodeURIComponent(id)}/pdf`;
  const headers: Record<string, string> = {};

  let authToken = token;
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("hope_access_token") || undefined;
  }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken.trim()}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      if (retryCount === 0) {
        const newAccessToken = await refreshAccessToken();
        return getBookPdfBlobApi(id, newAccessToken, retryCount + 1);
      }
      dispatchSessionExpired();
      throw new SessionExpiredError();
    }

    if (!response.ok) {
      let errorMsg = `Không thể tải file PDF (mã ${response.status})`;
      try {
        const text = await response.text();
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed?.message) {
            errorMsg = parsed.message;
          }
        }
      } catch {
        // Bỏ qua lỗi parse JSON nếu response không phải JSON
      }
      throw new Error(errorMsg);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Blob([arrayBuffer], { type: "application/pdf" });
  } catch (error: unknown) {
    if (error instanceof SessionExpiredError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để tải file PDF");
  }
}
