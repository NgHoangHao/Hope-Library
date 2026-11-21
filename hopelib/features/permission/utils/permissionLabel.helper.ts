export interface FormattedPermission {
  module: string;
  action: string;
  displayText: string; // e.g. "Người dùng: Xem"
}

const MODULE_TRANSLATIONS: Record<string, string> = {
  BOOK: "Sách",
  AUTHOR: "Tác giả",
  CATEGORY: "Thể loại",
  LOAN: "Mượn trả",
  USER: "Người dùng",
  ROLE: "Vai trò",
  PERMISSION: "Quyền hạn",
  NAVIGATION: "Điều hướng",
  AUDIT: "Nhật ký hệ thống",
  ORDER: "Đơn hàng",
  BORROWER: "Người mượn",
  FINE: "Tiền phạt",
  SYSTEM: "Cấu hình"
};

const ACTION_TRANSLATIONS: Record<string, string> = {
  READ: "Xem",
  CREATE: "Thêm mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  ASSIGN: "Phân quyền",
  APPROVE: "Duyệt",
  SEARCH: "Tìm kiếm",
};

export function formatPermissionDisplay(
  code: string,
  description?: string | null
): FormattedPermission {
  const parts = code.toUpperCase().split("_");

  // Xử lý các case đặc biệt như ROLE_PERMISSION_ASSIGN, ROLE_NAVIGATION_ASSIGN
  if (code === "ROLE_PERMISSION_ASSIGN") {
    return {
      module: "Phân quyền",
      action: "Gán quyền hạn",
      displayText: "Phân quyền: Gán quyền vai trò",
    };
  }

  if (code === "ROLE_NAVIGATION_ASSIGN") {
    return {
      module: "Phân quyền",
      action: "Gán menu điều hướng",
      displayText: "Phân quyền: Gán menu vai trò",
    };
  }

  if (parts.length >= 2) {
    const rawModule = parts[0];
    const rawAction = parts[parts.length - 1];

    const moduleName = MODULE_TRANSLATIONS[rawModule] || rawModule;
    const actionName = ACTION_TRANSLATIONS[rawAction] || rawAction;

    return {
      module: moduleName,
      action: actionName,
      displayText: `${moduleName}: ${actionName}`,
    };
  }

  // Fallback
  return {
    module: "Hệ thống",
    action: description || code,
    displayText: description ? `Hệ thống: ${description}` : code,
  };
}
