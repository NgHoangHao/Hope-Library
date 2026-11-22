"use client";

import React from "react";
import Link from "next/link";
import { BookOpenCheck, AlertCircle, ArrowRight } from "lucide-react";

interface BorrowerRemainingBooksCardProps {
  maxBorrowBooks: number;
  borrowedBooksCount: number;
  remainingBorrowBooks: number;
  isLoading: boolean;
  variant?: "banner" | "sidebar";
  className?: string;
}

export function BorrowerRemainingBooksCard({
  maxBorrowBooks,
  borrowedBooksCount,
  remainingBorrowBooks,
  isLoading,
  variant = "banner",
  className = "",
}: BorrowerRemainingBooksCardProps) {
  const isLimitReached = !isLoading && maxBorrowBooks > 0 && remainingBorrowBooks <= 0;
  const usagePercent =
    maxBorrowBooks > 0
      ? Math.min(100, Math.round((borrowedBooksCount / maxBorrowBooks) * 100))
      : 0;

  if (variant === "sidebar") {
    return (
      <div
        className={`rounded-2xl p-3.5 border transition-colors ${
          isLimitReached
            ? "bg-red-50/70 border-red-200/80"
            : "bg-amber-50/70 border-amber-200/80"
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              isLimitReached ? "text-red-700" : "text-amber-800"
            }`}
          >
            {isLimitReached ? (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <BookOpenCheck className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>Còn có thể mượn</span>
          </span>
          {!isLoading && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isLimitReached
                  ? "bg-red-100 text-red-700"
                  : "bg-[#F5B82E]/30 text-amber-900"
              }`}
            >
              {remainingBorrowBooks}/{maxBorrowBooks}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 py-1 animate-pulse">
            <div className="h-5 w-24 rounded bg-amber-200/50" />
            <div className="h-1.5 w-full rounded-full bg-amber-200/40" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl font-bold leading-none ${
                  isLimitReached ? "text-red-700" : "text-[#1A1A1A]"
                }`}
              >
                {remainingBorrowBooks}
              </span>
              <span className="text-xs text-neutral-600 font-medium">
                cuốn sách
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isLimitReached ? "bg-red-500" : "bg-[#F5B82E]"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <p className="mt-1.5 text-[11px] text-neutral-600 leading-tight">
              Đang mượn:{" "}
              <span className="font-semibold text-neutral-800">
                {borrowedBooksCount}
              </span>{" "}
              / tối đa{" "}
              <span className="font-semibold text-neutral-800">
                {maxBorrowBooks}
              </span>{" "}
              cuốn
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isLimitReached
          ? "bg-red-50/70 border-red-200/80"
          : "bg-white border-amber-200/80"
      } ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isLimitReached
              ? "bg-red-100 text-red-600"
              : "bg-[#F5B82E]/20 text-[#B8860B]"
          }`}
        >
          {isLimitReached ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <BookOpenCheck className="w-5 h-5" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Số sách còn có thể mượn
            </span>
            {!isLoading && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  isLimitReached
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {remainingBorrowBooks} / {maxBorrowBooks} cuốn
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="mt-1.5 h-5 w-52 rounded bg-neutral-200/70 animate-pulse" />
          ) : isLimitReached ? (
            <p className="text-sm text-red-700 font-medium mt-0.5">
              Bạn đã đạt giới hạn tối đa {maxBorrowBooks} cuốn đang mượn. Vui lòng trả sách trước khi mượn thêm.
            </p>
          ) : (
            <p className="text-sm text-neutral-700 mt-0.5">
              Bạn còn có thể mượn thêm{" "}
              <span className="font-bold text-[#1A1A1A]">
                {remainingBorrowBooks} cuốn sách
              </span>{" "}
              (hiện đang mượn{" "}
              <span className="font-semibold text-neutral-900">
                {borrowedBooksCount}/{maxBorrowBooks}
              </span>{" "}
              cuốn).
            </p>
          )}
        </div>
      </div>

      {!isLoading && (
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden lg:block w-32">
            <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
              <span>Đã dùng</span>
              <span className="font-semibold text-neutral-700">
                {borrowedBooksCount}/{maxBorrowBooks}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isLimitReached ? "bg-red-500" : "bg-[#F5B82E]"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <Link
            href={isLimitReached ? "/borrowing" : "/books"}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
              isLimitReached
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#F5B82E]/20 hover:bg-[#F5B82E]/35 text-[#8A6500]"
            }`}
          >
            <span>{isLimitReached ? "Xem sách đang mượn" : "Khám phá tủ sách"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
