"use client";

import React, { ReactNode } from "react";
import { usePermissions } from "../hooks/usePermissions";

export interface PermissionGateProps {
  /**
   * Mã quyền hạn đơn lẻ cần kiểm tra (ví dụ: 'BOOK_CREATE')
   */
  permission?: string;
  /**
   * Danh sách quyền hạn, chỉ cần có ít nhất 1 quyền là hợp lệ
   */
  anyOf?: string[];
  /**
   * Danh sách quyền hạn, bắt buộc phải có đủ tất cả các quyền
   */
  allOf?: string[];
  /**
   * Nội dung hiển thị khi có quyền
   */
  children: ReactNode;
  /**
   * Nội dung dự phòng hiển thị khi không có quyền (mặc định là null - ẩn hoàn toàn)
   */
  fallback?: ReactNode;
}

/**
 * Component hỗ trợ ẩn / hiện button hoặc phần tử giao diện theo quyền hạn (Permission).
 *
 * @example
 * // 1. Kiểm tra 1 quyền:
 * <PermissionGate permission="BOOK_CREATE">
 *   <button>Thêm mới sách</button>
 * </PermissionGate>
 *
 * // 2. Kiểm tra ít nhất 1 trong danh sách quyền:
 * <PermissionGate anyOf={["BOOK_UPDATE", "BOOK_DELETE"]}>
 *   <ActionMenu />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  let isAllowed = true;

  if (permission && !hasPermission(permission)) {
    isAllowed = false;
  }

  if (anyOf && anyOf.length > 0 && !hasAnyPermission(anyOf)) {
    isAllowed = false;
  }

  if (allOf && allOf.length > 0 && !hasAllPermissions(allOf)) {
    isAllowed = false;
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
