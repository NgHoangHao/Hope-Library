"use client";

import React from "react";
import {
  PermissionMatrixHeader,
  PermissionMatrixToolbar,
  PermissionMatrixTable,
  PermissionSaveBar,
  usePermissionMatrix,
} from "@/features/permission";
import { usePermissions } from "@/features/auth";

export default function RolePermissionManagementPage() {
  const { hasPermission } = usePermissions();
  const canAssign = hasPermission("ROLE_PERMISSION_ASSIGN");

  // Custom hook quản lý toàn bộ nghiệp vụ dữ liệu ma trận, lọc và API
  const {
    roles,
    permissions,
    filteredPermissions,
    modules,
    selectedModule,
    setSelectedModule,
    searchTerm,
    setSearchTerm,
    hasPermissionInMatrix,
    toggleCell,
    toggleRow,
    toggleColumn,
    isRowFullyChecked,
    isColumnFullyChecked,
    isLoading,
    isSaving,
    addedDiff,
    removedDiff,
    hasChanges,
    handleSaveChanges,
    handleResetChanges,
    feedback,
    setFeedback,
  } = usePermissionMatrix({ canAssign });

  return (
    <div className="space-y-6 pb-24">
      {/* Header trang và thông báo */}
      <PermissionMatrixHeader
        totalPermissions={permissions.length}
        totalRoles={roles.length}
        canAssign={canAssign}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
      />

      {/* Thanh công cụ tìm kiếm và lọc theo Module */}
      <PermissionMatrixToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        modules={modules}
        selectedModule={selectedModule}
        onSelectModule={setSelectedModule}
        totalFiltered={filteredPermissions.length}
      />

      {/* Bảng Ma trận phân quyền (Permission Matrix Table) */}
      <PermissionMatrixTable
        roles={roles}
        permissions={filteredPermissions}
        hasPermissionInMatrix={hasPermissionInMatrix}
        onToggleCell={toggleCell}
        onToggleRow={toggleRow}
        onToggleColumn={toggleColumn}
        isRowFullyChecked={isRowFullyChecked}
        isColumnFullyChecked={isColumnFullyChecked}
        canAssign={canAssign}
        isLoading={isLoading}
      />

      {/* Thanh tác vụ cố định lưu thay đổi (Sticky Action Bar) */}
      <PermissionSaveBar
        hasChanges={hasChanges}
        addedCount={addedDiff.length}
        removedCount={removedDiff.length}
        isSaving={isSaving}
        canAssign={canAssign}
        onReset={handleResetChanges}
        onSave={handleSaveChanges}
      />
    </div>
  );
}
