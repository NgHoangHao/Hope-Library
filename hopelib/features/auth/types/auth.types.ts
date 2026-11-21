export interface LoginCredentials {
  username: string; // Có thể là username hoặc email
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  confirmpassword?: string;
}

export interface RegisterResponseData {
  email: string;
  expiresInSeconds: number;
  message: string;
  code?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponseData {
  email: string;
  expiresInSeconds: number;
  message: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyResetOtpResponseData {
  resetToken: string;
  expiresInSeconds: number;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
  confirmPassword?: string;
  confirmpassword?: string;
}

export interface ResetPasswordResponseData {
  message: string;
}


export interface UserRoleItem {
  id: string;
  name: string;
  description?: string | null;
}

export interface AuthUser {
  id: string;
  code?: string;
  username: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  status: string;
  roles?: string[];
  roleList?: UserRoleItem[];
  roleDetails?: UserRoleItem[];
  createdAt?: string;
  avatarUrl?: string | null;
  avartarUrl?: string | null;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarFile?: File | null;
  avatarUrl?: string | null;
}

export interface LoginResponseData {
  accessToken: string;
  user?: AuthUser;
}

export interface RefreshTokenResponseData {
  accessToken: string;
}

export interface PermissionItem {
  id: string;
  code: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errorCode?: string;
  errors?: unknown;
  timestamp: string;
}
