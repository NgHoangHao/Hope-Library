"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  AuthorHeader,
  AuthorToolbar,
  AuthorTable,
  AuthorDetailModal,
  AuthorCreateModal,
  AuthorDeleteModal,
  useAuthorManagement,
} from "@/features/author";

export default function AuthorsPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("AUTHOR_READ");
  const canCreate = hasPermission("AUTHOR_CREATE");
  const canUpdate = hasPermission("AUTHOR_UPDATE");
  const canDelete = hasPermission("AUTHOR_DELETE");

  const {
    authors,
    filteredAuthors,
    searchTerm,
    setSearchTerm,
    isLoading,
    feedback,
    setFeedback,
    isDetailOpen,
    authorDetail,
    isLoadingDetail,
    isUpdating,
    openDetailModal,
    closeDetailModal,
    handleUpdateAuthor,
    isCreateOpen,
    isCreating,
    openCreateModal,
    closeCreateModal,
    handleCreateAuthor,
    isDeleteOpen,
    authorToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteAuthor,
  } = useAuthorManagement({ canRead });

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner phản hồi */}
      <AuthorHeader
        totalCount={authors.length}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
      />

      {/* Toolbar tìm kiếm & Nút thêm mới */}
      <AuthorToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenCreate={openCreateModal}
        canCreate={canCreate}
        totalFiltered={filteredAuthors.length}
      />

      {/* Bảng danh sách tác giả với nút ViewDetail và Delete */}
      <AuthorTable
        authors={filteredAuthors}
        isLoading={isLoading}
        onViewDetail={openDetailModal}
        onDelete={openDeleteModal}
        canRead={canRead}
        canDelete={canDelete}
      />

      {/* Modal Chi tiết Tác giả kèm sách liên kết & nút Update */}
      <AuthorDetailModal
        isOpen={isDetailOpen}
        authorDetail={authorDetail}
        isLoading={isLoadingDetail}
        isUpdating={isUpdating}
        canUpdate={canUpdate}
        onClose={closeDetailModal}
        onUpdate={handleUpdateAuthor}
      />

      {/* Modal Thêm mới tác giả */}
      <AuthorCreateModal
        isOpen={isCreateOpen}
        isCreating={isCreating}
        onClose={closeCreateModal}
        onCreate={handleCreateAuthor}
      />

      {/* Modal Xác nhận xóa tác giả */}
      <AuthorDeleteModal
        isOpen={isDeleteOpen}
        author={authorToDelete}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAuthor}
      />
    </div>
  );
}
