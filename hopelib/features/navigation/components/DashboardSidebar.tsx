"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, ArrowRight, LogOut, Loader2 } from "lucide-react";
import { NavigationTreeItem } from "../types/navigation.types";
import { getNavigationTreeByRoleApi } from "../services/navigationApi";
import { DynamicIcon } from "./DynamicIcon";
import { cn } from "@/lib/utils";
import { HopeLogo } from "@/components/ui";
import { requestLogout, isSessionExpiredError } from "@/features/auth";

interface DashboardSidebarProps {
  onCloseMobile?: () => void;
  className?: string;
}

/**
 * Chuẩn hóa đường dẫn điều hướng trong không gian Dashboard (Admin / Librarian).
 * Nếu menu trong DB được cấu hình là "/profile" (trùng với route của Borrower),
 * tự động ánh xạ sang "/dashboard/profile" của Dashboard.
 */
function resolveDashboardNavPath(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (trimmed === "/profile") {
    return "/dashboard/profile";
  }
  return trimmed;
}

function normalizeDashboardTree(items: NavigationTreeItem[]): NavigationTreeItem[] {
  return (items || [])
    .filter((item) => item.isVisible !== false && item.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item) => ({
      ...item,
      path: resolveDashboardNavPath(item.path),
      children:
        item.children && item.children.length > 0
          ? normalizeDashboardTree(item.children)
          : [],
    }));
}

