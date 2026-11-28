"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardRecentLoanData } from "../types/dashboard.types";

interface DashboardRecentLoansProps {
  loans: DashboardRecentLoanData[];
  isLoading: boolean;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getLoanStatusDisplay(status: string) {
  const normalized = status?.trim().toUpperCase();

  switch (normalized) {
    case "BORROWED":
      return {
        label: "Đang mượn",
        style: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
      };
    case "PENDING":
      return {
        label: "Chờ nhận sách",
        style: "bg-amber-50 text-amber-800 border-amber-200/80",
      };
    case "OVERDUE":
      return {
        label: "Quá hạn",
        style: "bg-rose-50 text-rose-700 border-rose-200/70",
      };
    case "RETURNED":
      return {
        label: "Đã trả",
        style: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        style: "bg-neutral-100 text-neutral-500 border-neutral-200/70",
      };
    case "EXPIRED":
      return {
        label: "Hết hạn giữ",
        style: "bg-orange-50 text-orange-700 border-orange-200/70",
      };
    default:
      return {
        label: status || "Không rõ",
        style: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
      };
  }
}

export function DashboardRecentLoans({
  loans,
  isLoading,
}: DashboardRecentLoansProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-2xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Mượn trả gần đây
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Theo dõi tình trạng và thời hạn trả sách
          </p>
        </div>
        <Link
          href="/books/loans"
          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-black transition-colors group"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
              <th className="py-3 px-3">MÃ PHIẾU</th>
              <th className="py-3 px-3">THÀNH VIÊN</th>
              <th className="py-3 px-3">TÊN SÁCH</th>
              <th className="py-3 px-3">NGÀY MƯỢN</th>
              <th className="py-3 px-3">HẠN TRẢ</th>
              <th className="py-3 px-3 text-right">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 text-xs sm:text-sm text-neutral-800">
            {isLoading ? (
              [1, 2, 3, 4].map((row) => (
                <tr key={row}>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="h-6 w-20 bg-neutral-100 rounded-full animate-pulse ml-auto" />
                  </td>
                </tr>
              ))
            ) : loans.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-xs text-neutral-400"
                >
                  Chưa có phiếu mượn trả nào gần đây.
                </td>
              </tr>
            ) : (
              loans.map((loan) => {
                const statusInfo = getLoanStatusDisplay(loan.status);
                return (
                  <tr
                    key={loan.id}
                    className="hover:bg-neutral-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-semibold text-neutral-700">
                      {loan.code}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-neutral-900">
                      {loan.memberName}
                    </td>
                    <td className="py-3.5 px-3 text-neutral-700">
                      {loan.bookTitle}
                    </td>
                    <td className="py-3.5 px-3 text-neutral-500">
                      {formatDate(loan.borrowDate)}
                    </td>
                    <td className="py-3.5 px-3 text-neutral-500">
                      {formatDate(loan.dueDate)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={cn(
                          "inline-block px-3 py-1 rounded-full text-xs font-medium border",
                          statusInfo.style
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
