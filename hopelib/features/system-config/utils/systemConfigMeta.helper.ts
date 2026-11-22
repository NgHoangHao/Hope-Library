import { SystemConfigItem, SystemConfigValueType } from "../types/system-config.types";

export interface GroupDisplayInfo {
  label: string;
  shortLabel: string;
  description: string;
}

const GROUP_DISPLAY_MAP: Record<string, GroupDisplayInfo> = {
  AUTH: {
    label: "Xác thực & Bảo mật",
    shortLabel: "Xác thực",
    description: "Các tham số liên quan đến mã OTP, mật khẩu và chính sách bảo mật tài khoản",
  },
  LOAN: {
    label: "Mượn & Trả sách",
    shortLabel: "Mượn & Trả sách",
    description: "Các quy định về hạn mức mượn, giữ chỗ đặt sách, nhắc nhở và phí phạt quá hạn",
  },
};

const KEY_UNIT_MAP: Record<string, string> = {
  OTP_EXPIRATION_MINUTES: "phút",
  PASSWORD_MIN_LENGTH: "ký tự",
  MAX_BORROW_BOOKS: "cuốn",
  MAX_LOAN_DAYS: "ngày",
  OVERDUE_FINE_PER_DAY: "VNĐ",
  OVERDUE_REMINDER_BEFORE_DAYS: "ngày",
  RESERVATION_EXPIRATION_HOURS: "giờ",
};

export function getGroupDisplayInfo(group?: string | null): GroupDisplayInfo {
  const normalized = (group || "OTHER").toUpperCase();
  if (GROUP_DISPLAY_MAP[normalized]) {
    return GROUP_DISPLAY_MAP[normalized];
  }
  return {
    label: group ? `Nhóm ${group}` : "Cấu hình khác",
    shortLabel: group || "Khác",
    description: "Các thông số vận hành khác của hệ thống",
  };
}

export function getConfigUnit(config: SystemConfigItem): string | null {
  if (KEY_UNIT_MAP[config.key]) {
    return KEY_UNIT_MAP[config.key];
  }
  const match = config.description?.match(/\(([^)]+)\)\s*$/);
  return match?.[1] ?? null;
}

export function validateConfigValue(
  rawValue: string,
  valueType: SystemConfigValueType
): string | null {
  const trimmed = rawValue.trim();

  if (trimmed === "") {
    return "Giá trị cấu hình không được để trống";
  }

  if (valueType === "NUMBER") {
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return "Giá trị phải là một số hợp lệ";
    }
    if (parsed < 0) {
      return "Giá trị số không được nhỏ hơn 0";
    }
    return null;
  }

  if (valueType === "BOOLEAN") {
    const lower = trimmed.toLowerCase();
    if (lower !== "true" && lower !== "false") {
      return "Giá trị kiểu BOOLEAN chỉ chấp nhận true hoặc false";
    }
    return null;
  }

  if (valueType === "JSON") {
    try {
      JSON.parse(trimmed);
      return null;
    } catch {
      return "Giá trị không đúng định dạng JSON hợp lệ";
    }
  }

  return null;
}

export function formatConfigDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
