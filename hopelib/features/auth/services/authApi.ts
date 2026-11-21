import {
  LoginCredentials,
  LoginResponseData,
  RegisterPayload,
  RegisterResponseData,
  VerifyOtpPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponseData,
  VerifyResetOtpPayload,
  VerifyResetOtpResponseData,
  ResetPasswordPayload,
  ResetPasswordResponseData,
  AuthUser,
  UpdateProfilePayload,
  PermissionItem,
  RefreshTokenResponseData,
} from "../types/auth.types";
import { apiFetch, refreshAccessToken } from "./apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Gọi API POST /auth/login trong backend NestJS (auth.controller.ts)
 */
export async function loginApi(credentials: LoginCredentials): Promise<LoginResponseData> {
  const url = `${API_BASE_URL}/auth/login`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Giữ và nhận cookie refreshToken từ backend
      body: JSON.stringify({
        username: credentials.username.trim(),
        password: credentials.password,
      }),
    });

    const result = await response.json();

    // Backend trả về ApiResponse: { statusCode, message, response } hoặc AppException: { statusCode, message }
    if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
      const errorMsg =
        result?.message ||
        "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.";
      throw new Error(errorMsg);
    }

    const payload = (result.response || result.data || result) as LoginResponseData;
    return payload;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }
}

/**
 * Gọi API POST /auth/register trong backend NestJS (auth.controller.ts)
 */
export async function registerApi(payload: RegisterPayload): Promise<RegisterResponseData> {
  const url = `${API_BASE_URL}/auth/register`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: payload.username.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        confirmPassword: payload.confirmPassword ?? payload.confirmpassword,
        confirmpassword: payload.confirmpassword ?? payload.confirmPassword,
      }),
    });

    const result = await response.json();

    // Kiểm tra status HTTP và statusCode trong body
    if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
      const errorMsg =
        result?.message ||
        "Đăng ký tài khoản không thành công. Vui lòng thử lại.";
      throw new Error(errorMsg);
    }

    const data = (result.response || result.data || result) as RegisterResponseData;
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }
}

/**
 * Gọi API POST /auth/verify-otp trong backend NestJS (auth.controller.ts)
 */
export async function verifyOtpApi(payload: VerifyOtpPayload): Promise<AuthUser> {
  const url = `${API_BASE_URL}/auth/verify-otp`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        otp: payload.otp.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
      const errorMsg =
        result?.message ||
        "Xác thực mã OTP không thành công hoặc mã đã hết hạn.";
      throw new Error(errorMsg);
    }

    const data = (result.response || result.data || result) as AuthUser;
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }
}

/**
 * Gọi API POST /auth/resend-otp trong backend NestJS (auth.controller.ts)
 */
export async function resendOtpApi(payload: ResendOtpPayload): Promise<RegisterResponseData> {
  const url = `${API_BASE_URL}/auth/resend-otp`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
      }),
    });

    const result = await response.json();

    if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
      const errorMsg =
        result?.message ||
        "Không thể gửi lại mã OTP. Vui lòng thử lại sau.";
      throw new Error(errorMsg);
    }

    const data = (result.response || result.data || result) as RegisterResponseData;
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }
}

/**
 * Gọi API POST /auth/refresh-token trong backend NestJS.
 * Tự động gửi refreshToken từ HTTP Cookie và nhận accessToken mới.
 */
export async function refreshTokenApi(): Promise<RefreshTokenResponseData> {
  const token = await refreshAccessToken();
  return { accessToken: token };
}

/**
 * Gọi API GET /permissions/role (hoặc GET /permissions/role/:roleId) trong backend NestJS
 * Lấy danh sách toàn bộ quyền hạn theo vai trò của người dùng hiện tại từ token hoặc roleId
 */
