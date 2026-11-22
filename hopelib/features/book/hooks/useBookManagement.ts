"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BookEntity,
  PaginatedBookData,
  BookFormData,
  BookManagementFeedback,
} from "../types/book.types";
import {
  getBooksApi,
  getBookByIdApi,
  createBookApi,
  updateBookApi,
  deleteBookApi,
} from "../services/bookApi";
import { getAuthorsApi, Author } from "@/features/author";
import { getCategoriesApi, Category } from "@/features/category";
import { isSessionExpiredError } from "@/features/auth";

export interface UseBookManagementProps {
  canRead?: boolean;
}

export interface UseBookManagementReturn {
  // Books list & pagination
  books: BookEntity[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  isLoading: boolean;
  refreshBooks: () => Promise<void>;

  // Filters & Search
  authors: Author[];
  categories: Category[];
  authorMap: Record<string, string>;
  categoryMap: Record<string, string>;
  selectedAuthorId: string;
  selectedCategoryId: string;
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  handleSearchClick: () => void;
  handleSearchClear: () => void;
  handleAuthorChange: (authorId: string) => void;
  handleCategoryChange: (categoryId: string) => void;
  handleResetFilters: () => void;

  // Feedback
  feedback: BookManagementFeedback | null;
  setFeedback: React.Dispatch<React.SetStateAction<BookManagementFeedback | null>>;

  // Detail Modal
  isDetailOpen: boolean;
  bookDetail: BookEntity | null;
  isLoadingDetail: boolean;
  openDetailModal: (id: string) => Promise<void>;
  closeDetailModal: () => void;

  // Create Modal
  isCreateOpen: boolean;
  isCreating: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  handleCreateBook: (formData: BookFormData) => Promise<boolean>;

  // Edit Modal
  isEditOpen: boolean;
  bookToEdit: BookEntity | null;
  isLoadingEditDetail: boolean;
  isUpdating: boolean;
  openEditModal: (book: BookEntity) => void;
  closeEditModal: () => void;
  handleUpdateBook: (id: string, formData: BookFormData) => Promise<boolean>;

  // Delete Modal
  isDeleteOpen: boolean;
  bookToDelete: BookEntity | null;
  isDeleting: boolean;
  openDeleteModal: (book: BookEntity) => void;
  closeDeleteModal: () => void;
  handleDeleteBook: () => Promise<boolean>;
}

export function useBookManagement({
  canRead = true,
}: UseBookManagementProps = {}): UseBookManagementReturn {
  // Pagination & Data
  const [booksData, setBooksData] = useState<PaginatedBookData>({
    items: [],
    page: 1,
    size: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Author and Category lists for filter & lookup
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter & Search states
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchDraft, setSearchDraft] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  // Feedback notification
  const [feedback, setFeedback] = useState<BookManagementFeedback | null>(null);

  // Detail modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [bookDetail, setBookDetail] = useState<BookEntity | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<BookEntity | null>(null);
  const [isLoadingEditDetail, setIsLoadingEditDetail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<BookEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Authors and Categories once on mount
  useEffect(() => {
    let isMounted = true;
    async function initMetadata() {
      try {
        const [authorsRes, categoriesRes] = await Promise.allSettled([
          getAuthorsApi(),
          getCategoriesApi(),
        ]);

        if (!isMounted) return;

        if (authorsRes.status === "fulfilled") {
          setAuthors(authorsRes.value);
        }
        if (categoriesRes.status === "fulfilled") {
          setCategories(categoriesRes.value);
        }
      } catch {
        // Silently continue, fallback to ID display
      }
    }

    initMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick lookup maps: authorId -> name, categoryId -> name
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

  // Load books when page, size, filters or activeSearch changes
  useEffect(() => {
    let isMounted = true;

    async function loadBooks() {
      if (!canRead) {
        if (isMounted) {
          setBooksData({
            items: [],
            page: 1,
            size,
            total: 0,
            totalPages: 1,
          });
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getBooksApi({
          page,
          size,
          search: activeSearch,
          categoryId: selectedCategoryId === "ALL" ? undefined : selectedCategoryId,
          authorId: selectedAuthorId === "ALL" ? undefined : selectedAuthorId,
        });

        if (!isMounted) return;
        setBooksData(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách sách";
        setFeedback({ type: "error", message: msg });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      isMounted = false;
    };
  }, [canRead, page, size, selectedCategoryId, selectedAuthorId, activeSearch]);

  // Manual refresh callback
  const refreshBooks = useCallback(async () => {
    if (!canRead) return;
    try {
      setIsLoading(true);
      const data = await getBooksApi({
        page,
        size,
        search: activeSearch,
        categoryId: selectedCategoryId === "ALL" ? undefined : selectedCategoryId,
        authorId: selectedAuthorId === "ALL" ? undefined : selectedAuthorId,
      });
      setBooksData(data);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi làm mới danh sách sách";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [canRead, page, size, activeSearch, selectedCategoryId, selectedAuthorId]);

  // Search actions: only triggers API on button click or explicit trigger
  const handleSearchClick = useCallback(() => {
    setIsLoading(true);
    setPage(1);
    setActiveSearch(searchDraft.trim());
  }, [searchDraft]);

  const handleSearchClear = useCallback(() => {
    setSearchDraft("");
    setIsLoading(true);
    setPage(1);
    setActiveSearch("");
  }, []);

  // Filter actions: triggers API immediately on selection change
  const handleAuthorChange = useCallback((authorId: string) => {
    setIsLoading(true);
    setPage(1);
    setSelectedAuthorId(authorId);
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setIsLoading(true);
    setPage(1);
    setSelectedCategoryId(categoryId);
  }, []);

  const handleResetFilters = useCallback(() => {
    setIsLoading(true);
    setSearchDraft("");
    setActiveSearch("");
    setSelectedAuthorId("ALL");
    setSelectedCategoryId("ALL");
    setPage(1);
  }, []);

  // Detail Modal Actions
  const openDetailModal = useCallback(async (id: string) => {
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    setBookDetail(null);

    try {
      const detail = await getBookByIdApi(id);
      setBookDetail(detail);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi tải chi tiết cuốn sách";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailOpen(false);
    setBookDetail(null);
  }, []);

  // Create Modal Actions
  const openCreateModal = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateOpen(false);
  }, []);

  const handleCreateBook = useCallback(
    async (formData: BookFormData): Promise<boolean> => {
      try {
        setIsCreating(true);

        const data = new FormData();
        data.append("title", formData.title.trim());
        if (formData.isbn?.trim()) data.append("isbn", formData.isbn.trim());
        if (formData.authorId?.trim()) data.append("authorId", formData.authorId.trim());
        if (formData.categoryId?.trim()) data.append("categoryId", formData.categoryId.trim());
        if (formData.publisher?.trim()) data.append("publisher", formData.publisher.trim());
        if (formData.publicationYear !== undefined && formData.publicationYear !== "") {
          data.append("publicationYear", String(formData.publicationYear));
        }
        if (formData.edition?.trim()) data.append("edition", formData.edition.trim());
        if (formData.description?.trim()) data.append("description", formData.description.trim());
        if (formData.image) data.append("image", formData.image);
        if (formData.pdf) data.append("pdf", formData.pdf);

        // Book copies handling (support multiple copies or single initial copy)
        if (formData.copies && formData.copies.length > 0) {
          const validCopies = formData.copies
            .filter((c) => c.barcode && c.barcode.trim())
            .map((c) => ({
              barcode: c.barcode.trim(),
              shelfLocation: c.shelfLocation?.trim() || undefined,
            }));

          if (validCopies.length > 0) {
            data.append("copies", JSON.stringify(validCopies));
          }
        } else if (formData.initialBarcode?.trim()) {
          const initialCopies = [
            {
              barcode: formData.initialBarcode.trim(),
              shelfLocation: formData.initialShelfLocation?.trim() || undefined,
            },
          ];
          data.append("copies", JSON.stringify(initialCopies));
        }

        const newBook = await createBookApi(data);
        setFeedback({
          type: "success",
          message: `Thêm mới sách "${newBook.title}" thành công!`,
        });
        setIsCreateOpen(false);
        refreshBooks();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Thêm mới sách thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    [refreshBooks]
  );

  // Edit Modal Actions
  const openEditModal = useCallback(async (book: BookEntity) => {
    setBookToEdit(book);
    setIsEditOpen(true);
    setIsLoadingEditDetail(true);

    try {
      const detail = await getBookByIdApi(book.id);
      setBookToEdit((current) => (current && current.id === book.id ? detail : current));
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách bản sao của sách";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoadingEditDetail(false);
    }
  }, []);

  const closeEditModal = useCallback(() => {
    setBookToEdit(null);
    setIsLoadingEditDetail(false);
    setIsEditOpen(false);
  }, []);

  const handleUpdateBook = useCallback(
    async (id: string, formData: BookFormData): Promise<boolean> => {
      try {
        setIsUpdating(true);

        const data = new FormData();
        if (formData.title?.trim()) data.append("title", formData.title.trim());
        if (formData.isbn !== undefined) data.append("isbn", formData.isbn.trim());
        if (formData.authorId !== undefined) data.append("authorId", formData.authorId.trim());
        if (formData.categoryId !== undefined) data.append("categoryId", formData.categoryId.trim());
        if (formData.publisher !== undefined) data.append("publisher", formData.publisher.trim());
        if (formData.publicationYear !== undefined && formData.publicationYear !== "") {
          data.append("publicationYear", String(formData.publicationYear));
        }
        if (formData.edition !== undefined) data.append("edition", formData.edition.trim());
        if (formData.description !== undefined) data.append("description", formData.description.trim());
        if (formData.status !== undefined) data.append("status", formData.status);
        if (formData.image) data.append("image", formData.image);
        if (formData.pdf) data.append("pdf", formData.pdf);

        if (formData.copies !== undefined) {
          const copiesPayload = formData.copies
            .filter((c) => c.barcode && c.barcode.trim())
            .map((c) => ({
              ...(c.id ? { id: c.id } : {}),
              barcode: c.barcode.trim(),
              shelfLocation: c.shelfLocation?.trim() ?? "",
              ...(c.status ? { status: c.status } : {}),
            }));
          data.append("copies", JSON.stringify(copiesPayload));
        }

        const updated = await updateBookApi(id, data);

        // Update in current detail if open
        setBookDetail((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));

        setFeedback({
          type: "success",
          message: `Cập nhật sách "${updated.title}" thành công!`,
        });
        setIsEditOpen(false);
        setBookToEdit(null);
        refreshBooks();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Cập nhật sách thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [refreshBooks]
  );

  // Delete Modal Actions
  const openDeleteModal = useCallback((book: BookEntity) => {
    setBookToDelete(book);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setBookToDelete(null);
    setIsDeleteOpen(false);
  }, []);

  const handleDeleteBook = useCallback(async (): Promise<boolean> => {
    if (!bookToDelete) return false;

    try {
      setIsDeleting(true);
      await deleteBookApi(bookToDelete.id);

      if (bookDetail && bookDetail.id === bookToDelete.id) {
        closeDetailModal();
      }

      setFeedback({
        type: "success",
        message: `Đã xóa sách "${bookToDelete.title}" thành công!`,
      });
      setIsDeleteOpen(false);
      setBookToDelete(null);
      refreshBooks();
      return true;
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return false;
      const msg = err instanceof Error ? err.message : "Xóa sách thất bại";
      setFeedback({ type: "error", message: msg });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [bookToDelete, bookDetail, closeDetailModal, refreshBooks]);

  return {
    books: booksData.items,
    page: booksData.page,
    size: booksData.size,
    total: booksData.total,
    totalPages: booksData.totalPages,
    setPage,
    setSize,
    isLoading,
    refreshBooks,
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
  };
}
