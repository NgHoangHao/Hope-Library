"use client";

import React from "react";
import {
  BorrowerLoanPagination,
  LoanDeleteModal,
  LoanDetailModal,
  LoanFulfillModal,
  LoanManagementHeader,
  LoanManagementTable,
  LoanManagementToolbar,
  LoanUpdateModal,
  useLoanManagement,
} from "@/features/loan";

export default function LoansPage() {
  const {
    canRead,
    canUpdate,
    canDelete,
    canUpdateFine,
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
    handleRefresh,
    isDetailOpen,
    selectedLoanDetail,
    isLoadingDetail,
    openDetailModal,
    closeDetailModal,
    isUpdateOpen,
    loanToUpdate,
    isLoadingUpdateDetail,
    isUpdating,
    openUpdateModal,
    closeUpdateModal,
    handleUpdateLoan,
    isFulfillOpen,
    loanToFulfill,
    isLoadingFulfillDetail,
    isFulfilling,
    maxLoanDays,
    isLoadingMaxLoanDays,
    openFulfillModal,
    closeFulfillModal,
    handleFulfillLoan,
    isDeleteOpen,
    loanToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteLoan,
    updatingFineId,
    handleUpdateFineStatus,
  } = useLoanManagement();

  return (
    <div className="space-y-6 pb-16">
      {/* Header & TopCornerAlert */}
      <LoanManagementHeader
        totalCount={total}
        feedback={feedback}
        onClearFeedback={clearFeedback}
      />

      {/* Thanh tìm kiếm (bấm nút mới gọi API) & bộ lọc trạng thái (chọn gọi API ngay) */}
      <LoanManagementToolbar
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        submittedSearch={submittedSearch}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        total={total}
      />

      {/* Bảng danh sách phiếu mượn */}
      <LoanManagementTable
        loans={loans}
        page={page}
        size={size}
        isLoading={isLoading}
        canRead={canRead}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onViewDetail={openDetailModal}
        onEdit={(loanId) => openUpdateModal(loanId)}
        onFulfill={(loanId) => openFulfillModal(loanId)}
        onDelete={openDeleteModal}
      />

      {/* Phân trang */}
      {canRead && !isLoading && (
        <BorrowerLoanPagination
          page={page}
          size={size}
          total={total}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
        />
      )}

      {/* Modal xem chi tiết phiếu mượn (GET /loans/:id) */}
      <LoanDetailModal
        isOpen={isDetailOpen}
        isLoading={isLoadingDetail}
        loan={selectedLoanDetail}
        canUpdate={canUpdate}
        canUpdateFine={canUpdateFine}
        updatingFineId={updatingFineId}
        onClose={closeDetailModal}
        onOpenEdit={(loan) => openUpdateModal(loan.id, loan)}
        onOpenFulfill={(loan) => openFulfillModal(loan.id, loan)}
        onUpdateFineStatus={handleUpdateFineStatus}
      />

      {/* Modal xác nhận giao sách tại quầy (POST /loans/:id/fulfill) */}
      <LoanFulfillModal
        isOpen={isFulfillOpen}
        isLoadingDetail={isLoadingFulfillDetail}
        isFulfilling={isFulfilling}
        maxLoanDays={maxLoanDays}
        isLoadingMaxLoanDays={isLoadingMaxLoanDays}
        loan={loanToFulfill}
        onClose={closeFulfillModal}
        onConfirm={handleFulfillLoan}
      />

      {/* Modal cập nhật phiếu mượn (PUT /loans/:id) */}
      <LoanUpdateModal
        isOpen={isUpdateOpen}
        isLoadingDetail={isLoadingUpdateDetail}
        isUpdating={isUpdating}
        loan={loanToUpdate}
        canUpdateFine={canUpdateFine}
        updatingFineId={updatingFineId}
        onClose={closeUpdateModal}
        onSubmit={handleUpdateLoan}
        onUpdateFineStatus={handleUpdateFineStatus}
      />

      {/* Modal xác nhận xóa phiếu mượn (DELETE /loans/:id) */}
      <LoanDeleteModal
        isOpen={isDeleteOpen}
        loan={loanToDelete}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteLoan}
      />
    </div>
  );
}
