"use client";

import { useState, useEffect, useCallback } from "react";
import { usePermissions } from "@/features/auth";
import { showToast } from "@/components/ui";
import {
  getMyLoansApi,
  getLoanDetailApi,
  cancelLoanReservationApi,
} from "../services/loanApi";
import {
  LoanDetailResponseData,
  LoanFeedback,
  LoanResponseData,
  LoanStatus,
} from "../types/loan.types";
import { getLoanUnpaidFineAmount } from "../utils/loanDisplay";

/**
 * Custom hook quản lý danh sách phiếu mượn cá nhân của độc giả (/borrowing)
 */
export function useBorrowerLoans() {
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();
  const canReadMyLoans = hasPermission("LOAN_SELF_READ");

  const [loans, setLoans] = useState<LoanResponseData[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUnpaidFineAmount, setTotalUnpaidFineAmount] = useState(0);
  const [unpaidFineLoansCount, setUnpaidFineLoansCount] = useState(0);

  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | "ALL">("ALL");
  const [searchDraft, setSearchDraft] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<LoanFeedback | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLoanDetail, setSelectedLoanDetail] =
    useState<LoanDetailResponseData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const fetchMyLoans = useCallback(async () => {
    if (isPermissionsLoading) return;
    if (!canReadMyLoans) {
      setLoans([]);
      setTotal(0);
      setTotalPages(1);
      setTotalUnpaidFineAmount(0);
      setUnpaidFineLoansCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getMyLoansApi({
        page,
        size,
        status: selectedStatus,
        search: submittedSearch,
      });
      setLoans(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);

      const fallbackTotalFine = res.items.reduce(
        (sum, item) => sum + getLoanUnpaidFineAmount(item),
        0
      );
      const fallbackUnpaidCount = res.items.filter(
        (item) => getLoanUnpaidFineAmount(item) > 0
      ).length;

      setTotalUnpaidFineAmount(
        typeof res.totalUnpaidFineAmount === "number"
          ? res.totalUnpaidFineAmount
          : fallbackTotalFine
      );
      setUnpaidFineLoansCount(
        typeof res.unpaidFineLoansCount === "number"
          ? res.unpaidFineLoansCount
          : fallbackUnpaidCount
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách phiếu mượn của bạn";
      setFeedback({ type: "error", message });
      showToast({
        type: "error",
        title: "Lỗi tải phiếu mượn",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    isPermissionsLoading,
    canReadMyLoans,
    page,
    size,
    selectedStatus,
    submittedSearch,
  ]);

  useEffect(() => {
    fetchMyLoans();
  }, [fetchMyLoans]);

  const handleStatusChange = useCallback((status: LoanStatus | "ALL") => {
    setSelectedStatus(status);
    setPage(1);
  }, []);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      setSubmittedSearch(searchDraft.trim());
      setPage(1);
    },
    [searchDraft]
  );

  const handleSearchClear = useCallback(() => {
    setSearchDraft("");
    setSubmittedSearch("");
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedStatus("ALL");
    setSearchDraft("");
    setSubmittedSearch("");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSizeChange = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(1);
  }, []);

  const handleOpenDetail = useCallback(async (loanId: string) => {
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    setSelectedLoanDetail(null);
    try {
      const detail = await getLoanDetailApi(loanId);
      setSelectedLoanDetail(detail);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết phiếu mượn";
      setFeedback({ type: "error", message });
      showToast({
        type: "error",
        title: "Lỗi tải chi tiết phiếu",
        message,
      });
      setIsDetailOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedLoanDetail(null);
  }, []);

  const handleRequestCancelLoan = useCallback((loanId: string) => {
    setCancelTargetId(loanId);
  }, []);

  const handleCloseCancelModal = useCallback(() => {
    if (cancellingId) return;
    setCancelTargetId(null);
  }, [cancellingId]);

  const handleCancelLoan = useCallback(
    async (loanId: string) => {
      setCancellingId(loanId);
      setFeedback(null);
      try {
        await cancelLoanReservationApi(loanId);
        const successMsg = "Hủy phiếu đặt mượn sách thành công.";
        setFeedback({
          type: "success",
          message: successMsg,
        });
        showToast({
          type: "success",
          title: "Đã hủy đặt mượn",
          message: successMsg,
        });
        setCancelTargetId(null);
        if (selectedLoanDetail?.id === loanId) {
          setIsDetailOpen(false);
          setSelectedLoanDetail(null);
        }
        await fetchMyLoans();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể hủy phiếu đặt mượn này";
        setFeedback({ type: "error", message });
        showToast({
          type: "error",
          title: "Hủy phiếu thất bại",
          message,
        });
      } finally {
        setCancellingId(null);
      }
    },
    [fetchMyLoans, selectedLoanDetail]
  );

  const handleConfirmCancelLoan = useCallback(async () => {
    if (!cancelTargetId) return;
    await handleCancelLoan(cancelTargetId);
  }, [cancelTargetId, handleCancelLoan]);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return {
    canReadMyLoans,
    isPermissionsLoading,
    loans,
    page,
    size,
    total,
    totalPages,
    totalUnpaidFineAmount,
    unpaidFineLoansCount,
    isLoading,
    selectedStatus,
    searchDraft,
    setSearchDraft,
    submittedSearch,
    feedback,
    clearFeedback,
    isDetailOpen,
    selectedLoanDetail,
    isLoadingDetail,
    cancellingId,
    cancelTargetId,
    handleStatusChange,
    handleSearchSubmit,
    handleSearchClear,
    handleResetFilters,
    handlePageChange,
    handleSizeChange,
    handleOpenDetail,
    handleCloseDetail,
    handleRequestCancelLoan,
    handleCloseCancelModal,
    handleConfirmCancelLoan,
    handleCancelLoan,
    handleRefresh: fetchMyLoans,
  };
}
