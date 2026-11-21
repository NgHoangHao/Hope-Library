"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  BorrowerSummaryHeader,
  BorrowerSummaryToolbar,
  BorrowerSummaryTable,
  AccountPagination,
  useBorrowerSummaryManagement,
} from "@/features/account";

export default function UsersBorrowerSummaryPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("BORROWER_READ");
  const canCreateLoan = hasPermission("LOAN_CREATE");

  const {
    borrowers,
    total,
    page,
    size,
    totalPages,
    isLoading,
    searchDraft,
    setSearchDraft,
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
    refetchBorrowers,
  } = useBorrowerSummaryManagement({ canRead });

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê độc giả & Toast Alert */}
      <BorrowerSummaryHeader
        totalCount={total}
        isLoading={isLoading}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
        onRefresh={refetchBorrowers}
      />

      {/* Toolbar tìm kiếm (Bấm nút mới gọi API) & Lọc theo userStatus (Chọn là gọi API ngay) */}
      <BorrowerSummaryToolbar
        searchDraft={searchDraft}
        statusFilter={statusFilter}
        hasActiveFilters={hasActiveFilters}
        onSearchDraftChange={setSearchDraft}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
        onStatusFilterChange={handleStatusFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Bảng danh sách độc giả kèm nút Tạo phiếu mượn & Phân trang */}
      <div className="space-y-0">
        <BorrowerSummaryTable
          borrowers={borrowers}
          isLoading={isLoading}
          page={page}
          size={size}
          canCreateLoan={canCreateLoan}
          onCreateLoan={handleNavigateCreateLoan}
        />

        <AccountPagination
          page={page}
          size={size}
          total={total}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
        />
      </div>
    </div>
  );
}
