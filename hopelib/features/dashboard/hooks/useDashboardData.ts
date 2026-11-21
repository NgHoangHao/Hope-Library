"use client";

import { useState, useEffect, useCallback } from "react";
import { getDashboardOverviewApi } from "../services/dashboardApi";
import { DashboardOverviewData } from "../types/dashboard.types";

interface StoredUser {
  fullName?: string | null;
  username?: string;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Bạn");
  const [greeting, setGreeting] = useState<string>("Xin chào");
  const [todayLabel, setTodayLabel] = useState<string>("");

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await getDashboardOverviewApi();
      setData(overview);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu tổng quan dashboard";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hope_user");
      if (stored) {
        const parsed = JSON.parse(stored) as StoredUser;
        setDisplayName(parsed?.fullName || parsed?.username || "Bạn");
      }
    } catch {
      // ignore localStorage parse error
    }

    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting("Chào buổi sáng");
    else if (hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");

    setTodayLabel(
      now
        .toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
        .toUpperCase()
    );

    void fetchOverview();
  }, [fetchOverview]);

  return {
    data,
    isLoading,
    error,
    displayName,
    greeting,
    todayLabel,
    refetch: fetchOverview,
  };
}
