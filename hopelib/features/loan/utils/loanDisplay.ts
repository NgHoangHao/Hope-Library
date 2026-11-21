import {
  FineStatus,
  LoanFineResponseData,
  LoanItemStatus,
  LoanResponseData,
  LoanStatus,
} from "../types/loan.types";

export interface LoanStatusBadgeConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const LOAN_STATUS_CONFIG: Record<LoanStatus, LoanStatusBadgeConfig> = {
  PENDING: {
    label: "Chờ nhận sách",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  BORROWED: {
    label: "Đang mượn",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
  },
  OVERDUE: {
    label: "Quá hạn",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    dotClass: "bg-red-500",
  },
  RETURNED: {
    label: "Đã trả",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    badgeClass: "bg-stone-100 text-stone-600 border-stone-200",
    dotClass: "bg-stone-400",
  },
  EXPIRED: {
    label: "Hết hạn giữ",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    dotClass: "bg-orange-500",
  },
};

export const LOAN_ITEM_STATUS_LABELS: Record<LoanItemStatus, string> = {
  BORROWED: "Đang mượn",
  RETURNED: "Đã trả",
  OVERDUE: "Quá hạn",
  LOST: "Làm mất",
  DAMAGED: "Hư hỏng",
};

export const FINE_STATUS_CONFIG: Record<FineStatus, LoanStatusBadgeConfig> = {
  UNPAID: {
    label: "Chưa thanh toán",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    dotClass: "bg-red-500",
  },
  PAID: {
    label: "Đã thanh toán",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  WAIVED: {
    label: "Miễn phạt",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
    dotClass: "bg-stone-400",
  },
};

export function formatLoanDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatLoanDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrencyVnd(amount?: number | null): string {
  if (amount === undefined || amount === null) return "0 đ";
  return `${Number(amount).toLocaleString("vi-VN")} đ`;
}

/**
 * Lấy danh sách các khoản phạt chưa thanh toán (UNPAID, amount > 0) của một phiếu mượn
 */
export function getLoanUnpaidFines(
  loan: Pick<LoanResponseData, "fines">
): LoanFineResponseData[] {
  if (!Array.isArray(loan.fines) || loan.fines.length === 0) {
    return [];
  }
  return loan.fines.filter(
    (fine) =>
      fine.status?.toUpperCase() === "UNPAID" && Number(fine.amount ?? 0) > 0
  );
}

/**
 * Tính tổng số tiền phạt chưa thanh toán của một phiếu mượn
 */
export function getLoanUnpaidFineAmount(
  loan: Pick<LoanResponseData, "unpaidFineAmount" | "fines">
): number {
  if (
    typeof loan.unpaidFineAmount === "number" &&
    Number.isFinite(loan.unpaidFineAmount)
  ) {
    return loan.unpaidFineAmount;
  }

  return getLoanUnpaidFines(loan).reduce(
    (sum, fine) => sum + Number(fine.amount ?? 0),
    0
  );
}
