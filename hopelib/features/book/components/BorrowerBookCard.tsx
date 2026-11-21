"use client";

import React, { useState } from "react";
import { ArrowRight, BookOpen, Layers, ShoppingBag } from "lucide-react";
import { BookEntity } from "../types/book.types";
import { getBookCoverUrl } from "../utils/bookImage.helper";

interface BorrowerBookCardProps {
  book: BookEntity;
  onSelect: (book: BookEntity) => void;
  authorMap?: Record<string, string>;
  categoryMap?: Record<string, string>;
  inCartCount?: number;
}

const FALLBACK_PALETTES = [
  { bg: "#1F2937", text: "#F9FAFB", sub: "#9CA3AF" }, // Slate dark
  { bg: "#78350F", text: "#FEF3C7", sub: "#FDE68A" }, // Amber brown
  { bg: "#064E3B", text: "#ECFDF5", sub: "#A7F3D0" }, // Emerald deep
  { bg: "#1E3A8A", text: "#EFF6FF", sub: "#BFDBFE" }, // Royal blue
  { bg: "#4C1D95", text: "#F5F3FF", sub: "#DDD6FE" }, // Violet
  { bg: "#831843", text: "#FDF2F8", sub: "#FBCFE8" }, // Crimson
];

function getFallbackPalette(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % FALLBACK_PALETTES.length;
  }
  return FALLBACK_PALETTES[hash];
}

export function BorrowerBookCard({
  book,
  onSelect,
  authorMap,
  categoryMap,
  inCartCount = 0,
}: BorrowerBookCardProps) {
  const [imageError, setImageError] = useState(false);
  const coverUrl = getBookCoverUrl(book.bookUrl);
  const hasValidImage = Boolean(coverUrl) && !imageError;
  const palette = getFallbackPalette(book.id || book.title);

  const authorName =
    book.author?.name ||
    (book.authorId && authorMap ? authorMap[book.authorId] : null) ||
    "Chưa xác định";
  const categoryName =
    book.category?.name ||
    (book.categoryId && categoryMap ? categoryMap[book.categoryId] : null) ||
    "Chưa phân loại";
  const isAvailable = (book.availableCopies ?? 0) > 0;

  return (
    <div
      onClick={() => onSelect(book)}
      className="group flex flex-col bg-white rounded-2xl p-3 sm:p-3.5 border border-black/5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1"
    >
      {/* Book Cover Container */}
      <div className="relative w-full aspect-[1/1.22] rounded-xl overflow-hidden shadow-xs group-hover:shadow-md transition-shadow">
        {hasValidImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl!}
            alt={book.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Stylized Editorial Fallback Cover */
          <div
            className="w-full h-full p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden select-none"
            style={{ backgroundColor: palette.bg }}
          >
            {/* Book Spine Shading Effect */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/35 to-transparent pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span
                className="text-[9px] font-semibold tracking-[0.2em] uppercase"
                style={{ color: palette.sub }}
              >
                HOPE LIBRARY
              </span>
              <BookOpen className="w-3.5 h-3.5 opacity-60" style={{ color: palette.sub }} />
            </div>

            <div className="relative z-10 my-auto py-2">
              <h3
                className="text-base sm:text-lg font-bold tracking-tight leading-snug line-clamp-3"
                style={{ color: palette.text }}
              >
                {book.title}
              </h3>
            </div>

            <div className="relative z-10">
              <span
                className="text-xs font-medium tracking-wide block truncate"
                style={{ color: palette.sub }}
              >
                {authorName}
              </span>
            </div>

            {/* Subtle Sheen Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        )}

        {/* Floating In-Cart Badge */}
        {inCartCount > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F5B82E] text-[#1A1A1A] shadow-sm">
              <ShoppingBag aria-hidden="true" className="w-3 h-3" />
              <span>Trong giỏ ({inCartCount})</span>
            </span>
          </div>
        )}

        {/* Floating Availability Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-xs ${
              isAvailable
                ? "bg-emerald-500/90 text-white"
                : "bg-rose-500/90 text-white"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAvailable ? "bg-white" : "bg-white"
              }`}
            />
            {isAvailable
              ? `Còn ${book.availableCopies}/${book.totalCopies}`
              : "Hết sách"}
          </span>
        </div>
      </div>

      {/* Meta Info Below Cover */}
      <div className="mt-3 flex flex-col flex-1 justify-between">
        <div>
          {/* Category Pill */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-block text-[#B8860B] bg-amber-50 border border-amber-200/60 font-semibold px-2 py-0.5 rounded-md text-[11px] truncate max-w-[160px]">
              {categoryName}
            </span>

            {book.publicationYear ? (
              <span className="text-[11px] text-neutral-400 font-medium">
                {book.publicationYear}
              </span>
            ) : null}
          </div>

          {/* Book Title */}
          <h4 className="font-bold text-neutral-900 text-sm sm:text-[15px] mt-2 line-clamp-2 leading-tight group-hover:text-[#B8860B] transition-colors">
            {book.title}
          </h4>

          {/* Author */}
          <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
            {authorName}
          </p>
        </div>

        {/* Action Link */}
        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-800 group-hover:text-[#B8860B] transition-colors">
          <span className="inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#B8860B]" />
            <span>{isAvailable ? "Xem & Đặt mượn" : "Xem chi tiết"}</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}
