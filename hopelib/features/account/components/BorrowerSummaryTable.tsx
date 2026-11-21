"use client";

import React from "react";
import {
  User,
  Loader2,
  Mail,
  Phone,
  BookOpen,
  AlertTriangle,
  Banknote,
  BookPlus,
} from "lucide-react";
import { BorrowerSummaryUser } from "../types/account.types";
import { getAvatarUrl } from "@/features/profile";

export interface BorrowerSummaryTableProps {
  borrowers: BorrowerSummaryUser[];
  isLoading: boolean;
  page: number;
  size: number;
  canCreateLoan: boolean;
  onCreateLoan: (borrower: BorrowerSummaryUser) => void;
}

export function BorrowerSummaryTable({
  borrowers,
  isLoading,
  page,
  size,
  canCreateLoan,
  onCreateLoan,
}: BorrowerSummaryTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">
          Đang tải danh sách độc giả & thống kê mượn trả...
        </span>
      </div>
    );
  }

  if (borrowers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy độc giả nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Không có độc giả nào phù hợp với từ khóa tìm kiếm hoặc trạng thái đã chọn.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-700 border-collapse">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/75 text-xs font-semibold text-stone-500 uppercase tracking-wider select-none">
              <th scope="col" className="py-3.5 px-4 sm:px-5 w-14 text-center">
                STT
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-5 min-w-[230px]">
                Độc giả & Mã thẻ
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-5 min-w-[190px]">
                Liên hệ
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-5 w-36 text-center">
                Trạng thái
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-5 w-36 text-center">
                Đang mượn
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-5 w-36 text-center">
                Quá hạn
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-5 w-40 text-right">
                Tiền phạt
              </th>
              {canCreateLoan && (
                <th scope="col" className="py-3.5 px-4 sm:px-5 w-44 text-right">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {borrowers.map((borrower, index) => {
              const stt = (page - 1) * size + index + 1;
              const statusUpper = borrower.status?.toUpperCase() || "ACTIVE";
              const isActive = statusUpper === "ACTIVE";
              const isLocked = statusUpper === "LOCKED";
              const avatarSrc = getAvatarUrl(
                borrower.avatarUrl || borrower.avartarUrl
              );
              const initials = (
                borrower.fullName ||
                borrower.username ||
                "U"
              )[0].toUpperCase();

              const borrowedCount = Number(borrower.borrowedBooksCount) || 0;
              const expiredCount = Number(borrower.expiredLoansCount) || 0;
              const fineAmount = Number(borrower.totalFineAmount) || 0;

              const formattedFine = new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(fineAmount);

              return (
                <tr
                  key={borrower.id}
                  className="hover:bg-stone-50/80 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-4 px-4 sm:px-5 text-center text-xs font-mono text-stone-400">
                    {stt}
                  </td>

                  {/* Thông tin độc giả & mã code */}
                  <td className="py-4 px-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-[#F5B82E] text-stone-950 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {avatarSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarSrc}
                            alt={borrower.fullName || borrower.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-stone-900 truncate">
                          {borrower.fullName || borrower.username}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono truncate mt-0.5">
                          <span>@{borrower.username}</span>
                          {borrower.code && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                              {borrower.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Liên hệ */}
                  <td className="py-4 px-4 sm:px-5 text-xs text-stone-600 space-y-1">
                    <div
                      className="flex items-center gap-1.5 truncate"
                      title={borrower.email}
                    >
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{borrower.email}</span>
                    </div>
                    {borrower.phone ? (
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{borrower.phone}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-300 italic pl-5">
                        Chưa cập nhật SĐT
                      </span>
                    )}
                  </td>

                  {/* Trạng thái tài khoản */}
                  <td className="py-4 px-4 sm:px-5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isLocked
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-stone-100 text-stone-600 border border-stone-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive
                            ? "bg-emerald-500 animate-pulse"
                            : isLocked
                            ? "bg-rose-500"
                            : "bg-stone-400"
                        }`}
                      />
                      {statusUpper}
                    </span>
                  </td>

                  {/* Số sách đang mượn */}
                  <td className="py-4 px-4 sm:px-5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        borrowedCount >= 3
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : borrowedCount > 0
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-stone-50 text-stone-500 border-stone-200/80"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{borrowedCount}/3</span>
                    </span>
                  </td>

                  {/* Số phiếu EXPIRED */}
                  <td className="py-4 px-4 sm:px-5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        expiredCount > 0
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-stone-50 text-stone-500 border-stone-200/80"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{expiredCount} phiếu</span>
                    </span>
                  </td>

                  {/* Tổng tiền phạt */}
                  <td className="py-4 px-4 sm:px-5 text-right">
                    <div
                      className={`inline-flex items-center justify-end gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        fineAmount > 0
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-emerald-50/70 text-emerald-700 border-emerald-200/70"
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>{formattedFine}</span>
                    </div>
                  </td>

                  {/* Nút Tạo phiếu mượn (Create Loan) */}
                  {canCreateLoan && (
                    <td className="py-4 px-4 sm:px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onCreateLoan(borrower)}
                        title={`Tạo phiếu mượn sách cho ${borrower.fullName || borrower.username}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <BookPlus className="w-3.5 h-3.5 shrink-0" />
                        <span>Mượn</span>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
