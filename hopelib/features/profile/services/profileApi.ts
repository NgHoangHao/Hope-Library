import { getMeApi, updateProfileApi, UpdateProfilePayload, AuthUser } from "@/features/auth";

/**
 * Lấy thông tin cá nhân hiện tại từ GET /auth/me
 */
export async function getProfileApi(token?: string): Promise<AuthUser> {
  return getMeApi(token);
}

/**
 * Cập nhật thông tin cá nhân và avatar qua PUT /auth/me
 */
export async function updateProfileInfoApi(
  payload: UpdateProfilePayload,
  token?: string
): Promise<AuthUser> {
  return updateProfileApi(payload, token);
}
