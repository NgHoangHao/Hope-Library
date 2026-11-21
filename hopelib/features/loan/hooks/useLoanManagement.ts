"use client";

import { useState, useEffect, useCallback } from "react";
import { usePermissions } from "@/features/auth";
import {
  getLoansApi,
  getLoanDetailApi,
  updateLoanApi,
  fulfillLoanApi,
  deleteLoanApi,
  updateFineStatusApi,
} from "../services/loanApi";
import {
  FineStatus,
  FulfillLoanInput,
  LoanDetailResponseData,
  LoanFeedback,
  LoanResponseData,
  LoanStatus,
  UpdateLoanInput,
} from "../types/loan.types";
import { FINE_STATUS_CONFIG } from "../utils/loanDisplay";

/**
 * Custom hook quản lý danh sách phiếu mượn (GET /loans, GET /loans/:id, PUT /loans/:id, DELETE /loans/:id)
 * - Tìm kiếm chỉ gọi API khi bấm nút Search (submit)
 * - Lọc trạng thái gọi API ngay lập tức khi chọn
 */
export function useLoanManagement() {
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions();
  const canRead = hasPermission("LOAN_READ");
  const canUpdate = hasPermission("LOAN_UPDATE");
  const canDelete = hasPermission("LOAN_DELETE");
  const canUpdateFine = hasPermission("FINE_UPDATE");

  // Danh sách & phân trang
  const [loans, setLoans] = useState<LoanResponseData[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search
  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | "ALL">("ALL");
  const [searchDraft, setSearchDraft] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Phản hồi toast
  const [feedback, setFeedback] = useState<LoanFeedback | null>(null);

  // View Detail Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLoanDetail, setSelectedLoanDetail] =
    useState<LoanDetailResponseData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Update Modal
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [loanToUpdate, setLoanToUpdate] =
    useState<LoanDetailResponseData | null>(null);
  const [isLoadingUpdateDetail, setIsLoadingUpdateDetail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fulfill Modal (POST /loans/:id/fulfill)
  const [isFulfillOpen, setIsFulfillOpen] = useState(false);
  const [loanToFulfill, setLoanToFulfill] =
    useState<LoanDetailResponseData | null>(null);
  const [isLoadingFulfillDetail, setIsLoadingFulfillDetail] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<LoanResponseData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fine Status Update
  const [updatingFineId, setUpdatingFineId] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    if (isPermissionsLoading) return;
    if (!canRead) {
      setLoans([]);
      setTotal(0);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getLoansApi({
        page,
        size,
        status: selectedStatus,
        search: submittedSearch,
      });
      setLoans(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách phiếu mượn";
      setFeedback({ type: "error", message });
    } finally {
      setIsLoading(false);
    }
  }, [
    isPermissionsLoading,
    canRead,
    page,
    size,
    selectedStatus,
    submittedSearch,
    searchTrigger,
  ]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Filter: chọn trạng thái gọi API ngay lập tức
  const handleStatusChange = useCallback((status: LoanStatus | "ALL") => {
    setSelectedStatus(status);
    setPage(1);
  }, []);

  // Search: chỉ gọi API khi bấm nút Tìm kiếm / Submit form
  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = searchDraft.trim();
      setSubmittedSearch(trimmed);
      setPage(1);
      setSearchTrigger((prev) => prev + 1);
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

  // View Detail (GET /loans/:id)
  const openDetailModal = useCallback(async (loanId: string) => {
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
      setIsDetailOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedLoanDetail(null);
  }, []);

  // Open Update Modal (GET /loans/:id nếu chưa có detail)
  const openUpdateModal = useCallback(
    async (loanId: string, existingDetail?: LoanDetailResponseData | null) => {
      setIsDetailOpen(false);
      setIsUpdateOpen(true);

      if (existingDetail && existingDetail.id === loanId) {
        setLoanToUpdate(existingDetail);
        setIsLoadingUpdateDetail(false);
        return;
      }

      setIsLoadingUpdateDetail(true);
      setLoanToUpdate(null);
      try {
        const detail = await getLoanDetailApi(loanId);
        setLoanToUpdate(detail);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin phiếu mượn để cập nhật";
        setFeedback({ type: "error", message });
        setIsUpdateOpen(false);
      } finally {
        setIsLoadingUpdateDetail(false);
      }
    },
    []
  );

  const closeUpdateModal = useCallback(() => {
    if (isUpdating) return;
    setIsUpdateOpen(false);
    setLoanToUpdate(null);
  }, [isUpdating]);

  // Update Loan (PUT /loans/:id)
  const handleUpdateLoan = useCallback(
    async (loanId: string, input: UpdateLoanInput): Promise<boolean> => {
      setIsUpdating(true);
      setFeedback(null);
      try {
        await updateLoanApi(loanId, input);
        setFeedback({
          type: "success",
          message: "Cập nhật phiếu mượn sách thành công.",
        });
        setIsUpdateOpen(false);
        setLoanToUpdate(null);
        await fetchLoans();
        return true;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể cập nhật phiếu mượn";
        setFeedback({ type: "error", message });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchLoans]
  );

  // Open Fulfill Modal (GET /loans/:id nếu chưa có detail)
  const openFulfillModal = useCallback(
    async (loanId: string, existingDetail?: LoanDetailResponseData | null) => {
      setIsDetailOpen(false);
      setIsFulfillOpen(true);

      if (existingDetail && existingDetail.id === loanId) {
        setLoanToFulfill(existingDetail);
        setIsLoadingFulfillDetail(false);
        return;
      }

      setIsLoadingFulfillDetail(true);
      setLoanToFulfill(null);
      try {
        const detail = await getLoanDetailApi(loanId);
        setLoanToFulfill(detail);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin phiếu mượn để xác nhận giao sách";
        setFeedback({ type: "error", message });
        setIsFulfillOpen(false);
      } finally {
        setIsLoadingFulfillDetail(false);
      }
    },
    []
  );

  const closeFulfillModal = useCallback(() => {
    if (isFulfilling) return;
    setIsFulfillOpen(false);
    setLoanToFulfill(null);
  }, [isFulfilling]);

  // Fulfill Loan (POST /loans/:id/fulfill)
  const handleFulfillLoan = useCallback(
    async (loanId: string, input: FulfillLoanInput): Promise<boolean> => {
      setIsFulfilling(true);
      setFeedback(null);
      try {
        await fulfillLoanApi(loanId, input);
        setFeedback({
          type: "success",
          message:
            "Xác nhận giao sách tại quầy thành công! Phiếu mượn đã chuyển sang trạng thái Đang mượn.",
        });
        setIsFulfillOpen(false);
        setLoanToFulfill(null);
        await fetchLoans();
        return true;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể xác nhận giao sách cho phiếu mượn";
        setFeedback({ type: "error", message });
        return false;
      } finally {
        setIsFulfilling(false);
      }
    },
    [fetchLoans]
  );

  // Delete Modal
  const openDeleteModal = useCallback((loan: LoanResponseData) => {
    setLoanToDelete(loan);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setIsDeleteOpen(false);
    setLoanToDelete(null);
  }, [isDeleting]);

  // Delete Loan (DELETE /loans/:id)
  const handleDeleteLoan = useCallback(async (): Promise<boolean> => {
    if (!loanToDelete) return false;
    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteLoanApi(loanToDelete.id);
      setFeedback({
        type: "success",
        message: "Xóa phiếu mượn cùng các mục mượn và tiền phạt liên quan thành công.",
      });
      setIsDeleteOpen(false);
      setLoanToDelete(null);

      // Nếu xóa item cuối cùng của trang > 1, lùi về trang trước
      if (loans.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchLoans();
      }
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa phiếu mượn";
      setFeedback({ type: "error", message });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [loanToDelete, loans.length, page, fetchLoans]);

  // Update Fine Status (PATCH /fines/:id/status)
  const handleUpdateFineStatus = useCallback(
    async (fineId: string, status: FineStatus): Promise<boolean> => {
      setUpdatingFineId(fineId);
      setFeedback(null);
      try {
        const updatedFine = await updateFineStatusApi(fineId, status);

        const patchLoanFines = (
          prev: LoanDetailResponseData | null
        ): LoanDetailResponseData | null => {
          if (!prev || !prev.fines) return prev;
          const nextFines = prev.fines.map((fine) =>
            fine.id === fineId ? { ...fine, ...updatedFine } : fine
          );
          const nextUnpaidFineAmount = nextFines.reduce(
            (sum, f) =>
              f.status?.toUpperCase() === "UNPAID" && Number(f.amount ?? 0) > 0
                ? sum + Number(f.amount ?? 0)
                : sum,
            0
          );
          return {
            ...prev,
            fines: nextFines,
            unpaidFineAmount: nextUnpaidFineAmount,
          };
        };

        setSelectedLoanDetail(patchLoanFines);
        setLoanToUpdate(patchLoanFines);

        const statusLabel = FINE_STATUS_CONFIG[status]?.label || status;
        setFeedback({
          type: "success",
          message: `Đã cập nhật trạng thái khoản phạt sang "${statusLabel}".`,
        });

        await fetchLoans();
        return true;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái khoản phạt";
        setFeedback({ type: "error", message });
        return false;
      } finally {
        setUpdatingFineId(null);
      }
    },
    [fetchLoans]
  );

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return {
    canRead,
    canUpdate,
    canDelete,
    canUpdateFine,
    isPermissionsLoading,
    loans,
    page,
    size,
    total,
    totalPages,
    isLoading,
    selectedStatus,
    searchDraft,
    setSearchDraft,
    submittedSearch,
    feedback,
    clearFeedback,
    handleStatusChange,
    handleSearchSubmit,
    handleSearchClear,
    handleResetFilters,
    handlePageChange,
    handleSizeChange,
    handleRefresh: fetchLoans,
    // Detail modal
    isDetailOpen,
    selectedLoanDetail,
    isLoadingDetail,
    openDetailModal,
    closeDetailModal,
    // Update modal
    isUpdateOpen,
    loanToUpdate,
    isLoadingUpdateDetail,
    isUpdating,
    openUpdateModal,
    closeUpdateModal,
    handleUpdateLoan,
    // Fulfill modal
    isFulfillOpen,
    loanToFulfill,
    isLoadingFulfillDetail,
    isFulfilling,
    openFulfillModal,
    closeFulfillModal,
    handleFulfillLoan,
    // Delete modal
    isDeleteOpen,
    loanToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteLoan,
    // Fine status update
    updatingFineId,
    handleUpdateFineStatus,
  };
}
