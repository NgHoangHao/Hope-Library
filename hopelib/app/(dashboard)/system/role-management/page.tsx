"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  RoleManagementHeader,
  RoleManagementToolbar,
  RoleManagementTable,
  RoleFormModal,
  RoleDeleteModal,
  useRoleManagement,
} from "@/features/role";

export default function RoleManagementPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("ROLE_READ");
  const canCreate = hasPermission("ROLE_CREATE");
  const canUpdate = hasPermission("ROLE_UPDATE");
  const canDelete = hasPermission("ROLE_DELETE");

  const {
    roles,
    filteredRoles,
    isLoading,
    searchTerm,
    setSearchTerm,
    feedback,
    setFeedback,
    isFormOpen,
    formMode,
    itemToEdit,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeFormModal,
    handleCreateRole,
    handleUpdateRole,
    isDeleteOpen,
    itemToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteRole,
  } = useRoleManagement({ canRead });

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner phản hồi */}
      <RoleManagementHeader
        totalCount={roles.length}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
      />

      {/* Toolbar Tìm kiếm & Nút thêm mới */}
      <RoleManagementToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalFiltered={filteredRoles.length}
        onOpenCreate={openCreateModal}
        canCreate={canCreate}
      />

      {/* Bảng danh sách vai trò */}
      <RoleManagementTable
        roles={filteredRoles}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      {/* Modal Thêm mới / Cập nhật vai trò */}
      <RoleFormModal
        isOpen={isFormOpen}
        mode={formMode}
        item={itemToEdit}
        isSubmitting={isSubmitting}
        onClose={closeFormModal}
        onCreate={handleCreateRole}
        onUpdate={handleUpdateRole}
      />

      {/* Modal Xác nhận xóa vai trò */}
      <RoleDeleteModal
        isOpen={isDeleteOpen}
        item={itemToDelete}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteRole}
      />
    </div>
  );
}
