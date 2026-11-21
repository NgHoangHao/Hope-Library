"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { getAuditLogsApi, getAuditLogByIdApi } from "../services/auditLogApi";
import {
  AuditLogItem,
  AuditLogFeedback,
} from "../types/audit-log.types";
import { isSessionExpiredError } from "@/features/auth";

export interface UseAuditLogManagementOptions {
  canRead?: boolean;
}

export function useAuditLogManagement(options: UseAuditLogManagementOptions = {}) {
  const { canRead = true } = options;

  // Data states
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchDraft, setSearchDraft] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  // Feedback banner
  const [feedback, setFeedback] = useState<AuditLogFeedback | null>(null);

  // Modal Detail state
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  const [, startTransition] = useTransition();

  /**
   * Gọi API lấy danh sách Audit Logs
   */
  const fetchLogs = useCallback(
    async (
      currentPage = page,
      currentSize = size,
      currentSearch = activeSearch,
      currentAction = actionFilter
    ) => {
      if (!canRead) {
        setLogs([]);
        setTotal(0);
        setTotalPages(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getAuditLogsApi({
          page: currentPage,
          size: currentSize,
          search: currentSearch.trim() || undefined,
          action: currentAction !== "ALL" ? currentAction : undefined,
        });

        startTransition(() => {
          setLogs(data.items || []);
          setTotal(data.total || 0);
          setPage(data.page || 1);
          setSize(data.size || 10);
          setTotalPages(data.totalPages || 0);
        });
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể kết nối đến máy chủ để tải danh sách nhật ký.";
        setFeedback({
          type: "error",
          title: "Tải danh sách thất bại",
          message: msg,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [canRead, page, size, activeSearch, actionFilter]
  );

  // Kích hoạt nạp dữ liệu khi phân trang, lọc thao tác hoặc tìm kiếm thay đổi
  useEffect(() => {
    fetchLogs(page, size, activeSearch, actionFilter);
  }, [page, size, activeSearch, actionFilter, fetchLogs]);

  // Handler chuyển trang
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Handler đổi số lượng dòng hiển thị
  const handleSizeChange = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(1);
  }, []);

  // Handler tìm kiếm khi bấm Submit hoặc nhấn Enter
  const handleSearchSubmit = useCallback(() => {
    setActiveSearch(searchDraft.trim());
    setPage(1);
  }, [searchDraft]);

  // Handler xóa từ khóa tìm kiếm
  const handleSearchClear = useCallback(() => {
    setSearchDraft("");
    setActiveSearch("");
    setPage(1);
  }, []);

  // Handler lọc theo hành động CRUD (GET, POST, PUT, DELETE)
  const handleActionFilterChange = useCallback((action: string) => {
    setActionFilter(action);
    setPage(1);
  }, []);

  // Handler đặt lại tất cả bộ lọc
  const handleResetFilters = useCallback(() => {
    setSearchDraft("");
    setActiveSearch("");
    setActionFilter("ALL");
    setPage(1);
  }, []);

  // Handler mở Modal xem chi tiết
  const openDetailModal = useCallback(async (logOrId: AuditLogItem | string) => {
    setIsDetailOpen(true);

    if (typeof logOrId === "object" && logOrId !== null) {
      setSelectedLog(logOrId);
    } else {
      setIsLoadingDetail(true);
      try {
        const detail = await getAuditLogByIdApi(logOrId);
        setSelectedLog(detail);
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin chi tiết nhật ký.";
        setFeedback({
          type: "error",
          title: "Lỗi tải chi tiết",
          message: msg,
        });
      } finally {
        setIsLoadingDetail(false);
      }
    }
  }, []);

  // Handler đóng Modal xem chi tiết
  const closeDetailModal = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedLog(null);
  }, []);

  // Làm mới danh sách
  const refetchLogs = useCallback(() => {
    fetchLogs(page, size, activeSearch, actionFilter);
  }, [fetchLogs, page, size, activeSearch, actionFilter]);

  const hasActiveFilters = actionFilter !== "ALL" || Boolean(activeSearch.trim());

  return {
    logs,
    total,
    page,
    size,
    totalPages,
    isLoading,
    searchDraft,
    setSearchDraft,
    activeSearch,
    actionFilter,
    hasActiveFilters,
    feedback,
    setFeedback,
    selectedLog,
    isDetailOpen,
    isLoadingDetail,
    handlePageChange,
    handleSizeChange,
    handleSearchSubmit,
    handleSearchClear,
    handleActionFilterChange,
    handleResetFilters,
    openDetailModal,
    closeDetailModal,
    refetchLogs,
  };
}
