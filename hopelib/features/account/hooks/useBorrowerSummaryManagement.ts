"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUsersSummaryApi } from "../services/accountApi";
import {
  BorrowerSummaryUser,
  AccountFeedback,
} from "../types/account.types";
import { isSessionExpiredError } from "@/features/auth";

export interface UseBorrowerSummaryManagementOptions {
  canRead?: boolean;
}

export function useBorrowerSummaryManagement(
  options: UseBorrowerSummaryManagementOptions = {}
) {
  const { canRead = true } = options;
  const router = useRouter();

  // Dữ liệu danh sách độc giả & phân trang
  const [borrowers, setBorrowers] = useState<BorrowerSummaryUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State ô nhập tìm kiếm (chỉ gọi API khi bấm nút Tìm kiếm)
  const [searchDraft, setSearchDraft] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  // State lọc theo userStatus (chọn là gọi API ngay)
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Thông báo phản hồi (Toast Alert)
  const [feedback, setFeedback] = useState<AccountFeedback | null>(null);

  /**
   * Gọi API GET /users/summary
   */
  const fetchBorrowers = useCallback(
    async (
      targetPage: number,
      targetSize: number,
      targetSearch: string,
      targetStatus: string
    ) => {
      if (!canRead) {
        setBorrowers([]);
        setTotal(0);
        setTotalPages(1);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getUsersSummaryApi({
          page: targetPage,
          size: targetSize,
          search: targetSearch.trim() || undefined,
          status: targetStatus !== "ALL" ? targetStatus : undefined,
        });

        setBorrowers(Array.isArray(data?.items) ? data.items : []);
        setTotal(data?.total ?? 0);
        setPage(data?.page ?? targetPage);
        setSize(data?.size ?? targetSize);
        setTotalPages(data?.totalPages ?? 1);
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách thống kê độc giả.";
        setFeedback({
          type: "error",
          title: "Tải dữ liệu thất bại",
          message: msg,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [canRead]
  );

  // Tự động gọi API khi thay đổi page, size, statusFilter hoặc activeSearch
  useEffect(() => {
    fetchBorrowers(page, size, activeSearch, statusFilter);
  }, [fetchBorrowers, page, size, activeSearch, statusFilter]);

  /**
   * Khi người dùng bấm nút "Tìm kiếm" -> mới gọi API
   */
  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchDraft.trim();
    if (page === 1 && trimmed === activeSearch) {
      // Nếu từ khóa và trang không đổi nhưng người dùng bấm nút Tìm kiếm thì vẫn gọi lại API
      fetchBorrowers(1, size, trimmed, statusFilter);
    } else {
      setPage(1);
      setActiveSearch(trimmed);
    }
  }, [searchDraft, page, activeSearch, fetchBorrowers, size, statusFilter]);

  /**
   * Xóa ô tìm kiếm và gọi lại API danh sách gốc
   */
  const handleSearchClear = useCallback(() => {
    setSearchDraft("");
    if (page === 1 && activeSearch === "") {
      fetchBorrowers(1, size, "", statusFilter);
    } else {
      setPage(1);
      setActiveSearch("");
    }
  }, [page, activeSearch, fetchBorrowers, size, statusFilter]);

  /**
   * Khi chọn userStatus -> cập nhật state và gọi API ngay lập tức (thông qua useEffect hoặc gọi trực tiếp)
   */
  const handleStatusFilterChange = useCallback((newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  }, []);

  /**
   * Đặt lại toàn bộ bộ lọc tìm kiếm & trạng thái
   */
  const handleResetFilters = useCallback(() => {
    setSearchDraft("");
    setActiveSearch("");
    setStatusFilter("ALL");
    setPage(1);
  }, []);

  /**
   * Chuyển trang
   */
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  /**
   * Đổi số dòng mỗi trang
   */
  const handleSizeChange = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(1);
  }, []);

  /**
   * Điều hướng sang trang Tạo phiếu mượn (Create Loan) với userId đã chọn
   */
  const handleNavigateCreateLoan = useCallback(
    (borrower: BorrowerSummaryUser) => {
      const params = new URLSearchParams();
      params.set("userId", borrower.id);
      if (borrower.code) params.set("code", borrower.code);
      if (borrower.fullName) params.set("fullName", borrower.fullName);
      if (borrower.username) params.set("username", borrower.username);
      if (borrower.email) params.set("email", borrower.email);
      if (borrower.phone) params.set("phone", borrower.phone);
      if (borrower.status) params.set("status", borrower.status);
      params.set("borrowedBooksCount", String(borrower.borrowedBooksCount ?? 0));
      params.set("expiredLoansCount", String(borrower.expiredLoansCount ?? 0));
      params.set("totalFineAmount", String(borrower.totalFineAmount ?? 0));

      router.push(`/users/create-loan?${params.toString()}`);
    },
    [router]
  );

  const hasActiveFilters =
    statusFilter !== "ALL" || Boolean(activeSearch.trim());

  return {
    borrowers,
    total,
    page,
    size,
    totalPages,
    isLoading,
    searchDraft,
    setSearchDraft,
    activeSearch,
    statusFilter,
    hasActiveFilters,
    feedback,
    setFeedback,
    handleSearchSubmit,
    handleSearchClear,
    handleStatusFilterChange,
    handleResetFilters,
    handlePageChange,
    handleSizeChange,
    handleNavigateCreateLoan,
    refetchBorrowers: () =>
      fetchBorrowers(page, size, activeSearch, statusFilter),
  };
}
