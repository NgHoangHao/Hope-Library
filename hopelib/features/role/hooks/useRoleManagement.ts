"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RoleItem,
  CreateRoleDto,
  UpdateRoleDto,
  RoleFeedback,
} from "../types/role.types";
import {
  getAllRolesApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
} from "../services/roleApi";
import { isSessionExpiredError } from "@/features/auth";

export interface UseRoleManagementProps {
  canRead?: boolean;
}

export interface UseRoleManagementReturn {
  // Data & Filter
  roles: RoleItem[];
  filteredRoles: RoleItem[];
  isLoading: boolean;
  refreshRoles: () => Promise<void>;

  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Feedback Banner
  feedback: RoleFeedback | null;
  setFeedback: React.Dispatch<React.SetStateAction<RoleFeedback | null>>;

  // Form Modal (Create / Edit)
  isFormOpen: boolean;
  formMode: "create" | "edit";
  itemToEdit: RoleItem | null;
  isSubmitting: boolean;
  openCreateModal: () => void;
  openEditModal: (item: RoleItem) => void;
  closeFormModal: () => void;
  handleCreateRole: (dto: CreateRoleDto) => Promise<boolean>;
  handleUpdateRole: (id: string, dto: UpdateRoleDto) => Promise<boolean>;

  // Delete Modal
  isDeleteOpen: boolean;
  itemToDelete: RoleItem | null;
  isDeleting: boolean;
  openDeleteModal: (item: RoleItem) => void;
  closeDeleteModal: () => void;
  handleDeleteRole: () => Promise<boolean>;
}

export function useRoleManagement({
  canRead = true,
}: UseRoleManagementProps = {}): UseRoleManagementReturn {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<RoleFeedback | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [itemToEdit, setItemToEdit] = useState<RoleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RoleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all roles on mount or when canRead changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!canRead) {
        if (isMounted) {
          setRoles([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getAllRolesApi();
        if (!isMounted) return;
        setRoles(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách vai trò";
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
  const refreshRoles = useCallback(async () => {
    if (!canRead) return;
    try {
      setIsLoading(true);
      const data = await getAllRolesApi();
      setRoles(data);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi làm mới danh sách vai trò";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [canRead]);

  // Filtered roles based on search
  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) {
      return roles;
    }
    const term = searchTerm.toLowerCase().trim();
    return roles.filter((role) => {
      const matchName = role.name.toLowerCase().includes(term);
      const matchDesc = role.description
        ? role.description.toLowerCase().includes(term)
        : false;
      const matchId = role.id.toLowerCase().includes(term);
      return matchName || matchDesc || matchId;
    });
  }, [roles, searchTerm]);

  // Form Modal Actions
  const openCreateModal = useCallback(() => {
    setFormMode("create");
    setItemToEdit(null);
    setIsFormOpen(true);
  }, []);

  const openEditModal = useCallback((item: RoleItem) => {
    setFormMode("edit");
    setItemToEdit(item);
    setIsFormOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setItemToEdit(null);
  }, []);

  const handleCreateRole = useCallback(
    async (dto: CreateRoleDto): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        const newRole = await createRoleApi(dto);
        setFeedback({
          type: "success",
          message: `Thêm mới vai trò "${newRole.name}" thành công!`,
        });
        setIsFormOpen(false);
        await refreshRoles();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Thêm mới vai trò thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshRoles]
  );

  const handleUpdateRole = useCallback(
    async (id: string, dto: UpdateRoleDto): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        const updated = await updateRoleApi(id, dto);
        setFeedback({
          type: "success",
          message: `Cập nhật vai trò "${updated.name}" thành công!`,
        });
        setIsFormOpen(false);
        setItemToEdit(null);
        await refreshRoles();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Cập nhật vai trò thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshRoles]
  );

  // Delete Modal Actions
  const openDeleteModal = useCallback((item: RoleItem) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setItemToDelete(null);
    setIsDeleteOpen(false);
  }, []);

  const handleDeleteRole = useCallback(async (): Promise<boolean> => {
    if (!itemToDelete) return false;

    try {
      setIsDeleting(true);
      await deleteRoleApi(itemToDelete.id);
      setFeedback({
        type: "success",
        message: `Đã xóa vai trò "${itemToDelete.name}" thành công!`,
      });
      setIsDeleteOpen(false);
      setItemToDelete(null);
      await refreshRoles();
      return true;
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return false;
      const msg = err instanceof Error ? err.message : "Xóa vai trò thất bại";
      setFeedback({ type: "error", message: msg });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, refreshRoles]);

  return {
    roles,
    filteredRoles,
    isLoading,
    refreshRoles,
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
    handleCreateRole,
    handleUpdateRole,
    isDeleteOpen,
    itemToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteRole,
  };
}
