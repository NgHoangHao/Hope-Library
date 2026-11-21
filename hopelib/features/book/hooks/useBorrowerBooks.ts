"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookEntity,
  ReservationCartItem,
  MAX_RESERVATION_CART_ITEMS,
} from "../types/book.types";
import { getBooksApi, getBookByIdApi } from "../services/bookApi";
import { getCategoriesApi, Category } from "@/features/category";
import { getAuthorsApi, Author } from "@/features/author";
import { isSessionExpiredError } from "@/features/auth";
import { reserveBooksApi } from "@/features/loan";
import { showToast } from "@/components/ui";

export interface UseBorrowerBooksReturn {
  // Books data & pagination
  books: BookEntity[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refreshBooks: () => Promise<void>;

  // Filters
  searchDraft: string;
  setSearchDraft: (val: string) => void;
  submittedSearch: string;
  handleSearchSubmit: (e?: React.FormEvent) => void;
  handleSearchClear: () => void;
  selectedCategoryId: string;
  handleCategoryChange: (catId: string) => void;
  categories: Category[];
  selectedAuthorId: string;
  handleAuthorChange: (authorId: string) => void;
  authors: Author[];
  authorMap: Record<string, string>;
  categoryMap: Record<string, string>;
  handleResetFilters: () => void;
  handlePageChange: (newPage: number) => void;
  handleSizeChange: (newSize: number) => void;

  // Book Detail Modal
  isDetailOpen: boolean;
  selectedBookDetail: BookEntity | null;
  isLoadingDetail: boolean;
  handleSelectBook: (book: BookEntity) => Promise<void>;
  handleCloseDetail: () => void;

  // Book Reservation (POST /loans/reserve)
  isReserving: boolean;
  reserveError: string | null;
  reserveSuccessMessage: string | null;
  handleReserveBook: (bookCopyIds: string[], notes?: string) => Promise<boolean>;
  clearReserveFeedback: () => void;

  // Multi-book Reservation Cart (1 loan -> multiple copies across different books)
  cartItems: ReservationCartItem[];
  cartCopyIdSet: Set<string>;
  cartCountByBookId: Record<string, number>;
  isCartOpen: boolean;
  handleOpenCart: () => void;
  handleCloseCart: () => void;
  handleAddToCart: (items: ReservationCartItem[]) => void;
  handleRemoveFromCart: (bookCopyId: string) => void;
  handleClearCart: () => void;
  handleSubmitCartReservation: (notes?: string) => Promise<boolean>;
}

export function useBorrowerBooks(): UseBorrowerBooksReturn {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  // Pagination & Books State
  const [books, setBooks] = useState<BookEntity[]>([]);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchDraft, setSearchDraft] = useState<string>(initialSearch);
  const [submittedSearch, setSubmittedSearch] = useState<string>(initialSearch);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("ALL");

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedBookDetail, setSelectedBookDetail] = useState<BookEntity | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Reservation state
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [reserveSuccessMessage, setReserveSuccessMessage] = useState<string | null>(null);

  // Multi-book Reservation Cart state (persisted in sessionStorage)
  const [cartItems, setCartItems] = useState<ReservationCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("hope_reserve_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartItems(parsed.slice(0, MAX_RESERVATION_CART_ITEMS));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("hope_reserve_cart", JSON.stringify(cartItems));
    } catch {
      // ignore storage errors
    }
  }, [cartItems]);

  const cartCopyIdSet = useMemo(
    () => new Set(cartItems.map((i) => i.bookCopyId)),
    [cartItems]
  );

  const cartCountByBookId = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach((item) => {
      map[item.bookId] = (map[item.bookId] || 0) + 1;
    });
    return map;
  }, [cartItems]);

  // Author and Category fast lookup maps
  const authorMap = useMemo(() => {
    const map: Record<string, string> = {};
    authors.forEach((a) => {
      map[a.id] = a.name;
    });
    return map;
  }, [authors]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Load Categories & Authors for filter dropdowns on mount
  useEffect(() => {
    let isMounted = true;

    async function loadMeta() {
      try {
        const [cats, auths] = await Promise.allSettled([
          getCategoriesApi(),
          getAuthorsApi(),
        ]);
        if (isMounted) {
          if (cats.status === "fulfilled") setCategories(cats.value);
          if (auths.status === "fulfilled") setAuthors(auths.value);
        }
      } catch (err) {
        if (!isSessionExpiredError(err)) {
          console.warn("[useBorrowerBooks] Lỗi tải danh mục/tác giả:", err);
        }
      }
    }

    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch paginated books from GET /books
  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBooksApi({
        page,
        size,
        search: submittedSearch.trim() || undefined,
        categoryId: selectedCategoryId !== "ALL" ? selectedCategoryId : undefined,
        authorId: selectedAuthorId !== "ALL" ? selectedAuthorId : undefined,
      });

      setBooks(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const message =
        err instanceof Error ? err.message : "Không thể tải danh sách sách từ máy chủ";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, submittedSearch, selectedCategoryId, selectedAuthorId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Handlers for search & filters
  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setSubmittedSearch(searchDraft.trim());
      setPage(1);
    },
    [searchDraft]
  );

  const handleSearchClear = useCallback(() => {
    setSearchDraft("");
    setSubmittedSearch("");
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((catId: string) => {
    setSelectedCategoryId(catId);
    setPage(1);
  }, []);

  const handleAuthorChange = useCallback((authorId: string) => {
    setSelectedAuthorId(authorId);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchDraft("");
    setSubmittedSearch("");
    setSelectedCategoryId("ALL");
    setSelectedAuthorId("ALL");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleSizeChange = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(1);
  }, []);

  // Detail Modal handler calling GET /books/:id
  const handleSelectBook = useCallback(
    async (book: BookEntity) => {
      setIsDetailOpen(true);
      setIsLoadingDetail(true);
      setReserveError(null);
      setReserveSuccessMessage(null);

      // Optimistic preliminary data enriched with lookup maps
      const preliminary: BookEntity = {
        ...book,
        author: book.author || (book.authorId && authorMap[book.authorId] ? { id: book.authorId, name: authorMap[book.authorId] } : null),
        category: book.category || (book.categoryId && categoryMap[book.categoryId] ? { id: book.categoryId, name: categoryMap[book.categoryId] } : null),
      };
      setSelectedBookDetail(preliminary);

      try {
        const detail = await getBookByIdApi(book.id);
        const enriched: BookEntity = {
          ...detail,
          author: detail.author || (detail.authorId && authorMap[detail.authorId] ? { id: detail.authorId, name: authorMap[detail.authorId] } : null),
          category: detail.category || (detail.categoryId && categoryMap[detail.categoryId] ? { id: detail.categoryId, name: categoryMap[detail.categoryId] } : null),
        };
        setSelectedBookDetail(enriched);
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return;
        console.warn("[useBorrowerBooks] Lỗi lấy chi tiết sách:", err);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [authorMap, categoryMap]
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedBookDetail(null);
    setReserveError(null);
    setReserveSuccessMessage(null);
  }, []);

  const clearReserveFeedback = useCallback(() => {
    setReserveError(null);
    setReserveSuccessMessage(null);
  }, []);

  // Đặt mượn giữ chỗ sách qua POST /loans/reserve
  const handleReserveBook = useCallback(
    async (bookCopyIds: string[], notes?: string): Promise<boolean> => {
      if (!bookCopyIds || bookCopyIds.length === 0) {
        const msg = "Vui lòng chọn ít nhất 1 bản sao sách khả dụng để đặt mượn.";
        setReserveError(msg);
        return false;
      }

      setIsReserving(true);
      setReserveError(null);
      setReserveSuccessMessage(null);

      try {
        await reserveBooksApi({ bookCopyIds, notes });
        const successMsg =
          "Đặt mượn giữ chỗ sách thành công! Vui lòng tới quầy thư viện nhận sách trong vòng 48 giờ.";
        setReserveSuccessMessage(successMsg);
        showToast({
          type: "success",
          title: "Đặt mượn thành công",
          message: successMsg,
        });

        // Làm mới chi tiết sách hiện tại và danh sách tủ sách
        if (selectedBookDetail?.id) {
          try {
            const freshDetail = await getBookByIdApi(selectedBookDetail.id);
            const enriched: BookEntity = {
              ...freshDetail,
              author:
                freshDetail.author ||
                (freshDetail.authorId && authorMap[freshDetail.authorId]
                  ? { id: freshDetail.authorId, name: authorMap[freshDetail.authorId] }
                  : null),
              category:
                freshDetail.category ||
                (freshDetail.categoryId && categoryMap[freshDetail.categoryId]
                  ? { id: freshDetail.categoryId, name: categoryMap[freshDetail.categoryId] }
                  : null),
            };
            setSelectedBookDetail(enriched);
          } catch {
            // ignore refresh error
          }
        }
        await fetchBooks();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const message =
          err instanceof Error
            ? err.message
            : "Không thể đặt mượn sách. Vui lòng thử lại sau.";
        setReserveError(message);
        showToast({
          type: "error",
          title: "Đặt mượn thất bại",
          message,
        });
        return false;
      } finally {
        setIsReserving(false);
      }
    },
    [selectedBookDetail, authorMap, categoryMap, fetchBooks]
  );

  const handleOpenCart = useCallback(() => {
    setReserveError(null);
    setReserveSuccessMessage(null);
    setIsCartOpen(true);
  }, []);

  const handleCloseCart = useCallback(() => {
    if (isReserving) return;
    setIsCartOpen(false);
    setReserveError(null);
    setReserveSuccessMessage(null);
  }, [isReserving]);

  const handleAddToCart = useCallback(
    (newItems: ReservationCartItem[]) => {
      if (!newItems || newItems.length === 0) return;

      const existingIds = new Set(cartItems.map((i) => i.bookCopyId));
      const uniqueNew = newItems.filter((i) => !existingIds.has(i.bookCopyId));

      if (uniqueNew.length === 0) {
        showToast({
          type: "info",
          title: "Đã có trong giỏ",
          message: "Các bản sao này đã nằm trong giỏ đặt mượn của bạn.",
        });
        return;
      }

      const remainingSlots = MAX_RESERVATION_CART_ITEMS - cartItems.length;
      if (remainingSlots <= 0) {
        showToast({
          type: "warning",
          title: "Giỏ đặt mượn đã đầy",
          message: `Mỗi phiếu đặt mượn chỉ tối đa ${MAX_RESERVATION_CART_ITEMS} bản sách.`,
        });
        return;
      }

      const itemsToAdd = uniqueNew.slice(0, remainingSlots);
      const next = [...cartItems, ...itemsToAdd];
      setCartItems(next);

      if (itemsToAdd.length < uniqueNew.length) {
        showToast({
          type: "warning",
          title: "Đã đạt giới hạn 3 sách",
          message: `Đã thêm ${itemsToAdd.length} bản vào giỏ (${next.length}/${MAX_RESERVATION_CART_ITEMS}).`,
        });
      } else {
        showToast({
          type: "success",
          title: "Đã thêm vào giỏ đặt mượn",
          message: `Đã thêm ${itemsToAdd.length} bản sao (${next.length}/${MAX_RESERVATION_CART_ITEMS} sách). Bạn có thể chọn thêm đầu sách khác hoặc bấm Đặt mượn ngay.`,
        });
      }
    },
    [cartItems]
  );

  const handleRemoveFromCart = useCallback((bookCopyId: string) => {
    setCartItems((prev) => prev.filter((item) => item.bookCopyId !== bookCopyId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setReserveError(null);
  }, []);

  const handleSubmitCartReservation = useCallback(
    async (notes?: string): Promise<boolean> => {
      if (cartItems.length === 0) {
        setReserveError("Giỏ đặt mượn đang trống.");
        return false;
      }
      const copyIds = cartItems.map((i) => i.bookCopyId);
      const ok = await handleReserveBook(copyIds, notes);
      if (ok) {
        setCartItems([]);
      }
      return ok;
    },
    [cartItems, handleReserveBook]
  );

  return {
    books,
    page,
    size,
    total,
    totalPages,
    isLoading,
    error,
    refreshBooks: fetchBooks,
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
    clearReserveFeedback,
    cartItems,
    cartCopyIdSet,
    cartCountByBookId,
    isCartOpen,
    handleOpenCart,
    handleCloseCart,
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleSubmitCartReservation,
  };
}
