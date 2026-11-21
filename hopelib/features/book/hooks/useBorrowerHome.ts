"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookEntity } from "../types/book.types";
import { getTopReturnedBooksApi, getBookByIdApi } from "../services/bookApi";
import { getAuthorsApi, Author } from "@/features/author";
import { getCategoriesApi, Category } from "@/features/category";
import { isSessionExpiredError } from "@/features/auth";

export interface UseBorrowerHomeReturn {
  topBooks: BookEntity[];
  isLoadingTopBooks: boolean;
  topBooksError: string | null;
  refreshTopBooks: () => Promise<void>;

  // Meta maps
  authorMap: Record<string, string>;
  categoryMap: Record<string, string>;

  // Search & Navigation
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleSearchSubmit: (e?: React.FormEvent) => void;
  handleViewAll: () => void;

  // Book Detail Modal
  isDetailOpen: boolean;
  selectedBookDetail: BookEntity | null;
  isLoadingDetail: boolean;
  handleSelectBook: (book: BookEntity) => Promise<void>;
  handleCloseDetail: () => void;
}

export function useBorrowerHome(): UseBorrowerHomeReturn {
  const router = useRouter();

  // Top returned books state
  const [topBooks, setTopBooks] = useState<BookEntity[]>([]);
  const [isLoadingTopBooks, setIsLoadingTopBooks] = useState<boolean>(true);
  const [topBooksError, setTopBooksError] = useState<string | null>(null);

  // Reference metadata
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedBookDetail, setSelectedBookDetail] = useState<BookEntity | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

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

  // Load authors & categories for meta mapping
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
          console.warn("[useBorrowerHome] Lỗi tải danh mục/tác giả:", err);
        }
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch top returned books
  const fetchTopReturnedBooks = useCallback(async () => {
    setIsLoadingTopBooks(true);
    setTopBooksError(null);
    try {
      const data = await getTopReturnedBooksApi(4);
      setTopBooks(data);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const message =
        err instanceof Error ? err.message : "Không thể tải danh sách sách mượn trả nhiều nhất";
      setTopBooksError(message);
    } finally {
      setIsLoadingTopBooks(false);
    }
  }, []);

  useEffect(() => {
    fetchTopReturnedBooks();
  }, [fetchTopReturnedBooks]);

  // Navigate to book UI on view all or search
  const handleViewAll = useCallback(() => {
    router.push("/books");
  }, [router]);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = searchQuery.trim();
      if (trimmed) {
        router.push(`/books?search=${encodeURIComponent(trimmed)}`);
      } else {
        router.push("/books");
      }
    },
    [router, searchQuery]
  );

  // View detail for book via GET /books/:id
  const handleSelectBook = useCallback(
    async (book: BookEntity) => {
      setIsDetailOpen(true);
      setIsLoadingDetail(true);

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
        console.warn("[useBorrowerHome] Lỗi lấy chi tiết sách:", err);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [authorMap, categoryMap]
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedBookDetail(null);
  }, []);

  return {
    topBooks,
    isLoadingTopBooks,
    topBooksError,
    refreshTopBooks: fetchTopReturnedBooks,
    authorMap,
    categoryMap,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    handleViewAll,
    isDetailOpen,
    selectedBookDetail,
    isLoadingDetail,
    handleSelectBook,
    handleCloseDetail,
  };
}
