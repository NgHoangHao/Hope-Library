"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPopularBookData } from "../types/dashboard.types";

interface DashboardPopularBooksProps {
  books: DashboardPopularBookData[];
  updatedAt?: string;
  isLoading: boolean;
}

const RANK_BADGE_STYLES: Record<number, string> = {
  1: "bg-[#1A1A1A] text-white",
  2: "bg-[#C69214] text-white",
  3: "bg-[#8C5E3C] text-white",
};

function formatUpdatedTime(iso?: string): string {
  if (!iso) return "Vừa cập nhật";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Vừa cập nhật";
  return `Cập nhật lúc ${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function DashboardPopularBooks({
  books,
  updatedAt,
  isLoading,
}: DashboardPopularBooksProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Sách được yêu thích
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Theo lượt mượn nhiều nhất
            </p>
          </div>
          <Link
            href="/books/book-list"
            className="text-xs font-semibold text-neutral-700 hover:text-black transition-colors"
          >
            Xem tất cả
          </Link>
        </div>

        {/* Top 3 List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-2.5 rounded-xl"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-3/4 bg-neutral-100 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-400">
            Chưa có dữ liệu lượt mượn sách.
          </div>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
              <div
                key={book.bookId}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs",
                      RANK_BADGE_STYLES[book.rank] ?? "bg-neutral-200 text-neutral-700"
                    )}
                  >
                    {book.rank}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#C68A14] transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-neutral-400 truncate">
                      {book.author}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-neutral-800 shrink-0 pl-2">
                  {book.borrowCount.toLocaleString("vi-VN")} lượt
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 mt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
        <span>{formatUpdatedTime(updatedAt)}</span>
        <TrendingUp className="w-3.5 h-3.5 text-[#C68A14]" />
      </div>
    </div>
  );
}
