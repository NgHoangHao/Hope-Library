"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAccountsApi,
  createAccountApi,
  deleteAccountApi,
  getAccountRolesApi,
} from "../services/accountApi";
import {
  AccountUser,
  AccountRoleItem,
  CreateAccountInput,
  AccountFeedback,
} from "../types/account.types";

export interface UseAccountManagementOptions {
  canRead?: boolean;
}

export function useAccountManagement(options: UseAccountManagementOptions = {}) {
  const { canRead = true } = options;

  // Data states
  const [accounts, setAccounts] = useState<AccountUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [availableRoles, setAvailableRoles] = useState<AccountRoleItem[]>([]);

  // Feedback (Toast Alert)
  const [feedback, setFeedback] = useState<AccountFeedback | null>(null);

  // Modal Create state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Modal Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<AccountUser | null>(null);

  // Debounce search ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Tải danh sách vai trò
   */
  useEffect(() => {
    let isMounted = true;
    getAccountRolesApi().then((roles) => {
      if (isMounted) {
        setAvailableRoles(roles);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Gọi API lấy danh sách người dùng
   */
  const fetchAccounts = useCallback(
    async (currentPage = page, currentSize = size, search = searchTerm, status = statusFilter, role = roleFilter) => {
      if (!canRead) {
        setAccounts([]);
        setTotal(0);
        setTotalPages(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getAccountsApi({
          page: currentPage,
          size: currentSize,
          search: search.trim() || undefined,
          status: status !== "ALL" ? status : undefined,
          role: role !== "ALL" ? role : undefined,
        });

        setAccounts(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setSize(data.size || 10);
        setTotalPages(data.totalPages || 0);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách tài khoản người dùng.";
        setFeedback({
          type: "error",
          title: "Tải danh sách thất bại",
          message: msg,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [canRead, page, size, searchTerm, statusFilter, roleFilter]
  );

  useEffect(() => {
    fetchAccounts(page, size, searchTerm, statusFilter, roleFilter);
  }, [fetchAccounts, page, size, statusFilter, roleFilter]);

  /**
   * Xử lý thay đổi từ khóa tìm kiếm (có debounce 400ms)
   */
  const handleSearchChange = useCallback(
    (newSearch: string) => {
      setSearchTerm(newSearch);
      setPage(1);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        fetchAccounts(1, size, newSearch, statusFilter, roleFilter);
      }, 400);
    },
    [fetchAccounts, size, statusFilter, roleFilter]
  );

  /**
   * Xử lý thay đổi bộ lọc trạng thái
   */
  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  /**
   * Xử lý thay đổi bộ lọc vai trò
   */
  const handleRoleFilterChange = useCallback((role: string) => {
    setRoleFilter(role);
    setPage(1);
  }, []);

  /**
   * Xử lý chuyển trang
   */
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  /**
   * Xử lý đổi kích thước trang
   */
  const handleSizeChange = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(1);
  }, []);

  /**
   * Modal Create actions
   */
  const openCreateModal = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateOpen(false);
  }, []);

  const handleCreateAccount = useCallback(
    async (input: CreateAccountInput): Promise<boolean> => {
      setIsCreating(true);
      try {
        const newUser = await createAccountApi(input);
        setIsCreateOpen(false);
        setFeedback({
          type: "success",
          title: "Thêm thành công",
          message: `Đã tạo tài khoản "${newUser.username}" thành công.`,
        });
        // Tải lại dữ liệu trang hiện tại
        fetchAccounts(page, size, searchTerm, statusFilter, roleFilter);
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Thêm người dùng thất bại. Vui lòng kiểm tra lại thông tin.";
        setFeedback({
          type: "error",
          title: "Thêm thất bại",
          message: msg,
        });
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    [fetchAccounts, page, size, searchTerm, statusFilter, roleFilter]
  );

  /**
   * Modal Delete actions
   */
  const openDeleteModal = useCallback((user: AccountUser) => {
    setUserToDelete(user);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteOpen(false);
    setUserToDelete(null);
  }, []);

  const handleDeleteAccount = useCallback(async (): Promise<boolean> => {
    if (!userToDelete) return false;

    setIsDeleting(true);
    try {
      await deleteAccountApi(userToDelete.id);
      setIsDeleteOpen(false);
      setFeedback({
        type: "success",
        title: "Xóa thành công",
        message: `Đã xóa tài khoản "${userToDelete.fullName || userToDelete.username}" khỏi hệ thống.`,
      });
      setUserToDelete(null);

      // Nếu xóa item cuối cùng của trang > 1, lùi về trang trước
      const newPage = accounts.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      fetchAccounts(newPage, size, searchTerm, statusFilter, roleFilter);
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể xóa người dùng. Vui lòng thử lại sau.";
      setFeedback({
        type: "error",
        title: "Xóa thất bại",
        message: msg,
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [userToDelete, accounts.length, page, size, searchTerm, statusFilter, roleFilter, fetchAccounts]);

  return {
    accounts,
    total,
    page,
    size,
    totalPages,
    isLoading,
    searchTerm,
    statusFilter,
    roleFilter,
    availableRoles,
    feedback,
    setFeedback,
    isCreateOpen,
    isCreating,
    isDeleteOpen,
    isDeleting,
    userToDelete,
    handleSearchChange,
    handleStatusFilterChange,
    handleRoleFilterChange,
    handlePageChange,
    handleSizeChange,
    openCreateModal,
    closeCreateModal,
    handleCreateAccount,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteAccount,
    refetchAccounts: () => fetchAccounts(page, size, searchTerm, statusFilter, roleFilter),
  };
}
