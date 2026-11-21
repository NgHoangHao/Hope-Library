"use client";

import React from "react";
import { ShoppingBag, ArrowRight, BookOpen } from "lucide-react";
import {
  ReservationCartItem,
  MAX_RESERVATION_CART_ITEMS,
} from "../types/book.types";
import { getBookCoverUrl } from "../utils/bookImage.helper";

export interface BorrowerReserveCartBarProps {
  items: ReservationCartItem[];
  onOpenCart: () => void;
}

/**
 * Thanh nổi cuối màn hình hiển thị giỏ đặt mượn sách (gộp nhiều bản sao từ nhiều đầu sách vào 1 phiếu mượn).
 */
export function BorrowerReserveCartBar({
  items,
  onOpenCart,
}: BorrowerReserveCartBarProps) {
  if (items.length === 0) return null;

  const uniqueBookCount = new Set(items.map((item) => item.bookId)).size;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-2xl pointer-events-auto ui-dialog-enter">
      <div className="bg-stone-900/95 backdrop-blur-md text-white rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xl border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Stacked miniature covers */}
          <div className="flex -space-x-2 shrink-0">
            {items.slice(0, 3).map((item) => {
              const cover = getBookCoverUrl(item.bookUrl);
              return (
                <div
                  key={item.bookCopyId}
                  className="w-9 h-11 rounded-lg overflow-hidden border-2 border-stone-900 bg-stone-800 flex items-center justify-center shadow-xs"
                  title={item.bookTitle}
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={item.bookTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen aria-hidden="true" className="w-4 h-4 text-amber-300" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-white">
                <ShoppingBag aria-hidden="true" className="w-4 h-4 text-[#F5B82E]" />
                <span>
                  Giỏ đặt mượn ({items.length}/{MAX_RESERVATION_CART_ITEMS} bản)
                </span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-300 truncate">
              {uniqueBookCount > 1
                ? `${uniqueBookCount} đầu sách khác nhau trong cùng 1 phiếu mượn`
                : items[0].bookTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] text-xs sm:text-sm font-bold shadow-xs shrink-0 cursor-pointer"
        >
          <span>Đặt mượn ngay</span>
          <ArrowRight aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

BorrowerReserveCartBar.displayName = "BorrowerReserveCartBar";
