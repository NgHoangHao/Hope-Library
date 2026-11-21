"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayerDismissal, useFocusTrap } from "@/hooks";
import { logoutApi } from "../services/authApi";
import { clearStoredPermissions } from "../utils/permission.helper";
import { showToast } from "@/components/ui/TopCornerAlert";

export const REQUEST_LOGOUT_EVENT = "hope_request_logout";

/**
 * Hàm kích hoạt mở Modal xác nhận đăng xuất từ bất kỳ đâu trong ứng dụng
 */
export function requestLogout(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REQUEST_LOGOUT_EVENT));
  }
}

export interface LogoutConfirmModalProps {
  /** Cho phép điều khiển modal thủ công qua props (tuỳ chọn) */
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: () => Promise<void> | void;
}

export function LogoutConfirmModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onConfirm: controlledOnConfirm,
}: LogoutConfirmModalProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quyết định trạng thái mở modal (controlled hoặc internal)
  const isControlled = controlledIsOpen !== undefined;
  const isVisible = isControlled ? controlledIsOpen : internalOpen;

  // Lắng nghe sự kiện toàn cục REQUEST_LOGOUT_EVENT nếu không dùng controlled mode
  useEffect(() => {
    if (isControlled) return;

    const handleOpenRequest = () => {
      setInternalOpen(true);
    };

    window.addEventListener(REQUEST_LOGOUT_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener(REQUEST_LOGOUT_EVENT, handleOpenRequest);
    };
  }, [isControlled]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Không cho phép đóng khi đang xử lý logout
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  }, [isSubmitting, isControlled, controlledOnClose]);

  // Shared top-most Escape dismissal (với IME guard) + Focus trap
  useLayerDismissal({
    isOpen: isVisible,
    onDismiss: handleClose,
    disabled: isSubmitting,
  });
  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isVisible,
  });

  const handleConfirmLogout = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (controlledOnConfirm) {
        await controlledOnConfirm();
      } else {
        // 1. Gọi backend API POST /auth/logout (xóa refreshToken cookie)
        await logoutApi();

        // 2. Xóa toàn bộ dữ liệu xác thực tại client
        localStorage.removeItem("hope_access_token");
        localStorage.removeItem("hope_user");
        clearStoredPermissions();

        // 3. Dispatch event storage để cập nhật các component khác
        window.dispatchEvent(new Event("storage"));

        // 4. Bắn thông báo Alert thành công ở góc trên màn hình
        showToast({
          type: "success",
          title: "Đăng xuất thành công",
          message: "Phiên làm việc đã kết thúc. Hẹn gặp lại bạn!",
        });

        // 5. Đóng modal
        setInternalOpen(false);

        // 6. Điều hướng về màn hình Đăng nhập
        try {
          router.push("/login");
        } catch {
          window.location.href = "/login";
        }
      }
    } catch (error) {
      console.error("Lỗi trong quá trình đăng xuất:", error);
      // Dù có lỗi mạng vẫn đảm bảo dọn dẹp client và chuyển về /login
      localStorage.removeItem("hope_access_token");
      localStorage.removeItem("hope_user");
      clearStoredPermissions();
      setInternalOpen(false);
      window.location.href = "/login";
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      className="fixed inset-0 z-[999980] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/55 backdrop-blur-xs ui-backdrop-enter"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-100 z-10 ui-dialog-enter"
      >
        <div className="flex flex-col items-center text-center">
          {/* Avatar icon */}
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 ring-8 ring-red-50/50">
            <LogOut className="w-7 h-7 stroke-[2.2]" />
          </div>

          {/* Title */}
          <h3
            id="logout-confirm-title"
            className="text-xl font-serif font-bold text-neutral-900 tracking-tight mb-2"
          >
            Xác nhận đăng xuất
          </h3>

          {/* Message */}
          <p className="text-sm text-neutral-600 leading-relaxed mb-6">
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống{" "}
            <span className="font-semibold text-neutral-800">Hope Library</span>?
            Phiên làm việc hiện tại của bạn sẽ kết thúc và cần đăng nhập lại để tiếp tục sử dụng các tính năng quản trị.
          </p>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-neutral-300 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50 active:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmLogout}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đăng xuất...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
