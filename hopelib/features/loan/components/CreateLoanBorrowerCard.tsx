"use client";

import React from "react";
import {
  UserCheck,
  Mail,
  Phone,
  BookOpen,
  AlertTriangle,
  Banknote,
  Fingerprint,
} from "lucide-react";
import { SelectedBorrowerInfo } from "../types/loan.types";

export interface CreateLoanBorrowerCardProps {
  userId: string;
  borrowerInfo: SelectedBorrowerInfo;
  onUserIdChange: (newUserId: string) => void;
}

export function CreateLoanBorrowerCard({
  userId,
  borrowerInfo,
  onUserIdChange,
}: CreateLoanBorrowerCardProps) {
  const hasDetails = Boolean(
    borrowerInfo.fullName || borrowerInfo.username || borrowerInfo.code
  );

  const formattedFine =
    borrowerInfo.totalFineAmount !== undefined
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(Number(borrowerInfo.totalFineAmount) || 0)
      : null;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              Thông tin Độc giả Mượn sách
            </h2>
            <p className="text-xs text-stone-500">
              Mã định danh (userId) được tự động lấy từ độc giả bạn đã chọn
            </p>
          </div>
        </div>

        {borrowerInfo.code && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            Mã thẻ: {borrowerInfo.code}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Input userId */}
        <div className="lg:col-span-5">
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
            Mã định danh người mượn (userId) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Fingerprint className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
              placeholder="Nhập UUID của người mượn..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>
        </div>

        {/* Chi tiết độc giả nếu được truyền từ trang danh sách */}
        {hasDetails ? (
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/70">
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-bold text-stone-900 truncate">
                {borrowerInfo.fullName || borrowerInfo.username}
              </div>
              {borrowerInfo.username && (
                <div className="text-[11px] font-mono text-stone-500 truncate">
                  @{borrowerInfo.username}
                </div>
              )}
              {borrowerInfo.email && (
                <div className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{borrowerInfo.email}</span>
                </div>
              )}
              {borrowerInfo.phone && (
                <div className="flex items-center gap-1 text-[11px] text-stone-500">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>{borrowerInfo.phone}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center space-y-1.5 border-t sm:border-t-0 sm:border-l border-stone-200/80 pt-2 sm:pt-0 sm:pl-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Đang mượn:
                </span>
                <span className="font-bold text-stone-800">
                  {borrowerInfo.borrowedBooksCount ?? 0} cuốn
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Quá hạn lấy:
                </span>
                <span className="font-bold text-stone-800">
                  {borrowerInfo.expiredLoansCount ?? 0} phiếu
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-stone-200/80 pt-2 sm:pt-0 sm:pl-3">
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-rose-600" />
                Tổng tiền phạt:
              </span>
              <span
                className={`text-sm font-bold font-mono mt-0.5 ${
                  Number(borrowerInfo.totalFineAmount) > 0
                    ? "text-rose-600"
                    : "text-emerald-700"
                }`}
              >
                {formattedFine || "0 ₫"}
              </span>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 text-xs text-stone-500 bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            Đang sử dụng trực tiếp mã định danh <span className="font-mono font-semibold text-stone-800">{userId || "(chưa nhập)"}</span> để tạo phiếu mượn sách.
          </div>
        )}
      </div>
    </div>
  );
}
