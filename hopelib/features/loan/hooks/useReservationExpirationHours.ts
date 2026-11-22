"use client";

import { useState, useEffect, useCallback } from "react";
import { isSessionExpiredError } from "@/features/auth";
import { getReservationExpirationHoursApi } from "../services/loanApi";

const DEFAULT_RESERVATION_EXPIRATION_HOURS = 48;

export interface UseReservationExpirationHoursReturn {
  reservationExpirationHours: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook lấy số giờ giữ chỗ đặt sách tối đa từ GET /loans/reservation-expiration-hours
 */
export function useReservationExpirationHours(): UseReservationExpirationHoursReturn {
  const [reservationExpirationHours, setReservationExpirationHours] =
    useState<number>(DEFAULT_RESERVATION_EXPIRATION_HOURS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpirationHours = useCallback(async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("hope_access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getReservationExpirationHoursApi(token);
      setReservationExpirationHours(data.reservationExpirationHours);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const message =
        err instanceof Error
          ? err.message
          : "Không thể tải thời gian giữ chỗ đặt sách tối đa";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpirationHours();
  }, [fetchExpirationHours]);

  return {
    reservationExpirationHours,
    isLoading,
    error,
    refresh: fetchExpirationHours,
  };
}
