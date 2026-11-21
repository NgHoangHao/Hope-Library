const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Chuẩn hóa URL ảnh bìa sách từ Backend hoặc thư mục lưu trữ tĩnh E:\hope-library-uploads\books
 * Đảm bảo trình duyệt luôn trỏ đúng về NestJS Backend (port 3001) phục vụ static assets.
 */
export function getBookCoverUrl(bookUrl?: string | null): string | null {
  if (!bookUrl || !bookUrl.trim()) {
    return null;
  }

  const trimmed = bookUrl.trim();

  // 1. Đã là full URL hoặc blob/data preview
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // 2. Nếu đã có tiền tố /uploads/
  if (trimmed.startsWith("/uploads/")) {
    return `${API_BASE_URL}${trimmed}`;
  }

  // 3. Nếu là đường dẫn tương đối books/... hoặc chỉ có tên file (ví dụ: 1792989331832-xxx.webp)
  const normalized = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (normalized.startsWith("books/")) {
    return `${API_BASE_URL}/uploads/${normalized}`;
  }

  return `${API_BASE_URL}/uploads/books/${normalized}`;
}
