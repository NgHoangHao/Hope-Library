"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  AccountHeader,
  AccountToolbar,
  AccountTable,
  AccountPagination,
  AccountCreateModal,
  AccountDeleteModal,
  useAccountManagement,
} from "@/features/account";

export default function AccountsPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("USER_READ");
  const canCreate = hasPermission("USER_CREATE");
  const canDelete = hasPermission("USER_DELETE");

  const {
    accounts,
    total,
    page,
    size,
    totalPages,
    isLoading,
    searchTerm,
    statusFilter,
    roleFilter,
    availableRoles,
    feedback,
    setFeedback,
    isCreateOpen,
    isCreating,
    isDeleteOpen,
    isDeleting,
    userToDelete,
    handleSearchChange,
    handleStatusFilterChange,
    handleRoleFilterChange,
    handlePageChange,
    handleSizeChange,
    openCreateModal,
    closeCreateModal,
    handleCreateAccount,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteAccount,
    refetchAccounts,
  } = useAccountManagement({ canRead });

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner Alert thông báo nổi */}
      <AccountHeader
        totalCount={total}
        isLoading={isLoading}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
        onRefresh={refetchAccounts}
      />

      {/* Toolbar tìm kiếm, lọc theo vai trò & trạng thái, nút thêm mới */}
      <AccountToolbar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        roleFilter={roleFilter}
        availableRoles={availableRoles}
        canCreate={canCreate}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onRoleFilterChange={handleRoleFilterChange}
        onOpenCreate={openCreateModal}
      />

      {/* Bảng danh sách tài khoản kèm phân trang bên dưới */}
      <div className="space-y-0">
        <AccountTable
          accounts={accounts}
          isLoading={isLoading}
          page={page}
          size={size}
          canDelete={canDelete}
          onDelete={openDeleteModal}
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

      {/* Modal Thêm mới tài khoản */}
      <AccountCreateModal
        isOpen={isCreateOpen}
        isCreating={isCreating}
        availableRoles={availableRoles}
        onClose={closeCreateModal}
        onCreate={handleCreateAccount}
      />

      {/* Modal Xác nhận xóa tài khoản */}
      <AccountDeleteModal
        isOpen={isDeleteOpen}
        user={userToDelete}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
