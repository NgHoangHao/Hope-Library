const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Chuẩn hóa URL ảnh đại diện (avatar) từ Backend hoặc thư mục lưu trữ tĩnh E:\hope-library-uploads\avatars
 * Đảm bảo trình duyệt luôn load đúng ảnh tĩnh từ NestJS Backend (port 3001).
 */
export function getAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl || !avatarUrl.trim()) {
    return null;
  }

  const trimmed = avatarUrl.trim();

  // 1. Full URL hoặc Blob / Data URL (ảnh vừa chọn preview)
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // 2. Đường dẫn đã có tiền tố /uploads/
  if (trimmed.startsWith("/uploads/")) {
    return `${API_BASE_URL}${trimmed}`;
  }

  // 3. Đường dẫn bắt đầu bằng avatars/ hoặc chỉ có tên file
  const normalized = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (normalized.startsWith("avatars/")) {
    return `${API_BASE_URL}/uploads/${normalized}`;
  }

  return `${API_BASE_URL}/uploads/avatars/${normalized}`;
}

/**
 * Kiểm tra tính hợp lệ của file avatar (định dạng, dung lượng <= 5MB)
 */
export function validateAvatarFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: "Định dạng file không hỗ trợ. Vui lòng chọn ảnh định dạng PNG, JPG, JPEG hoặc WEBP.",
    };
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: "Kích thước file ảnh vượt quá giới hạn 5MB.",
    };
  }

  return { isValid: true };
}
