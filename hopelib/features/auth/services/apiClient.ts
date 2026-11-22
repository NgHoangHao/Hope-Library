const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const SESSION_EXPIRED_EVENT = "hope_session_expired";

export class SessionExpiredError extends Error {
  readonly isSessionExpired = true;

  constructor(message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  if (!error || typeof error !== "object") return false;
  return (
    error instanceof SessionExpiredError ||
    (error as { isSessionExpired?: boolean }).isSessionExpired === true ||
    (error as Error).name === "SessionExpiredError"
  );
}

export function dispatchSessionExpired(
  message = "Phiên làm việc của bạn đã kết thúc. Vui lòng đăng nhập lại để tiếp tục."
): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { message },
      })
    );
  }
}

// Concurrency mutex for refresh token requests
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Gọi API POST /auth/refresh-token trong backend NestJS.
 * Tự động gửi refreshToken từ HTTP Cookie (credentials: "include").
 * Nếu nhiều request 401 cùng lúc, tất cả sẽ dùng chung 1 Promise làm mới duy nhất.
 */
export async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    const token = await refreshPromise;
    if (!token) {
      throw new SessionExpiredError();
    }
    return token;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const url = `${API_BASE_URL}/auth/refresh-token`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Mang cookie refreshToken lên backend
      });

      const text = await response.text();
      let result: any = {};
      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          result = { message: text };
        }
      }

      // Nếu refresh token trong cookie đã hết hạn hoặc không hợp lệ (HTTP 401 / statusCode >= 400)
      if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
        throw new Error(result?.message || "Refresh token đã hết hạn");
      }

      const payload = result.response ?? result.data ?? result;
      const newAccessToken = payload?.accessToken;

      if (!newAccessToken || typeof newAccessToken !== "string") {
        throw new Error("Không nhận được access token mới từ máy chủ");
      }

      // Lưu accessToken mới vào localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("hope_access_token", newAccessToken);
        window.dispatchEvent(
          new CustomEvent("hope_token_refreshed", {
            detail: { accessToken: newAccessToken },
          })
        );
      }

      return newAccessToken;
    } catch {
      // Refresh token hết hạn -> xóa thông tin đăng nhập và phát sự kiện hiển thị alert ở góc trên màn hình
      if (typeof window !== "undefined") {
        localStorage.removeItem("hope_access_token");
        localStorage.removeItem("hope_user");
        localStorage.removeItem("hope_permissions");
        localStorage.removeItem("hope_permission_details");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("hope_user_updated", { detail: null }));
        dispatchSessionExpired("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  const token = await refreshPromise;
  if (!token) {
    throw new SessionExpiredError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
  return token;
}

export interface ApiFetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

/**
 * Trình bọc fetch tập trung:
 * 1. Tự động đính kèm Bearer token từ localStorage hoặc tham số.
 * 2. Đặt credentials: "include" để luôn kèm cookie.
 * 3. Tự động kiểm tra HTTP 401: Khi accessToken hết hạn, tự động gọi /auth/refresh-token.
 *    - Nếu refresh thành công: tự động retry lại API call vừa rồi với token mới.
 *    - Nếu refresh token trên cookies hết hạn: kích hoạt alert góc trên màn hình và ném SessionExpiredError.
 * 4. Chuẩn hóa trích xuất dữ liệu ApiResponse (result.response ?? result.data ?? result).
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {},
  retryCount = 0
): Promise<T> {
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (options.params) {
    const urlObj = new URL(url);
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        urlObj.searchParams.set(key, String(val));
      }
    });
    url = urlObj.toString();
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!options.skipAuth) {
    let authToken = options.token;
    if (!authToken && typeof window !== "undefined") {
      authToken = localStorage.getItem("hope_access_token") || undefined;
    }
    if (authToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${authToken.trim()}`;
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  };

  try {
    const response = await fetch(url, fetchOptions);

    const isRefreshEndpoint = url.includes("/auth/refresh-token");
    const isLoginEndpoint = url.includes("/auth/login");

    // Khi accessToken hết hạn (HTTP 401)
    if (response.status === 401 && !isRefreshEndpoint && !isLoginEndpoint) {
      if (retryCount === 0) {
        // Tự động làm mới accessToken bằng cookie refreshToken
        const newAccessToken = await refreshAccessToken();

        // Tự động retry lại request ban đầu với token mới
        return apiFetch<T>(
          endpoint,
          {
            ...options,
            token: newAccessToken,
            headers: {
              ...((options.headers as Record<string, string>) || {}),
              Authorization: `Bearer ${newAccessToken}`,
            },
          },
          retryCount + 1
        );
      } else {
        // Nếu đã retry mà vẫn bị 401 thì báo phiên hết hạn
        dispatchSessionExpired();
        throw new SessionExpiredError();
      }
    }

    if (response.status === 204) {
      return null as T;
    }

    const text = await response.text();
    let result: any = {};
    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text };
      }
    }

    // Kiểm tra mã lỗi từ ApiResponse backend
    if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
      if (result.statusCode === 401 && !isRefreshEndpoint && !isLoginEndpoint) {
        if (retryCount === 0) {
          const newAccessToken = await refreshAccessToken();
          return apiFetch<T>(
            endpoint,
            {
              ...options,
              token: newAccessToken,
              headers: {
                ...((options.headers as Record<string, string>) || {}),
                Authorization: `Bearer ${newAccessToken}`,
              },
            },
            retryCount + 1
          );
        } else {
          dispatchSessionExpired();
          throw new SessionExpiredError();
        }
      }

      const errorMsg = result?.message || `Yêu cầu thất bại (mã ${response.status})`;
      throw new Error(errorMsg);
    }

    // Tuân thủ quy tắc ApiResponse: Dữ liệu nằm trong key response (fallback data/result)
    const payload = (result.response ?? result.data ?? result) as T;
    return payload;
  } catch (err: unknown) {
    if (err instanceof SessionExpiredError) {
      throw err;
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }
}
