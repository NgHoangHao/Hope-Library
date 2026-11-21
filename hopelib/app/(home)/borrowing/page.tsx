"use client";

import React from "react";
import Link from "next/link";
import {
  BookMarked,
  ChevronRight,
  Home,
  ShieldAlert,
} from "lucide-react";
import { useBorrowerHomeGuard } from "@/features/auth";
import {
  BorrowerLoanCancelModal,
  BorrowerLoanDetailModal,
  BorrowerLoanList,
  BorrowerLoanPagination,
  BorrowerLoanToolbar,
  BorrowerUnpaidFineBanner,
  useBorrowerLoans,
} from "@/features/loan";

export default function BorrowingPage() {
  const { isAuthorized } = useBorrowerHomeGuard();
  const {
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
    handleRefresh,
  } = useBorrowerLoans();

  if (!isAuthorized) {
    return null;
  }

  const hasActiveFilter = selectedStatus !== "ALL" || submittedSearch !== "";

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6 font-medium">
          <Link
            href="/home"
            className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[#B8860B] font-semibold">Sách đang mượn</span>
        </nav>

        {/* Page Title & Subtitle */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center font-bold">
              <BookMarked className="w-4 h-4" />
            </div>
            <span className="text-[#B8860B] font-semibold text-xs tracking-[0.2em] uppercase">
              PHIẾU MƯỢN CỦA BẠN
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#1A1A1A]">
            Quản lý mượn &amp; giữ chỗ sách
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Theo dõi trạng thái các phiếu đặt giữ chỗ, sách đang mượn, hạn trả và lịch sử mượn trả của bạn.
          </p>
        </div>

        {!isPermissionsLoading && !canReadMyLoans ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">
              Bạn chưa có quyền xem danh sách phiếu mượn cá nhân
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Tài khoản của bạn cần được cấp quyền{" "}
              <code className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-mono">
                LOAN_SELF_READ
              </code>{" "}
              để sử dụng tính năng này.
            </p>
          </div>
        ) : (
          <>
            <BorrowerUnpaidFineBanner
              totalUnpaidFineAmount={totalUnpaidFineAmount}
              unpaidFineLoansCount={unpaidFineLoansCount}
            />

            <BorrowerLoanToolbar
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusChange}
              searchDraft={searchDraft}
              onSearchDraftChange={setSearchDraft}
              onSearchSubmit={handleSearchSubmit}
              onSearchClear={handleSearchClear}
              onResetFilters={handleResetFilters}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              total={total}
            />

            <BorrowerLoanList
              loans={loans}
              isLoading={isLoading}
              cancellingId={cancellingId}
              onOpenDetail={handleOpenDetail}
              onCancelLoan={handleRequestCancelLoan}
              onResetFilters={handleResetFilters}
              hasActiveFilter={hasActiveFilter}
            />

            <BorrowerLoanPagination
              page={page}
              size={size}
              total={total}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onSizeChange={handleSizeChange}
            />

            <BorrowerLoanDetailModal
              isOpen={isDetailOpen}
              isLoading={isLoadingDetail}
              loan={selectedLoanDetail}
              cancellingId={cancellingId}
              onClose={handleCloseDetail}
              onCancelLoan={handleRequestCancelLoan}
            />

            <BorrowerLoanCancelModal
              loanId={cancelTargetId}
              isCancelling={Boolean(cancelTargetId && cancellingId === cancelTargetId)}
              onClose={handleCloseCancelModal}
              onConfirm={handleConfirmCancelLoan}
            />
          </>
        )}
      </div>
    </div>
  );
}
