"use client";

import { useState, useEffect, useCallback } from "react";
import { isSessionExpiredError } from "@/features/auth";
import { getMyRemainingBorrowBooksApi } from "../services/loanApi";
import { RemainingBorrowBooksData } from "../types/loan.types";

export const BORROW_QUOTA_UPDATED_EVENT = "hope_borrow_quota_updated";

/**
 * Phát sự kiện để các widget hiển thị hạn mức mượn sách tự động cập nhật lại số liệu
 */
export function notifyBorrowQuotaUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BORROW_QUOTA_UPDATED_EVENT));
  }
}

export interface UseRemainingBorrowBooksReturn {
  quota: RemainingBorrowBooksData | null;
  maxBorrowBooks: number;
  borrowedBooksCount: number;
  remainingBorrowBooks: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook lấy số sách độc giả hiện tại còn có thể mượn từ GET /loans/me/remaining-books
 */
export function useRemainingBorrowBooks(): UseRemainingBorrowBooksReturn {
  const [quota, setQuota] = useState<RemainingBorrowBooksData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRemainingBooks = useCallback(async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("hope_access_token");
    if (!token) {
      setQuota(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyRemainingBorrowBooksApi(token);
      setQuota(data);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const message =
        err instanceof Error
          ? err.message
          : "Không thể tải hạn mức mượn sách";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRemainingBooks();

    const handleRefresh = () => {
      fetchRemainingBooks();
    };

    window.addEventListener(BORROW_QUOTA_UPDATED_EVENT, handleRefresh);
    window.addEventListener("hope_user_updated", handleRefresh);
    return () => {
      window.removeEventListener(BORROW_QUOTA_UPDATED_EVENT, handleRefresh);
      window.removeEventListener("hope_user_updated", handleRefresh);
    };
  }, [fetchRemainingBooks]);

  return {
    quota,
    maxBorrowBooks: quota?.maxBorrowBooks ?? 0,
    borrowedBooksCount: quota?.borrowedBooksCount ?? 0,
    remainingBorrowBooks: quota?.remainingBorrowBooks ?? 0,
    isLoading,
    error,
    refresh: fetchRemainingBooks,
  };
}
