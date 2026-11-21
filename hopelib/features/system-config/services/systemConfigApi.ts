import { apiFetch } from "@/features/auth";
import {
  SystemConfigItem,
  UpdateSystemConfigValueDto,
} from "../types/system-config.types";

/**
 * GET /system-configs - Lấy toàn bộ danh sách cấu hình hệ thống
 */
export async function getAllSystemConfigsApi(
  group?: string,
  token?: string
): Promise<SystemConfigItem[]> {
  try {
    const query = group ? `?group=${encodeURIComponent(group)}` : "";
    const data = await apiFetch<SystemConfigItem[]>(`/system-configs${query}`, {
      method: "GET",
      token,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ lấy danh sách cấu hình hệ thống");
  }
}

/**
 * PUT /system-configs/:id - Chỉ cập nhật trường `value`, giữ nguyên toàn bộ các trường khác
 */
export async function updateSystemConfigValueApi(
  id: string,
  payload: UpdateSystemConfigValueDto,
  token?: string
): Promise<SystemConfigItem> {
  try {
    return await apiFetch<SystemConfigItem>(
      `/system-configs/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        token,
        body: JSON.stringify({
          value: String(payload.value),
        }),
      }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể kết nối đến máy chủ khi cập nhật cấu hình hệ thống");
  }
}
