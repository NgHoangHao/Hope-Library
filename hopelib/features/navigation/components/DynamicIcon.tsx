import React from "react";
import {
  LayoutGrid,
  LayoutDashboard,
  Book,
  BookOpen,
  BookCopy,
  BookPlus,
  BookUser,
  Library,
  Users,
  User,
  UserRound,
  UsersRound,
  UserCog,
  UserCircle,
  Tag,
  Tags,
  PenTool,
  Feather,
  Edit,
  Repeat,
  ArrowLeftRight,
  ClipboardList,
  ClipboardPlus,
  Settings,
  SlidersHorizontal,
  Shield,
  ShieldCheck,
  UserCheck,
  BadgeCheck,
  KeyRound,
  Lock,
  PanelLeft,
  Menu,
  FolderTree,
  ScrollText,
  History,
  FileClock,
  Clock,
  Bookmark,
  Layers,
  Folder,
  Bell,
  BarChart3,
  LucideProps,
} from "lucide-react";

export interface NavigationIconOption {
  value: string;
  label: string;
  group: "Tổng quan" | "Sách & Mượn trả" | "Người dùng" | "Hệ thống";
}

export const NAVIGATION_ICON_OPTIONS: NavigationIconOption[] = [
  // Tổng quan
  { value: "layout-dashboard", label: "Tổng quan", group: "Tổng quan" },
  { value: "bar-chart-3", label: "Thống kê", group: "Tổng quan" },
  { value: "bell", label: "Thông báo", group: "Tổng quan" },
  { value: "user-circle", label: "Hồ sơ cá nhân", group: "Tổng quan" },
  { value: "clock", label: "Lịch sử", group: "Tổng quan" },

  // Sách & Mượn trả
  { value: "book-open", label: "Quản lý sách", group: "Sách & Mượn trả" },
  { value: "library", label: "Danh sách sách", group: "Sách & Mượn trả" },
  { value: "book", label: "Đầu sách", group: "Sách & Mượn trả" },
  { value: "tags", label: "Thể loại", group: "Sách & Mượn trả" },
  { value: "feather", label: "Tác giả", group: "Sách & Mượn trả" },
  { value: "book-copy", label: "Mượn trả", group: "Sách & Mượn trả" },
  { value: "arrow-left-right", label: "Giao dịch mượn/trả", group: "Sách & Mượn trả" },
  { value: "book-plus", label: "Tạo phiếu mượn", group: "Sách & Mượn trả" },
  { value: "clipboard-list", label: "Phiếu mượn", group: "Sách & Mượn trả" },
  { value: "bookmark", label: "Đánh dấu", group: "Sách & Mượn trả" },

  // Người dùng
  { value: "users", label: "Tài khoản", group: "Người dùng" },
  { value: "user-cog", label: "Thủ thư", group: "Người dùng" },
  { value: "book-user", label: "Độc giả", group: "Người dùng" },
  { value: "users-round", label: "Nhóm người dùng", group: "Người dùng" },
  { value: "user-check", label: "Xác thực tài khoản", group: "Người dùng" },

  // Hệ thống
  { value: "settings", label: "Hệ thống", group: "Hệ thống" },
  { value: "panel-left", label: "Phân quyền Menu", group: "Hệ thống" },
  { value: "folder-tree", label: "Quản lý Điều hướng", group: "Hệ thống" },
  { value: "shield-check", label: "Phân quyền Vai trò", group: "Hệ thống" },
  { value: "key-round", label: "Quản lý Quyền hạn", group: "Hệ thống" },
  { value: "badge-check", label: "Quản lý Vai trò", group: "Hệ thống" },
  { value: "sliders-horizontal", label: "Cấu hình hệ thống", group: "Hệ thống" },
  { value: "scroll-text", label: "Nhật ký hệ thống", group: "Hệ thống" },
  { value: "shield", label: "Bảo mật", group: "Hệ thống" },
  { value: "layers", label: "Phân tầng", group: "Hệ thống" },
  { value: "folder", label: "Thư mục", group: "Hệ thống" },
];

interface DynamicIconProps extends Omit<LucideProps, "name"> {
  name?: string | null;
}

