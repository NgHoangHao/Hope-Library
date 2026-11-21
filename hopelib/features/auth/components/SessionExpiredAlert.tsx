"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, LogIn, X, Clock } from "lucide-react";
import { SESSION_EXPIRED_EVENT } from "../services/apiClient";

export interface SessionExpiredAlertProps {
  loginUrl?: string;
}

export function SessionExpiredAlert({ loginUrl = "/login" }: SessionExpiredAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string>(
    "Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống."
  );

  useEffect(() => {
    const handleExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      if (customEvent.detail?.message) {
        setMessage(customEvent.detail.message);
      }
      setIsOpen(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    };
  }, []);

  const handleLoginClick = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath.startsWith("/login")) {
        window.location.reload();
        return;
      }
      const target = `${loginUrl}?redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = target;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Thông báo phiên làm việc"
      className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[999999] max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-auto select-none"
    >
      <div
        role="alert"
        aria-live="assertive"
        className="relative bg-white/95 backdrop-blur-md rounded-2xl border-2 border-rose-500/40 shadow-2xl shadow-rose-950/25 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4"
      >
        {/* Thanh gradient viền trên tạo điểm nhấn nổi bật */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            {/* Icon cảnh báo có hiệu ứng xung động (pulse ring) */}
            <div className="relative shrink-0 mt-0.5">
              <span className="absolute -inset-1 rounded-2xl bg-rose-500/30 animate-ping opacity-75" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

            {/* Nội dung thông báo */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 tracking-wide uppercase">
                  <Clock className="w-3 h-3 text-rose-600" />
                  Hết phiên đăng nhập
                </span>
              </div>

              <h2 className="text-base font-bold text-stone-900 mt-1.5 tracking-tight">
                Phiên đăng nhập đã hết hạn
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed line-clamp-3">
                {message}
              </p>

              {/* Nút hành động đăng nhập lại */}
              <div className="mt-4 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-md shadow-rose-700/25 transition-all duration-200 cursor-pointer active:scale-98"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập lại
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Nút đóng (X) góc phải */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
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
