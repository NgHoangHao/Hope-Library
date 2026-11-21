"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AccountPaginationProps {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export function AccountPagination({
  page,
  size,
  total,
  totalPages,
  onPageChange,
  onSizeChange,
}: AccountPaginationProps) {
  if (total === 0) return null;

  const startItem = (page - 1) * size + 1;
  const endItem = Math.min(page * size, total);

  // Tạo danh sách trang hiển thị xung quanh trang hiện tại
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-stone-50/50 border-t border-stone-200/80 rounded-b-2xl">
      {/* Thông tin số lượng hiển thị */}
      <div className="text-xs text-stone-500">
        Hiển thị <span className="font-semibold text-stone-900">{startItem}</span> -{" "}
        <span className="font-semibold text-stone-900">{endItem}</span> trong tổng số{" "}
        <span className="font-semibold text-stone-900">{total}</span> tài khoản
      </div>

      <div className="flex items-center gap-3.5">
        {/* Chọn số dòng hiển thị mỗi trang */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500">Hiển thị:</span>
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="text-xs font-semibold bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value={10}>10 dòng</option>
            <option value={20}>20 dòng</option>
            <option value={50}>50 dòng</option>
          </select>
        </div>

        {/* Nút bấm chuyển trang */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                p === page
                  ? "bg-[#F5B82E] text-stone-950 shadow-2xs font-bold"
                  : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Trang kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