export function DynamicIcon({ name, className = "w-5 h-5", ...props }: DynamicIconProps) {
  if (!name) {
    return <LayoutDashboard className={className} {...props} />;
  }

  const normalized = name.toLowerCase().replace(/[-_\s]/g, "");

  switch (normalized) {
    // Dashboard & Overview
    case "dashboard":
    case "layoutdashboard":
    case "overview":
    case "tongquan":
      return <LayoutDashboard className={className} {...props} />;
    case "layoutgrid":
    case "grid":
      return <LayoutGrid className={className} {...props} />;
    case "barchart":
    case "barchart3":
    case "stats":
    case "thongke":
    case "report":
    case "baocao":
      return <BarChart3 className={className} {...props} />;
    case "bell":
    case "notification":
    case "notifications":
    case "thongbao":
      return <Bell className={className} {...props} />;

    // Books & Library
    case "book":
    case "books":
    case "sach":
      return <Book className={className} {...props} />;
    case "bookopen":
    case "bookoutline":
      return <BookOpen className={className} {...props} />;
    case "library":
    case "booklist":
    case "khosach":
      return <Library className={className} {...props} />;
    case "bookcopy":
    case "loans":
    case "loan":
      return <BookCopy className={className} {...props} />;
    case "bookplus":
    case "createloan":
    case "taophieumuon":
      return <BookPlus className={className} {...props} />;
    case "clipboardplus":
      return <ClipboardPlus className={className} {...props} />;
    case "clipboardlist":
    case "phieumuon":
      return <ClipboardList className={className} {...props} />;
    case "bookmark":
    case "bookmarks":
      return <Bookmark className={className} {...props} />;

    // Authors
    case "author":
    case "authors":
    case "tacgia":
    case "feather":
      return <Feather className={className} {...props} />;
    case "pen":
    case "pentool":
      return <PenTool className={className} {...props} />;
    case "edit":
      return <Edit className={className} {...props} />;

    // Categories
    case "category":
    case "categories":
    case "theloai":
    case "tags":
      return <Tags className={className} {...props} />;
    case "tag":
      return <Tag className={className} {...props} />;

    // Borrow / Loans / Return
    case "muontra":
    case "muon":
    case "tra":
    case "arrowleftright":
    case "exchange":
      return <ArrowLeftRight className={className} {...props} />;
    case "repeat":
      return <Repeat className={className} {...props} />;

    // Users & Accounts
    case "users":
    case "account":
    case "accounts":
    case "taikhoan":
    case "thanhvien":
      return <Users className={className} {...props} />;
    case "user":
      return <User className={className} {...props} />;
    case "userround":
      return <UserRound className={className} {...props} />;
    case "usercog":
    case "librarian":
    case "librarians":
    case "thuthu":
      return <UserCog className={className} {...props} />;
    case "bookuser":
    case "borrower":
    case "borrowers":
    case "docgia":
    case "bandoc":
      return <BookUser className={className} {...props} />;
    case "usersround":
      return <UsersRound className={className} {...props} />;
    case "usercircle":
    case "profile":
    case "hoso":
      return <UserCircle className={className} {...props} />;
    case "usercheck":
      return <UserCheck className={className} {...props} />;

    // System, Navigation, Permissions, Roles, Configs, Logs
    case "settings":
    case "setting":
    case "system":
    case "hethong":
      return <Settings className={className} {...props} />;
    case "sliders":
    case "slidershorizontal":
    case "config":
    case "configs":
    case "cauhinh":
      return <SlidersHorizontal className={className} {...props} />;
    case "panelleft":
    case "sidebar":
      return <PanelLeft className={className} {...props} />;
    case "menu":
    case "menus":
      return <Menu className={className} {...props} />;
    case "foldertree":
    case "navigation":
    case "navigations":
    case "dieuhuong":
      return <FolderTree className={className} {...props} />;
    case "shieldcheck":
    case "permission":
    case "permissions":
    case "phanquyen":
      return <ShieldCheck className={className} {...props} />;
    case "shield":
      return <Shield className={className} {...props} />;
    case "badgecheck":
    case "role":
    case "roles":
    case "vaitro":
      return <BadgeCheck className={className} {...props} />;
    case "key":
    case "keyround":
    case "quyenhan":
      return <KeyRound className={className} {...props} />;
    case "lock":
      return <Lock className={className} {...props} />;
    case "scrolltext":
    case "log":
    case "logs":
    case "auditlog":
    case "auditlogs":
    case "nhatky":
      return <ScrollText className={className} {...props} />;
    case "history":
      return <History className={className} {...props} />;
    case "fileclock":
      return <FileClock className={className} {...props} />;
    case "clock":
      return <Clock className={className} {...props} />;
    case "layers":
      return <Layers className={className} {...props} />;
    case "folder":
      return <Folder className={className} {...props} />;

    default:
      return <LayoutGrid className={className} {...props} />;
  }
}
