import { NavItem, StatItem } from "@/types/landing";

export const SITE_CONFIG = {
  name: "HOPE LIBRARY",
  tagline: "THƯ VIỆN CỦA NHỮNG ƯỚC MƠ",
  description:
    "Hàng ngàn cuốn sách đang chờ bạn mở ra. Tìm kiếm, mượn sách và theo dõi hành trình đọc của riêng bạn tại Hope Library.",
};

export const LANDING_NAV_ITEMS: NavItem[] = [
  { label: "Trang chủ", href: "/", isActive: true },
  { label: "Khám phá sách", href: "/books" },
  { label: "Sách của tôi", href: "/my-books" },
];

export const HERO_STATS: StatItem[] = [
  { value: "2.480+", label: "Đầu sách" },
  { value: "1.294", label: "Độc giả" },
  { value: "98%", label: "Hài lòng" },
];

export const CATEGORY_TICKER = [
  "Văn học",
  "Tâm lý học",
  "Kỹ năng sống",
  "Khoa học",
  "Lịch sử",
];
