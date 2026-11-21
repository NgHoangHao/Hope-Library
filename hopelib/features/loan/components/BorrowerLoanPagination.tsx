"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BorrowerLoanPaginationProps {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export function BorrowerLoanPagination({
  page,
  size,
  total,
  totalPages,
  onPageChange,
  onSizeChange,
}: BorrowerLoanPaginationProps) {
  if (total === 0) return null;

  const startItem = (page - 1) * size + 1;
  const endItem = Math.min(page * size, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 mt-2">
      <div className="text-xs text-stone-500">
        Hiển thị <span className="font-semibold text-stone-900">{startItem}</span> -{" "}
        <span className="font-semibold text-stone-900">{endItem}</span> trong tổng số{" "}
        <span className="font-semibold text-stone-900">{total}</span> phiếu mượn
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Hiển thị:</span>
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="text-xs font-semibold bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value={10}>10 phiếu/trang</option>
            <option value={20}>20 phiếu/trang</option>
            <option value={50}>50 phiếu/trang</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-stone-700 px-2">
            Trang <span className="font-bold text-stone-900">{page}</span> / {totalPages || 1}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
