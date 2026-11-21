"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  PermissionManagementHeader,
  PermissionManagementToolbar,
  PermissionManagementTable,
  PermissionFormModal,
  PermissionDeleteModal,
  usePermissionManagement,
} from "@/features/permission";

export default function PermissionManagementPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("PERMISSION_READ");
  const canCreate = hasPermission("PERMISSION_CREATE");
  const canUpdate = hasPermission("PERMISSION_UPDATE");
  const canDelete = hasPermission("PERMISSION_DELETE");

  const {
    permissions,
    filteredPermissions,
    isLoading,
    modules,
    selectedModule,
    setSelectedModule,
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
    handleCreatePermission,
    handleUpdatePermission,
    isDeleteOpen,
    itemToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeletePermission,
  } = usePermissionManagement({ canRead });

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner phản hồi */}
      <PermissionManagementHeader
        totalCount={permissions.length}
        moduleCount={Math.max(0, modules.length - 1)}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
      />

      {/* Toolbar Tìm kiếm & Lọc theo mục đối tượng & Nút thêm mới */}
      <PermissionManagementToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        modules={modules}
        selectedModule={selectedModule}
        onSelectModule={setSelectedModule}
        totalFiltered={filteredPermissions.length}
        onOpenCreate={openCreateModal}
        canCreate={canCreate}
      />

      {/* Bảng danh sách quyền hạn (Lọc theo mục đối tượng, không có nút ViewDetail) */}
      <PermissionManagementTable
        permissions={filteredPermissions}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      {/* Modal Thêm mới / Cập nhật quyền hạn */}
      <PermissionFormModal
        isOpen={isFormOpen}
        mode={formMode}
        item={itemToEdit}
        isSubmitting={isSubmitting}
        onClose={closeFormModal}
        onCreate={handleCreatePermission}
        onUpdate={handleUpdatePermission}
      />

      {/* Modal Xác nhận xóa quyền hạn */}
      <PermissionDeleteModal
        isOpen={isDeleteOpen}
        item={itemToDelete}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeletePermission}
      />
    </div>
  );
}
