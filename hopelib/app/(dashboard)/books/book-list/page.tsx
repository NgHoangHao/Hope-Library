"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  BookManagementHeader,
  BookFilterToolbar,
  BookManagementTable,
  BookPagination,
  BookManagementDetailModal,
  BookManagementFormModal,
  BookManagementDeleteModal,
  useBookManagement,
} from "@/features/book";

export default function BookListPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("BOOK_READ");
  const canCreate = hasPermission("BOOK_CREATE");
  const canUpdate = hasPermission("BOOK_UPDATE");
  const canDelete = hasPermission("BOOK_DELETE");

  const {
    books,
    page,
    size,
    total,
    totalPages,
    setPage,
    setSize,
    isLoading,
    authors,
    categories,
    authorMap,
    categoryMap,
    selectedAuthorId,
    selectedCategoryId,
    searchDraft,
    setSearchDraft,
    handleSearchClick,
    handleSearchClear,
    handleAuthorChange,
    handleCategoryChange,
    handleResetFilters,
    feedback,
    setFeedback,
    isDetailOpen,
    bookDetail,
    isLoadingDetail,
    openDetailModal,
    closeDetailModal,
    isCreateOpen,
    isCreating,
    openCreateModal,
    closeCreateModal,
    handleCreateBook,
    isEditOpen,
    bookToEdit,
    isLoadingEditDetail,
    isUpdating,
    openEditModal,
    closeEditModal,
    handleUpdateBook,
    isDeleteOpen,
    bookToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteBook,
  } = useBookManagement({ canRead });

  const hasActiveFilters =
    selectedAuthorId !== "ALL" ||
    selectedCategoryId !== "ALL" ||
    Boolean(searchDraft.trim());

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner phản hồi */}
      <BookManagementHeader
        totalCount={total}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
      />

      {/* Toolbar Tìm kiếm (nút Search) & Bộ lọc Tác giả/Thể loại (Combobox gọi API ngay) */}
      <BookFilterToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearchSubmit={handleSearchClick}
        onSearchClear={handleSearchClear}
        authors={authors}
        selectedAuthorId={selectedAuthorId}
        onAuthorChange={handleAuthorChange}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={handleCategoryChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        onOpenCreate={openCreateModal}
        canCreate={canCreate}
      />

      {/* Bảng danh sách sách */}
      <BookManagementTable
        books={books}
        isLoading={isLoading}
        authorMap={authorMap}
        categoryMap={categoryMap}
        onViewDetail={openDetailModal}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        canRead={canRead}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      {/* Phân trang */}
      <BookPagination
        page={page}
        size={size}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onSizeChange={setSize}
      />

      {/* Modal Chi tiết sách & Bản sao */}
      <BookManagementDetailModal
        isOpen={isDetailOpen}
        book={bookDetail}
        isLoading={isLoadingDetail}
        authorMap={authorMap}
        categoryMap={categoryMap}
        onClose={closeDetailModal}
        onEdit={openEditModal}
        canUpdate={canUpdate}
      />

      {/* Modal Thêm mới sách */}
      <BookManagementFormModal
        isOpen={isCreateOpen}
        mode="create"
        authors={authors}
        categories={categories}
        isSubmitting={isCreating}
        onClose={closeCreateModal}
        onSubmit={handleCreateBook}
      />

      {/* Modal Chỉnh sửa sách */}
      <BookManagementFormModal
        isOpen={isEditOpen}
        mode="edit"
        book={bookToEdit}
        isLoadingDetail={isLoadingEditDetail}
        authors={authors}
        categories={categories}
        isSubmitting={isUpdating}
        onClose={closeEditModal}
        onSubmit={(data) => {
          if (!bookToEdit) return Promise.resolve(false);
          return handleUpdateBook(bookToEdit.id, data);
        }}
      />

      {/* Modal Xác nhận xóa sách */}
      <BookManagementDeleteModal
        isOpen={isDeleteOpen}
        book={bookToDelete}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteBook}
      />
    </div>
  );
}
