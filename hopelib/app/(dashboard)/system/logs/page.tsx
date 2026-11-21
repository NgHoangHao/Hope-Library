"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  AuditLogHeader,
  AuditLogToolbar,
  AuditLogTable,
  AuditLogPagination,
  AuditLogDetailModal,
  useAuditLogManagement,
} from "@/features/audit-log";

export default function AuditLogsPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("AUDIT_LOG_READ");

  const {
    logs,
    total,
    page,
    size,
    totalPages,
    isLoading,
    searchDraft,
    setSearchDraft,
    actionFilter,
    hasActiveFilters,
    feedback,
    setFeedback,
    selectedLog,
    isDetailOpen,
    isLoadingDetail,
    handlePageChange,
    handleSizeChange,
    handleSearchSubmit,
    handleSearchClear,
    handleActionFilterChange,
    handleResetFilters,
    openDetailModal,
    closeDetailModal,
    refetchLogs,
  } = useAuditLogManagement({ canRead });

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner Alert thông báo nổi */}
      <AuditLogHeader
        totalCount={total}
        isLoading={isLoading}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
        onRefresh={refetchLogs}
      />

      {/* Toolbar tìm kiếm theo user và lọc theo thao tác (GET, POST, PUT, DELETE) */}
      <AuditLogToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
        actionFilter={actionFilter}
        onActionFilterChange={handleActionFilterChange}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Bảng danh sách nhật ký kiểm toán */}
      <div className="space-y-0">
        <AuditLogTable
          logs={logs}
          isLoading={isLoading}
          page={page}
          size={size}
          onViewDetail={openDetailModal}
        />

        {/* Phân trang */}
        <AuditLogPagination
          page={page}
          size={size}
          total={total}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
        />
      </div>

      {/* Modal xem chi tiết nhật ký kiểm toán */}
      <AuditLogDetailModal
        isOpen={isDetailOpen}
        log={selectedLog}
        isLoading={isLoadingDetail}
        onClose={closeDetailModal}
      />
    </div>
  );
}
