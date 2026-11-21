"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PermissionItem,
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionFeedback,
} from "../types/permission.types";
import {
  getAllPermissionsApi,
  createPermissionApi,
  updatePermissionApi,
  deletePermissionApi,
} from "../services/permissionApi";
import { formatPermissionDisplay } from "../utils/permissionLabel.helper";
import { isSessionExpiredError } from "@/features/auth";

export interface UsePermissionManagementProps {
  canRead?: boolean;
}

export interface ModuleFilterOption {
  key: string;
  label: string;
  count: number;
}

export interface UsePermissionManagementReturn {
  // Data & Filter
  permissions: PermissionItem[];
  filteredPermissions: PermissionItem[];
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;

  // Object / Module Filters
  modules: ModuleFilterOption[];
  selectedModule: string;
  setSelectedModule: (mod: string) => void;

  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Feedback Banner
  feedback: PermissionFeedback | null;
  setFeedback: React.Dispatch<React.SetStateAction<PermissionFeedback | null>>;

  // Form Modal (Create / Edit)
  isFormOpen: boolean;
  formMode: "create" | "edit";
  itemToEdit: PermissionItem | null;
  isSubmitting: boolean;
  openCreateModal: () => void;
  openEditModal: (item: PermissionItem) => void;
  closeFormModal: () => void;
  handleCreatePermission: (dto: CreatePermissionDto) => Promise<boolean>;
  handleUpdatePermission: (id: string, dto: UpdatePermissionDto) => Promise<boolean>;

  // Delete Modal
  isDeleteOpen: boolean;
  itemToDelete: PermissionItem | null;
  isDeleting: boolean;
  openDeleteModal: (item: PermissionItem) => void;
  closeDeleteModal: () => void;
  handleDeletePermission: () => Promise<boolean>;
}

export function usePermissionManagement({
  canRead = true,
}: UsePermissionManagementProps = {}): UsePermissionManagementReturn {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<PermissionFeedback | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [itemToEdit, setItemToEdit] = useState<PermissionItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermissionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all permissions on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!canRead) {
        if (isMounted) {
          setPermissions([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getAllPermissionsApi();
        if (!isMounted) return;
        setPermissions(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách quyền hạn";
        setFeedback({ type: "error", message: msg });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [canRead]);

  // Refresh callback
  const refreshPermissions = useCallback(async () => {
    if (!canRead) return;
    try {
      setIsLoading(true);
      const data = await getAllPermissionsApi();
      setPermissions(data);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi làm mới quyền hạn";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [canRead]);

  // Danh sách các đối tượng / module động tính từ mã quyền hạn
  const modules = useMemo<ModuleFilterOption[]>(() => {
    const counts: Record<string, number> = {};

    permissions.forEach((perm) => {
      const { module } = formatPermissionDisplay(perm.code, perm.description);
      counts[module] = (counts[module] || 0) + 1;
    });

    const list: ModuleFilterOption[] = [
      { key: "ALL", label: "Tất cả đối tượng", count: permissions.length },
    ];

    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([mod, count]) => {
        list.push({ key: mod, label: mod, count });
      });

    return list;
  }, [permissions]);

  // Lọc quyền hạn theo Module và Search
  const filteredPermissions = useMemo(() => {
    return permissions.filter((perm) => {
      const { module, action, displayText } = formatPermissionDisplay(
        perm.code,
        perm.description
      );

      // 1. Lọc theo đối tượng / module
      if (selectedModule !== "ALL" && module !== selectedModule) {
        return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchCode = perm.code.toLowerCase().includes(term);
        const matchDesc = perm.description
          ? perm.description.toLowerCase().includes(term)
          : false;
        const matchDisplay = displayText.toLowerCase().includes(term);
        const matchAction = action.toLowerCase().includes(term);
        const matchModule = module.toLowerCase().includes(term);

        if (!matchCode && !matchDesc && !matchDisplay && !matchAction && !matchModule) {
          return false;
        }
      }

      return true;
    });
  }, [permissions, selectedModule, searchTerm]);

  // Form Modal Actions
  const openCreateModal = useCallback(() => {
    setFormMode("create");
    setItemToEdit(null);
    setIsFormOpen(true);
  }, []);

  const openEditModal = useCallback((item: PermissionItem) => {
    setFormMode("edit");
    setItemToEdit(item);
    setIsFormOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setItemToEdit(null);
  }, []);

  const handleCreatePermission = useCallback(
    async (dto: CreatePermissionDto): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        const newPerm = await createPermissionApi(dto);
        setFeedback({
          type: "success",
          message: `Thêm mới quyền hạn "${newPerm.code}" thành công!`,
        });
        setIsFormOpen(false);
        await refreshPermissions();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Thêm mới quyền hạn thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshPermissions]
  );

  const handleUpdatePermission = useCallback(
    async (id: string, dto: UpdatePermissionDto): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        const updated = await updatePermissionApi(id, dto);
        setFeedback({
          type: "success",
          message: `Cập nhật quyền hạn "${updated.code}" thành công!`,
        });
        setIsFormOpen(false);
        setItemToEdit(null);
        await refreshPermissions();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Cập nhật quyền hạn thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshPermissions]
  );

  // Delete Modal Actions
  const openDeleteModal = useCallback((item: PermissionItem) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setItemToDelete(null);
    setIsDeleteOpen(false);
  }, []);

  const handleDeletePermission = useCallback(async (): Promise<boolean> => {
    if (!itemToDelete) return false;

    try {
      setIsDeleting(true);
      await deletePermissionApi(itemToDelete.id);
      setFeedback({
        type: "success",
        message: `Đã xóa quyền hạn "${itemToDelete.code}" thành công!`,
      });
      setIsDeleteOpen(false);
      setItemToDelete(null);
      await refreshPermissions();
      return true;
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return false;
      const msg = err instanceof Error ? err.message : "Xóa quyền hạn thất bại";
      setFeedback({ type: "error", message: msg });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, refreshPermissions]);

  return {
    permissions,
    filteredPermissions,
    isLoading,
    refreshPermissions,
    modules,
    selectedModule,
    setSelectedModule,
    searchTerm,
    setSearchTerm,
    feedback,
    setFeedback,
    isFormOpen,
    formMode,
    itemToEdit,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeFormModal,
    handleCreatePermission,
    handleUpdatePermission,
    isDeleteOpen,
    itemToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeletePermission,
  };
}
