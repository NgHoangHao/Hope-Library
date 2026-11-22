"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  X,
  BookOpen,
  Calendar,
  Building2,
  Barcode,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookmarkPlus,
  ShoppingBag,
  Check,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  BookEntity,
  ReservationCartItem,
  MAX_RESERVATION_CART_ITEMS,
} from "../types/book.types";
import { getBookCoverUrl } from "../utils/bookImage.helper";
import { BookPdfSection } from "./BookPdfSection";
import { useLayerDismissal, useFocusTrap } from "@/hooks";

export interface BorrowerBookDetailModalProps {
  isOpen: boolean;
  book: BookEntity | null;
  isLoading: boolean;
  onClose: () => void;
  authorMap?: Record<string, string>;
  categoryMap?: Record<string, string>;
  // Reservation props (POST /loans/reserve)
  isReserving?: boolean;
  reserveError?: string | null;
  reserveSuccessMessage?: string | null;
  onReserveBook?: (bookCopyIds: string[], notes?: string) => Promise<boolean>;
  // Multi-book cart props
  cartCopyIdSet?: Set<string>;
  cartCount?: number;
  maxCartItems?: number;
  reservationExpirationHours?: number;
  onAddToCart?: (items: ReservationCartItem[]) => void;
  onOpenCart?: () => void;
}

