"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Trash2,
  BookOpen,
  Barcode,
  MapPin,
  Clock,
  Loader2,
  BookmarkPlus,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  ReservationCartItem,
  MAX_RESERVATION_CART_ITEMS,
} from "../types/book.types";
import { getBookCoverUrl } from "../utils/bookImage.helper";
import { useLayerDismissal, useFocusTrap } from "@/hooks";

export interface BorrowerReserveCartDrawerProps {
  isOpen: boolean;
  items: ReservationCartItem[];
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
  onClose: () => void;
  onRemoveItem: (bookCopyId: string) => void;
  onClearCart: () => void;
  onSubmitReservation: (notes?: string) => Promise<boolean>;
}

export function BorrowerReserveCartDrawer({
  isOpen,
  items,
  isSubmitting,
  error,
  successMessage,
  onClose,
  onRemoveItem,
  onClearCart,
  onSubmitReservation,
}: BorrowerReserveCartDrawerProps) {
  const [notes, setNotes] = useState("");

  useLayerDismissal({
    isOpen,
    onDismiss: onClose,
    disabled: isSubmitting,
  });

  const drawerRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
  });

  if (!isOpen) return null;

  const uniqueBookCount = new Set(items.map((i) => i.bookId)).size;

  const handleConfirm = async () => {
    if (items.length === 0 || isSubmitting) return;
    const ok = await onSubmitReservation(notes);
    if (ok) {
      setNotes("");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs ui-backdrop-enter"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* Right Slide-over Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-w-md bg-[#FAF8F5] h-full shadow-2xl border-l border-stone-200 flex flex-col ui-drawer-right-enter"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-stone-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center shrink-0">
              <ShoppingBag aria-hidden="true" className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="reserve-cart-drawer-title"
                className="text-base font-bold text-stone-900 truncate"
              >
                Giỏ đặt mượn sách
              </h2>
              <p className="text-xs text-stone-500">
                {items.length}/{MAX_RESERVATION_CART_ITEMS} bản sách
                {uniqueBookCount > 1 ? ` · ${uniqueBookCount} đầu sách` : ""} trong 1 phiếu mượn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng giỏ đặt mượn"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Info Banner */}
          <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
            <Clock aria-hidden="true" className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Tất cả sách trong giỏ sẽ được gộp thành <strong>1 phiếu đặt mượn duy nhất</strong> (giữ chỗ tối đa 48 giờ, tối đa {MAX_RESERVATION_CART_ITEMS} sách).
            </span>
          </div>

          {/* Feedback */}
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMessage}</span>
              </div>
              <Link
                href="/borrowing"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
              >
                <span>Xem phiếu mượn của tôi</span>
                <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Empty state */}
          {items.length === 0 ? (
            <div className="py-12 px-4 text-center bg-white rounded-2xl border border-stone-200/70">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <BookOpen aria-hidden="true" className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-800">
                Giỏ đặt mượn đang trống
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Chọn các đầu sách từ Tủ sách và nhấn &quot;Thêm vào giỏ đặt mượn&quot; để gộp nhiều cuốn vào cùng 1 phiếu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Danh sách bản sao đã chọn
                </span>
                <button
                  type="button"
                  onClick={onClearCart}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>

              {items.map((item) => {
                const cover = getBookCoverUrl(item.bookUrl);
                return (
                  <div
                    key={item.bookCopyId}
                    className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex items-start gap-3"
                  >
                    <div className="w-12 h-16 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center shrink-0">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={item.bookTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen aria-hidden="true" className="w-5 h-5 text-stone-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                        {item.bookTitle}
                      </p>
                      {item.authorName && (
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {item.authorName}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
                        <span className="inline-flex items-center gap-1 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                          <Barcode aria-hidden="true" className="w-3 h-3 text-stone-400" />
                          {item.barcode}
                        </span>
                        {item.shelfLocation && (
                          <span className="inline-flex items-center gap-1 text-stone-500">
                            <MapPin aria-hidden="true" className="w-3 h-3 text-stone-400" />
                            {item.shelfLocation}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.bookCopyId)}
                      disabled={isSubmitting}
                      aria-label={`Xóa bản sao ${item.barcode} khỏi giỏ`}
                      title="Xóa khỏi giỏ"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 bg-white border-t border-stone-200/80 space-y-3">
            <div>
              <label
                htmlFor="reserve-cart-notes"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Ghi chú cho phiếu mượn (tùy chọn)
              </label>
              <input
                id="reserve-cart-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                placeholder="VD: Sẽ đến lấy sách vào chiều mai..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-stone-200 bg-stone-50/70 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || items.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] text-sm font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
                  <span>Đang gửi yêu cầu đặt mượn...</span>
                </>
              ) : (
                <>
                  <BookmarkPlus aria-hidden="true" className="w-4 h-4" />
                  <span>Xác nhận đặt mượn ({items.length} bản sách)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

BorrowerReserveCartDrawer.displayName = "BorrowerReserveCartDrawer";