export function DashboardSidebar({ onCloseMobile, className }: DashboardSidebarProps) {
  const pathname = usePathname();

  const [navigationTree, setNavigationTree] = useState<NavigationTreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<{
    fullName?: string | null;
    username?: string;
    roles?: string[];
  } | null>(null);

  // Khôi phục thông tin user đã lưu
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hope_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Gọi API lấy cấu trúc cây navigation từ backend dựa theo token role
  useEffect(() => {
    let isMounted = true;
    async function fetchNavTree() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("hope_access_token")
          : null;
      if (!token) {
        if (isMounted) {
          setNavigationTree([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const tree = await getNavigationTreeByRoleApi();
        if (isMounted) {
          // Lọc các menu visible và active, sắp xếp sortOrder và chuẩn hóa path cho Dashboard
          const filtered = normalizeDashboardTree(tree || []);
          setNavigationTree(filtered);

          // Tự động mở các nhóm menu cha nếu có URL con đang active
          const initialExpanded: Record<string, boolean> = {};
          filtered.forEach((item) => {
            if (item.children && item.children.length > 0) {
              const hasActiveChild = item.children.some(
                (child) =>
                  child.path &&
                  (child.path === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === child.path || pathname?.startsWith(child.path + "/"))
              );
              if (hasActiveChild) {
                initialExpanded[item.id] = true;
              }
            }
          });
          setExpandedIds((prev) => ({ ...prev, ...initialExpanded }));
        }
      } catch (err) {
        if (!isSessionExpiredError(err)) {
          console.error("Lỗi khi tải navigation tree:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchNavTree();

    // Lắng nghe sự kiện cập nhật quyền hạn để tránh Next.js Router Cache giữ lại state cũ
    const handlePermissionsUpdated = () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("hope_access_token")
          : null;
      if (!token) {
        if (isMounted) {
          setNavigationTree([]);
          setIsLoading(false);
        }
        return;
      }
      fetchNavTree();
    };
    window.addEventListener("permissionsUpdated", handlePermissionsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("permissionsUpdated", handlePermissionsUpdated);
    };
  }, [pathname]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLogout = () => {
    requestLogout();
  };

  // Xác định chữ viết tắt avatar (Initials)
  const getUserInitials = () => {
    if (user?.fullName) {
      const parts = user.fullName.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.fullName.slice(0, 2).toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "MA";
  };

  // Hiển thị tên chức danh theo vai trò
  const getUserRoleLabel = () => {
    const roles = user?.roles || [];
    if (roles.some((r) => r.toUpperCase() === "ADMIN")) return "Quản trị viên";
    if (roles.some((r) => r.toUpperCase() === "LIBRARIAN")) return "Thủ thư";
    if (roles.some((r) => r.toUpperCase() === "BORROWER")) return "Độc giả";
    return "Thủ thư";
  };

  return (
    <aside
      className={cn(
        "w-72 bg-[#161616] text-white flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all border-r border-white/5",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center group select-none"
          onClick={onCloseMobile}
        >
          <HopeLogo size="lg" variant="dark" className="gap-3" />
        </Link>
      </div>

      {/* Eyebrow Section Label */}
      <div className="px-6 pt-3 pb-2">
        <span className="text-[11px] font-semibold text-neutral-400 tracking-[0.18em] uppercase">
          KHÔNG GIAN QUẢN LÝ
        </span>
      </div>

      {/* Navigation Menu List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-11 rounded-xl bg-white/5 animate-pulse flex items-center px-4 gap-3"
              >
                <div className="w-5 h-5 rounded-md bg-white/10" />
                <div className="h-3.5 w-24 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : navigationTree.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 px-4">
            Không có menu nào được cấp quyền cho vai trò này.
          </div>
        ) : (
          navigationTree.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = !!expandedIds[item.id];

            // Kiểm tra trạng thái Active
            const isSelfActive =
              item.path &&
              (item.path === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.path || pathname?.startsWith(item.path + "/"));

            const isChildActive =
              hasChildren &&
              item.children?.some(
                (child) =>
                  child.path &&
                  (child.path === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === child.path || pathname?.startsWith(child.path + "/"))
              );

            const isActive = isSelfActive || isChildActive;

            // Nếu là nhóm cha có menu con
            if (hasChildren) {
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer group",
                      isActive
                        ? "text-white bg-[#222222]"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <DynamicIcon
                        name={item.icon}
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-[#F5B82E]" : "text-neutral-400 group-hover:text-white"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>

                  {/* Cây con (Nested Children) */}
                  {isExpanded && (
                    <div className="pl-6 pr-1 py-1 space-y-1 border-l border-white/10 ml-5">
                      {item.children
                        ?.filter((c) => c.isVisible !== false && c.isActive !== false)
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                        .map((child) => {
                          const isSubActive =
                            child.path &&
                            (child.path === "/dashboard"
                              ? pathname === "/dashboard"
                              : pathname === child.path ||
                                pathname?.startsWith(child.path + "/"));

                          return (
                            <Link
                              key={child.id}
                              href={child.path || "#"}
                              onClick={onCloseMobile}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm transition-all relative",
                                isSubActive
                                  ? "bg-[#252525] text-white font-medium"
                                  : "text-neutral-400 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <DynamicIcon
                                name={child.icon}
                                className={cn(
                                  "w-4 h-4",
                                  isSubActive ? "text-[#F5B82E]" : "text-neutral-500"
                                )}
                              />
                              <span className="truncate">{child.name}</span>
                              {isSubActive && (
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#F5B82E] rounded-l" />
                              )}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            }

            // Menu đơn (Single Leaf Item)
            return (
              <Link
                key={item.id}
                href={item.path || "#"}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all relative group",
                  isSelfActive
                    ? "bg-[#242424] text-white shadow-xs"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <DynamicIcon
                    name={item.icon}
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isSelfActive
                        ? "text-[#F5B82E]"
                        : "text-neutral-400 group-hover:text-white"
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {/* Vạch highlight vàng ở mép phải như trong ảnh */}
                {isSelfActive && (
                  <span className="w-1.5 h-6 bg-[#F5B82E] rounded-full absolute right-2" />
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* Bottom Quote Box */}
      <div className="px-4 pb-3">
        <div className="bg-[#1F1F1F] border border-white/5 rounded-2xl p-4 relative overflow-hidden">
          <div className="text-[#F5B82E] text-2xl font-serif leading-none mb-1 select-none">
            “
          </div>
          <p className="text-neutral-300 text-xs leading-relaxed font-light">
            Một thư viện tốt là nơi mọi cánh cửa tri thức đều rộng mở.
          </p>
          <span className="text-[#F5B82E] text-[10px] font-bold tracking-widest uppercase mt-2.5 block">
            HOPE LIBRARY
          </span>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#F5B82E] text-[#1A1A1A] font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
              {getUserInitials()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {user?.fullName || user?.username || "Minh Anh"}
              </div>
              <div className="text-xs text-neutral-400 truncate">
                {getUserRoleLabel()}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
