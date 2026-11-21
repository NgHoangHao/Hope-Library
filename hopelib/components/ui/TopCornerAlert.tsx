"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommittedRef } from "@/hooks";

export type AlertType = "success" | "error" | "info" | "warning";

export interface AlertFeedback {
  type: AlertType;
  message: string;
  title?: string;
}

export const SHOW_TOAST_EVENT = "hope_show_toast";

/**
 * Hàm tiện ích phát thông báo Alert nổi ở góc trên màn hình từ bất kỳ đâu trong dự án.
 */
export function showToast(feedback: AlertFeedback): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SHOW_TOAST_EVENT, {
        detail: feedback,
      })
    );
  }
}

export interface TopCornerAlertProps {
  /** Dữ liệu thông báo truyền qua prop (dùng cho các Header/Page quản lý state cục bộ) */
  feedback?: AlertFeedback | null;
  /** Callback đóng thông báo khi người dùng nhấn nút X hoặc hết thời gian tự động đóng */
  onClose?: () => void;
  /** Thời gian tự đóng (milliseconds), mặc định 2000ms (2s). Truyền 0 để không tự đóng */
  autoCloseDuration?: number;
  /** Cho phép lắng nghe sự kiện toàn cục hope_show_toast (mặc định false nếu dùng cho Header) */
  listenToGlobalEvents?: boolean;
}

const configByType: Record<
  AlertType,
  {
    borderClass: string;
    shadowClass: string;
    gradientBarClass: string;
    avatarGradientClass: string;
    avatarShadowClass: string;
    pulseRingClass: string;
    badgeBgClass: string;
    badgeTextClass: string;
    defaultBadgeText: string;
    defaultTitle: string;
    IconComponent: React.ComponentType<{ className?: string }>;
  }
> = {
  success: {
    borderClass: "border-emerald-500/40",
    shadowClass: "shadow-emerald-950/20",
    gradientBarClass: "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600",
    avatarGradientClass: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    avatarShadowClass: "shadow-emerald-600/30",
    pulseRingClass: "bg-emerald-500/30",
    badgeBgClass: "bg-emerald-100",
    badgeTextClass: "text-emerald-800",
    defaultBadgeText: "Thành công",
    defaultTitle: "Thao tác thành công",
    IconComponent: CheckCircle2,
  },
  error: {
    borderClass: "border-rose-500/40",
    shadowClass: "shadow-rose-950/25",
    gradientBarClass: "bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600",
    avatarGradientClass: "bg-gradient-to-br from-rose-500 to-rose-700",
    avatarShadowClass: "shadow-rose-600/30",
    pulseRingClass: "bg-rose-500/30",
    badgeBgClass: "bg-rose-100",
    badgeTextClass: "text-rose-800",
    defaultBadgeText: "Thông báo lỗi",
    defaultTitle: "Đã xảy ra lỗi",
    IconComponent: AlertCircle,
  },
  warning: {
    borderClass: "border-amber-500/40",
    shadowClass: "shadow-amber-950/20",
    gradientBarClass: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
    avatarGradientClass: "bg-gradient-to-br from-amber-500 to-amber-700",
    avatarShadowClass: "shadow-amber-600/30",
    pulseRingClass: "bg-amber-500/30",
    badgeBgClass: "bg-amber-100",
    badgeTextClass: "text-amber-800",
    defaultBadgeText: "Cảnh báo",
    defaultTitle: "Cảnh báo hệ thống",
    IconComponent: AlertTriangle,
  },
  info: {
    borderClass: "border-sky-500/40",
    shadowClass: "shadow-sky-950/20",
    gradientBarClass: "bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600",
    avatarGradientClass: "bg-gradient-to-br from-sky-500 to-sky-700",
    avatarShadowClass: "shadow-sky-600/30",
    pulseRingClass: "bg-sky-500/30",
    badgeBgClass: "bg-sky-100",
    badgeTextClass: "text-sky-800",
    defaultBadgeText: "Thông báo",
    defaultTitle: "Thông tin hệ thống",
    IconComponent: Info,
  },
};

