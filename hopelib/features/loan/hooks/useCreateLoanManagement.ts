"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createLoanApi } from "../services/loanApi";
import {
  LoanStatus,
  SelectedBookCopyForLoan,
  SelectedBorrowerInfo,
  LoanDetailResponseData,
  LoanFeedback,
} from "../types/loan.types";
import {
  getBooksApi,
  getBookByIdApi,
  BookEntity,
  BookCopyItem,
} from "@/features/book";
import { isSessionExpiredError } from "@/features/auth";
import { useMaxLoanDays } from "./useMaxLoanDays";

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateString(baseDateStr: string, days: number): string {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const target = new Date(
    isNaN(base.getTime()) ? Date.now() : base.getTime()
  );
  target.setDate(target.getDate() + days);
  return formatDateInput(target);
}

export interface UseCreateLoanManagementOptions {
  canReadBooks?: boolean;
}

export function useCreateLoanManagement(
  options: UseCreateLoanManagementOptions = {}
) {
  const { canReadBooks = true } = options;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lấy thông tin độc giả đã chọn từ URL query parameters
  const initialUserId = searchParams.get("userId") || "";
  const [userId, setUserId] = useState<string>(initialUserId);

  const [borrowerInfo, setBorrowerInfo] = useState<SelectedBorrowerInfo>(() => ({
    userId: initialUserId,
    code: searchParams.get("code") || undefined,
    fullName: searchParams.get("fullName") || undefined,
    username: searchParams.get("username") || undefined,
    email: searchParams.get("email") || undefined,
    phone: searchParams.get("phone") || undefined,
    status: searchParams.get("status") || undefined,
    borrowedBooksCount: searchParams.get("borrowedBooksCount")
      ? Number(searchParams.get("borrowedBooksCount"))
      : undefined,
    expiredLoansCount: searchParams.get("expiredLoansCount")
      ? Number(searchParams.get("expiredLoansCount"))
      : undefined,
    totalFineAmount: searchParams.get("totalFineAmount")
      ? Number(searchParams.get("totalFineAmount"))
      : undefined,
  }));

  // Đồng bộ khi URL searchParams thay đổi
  useEffect(() => {
    const paramUserId = searchParams.get("userId") || "";
    if (paramUserId) {
      setUserId(paramUserId);
      setBorrowerInfo({
        userId: paramUserId,
        code: searchParams.get("code") || undefined,
        fullName: searchParams.get("fullName") || undefined,
        username: searchParams.get("username") || undefined,
        email: searchParams.get("email") || undefined,
        phone: searchParams.get("phone") || undefined,
        status: searchParams.get("status") || undefined,
        borrowedBooksCount: searchParams.get("borrowedBooksCount")
          ? Number(searchParams.get("borrowedBooksCount"))
          : undefined,
        expiredLoansCount: searchParams.get("expiredLoansCount")
          ? Number(searchParams.get("expiredLoansCount"))
          : undefined,
        totalFineAmount: searchParams.get("totalFineAmount")
          ? Number(searchParams.get("totalFineAmount"))
          : undefined,
      });
    }
  }, [searchParams]);

  // Cấu hình hạn trả sách mặc định (MAX_LOAN_DAYS)
  const { maxLoanDays, isLoading: isLoadingMaxLoanDays } = useMaxLoanDays();

  // Thông tin phiếu mượn
  const [loanDate, setLoanDate] = useState<string>(() =>
    formatDateInput(new Date())
  );
  const dueDate = addDaysToDateString(loanDate, maxLoanDays);
  const [loanStatus, setLoanStatus] = useState<LoanStatus>("BORROWED");
  const [notes, setNotes] = useState<string>("");

  // Danh sách bản sao sách được chọn để mượn (items)
  const [selectedItems, setSelectedItems] = useState<
    SelectedBookCopyForLoan[]
  >([]);
  const [manualBookCopyId, setManualBookCopyId] = useState<string>("");

  // Trạng thái tìm kiếm & chọn sách từ danh mục
  const [books, setBooks] = useState<BookEntity[]>([]);
  const [bookPage, setBookPage] = useState<number>(1);
  const [bookTotalPages, setBookTotalPages] = useState<number>(1);
  const [bookTotal, setBookTotal] = useState<number>(0);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [bookSearchDraft, setBookSearchDraft] = useState<string>("");
  const [activeBookSearch, setActiveBookSearch] = useState<string>("");

  // Sách đang mở để xem & chọn bản sao vật lý (copies)
  const [expandedBook, setExpandedBook] = useState<BookEntity | null>(null);
  const [isLoadingCopies, setIsLoadingCopies] = useState<boolean>(false);

  // Trạng thái submit POST /loans
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdLoan, setCreatedLoan] =
    useState<LoanDetailResponseData | null>(null);
  const [feedback, setFeedback] = useState<LoanFeedback | null>(null);

  /**
   * Tải danh sách đầu sách để thủ thư chọn bản sao
   */
  const fetchBooks = useCallback(
    async (pageNum: number, searchStr: string) => {
      if (!canReadBooks) {
        setBooks([]);
        setBookTotal(0);
        setBookTotalPages(1);
        setIsLoadingBooks(false);
        return;
      }
      setIsLoadingBooks(true);
      try {
        const res = await getBooksApi({
          page: pageNum,
          size: 6,
          search: searchStr.trim() || undefined,
        });
        setBooks(res.items || []);
        setBookPage(res.page || 1);
        setBookTotalPages(res.totalPages || 1);
        setBookTotal(res.total || 0);
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return;
      } finally {
        setIsLoadingBooks(false);
      }
    },
    [canReadBooks]
  );

  useEffect(() => {
    fetchBooks(bookPage, activeBookSearch);
  }, [fetchBooks, bookPage, activeBookSearch]);

  /**
   * Tìm kiếm sách khi bấm nút Tìm
   */
  const handleBookSearchSubmit = useCallback(() => {
    const trimmed = bookSearchDraft.trim();
    if (bookPage === 1 && trimmed === activeBookSearch) {
      fetchBooks(1, trimmed);
    } else {
      setBookPage(1);
      setActiveBookSearch(trimmed);
    }
  }, [bookSearchDraft, bookPage, activeBookSearch, fetchBooks]);

  const handleBookSearchClear = useCallback(() => {
    setBookSearchDraft("");
    if (bookPage === 1 && activeBookSearch === "") {
      fetchBooks(1, "");
    } else {
      setBookPage(1);
      setActiveBookSearch("");
    }
  }, [bookPage, activeBookSearch, fetchBooks]);

  /**
   * Mở chi tiết 1 cuốn sách để tải danh sách bản sao (copies) từ GET /books/:id
   */
  const handleInspectBookCopies = useCallback(async (book: BookEntity) => {
    setIsLoadingCopies(true);
    try {
      const detail = await getBookByIdApi(book.id);
      setExpandedBook(detail);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách bản sao của cuốn sách này.";
      setFeedback({
        type: "error",
        title: "Lỗi tải bản sao sách",
        message: msg,
      });
    } finally {
      setIsLoadingCopies(false);
    }
  }, []);

  /**
   * Chọn 1 bản sao sách từ cuốn sách đang mở thêm vào danh sách mượn
   */
  const handleSelectBookCopy = useCallback(
    (book: BookEntity, copy: BookCopyItem) => {
      const copyId = copy.id.trim();
      const exists = selectedItems.some((item) => item.bookCopyId === copyId);
      if (exists) {
        setFeedback({
          type: "info",
          title: "Bản sao đã được chọn",
          message: `Bản sao mã vạch "${copy.barcode}" đã có trong danh sách mượn.`,
        });
        return;
      }

      setSelectedItems((prev) => [
        ...prev,
        {
          bookCopyId: copyId,
          barcode: copy.barcode,
          shelfLocation: copy.shelfLocation,
          bookId: book.id,
          bookTitle: book.title,
          bookIsbn: book.isbn,
          bookUrl: book.bookUrl,
          status: "BORROWED",
        },
      ]);
    },
    [selectedItems]
  );

  /**
   * Thêm trực tiếp bằng mã UUID bookCopyId
   */
  const handleAddManualBookCopy = useCallback(() => {
    const trimmedId = manualBookCopyId.trim();
    if (!trimmedId) {
      setFeedback({
        type: "error",
        title: "Thiếu mã bản sao",
        message: "Vui lòng nhập mã định danh bản sao sách (bookCopyId).",
      });
      return;
    }

    const exists = selectedItems.some((item) => item.bookCopyId === trimmedId);
    if (exists) {
      setFeedback({
        type: "info",
        title: "Trùng mã bản sao",
        message: "Mã bản sao sách này đã có trong danh sách mượn.",
      });
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        bookCopyId: trimmedId,
        barcode: trimmedId.slice(0, 8).toUpperCase(),
        shelfLocation: "Nhập thủ công",
        bookTitle: `Bản sao ID: ${trimmedId}`,
        status: "BORROWED",
      },
    ]);
    setManualBookCopyId("");
  }, [manualBookCopyId, selectedItems]);

  /**
   * Xóa 1 bản sao khỏi danh sách mượn
   */
  const handleRemoveSelectedCopy = useCallback((bookCopyId: string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.bookCopyId !== bookCopyId)
    );
  }, []);

  /**
   * Gửi yêu cầu POST /loans tạo mới phiếu mượn
   */
  const handleSubmitCreateLoan = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const trimmedUserId = userId.trim();
      if (!trimmedUserId) {
        setFeedback({
          type: "error",
          title: "Thiếu người mượn",
          message: "Mã định danh độc giả (userId) không được để trống.",
        });
        return false;
      }

      const loanDateObj = loanDate
        ? new Date(`${loanDate}T00:00:00.000Z`)
        : new Date();

      if (selectedItems.length === 0) {
        setFeedback({
          type: "error",
          title: "Chưa chọn sách mượn",
          message:
            "Vui lòng chọn ít nhất 1 bản sao sách khả dụng vào phiếu mượn.",
        });
        return false;
      }

      setIsSubmitting(true);
      try {
        const result = await createLoanApi({
          userId: trimmedUserId,
          loanDate: loanDateObj.toISOString(),
          status: loanStatus,
          notes: notes.trim() || undefined,
          items: selectedItems.map((item) => ({
            bookCopyId: item.bookCopyId,
            status: item.status || "BORROWED",
          })),
        });

        setCreatedLoan(result);
        setSelectedItems([]);
        setNotes("");
        setFeedback({
          type: "success",
          title: "Tạo phiếu mượn thành công",
          message: `Đã tạo phiếu mượn mới thành công với ${result.items?.length || selectedItems.length} cuốn sách!`,
        });

        // Cập nhật lại danh sách sách & bản sao sau khi tạo phiếu
        fetchBooks(bookPage, activeBookSearch);
        if (expandedBook) {
          getBookByIdApi(expandedBook.id)
            .then((updatedBook) => setExpandedBook(updatedBook))
            .catch(() => {});
        }
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg =
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tạo phiếu mượn sách.";
        setFeedback({
          type: "error",
          title: "Tạo phiếu mượn thất bại",
          message: msg,
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      userId,
      loanDate,
      loanStatus,
      notes,
      selectedItems,
      fetchBooks,
      bookPage,
      activeBookSearch,
      expandedBook,
    ]
  );

  /**
   * Quay về danh sách độc giả (/users)
   */
  const handleBackToUsers = useCallback(() => {
    router.push("/users");
  }, [router]);

  return {
    // Borrower state
    userId,
    setUserId,
    borrowerInfo,

    // Loan form state
    loanDate,
    setLoanDate,
    dueDate,
    maxLoanDays,
    isLoadingMaxLoanDays,
    loanStatus,
    setLoanStatus,
    notes,
    setNotes,
    selectedItems,
    manualBookCopyId,
    setManualBookCopyId,

    // Book & copy catalog selector
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

    // Submission & Feedback
    isSubmitting,
    createdLoan,
    setCreatedLoan,
    feedback,
    setFeedback,

    // Handlers
    handleBookSearchSubmit,
    handleBookSearchClear,
    handleInspectBookCopies,
    handleSelectBookCopy,
    handleAddManualBookCopy,
    handleRemoveSelectedCopy,
    handleSubmitCreateLoan,
    handleBackToUsers,
  };
}
