"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  CategoryHeader,
  CategoryToolbar,
  CategoryTable,
  CategoryDetailModal,
  CategoryCreateModal,
  CategoryDeleteModal,
  useCategoryManagement,
} from "@/features/category";

export default function CategoriesPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("CATEGORY_READ");
  const canCreate = hasPermission("CATEGORY_CREATE");
  const canUpdate = hasPermission("CATEGORY_UPDATE");
  const canDelete = hasPermission("CATEGORY_DELETE");

  const {
    categories,
    filteredCategories,
    searchTerm,
    setSearchTerm,
    isLoading,
    feedback,
    setFeedback,
    isDetailOpen,
    categoryDetail,
    isLoadingDetail,
    isUpdating,
    openDetailModal,
    closeDetailModal,
    handleUpdateCategory,
    isCreateOpen,
    isCreating,
    openCreateModal,
    closeCreateModal,
    handleCreateCategory,
    isDeleteOpen,
    categoryToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteCategory,
  } = useCategoryManagement({ canRead });

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner phản hồi */}
      <CategoryHeader
        totalCount={categories.length}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
      />

      {/* Toolbar tìm kiếm & Nút thêm mới */}
      <CategoryToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenCreate={openCreateModal}
        canCreate={canCreate}
        totalFiltered={filteredCategories.length}
      />

      {/* Bảng danh sách thể loại với nút ViewDetail và Delete */}
      <CategoryTable
        categories={filteredCategories}
        isLoading={isLoading}
        onViewDetail={openDetailModal}
        onDelete={openDeleteModal}
        canRead={canRead}
        canDelete={canDelete}
      />

      {/* Modal Chi tiết Thể loại kèm sách liên kết & nút Update */}
      <CategoryDetailModal
        isOpen={isDetailOpen}
        categoryDetail={categoryDetail}
        isLoading={isLoadingDetail}
        isUpdating={isUpdating}
        canUpdate={canUpdate}
        onClose={closeDetailModal}
        onUpdate={handleUpdateCategory}
      />

      {/* Modal Thêm mới thể loại */}
      <CategoryCreateModal
        isOpen={isCreateOpen}
        isCreating={isCreating}
        onClose={closeCreateModal}
        onCreate={handleCreateCategory}
      />

      {/* Modal Xác nhận xóa thể loại */}
      <CategoryDeleteModal
        isOpen={isDeleteOpen}
        category={categoryToDelete}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
