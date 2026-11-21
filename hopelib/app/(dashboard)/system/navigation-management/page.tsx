"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  NavigationManagementHeader,
  NavigationManagementToolbar,
  NavigationManagementTreeTable,
  NavigationFormModal,
  NavigationDeleteModal,
  useNavigationManagement,
} from "@/features/navigation";

export default function NavigationManagementPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("NAVIGATION_READ");
  const canCreate = hasPermission("NAVIGATION_CREATE");
  const canUpdate = hasPermission("NAVIGATION_UPDATE");
  const canDelete = hasPermission("NAVIGATION_DELETE");

  const {
    flatNavigations,
    treeData,
    filteredTree,
    isLoading,
    searchDraft,
    setSearchDraft,
    activeSearch,
    handleSearchClick,
    handleSearchClear,
    matchingNodeIds,
    expandedNodeIds,
    toggleExpand,
    handleExpandAll,
    handleCollapseAll,
    feedback,
    setFeedback,
    isFormOpen,
    formMode,
    itemToEdit,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeFormModal,
    handleCreateNavigation,
    handleUpdateNavigation,
    isDeleteOpen,
    itemToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteNavigation,
    getParentDropdownOptions,
  } = useNavigationManagement({ canRead });

  // Danh sách menu hợp lệ cho dropdown cha (loại trừ chính nó và con cháu của nó khi sửa)
  const parentOptions = getParentDropdownOptions(itemToEdit?.id);

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner phản hồi */}
      <NavigationManagementHeader
        totalCount={flatNavigations.length}
        rootCount={treeData.length}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
      />

      {/* Toolbar Tìm kiếm trên FE (nút Search) & Mở rộng/Thu gọn & Thêm mới */}
      <NavigationManagementToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearchSubmit={handleSearchClick}
        onSearchClear={handleSearchClear}
        activeSearch={activeSearch}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onOpenCreate={() => openCreateModal(null)}
        canCreate={canCreate}
      />

      {/* Bảng dạng cây phân cấp (Tree Table) dựng từ mảng phẳng trên FE */}
      <NavigationManagementTreeTable
        tree={filteredTree}
        isLoading={isLoading}
        expandedNodeIds={expandedNodeIds}
        onToggleExpand={toggleExpand}
        matchingNodeIds={matchingNodeIds}
        activeSearch={activeSearch}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onAddChild={(parentId) => openCreateModal(parentId)}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      {/* Modal Thêm mới / Cập nhật Menu điều hướng */}
      <NavigationFormModal
        isOpen={isFormOpen}
        mode={formMode}
        item={itemToEdit}
        parentOptions={parentOptions}
        isSubmitting={isSubmitting}
        onClose={closeFormModal}
        onCreate={handleCreateNavigation}
        onUpdate={handleUpdateNavigation}
      />

      {/* Modal Xác nhận xóa Menu điều hướng */}
      <NavigationDeleteModal
        isOpen={isDeleteOpen}
        item={itemToDelete}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteNavigation}
      />
    </div>
  );
}