export function BorrowerBookDetailModal({
  isOpen,
  book,
  isLoading,
  onClose,
  authorMap,
  categoryMap,
  isReserving = false,
  reserveError = null,
  reserveSuccessMessage = null,
  onReserveBook,
  cartCopyIdSet,
  cartCount = 0,
  maxCartItems = MAX_RESERVATION_CART_ITEMS,
  reservationExpirationHours = 48,
  onAddToCart,
  onOpenCart,
}: BorrowerBookDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [selectedCopyIds, setSelectedCopyIds] = useState<string[]>([]);
  const [reserveNotes, setReserveNotes] = useState("");

  useLayerDismissal({
    isOpen,
    onDismiss: onClose,
    disabled: isReserving,
  });

  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
  });

  const availableCopies = useMemo(() => {
    if (!book?.copies) return [];
    return book.copies.filter(
      (copy) =>
        copy.id &&
        (copy.status?.toUpperCase() === "AVAILABLE" ||
          copy.status?.toUpperCase() === "READY")
    );
  }, [book?.copies]);

  // Reset image error & pre-select first available copy when book changes
  useEffect(() => {
    setImageError(false);
    setReserveNotes("");
    if (availableCopies.length > 0 && availableCopies[0].id) {
      setSelectedCopyIds([availableCopies[0].id]);
    } else {
      setSelectedCopyIds([]);
    }
  }, [book?.id, availableCopies]);

  if (!isOpen) return null;

  const coverUrl = book?.bookUrl ? getBookCoverUrl(book.bookUrl) : null;
  const hasValidImage = Boolean(coverUrl) && !imageError;
  const authorName =
    book?.author?.name ||
    (book?.authorId && authorMap ? authorMap[book.authorId] : null) ||
    "Chưa xác định";
  const categoryName =
    book?.category?.name ||
    (book?.categoryId && categoryMap ? categoryMap[book.categoryId] : null) ||
    "Chưa phân loại";
  const isAvailable = (book?.availableCopies ?? 0) > 0 || availableCopies.length > 0;

  const handleToggleCopy = (copyId: string) => {
    setSelectedCopyIds((prev) =>
      prev.includes(copyId)
        ? prev.filter((id) => id !== copyId)
        : [...prev, copyId]
    );
  };

  const handleSubmitReserve = async () => {
    if (!onReserveBook || selectedCopyIds.length === 0 || isReserving) return;
    const ok = await onReserveBook(selectedCopyIds, reserveNotes);
    if (ok) {
      setReserveNotes("");
    }
  };

  const handleAddSelectedToCart = () => {
    if (!onAddToCart || !book || selectedCopyIds.length === 0) return;
    const selectedItems: ReservationCartItem[] = availableCopies
      .filter((copy) => copy.id && selectedCopyIds.includes(copy.id))
      .map((copy) => ({
        bookCopyId: copy.id,
        barcode: copy.barcode,
        shelfLocation: copy.shelfLocation,
        bookId: book.id,
        bookTitle: book.title,
        bookUrl: book.bookUrl,
        authorName,
      }));
    if (selectedItems.length > 0) {
      onAddToCart(selectedItems);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={book ? `Chi tiết sách ${book.title}` : "Chi tiết sách"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs ui-backdrop-enter"
      onClick={() => {
        if (!isReserving) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh] ui-dialog-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isReserving}
          aria-label="Đóng chi tiết sách"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-black/5 flex items-center justify-center shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          title="Đóng"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>

        {isLoading ? (
          <div className="py-28 flex flex-col items-center justify-center gap-3 text-neutral-600">
            <Loader2 className="w-10 h-10 animate-spin text-[#F5B82E]" />
            <p className="text-sm font-medium">Đang tải thông tin chi tiết sách...</p>
          </div>
        ) : !book ? (
          <div className="py-20 text-center px-6">
            <p className="text-base font-semibold text-neutral-800">
              Không thể tải thông tin cuốn sách này
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Dữ liệu sách có thể đã bị thay đổi hoặc không tồn tại.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-5 py-2 rounded-xl bg-[#F5B82E] text-[#1A1A1A] text-xs font-semibold hover:bg-[#EAA91D] transition-all cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Left Column: Cover Image & Availability */}
              <div className="sm:col-span-5 flex flex-col items-center">
                <div className="relative w-[180px] sm:w-[220px] aspect-[1/1.25] rounded-2xl overflow-hidden shadow-lg border border-black/10 bg-neutral-900 flex items-center justify-center">
                  {hasValidImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl!}
                      alt={book.title}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full p-5 flex flex-col justify-between bg-gradient-to-br from-amber-900 to-stone-900 text-white select-none">
                      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-300">
                        HOPE LIBRARY
                      </span>
                      <h3 className="text-base sm:text-lg font-bold line-clamp-3 my-auto text-amber-50">
                        {book.title}
                      </h3>
                      <span className="text-xs text-amber-200 truncate">
                        {authorName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Availability status badge */}
                <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-2xs">
                  {isAvailable ? (
                    <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle aria-hidden="true" className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-neutral-800">
                    {isAvailable
                      ? `Sẵn sàng (${book.availableCopies}/${book.totalCopies} bản)`
                      : "Tạm hết sách để mượn"}
                  </span>
                </div>
              </div>

              {/* Right Column: Title, Author, Category & Metadata */}
              <div className="sm:col-span-7 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#B8860B] bg-[#F5B82E]/15 border border-[#F5B82E]/30 px-3 py-0.5 rounded-full">
                    {categoryName}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight leading-snug">
                  {book.title}
                </h2>

                <p className="text-sm font-medium text-neutral-600 mt-1.5">
                  Tác giả: <span className="text-neutral-900 font-semibold">{authorName}</span>
                </p>

                {book.author?.biography && (
                  <p className="text-xs text-neutral-500 italic mt-1 line-clamp-2">
                    {book.author.biography}
                  </p>
                )}

                {/* Metadata 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2.5 my-4 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-black/5 shadow-2xs">
                    <span className="text-neutral-400 flex items-center gap-1.5 text-[11px] mb-1">
                      <Building2 aria-hidden="true" className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>Nhà xuất bản</span>
                    </span>
                    <span className="font-semibold text-neutral-800 line-clamp-1">
                      {book.publisher || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-black/5 shadow-2xs">
                    <span className="text-neutral-400 flex items-center gap-1.5 text-[11px] mb-1">
                      <Calendar aria-hidden="true" className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>Năm xuất bản</span>
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {book.publicationYear || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-black/5 shadow-2xs">
                    <span className="text-neutral-400 flex items-center gap-1.5 text-[11px] mb-1">
                      <Barcode aria-hidden="true" className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>Mã ISBN</span>
                    </span>
                    <span className="font-semibold text-neutral-800 font-mono text-[11px]">
                      {book.isbn || "Chưa có mã"}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-black/5 shadow-2xs">
                    <span className="text-neutral-400 flex items-center gap-1.5 text-[11px] mb-1">
                      <BookOpen aria-hidden="true" className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>Phiên bản</span>
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {book.edition || "Bản tiêu chuẩn"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                    Giới thiệu tác phẩm
                  </h4>
                  <div className="bg-white/80 p-3.5 rounded-2xl border border-black/5 text-xs sm:text-sm text-neutral-600 leading-relaxed max-h-40 overflow-y-auto">
                    {book.description ? (
                      book.description
                    ) : (
                      <span className="italic text-neutral-400">
                        Chưa có phần giới thiệu chi tiết cho cuốn sách này.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* File PDF nội dung sách (nếu có) */}
            <BookPdfSection
              bookId={book.id}
              bookTitle={book.title}
              pdfUrl={book.pdfUrl}
              variant="borrower"
            />

            {/* Copies list (Chọn bản sao vật lý để đặt mượn) */}
            {book.copies && book.copies.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="w-4 h-4 text-[#B8860B]" />
                    <span>
                      Chọn bản sao để đặt mượn ({availableCopies.length}/{book.copies.length} khả dụng)
                    </span>
                  </h4>
                  {selectedCopyIds.length > 0 && (
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      Đã chọn {selectedCopyIds.length} bản
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {book.copies.map((copy, index) => {
                    const isCopyAvailable =
                      Boolean(copy.id) &&
                      (copy.status?.toUpperCase() === "AVAILABLE" ||
                        copy.status?.toUpperCase() === "READY");
                    const isSelected = Boolean(copy.id && selectedCopyIds.includes(copy.id));
                    const isInCart = Boolean(copy.id && cartCopyIdSet?.has(copy.id));

                    if (isCopyAvailable && copy.id && (onReserveBook || onAddToCart)) {
                      return (
                        <button
                          key={copy.id}
                          type="button"
                          onClick={() => handleToggleCopy(copy.id)}
                          aria-pressed={isSelected}
                          className={`p-3 rounded-xl border text-left flex flex-col text-xs transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-50/90 border-[#F5B82E] ring-2 ring-[#F5B82E]/35 shadow-xs"
                              : isInCart
                              ? "bg-emerald-50/60 border-emerald-300"
                              : "bg-white border-black/10 hover:border-amber-400 hover:bg-amber-50/30"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="font-mono font-semibold text-neutral-900 truncate">
                              {copy.barcode}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isInCart && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Trong giỏ
                                </span>
                              )}
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-[#F5B82E] text-[#1A1A1A]"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {isSelected ? (
                                  <Check aria-hidden="true" className="w-3.5 h-3.5 stroke-[2.5]" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-neutral-500 mt-1.5 flex items-center gap-1">
                            <MapPin aria-hidden="true" className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">
                              Kệ: {copy.shelfLocation || "Khu vực chung"}
                            </span>
                          </span>
                        </button>
                      );
                    }

                    return (
                      <div
                        key={copy.id || index}
                        className="p-3 bg-neutral-100/70 rounded-xl border border-black/5 flex flex-col text-xs opacity-70"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-semibold text-neutral-700 truncate">
                            {copy.barcode}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-200 text-neutral-600 shrink-0">
                            {copy.status || "Đang mượn"}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-1.5 flex items-center gap-1">
                          <MapPin aria-hidden="true" className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate">
                            Kệ: {copy.shelfLocation || "Khu vực chung"}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reservation Action Box (POST /loans/reserve) */}
            {onReserveBook && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/90 shadow-xs space-y-3.5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center shrink-0">
                      <BookmarkPlus aria-hidden="true" className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">
                        Đặt mượn giữ chỗ trực tuyến
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                        <Clock aria-hidden="true" className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Phiếu giữ chỗ có hiệu lực {reservationExpirationHours} giờ để bạn tới quầy nhận sách (tối đa {maxCartItems} sách).</span>
                      </p>
                    </div>
                  </div>
                </div>

                {reserveError && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{reserveError}</span>
                  </div>
                )}

                {reserveSuccessMessage && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                      <span>{reserveSuccessMessage}</span>
                    </div>
                    <Link
                      href="/borrowing"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 font-semibold text-emerald-900 hover:underline shrink-0"
                    >
                      <span>Xem phiếu mượn</span>
                      <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {availableCopies.length > 0 ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder="Ghi chú thêm nếu đặt mượn ngay (tùy chọn)..."
                      disabled={isReserving}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-neutral-200 bg-neutral-50/70 text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
                    />

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      {onAddToCart && (
                        <button
                          type="button"
                          onClick={handleAddSelectedToCart}
                          disabled={isReserving || selectedCopyIds.length === 0}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <ShoppingBag aria-hidden="true" className="w-4 h-4 text-[#F5B82E]" />
                          <span>
                            Thêm vào giỏ ({cartCount}/{maxCartItems})
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmitReserve}
                        disabled={isReserving || selectedCopyIds.length === 0}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {isReserving ? (
                          <>
                            <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
                            <span>Đang đặt mượn...</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus aria-hidden="true" className="w-4 h-4" />
                            <span>
                              Đặt mượn ngay
                              {selectedCopyIds.length > 1 ? ` (${selectedCopyIds.length} bản)` : ""}
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    {cartCount > 0 && onOpenCart && (
                      <div className="pt-1 flex items-center justify-between text-xs text-stone-600">
                        <span>
                          Bạn đang có <strong className="text-stone-900">{cartCount} bản sách</strong> trong giỏ đặt mượn.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCart();
                          }}
                          className="inline-flex items-center gap-1 font-bold text-[#B8860B] hover:underline cursor-pointer"
                        >
                          <span>Mở giỏ &amp; gửi 1 phiếu</span>
                          <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-rose-600 font-medium">
                    Hiện tại tất cả bản sao của đầu sách này đều đang được mượn hoặc đã được giữ chỗ.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

BorrowerBookDetailModal.displayName = "BorrowerBookDetailModal";
