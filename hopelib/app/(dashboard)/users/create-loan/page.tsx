"use client";

import React, { Suspense } from "react";
import { usePermissions } from "@/features/auth";
import {
  CreateLoanHeader,
  CreateLoanBorrowerCard,
  CreateLoanBookSelector,
  CreateLoanFormPanel,
  useCreateLoanManagement,
} from "@/features/loan";

function CreateLoanOrchestrator() {
  const { hasPermission } = usePermissions();
  const canCreateLoan = hasPermission("LOAN_CREATE");
  const canReadBooks = hasPermission("BOOK_READ");

  const {
    userId,
    setUserId,
    borrowerInfo,
    loanDate,
    setLoanDate,
    dueDate,
    setDueDate,
    loanStatus,
    setLoanStatus,
    notes,
    setNotes,
    selectedItems,
    manualBookCopyId,
    setManualBookCopyId,
    books,
    bookPage,
    setBookPage,
    bookTotalPages,
    bookTotal,
    isLoadingBooks,
    bookSearchDraft,
    setBookSearchDraft,
    expandedBook,
    setExpandedBook,
    isLoadingCopies,
    isSubmitting,
    createdLoan,
    feedback,
    setFeedback,
    handleBookSearchSubmit,
    handleBookSearchClear,
    handleInspectBookCopies,
    handleSelectBookCopy,
    handleAddManualBookCopy,
    handleRemoveSelectedCopy,
    handleQuickDueDate,
    handleSubmitCreateLoan,
    handleBackToUsers,
  } = useCreateLoanManagement({ canReadBooks });

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Nút quay lại */}
      <CreateLoanHeader
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
        onBack={handleBackToUsers}
      />

      {/* Thông tin độc giả đã chọn (userId) */}
      <CreateLoanBorrowerCard
        userId={userId}
        borrowerInfo={borrowerInfo}
        onUserIdChange={setUserId}
      />

      {/* Bố cục 2 cột: Chọn sách/bản sao & Form thiết lập phiếu mượn POST /loans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <CreateLoanBookSelector
            books={books}
            bookPage={bookPage}
            bookTotalPages={bookTotalPages}
            bookTotal={bookTotal}
            isLoadingBooks={isLoadingBooks}
            bookSearchDraft={bookSearchDraft}
            expandedBook={expandedBook}
            isLoadingCopies={isLoadingCopies}
            selectedItems={selectedItems}
            manualBookCopyId={manualBookCopyId}
            onBookSearchDraftChange={setBookSearchDraft}
            onBookSearchSubmit={handleBookSearchSubmit}
            onBookSearchClear={handleBookSearchClear}
            onBookPageChange={setBookPage}
            onInspectBookCopies={handleInspectBookCopies}
            onCloseExpandedBook={() => setExpandedBook(null)}
            onSelectBookCopy={handleSelectBookCopy}
            onManualBookCopyIdChange={setManualBookCopyId}
            onAddManualBookCopy={handleAddManualBookCopy}
          />
        </div>

        <div className="lg:col-span-5">
          <CreateLoanFormPanel
            loanDate={loanDate}
            dueDate={dueDate}
            loanStatus={loanStatus}
            notes={notes}
            selectedItems={selectedItems}
            isSubmitting={isSubmitting}
            canCreateLoan={canCreateLoan}
            createdLoan={createdLoan}
            onLoanDateChange={setLoanDate}
            onDueDateChange={setDueDate}
            onQuickDueDate={handleQuickDueDate}
            onLoanStatusChange={setLoanStatus}
            onNotesChange={setNotes}
            onRemoveSelectedCopy={handleRemoveSelectedCopy}
            onSubmit={handleSubmitCreateLoan}
            onBackToUsers={handleBackToUsers}
          />
        </div>
      </div>
    </div>
  );
}

export default function CreateLoanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-stone-500">
          Đang khởi tạo trang lập phiếu mượn...
        </div>
      }
    >
      <CreateLoanOrchestrator />
    </Suspense>
  );
}
