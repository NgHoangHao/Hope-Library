"use client";

import { useState, useEffect, useCallback } from "react";
import { isSessionExpiredError } from "@/features/auth";
import { getMaxLoanDaysApi } from "../services/loanApi";

const DEFAULT_MAX_LOAN_DAYS = 14;

export interface UseMaxLoanDaysReturn {
  maxLoanDays: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook lấy số ngày hạn trả sách mặc định (MAX_LOAN_DAYS) từ GET /loans/max-loan-days
 */
export function useMaxLoanDays(): UseMaxLoanDaysReturn {
  const [maxLoanDays, setMaxLoanDays] = useState<number>(DEFAULT_MAX_LOAN_DAYS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaxLoanDays = useCallback(async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("hope_access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getMaxLoanDaysApi(token);
      setMaxLoanDays(data.maxLoanDays);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const message =
        err instanceof Error
          ? err.message
          : "Không thể tải cấu hình hạn trả sách mặc định";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaxLoanDays();
  }, [fetchMaxLoanDays]);

  return {
    maxLoanDays,
    isLoading,
    error,
    refresh: fetchMaxLoanDays,
  };
}