export function TopCornerAlert({
  feedback,
  onClose,
  autoCloseDuration = 2000,
  listenToGlobalEvents = false,
}: TopCornerAlertProps) {
  const [internalFeedback, setInternalFeedback] = useState<AlertFeedback | null>(null);
  const [toastTriggerCount, setToastTriggerCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useCommittedRef(onClose);

  // Lắng nghe sự kiện toàn cục nếu được kích hoạt
  useEffect(() => {
    if (!listenToGlobalEvents) return;

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<AlertFeedback>;
      if (customEvent.detail && customEvent.detail.message) {
        setInternalFeedback(customEvent.detail);
        setToastTriggerCount((prev) => prev + 1);
      }
    };

    window.addEventListener(SHOW_TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(SHOW_TOAST_EVENT, handleToast);
    };
  }, [listenToGlobalEvents]);

  // Ưu tiên feedback từ props, fallback về internal feedback nếu dùng chế độ global
  const activeFeedback = feedback ?? internalFeedback;
  const hasFeedback = Boolean(activeFeedback);
  const feedbackType = activeFeedback?.type;
  const feedbackMessage = activeFeedback?.message;
  const feedbackTitle = activeFeedback?.title;

  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setInternalFeedback(null);
    if (onCloseRef.current) {
      onCloseRef.current();
    }
  }, [onCloseRef]);

  // Bộ đếm tự động đóng thông báo sau 2 giây (2000ms)
  useEffect(() => {
    if (!hasFeedback || autoCloseDuration <= 0) return;

    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, autoCloseDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    hasFeedback,
    feedbackType,
    feedbackMessage,
    feedbackTitle,
    toastTriggerCount,
    autoCloseDuration,
    handleDismiss,
  ]);

  if (!activeFeedback) {
    return null;
  }

  const currentConfig = configByType[activeFeedback.type] || configByType.info;
  const { IconComponent } = currentConfig;
  const displayTitle = activeFeedback.title || currentConfig.defaultTitle;

  return (
    <aside
      aria-label="Thông báo hệ thống"
      className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[999990] max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-auto select-none"
    >
      <div
        role="alert"
        aria-live="polite"
        className={cn(
          "relative bg-white/95 backdrop-blur-md rounded-2xl border-2 shadow-2xl overflow-hidden ui-toast-enter",
          currentConfig.borderClass,
          currentConfig.shadowClass
        )}
      >
        {/* Thanh gradient viền trên đồng bộ nhận diện thương hiệu */}
        <div className={cn("absolute top-0 left-0 right-0 h-1.5", currentConfig.gradientBarClass)} />

        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            {/* Icon với hiệu ứng xung động (pulse ring) */}
            <div className="relative shrink-0 mt-0.5">
              <span
                className={cn(
                  "absolute -inset-1 rounded-2xl animate-ping motion-reduce:animate-none opacity-75",
                  currentConfig.pulseRingClass
                )}
              />
              <div
                className={cn(
                  "relative w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md",
                  currentConfig.avatarGradientClass,
                  currentConfig.avatarShadowClass
                )}
              >
                <IconComponent className="w-6 h-6" />
              </div>
            </div>

            {/* Nội dung thông báo */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase",
                    currentConfig.badgeBgClass,
                    currentConfig.badgeTextClass
                  )}
                >
                  {currentConfig.defaultBadgeText}
                </span>
              </div>

              <h3 className="text-base font-bold text-stone-900 mt-1.5 tracking-tight">
                {displayTitle}
              </h3>

              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed line-clamp-3">
                {activeFeedback.message}
              </p>
            </div>

            {/* Nút đóng (X) góc phải */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Đóng thông báo"
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

TopCornerAlert.displayName = "TopCornerAlert";
