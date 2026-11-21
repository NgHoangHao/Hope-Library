"use client";

import React from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  Pencil,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { LoanResponseData } from "../types/loan.types";
import {
  formatCurrencyVnd,
  formatLoanDate,
  formatLoanDateTime,
  getLoanUnpaidFineAmount,
  LOAN_STATUS_CONFIG,
} from "../utils/loanDisplay";

export interface LoanManagementTableProps {
  loans: LoanResponseData[];
  page: number;
  size: number;
  isLoading: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onViewDetail: (loanId: string) => void;
  onEdit: (loanId: string) => void;
  onFulfill: (loanId: string) => void;
  onDelete: (loan: LoanResponseData) => void;
}

export function LoanManagementTable({
  loans,
  page,
  size,
  isLoading,
  canRead,
  canUpdate,
  canDelete,
  onViewDetail,
  onEdit,
  onFulfill,
  onDelete,
}: LoanManagementTableProps) {
  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-14 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200/60">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-900">
          Bạn không có quyền xem danh sách phiếu mượn
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Vui lòng liên hệ quản trị viên để được cấp quyền{" "}
          <span className="font-mono font-semibold text-stone-700">
            LOAN_READ
          </span>
          .
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">
          Đang tải danh sách phiếu mượn...
        </span>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy phiếu mượn nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Không có phiếu mượn nào khớp với điều kiện lọc hoặc tìm kiếm hiện tại.
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
              <th scope="col" className="py-3.5 px-4 w-14 text-center">
                STT
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[165px]">
                Mã phiếu
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[220px]">
                Người mượn
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[190px]">
                Thời gian mượn / hạn trả
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[140px]">
                Trạng thái
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[180px]">
                Ghi chú
              </th>
              <th scope="col" className="py-3.5 px-4 w-56 text-right">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loans.map((loan, index) => {
              const stt = (page - 1) * size + index + 1;
              const statusCfg =
                LOAN_STATUS_CONFIG[loan.status] || LOAN_STATUS_CONFIG.BORROWED;
              const displayName =
                loan.user?.fullName ||
                loan.user?.username ||
                "Độc giả chưa xác định";
              const avatarLetter = displayName.charAt(0).toUpperCase();
              const isPending = loan.status === "PENDING";

              return (
                <tr
                  key={loan.id}
                  className="hover:bg-stone-50/80 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-4 px-4 text-center font-mono text-xs text-stone-400">
                    {stt}
                  </td>

                  {/* Mã phiếu */}
                  <td className="py-4 px-4">
                    <span
                      className="inline-block font-mono text-xs font-semibold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200/70"
                      title={loan.id}
                    >
                      #{loan.id.slice(0, 8)}...
                    </span>
                    <span className="block text-[11px] text-stone-400 mt-1">
                      Tạo: {formatLoanDate(loan.createdAt)}
                    </span>
                  </td>

                  {/* Người mượn */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/70 font-semibold text-xs shadow-2xs">
                        {avatarLetter}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 truncate group-hover:text-amber-800 transition-colors">
                          {displayName}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          {loan.user?.email ||
                            loan.user?.username ||
                            `UID: ${loan.userId.slice(0, 8)}...`}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Thời gian mượn / hạn trả */}
                  <td className="py-4 px-4 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Mượn: {formatLoanDate(loan.loanDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        {isPending && loan.pickupDeadline
                          ? `Hạn lấy: ${formatLoanDateTime(loan.pickupDeadline)}`
                          : `Hạn trả: ${formatLoanDate(loan.dueDate)}`}
                      </span>
                    </div>
                    {loan.returnDate && (
                      <p className="text-emerald-700 font-medium pl-5">
                        Đã trả: {formatLoanDate(loan.returnDate)}
                      </p>
                    )}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusCfg.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                        />
                        {statusCfg.label}
                      </span>
                      {getLoanUnpaidFineAmount(loan) > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap"
                          title="Phiếu mượn có tiền phạt chưa thanh toán"
                        >
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>
                            Phạt: {formatCurrencyVnd(getLoanUnpaidFineAmount(loan))}
                          </span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Ghi chú */}
                  <td className="py-4 px-4">
                    {loan.notes ? (
                      <p
                        className="text-xs text-stone-600 line-clamp-2 max-w-[220px]"
                        title={loan.notes}
                      >
                        {loan.notes}
                      </p>
                    ) : (
                      <span className="text-xs text-stone-400 italic">
                        Không có ghi chú
                      </span>
                    )}
                  </td>

                  {/* Hành động */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canRead && (
                        <button
                          type="button"
                          onClick={() => onViewDetail(loan.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
                          title="Xem chi tiết phiếu mượn"
                        >
                          <Eye className="w-3.5 h-3.5 text-stone-600" />
                          <span>Xem</span>
                        </button>
                      )}

                      {canUpdate &&
                        (isPending ? (
                          <button
                            type="button"
                            onClick={() => onFulfill(loan.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-colors cursor-pointer"
                            title="Xác nhận giao sách tại quầy"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Xác nhận</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEdit(loan.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 transition-colors cursor-pointer"
                            title="Cập nhật phiếu mượn"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-700" />
                            <span>Sửa</span>
                          </button>
                        ))}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(loan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 transition-colors cursor-pointer"
                          title="Xóa phiếu mượn"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