export async function getPermissionsByRoleApi(
  token?: string,
  roleId?: string
): Promise<PermissionItem[]> {
  const endpoint = roleId
    ? `/permissions/role/${encodeURIComponent(roleId)}`
    : `/permissions/role`;

  try {
    const data = await apiFetch<PermissionItem[]>(endpoint, {
      method: "GET",
      token,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để lấy quyền hạn theo vai trò.");
  }
}

/**
 * Gọi API POST /auth/forgot-password: Yêu cầu mã OTP khôi phục mật khẩu gửi về Gmail
 */
export async function forgotPasswordApi(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponseData> {
  const url = `${API_BASE_URL}/auth/forgot-password`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: payload.email.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
      const errorMsg =
        result?.message || "Không thể gửi mã OTP khôi phục mật khẩu. Vui lòng kiểm tra lại email.";
      throw new Error(errorMsg);
    }

    const data = (result.response || result.data || result) as ForgotPasswordResponseData;
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để gửi mã khôi phục mật khẩu.");
  }
}

/**
 * Gọi API POST /auth/verify-reset-otp: Xác thực OTP quên mật khẩu và nhận resetToken
 */
export async function verifyResetOtpApi(
  payload: VerifyResetOtpPayload
): Promise<VerifyResetOtpResponseData> {
  const url = `${API_BASE_URL}/auth/verify-reset-otp`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: payload.email.trim(),
        otp: payload.otp.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
      const errorMsg =
        result?.message || "Mã OTP không chính xác hoặc đã hết hạn.";
      throw new Error(errorMsg);
    }

    const data = (result.response || result.data || result) as VerifyResetOtpResponseData;
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để xác thực mã OTP.");
  }
}

/**
 * Gọi API POST /auth/reset-password: Đổi mật khẩu mới bằng resetToken
 */
export async function resetPasswordApi(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponseData> {
  const url = `${API_BASE_URL}/auth/reset-password`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        resetToken: payload.resetToken.trim(),
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword ?? payload.confirmpassword,
        confirmpassword: payload.confirmPassword ?? payload.confirmpassword,
      }),
    });

    const result = await response.json();

    if (!response.ok || (result.statusCode && result.statusCode >= 400)) {
      const errorMsg =
        result?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      throw new Error(errorMsg);
    }

    const data = (result.response || result.data || result) as ResetPasswordResponseData;
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ để đặt lại mật khẩu.");
  }
}

/**
 * Gọi API POST /auth/logout trong backend NestJS để xóa cookie refreshToken
 */
export async function logoutApi(): Promise<void> {
  const url = `${API_BASE_URL}/auth/logout`;

  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("Backend logout responded with status:", response.status);
    }
  } catch (error) {
    console.warn("Lỗi khi gọi API logout:", error);
  }
}

/**
 * Gọi API GET /auth/me trong backend NestJS (auth.controller.ts)
 * Lấy thông tin tài khoản hiện tại từ Access Token
 */
export async function getMeApi(token?: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", {
    method: "GET",
    token,
  });
}

/**
 * Gọi API PUT /auth/me (hỗ trợ alias /auth/profile) trong backend NestJS
 * Cập nhật thông tin trang cá nhân: họ và tên, số điện thoại, và file ảnh đại diện
 */
export async function updateProfileApi(
  payload: UpdateProfilePayload,
  token?: string
): Promise<AuthUser> {
  if (payload.avatarFile) {
    const formData = new FormData();
    if (payload.fullName !== undefined) {
      formData.append("fullName", payload.fullName.trim());
    }
    if (payload.phone !== undefined) {
      formData.append("phone", payload.phone.trim());
    }
    formData.append("avatar", payload.avatarFile);
    formData.append("avartar", payload.avatarFile);

    return apiFetch<AuthUser>("/auth/me", {
      method: "PUT",
      token,
      body: formData,
    });
  }

  const body: Record<string, any> = {};
  if (payload.fullName !== undefined) {
    body.fullName = payload.fullName.trim();
  }
  if (payload.phone !== undefined) {
    body.phone = payload.phone.trim();
  }
  if (payload.avatarUrl !== undefined) {
    body.avatarUrl = payload.avatarUrl;
    body.avartarUrl = payload.avatarUrl;
  }

  return apiFetch<AuthUser>("/auth/me", {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
}


