"use client";

import React from "react";
import { Star, ArrowRight } from "lucide-react";
import { BookItem } from "../types/book.types";

interface BookCardProps {
  book: BookItem;
  onSelect?: (book: BookItem) => void;
}

export function BookCard({ book, onSelect }: BookCardProps) {
  return (
    <div
      onClick={() => onSelect?.(book)}
      className="group flex flex-col cursor-pointer transition-transform duration-200 hover:-translate-y-1"
    >
      {/* Book Cover Container */}
      <div
        className="relative w-full aspect-[1/1.14] rounded-2xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300 border border-black/5"
        style={{ backgroundColor: book.coverBg }}
      >
        {/* Subtle Spine Shading on left */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <span
            className="text-[9px] sm:text-[10px] font-semibold tracking-[0.22em] uppercase block"
            style={{ color: book.subtextColor }}
          >
            HOPE LIBRARY
          </span>
        </div>

        {/* Center Title */}
        <div className="relative z-10 my-auto py-2">
          <h3
            className="text-xl sm:text-2xl font-bold tracking-tight leading-tight line-clamp-3"
            style={{ color: book.textColor }}
          >
            {book.title}
          </h3>
        </div>

        {/* Bottom Author */}
        <div className="relative z-10">
          <span
            className="text-xs sm:text-[13px] font-medium tracking-wide block truncate"
            style={{ color: book.subtextColor }}
          >
            {book.author}
          </span>
        </div>

        {/* Subtle sheen highlight effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Meta Info Below Cover */}
      <div className="mt-3.5 flex flex-col">
        {/* Genre & Rating */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-medium">{book.category}</span>
          <div className="flex items-center gap-1 font-semibold text-neutral-800">
            <Star className="w-3.5 h-3.5 fill-[#F5B82E] text-[#F5B82E]" />
            <span>{book.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Book Title */}
        <h4 className="font-bold text-neutral-900 text-sm sm:text-base mt-1 line-clamp-1 group-hover:text-[#B8860B] transition-colors">
          {book.title}
        </h4>

        {/* Author */}
        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
          {book.author}
        </p>

        {/* Action Link */}
        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-neutral-900 group-hover:text-[#B8860B] transition-colors">
          <span>Xem chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}
