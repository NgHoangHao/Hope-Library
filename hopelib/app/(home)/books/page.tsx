"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Home, BookOpen, ShoppingBag } from "lucide-react";
import {
  BorrowerBookCatalogToolbar,
  BorrowerBookCatalogGrid,
  BorrowerBookDetailModal,
  BorrowerReserveCartBar,
  BorrowerReserveCartDrawer,
  BookPagination,
  useBorrowerBooks,
} from "@/features/book";
import { useBorrowerHomeGuard } from "@/features/auth";

function BorrowerBooksContent() {
  const {
    books,
    page,
    size,
    total,
    totalPages,
    isLoading,
    searchDraft,
    setSearchDraft,
    submittedSearch,
    handleSearchSubmit,
    handleSearchClear,
    selectedCategoryId,
    handleCategoryChange,
    categories,
    selectedAuthorId,
    handleAuthorChange,
    authors,
    authorMap,
    categoryMap,
    handleResetFilters,
    handlePageChange,
    handleSizeChange,
    isDetailOpen,
    selectedBookDetail,
    isLoadingDetail,
    handleSelectBook,
    handleCloseDetail,
    isReserving,
    reserveError,
    reserveSuccessMessage,
    handleReserveBook,
    cartItems,
    maxCartItems,
    reservationExpirationHours,
    cartCopyIdSet,
    cartCountByBookId,
    isCartOpen,
    handleOpenCart,
    handleCloseCart,
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleSubmitCartReservation,
  } = useBorrowerBooks();

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
          <span className="text-[#B8860B] font-semibold">Tủ sách Thư viện</span>
        </nav>

        {/* Page Title & Subtitle + Reservation Cart Trigger */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[#B8860B] font-semibold text-xs tracking-[0.2em] uppercase">
                KHO TÀNG TRI THỨC
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#1A1A1A]">
              Tủ sách Thư viện
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Tra cứu, thêm nhiều đầu sách vào giỏ đặt mượn và tạo chung trong 1 phiếu giữ chỗ.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCart}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold shadow-xs self-start sm:self-auto cursor-pointer shrink-0"
          >
            <ShoppingBag aria-hidden="true" className="w-4 h-4 text-[#F5B82E]" />
            <span>Giỏ đặt mượn</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F5B82E] text-[#1A1A1A] text-xs font-bold">
              {cartItems.length}/{maxCartItems}
            </span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <BorrowerBookCatalogToolbar
          searchDraft={searchDraft}
          onSearchDraftChange={setSearchDraft}
          onSearchSubmit={handleSearchSubmit}
          onSearchClear={handleSearchClear}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          selectedAuthorId={selectedAuthorId}
          onAuthorChange={handleAuthorChange}
          authors={authors}
          onResetFilters={handleResetFilters}
          total={total}
        />

        {/* Book Grid */}
        <BorrowerBookCatalogGrid
          books={books}
          isLoading={isLoading}
          onSelectBook={handleSelectBook}
          onResetFilters={handleResetFilters}
          searchQuery={submittedSearch}
          authorMap={authorMap}
          categoryMap={categoryMap}
          cartCountByBookId={cartCountByBookId}
        />

        {/* Pagination */}
        <div className="mt-8 pt-4 border-t border-neutral-200/80">
          <BookPagination
            page={page}
            size={size}
            total={total}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onSizeChange={handleSizeChange}
          />
        </div>

        {/* Book Detail Modal (fetched via /books/:id & reserve via POST /loans/reserve) */}
        <BorrowerBookDetailModal
          isOpen={isDetailOpen}
          book={selectedBookDetail}
          isLoading={isLoadingDetail}
          onClose={handleCloseDetail}
          authorMap={authorMap}
          categoryMap={categoryMap}
          isReserving={isReserving}
          reserveError={reserveError}
          reserveSuccessMessage={reserveSuccessMessage}
          onReserveBook={handleReserveBook}
          cartCopyIdSet={cartCopyIdSet}
          cartCount={cartItems.length}
          maxCartItems={maxCartItems}
          reservationExpirationHours={reservationExpirationHours}
          onAddToCart={handleAddToCart}
          onOpenCart={handleOpenCart}
        />

        {/* Floating Multi-Book Reservation Cart Bar */}
        <BorrowerReserveCartBar
          items={cartItems}
          maxCartItems={maxCartItems}
          onOpenCart={handleOpenCart}
        />

        {/* Slide-over Multi-Book Reservation Cart Drawer */}
        <BorrowerReserveCartDrawer
          isOpen={isCartOpen}
          items={cartItems}
          maxCartItems={maxCartItems}
          reservationExpirationHours={reservationExpirationHours}
          isSubmitting={isReserving}
          error={reserveError}
          successMessage={reserveSuccessMessage}
          onClose={handleCloseCart}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onSubmitReservation={handleSubmitCartReservation}
        />
      </div>
    </div>
  );
}

export default function BorrowerBooksPage() {
  const { isAuthorized, isLoading: isGuardLoading } = useBorrowerHomeGuard();

  if (isGuardLoading || !isAuthorized) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#F5B82E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[500px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#F5B82E] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BorrowerBooksContent />
    </Suspense>
  );
}
