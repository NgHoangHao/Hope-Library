"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Category,
  CategoryDetail,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryFeedback,
} from "../types/category.types";
import {
  getCategoriesApi,
  getCategoryByIdApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "../services/categoryApi";
import { isSessionExpiredError } from "@/features/auth";

export interface UseCategoryManagementProps {
  canRead?: boolean;
}

export interface UseCategoryManagementReturn {
  // Data & Filter
  categories: Category[];
  filteredCategories: Category[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  refreshCategories: () => Promise<void>;

  // Feedback notification
  feedback: CategoryFeedback | null;
  setFeedback: React.Dispatch<React.SetStateAction<CategoryFeedback | null>>;

  // Detail Modal State & Actions
  isDetailOpen: boolean;
  selectedCategoryId: string | null;
  categoryDetail: CategoryDetail | null;
  isLoadingDetail: boolean;
  isUpdating: boolean;
  openDetailModal: (id: string) => Promise<void>;
  closeDetailModal: () => void;
  handleUpdateCategory: (id: string, dto: UpdateCategoryDto) => Promise<boolean>;

  // Create Modal State & Actions
  isCreateOpen: boolean;
  isCreating: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  handleCreateCategory: (dto: CreateCategoryDto) => Promise<boolean>;

  // Delete Modal State & Actions
  isDeleteOpen: boolean;
  categoryToDelete: Category | null;
  isDeleting: boolean;
  openDeleteModal: (category: Category) => void;
  closeDeleteModal: () => void;
  handleDeleteCategory: () => Promise<boolean>;
}

export function useCategoryManagement({
  canRead = true,
}: UseCategoryManagementProps = {}): UseCategoryManagementReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<CategoryFeedback | null>(null);

  // Detail state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Create state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories initially
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!canRead) {
        if (isMounted) {
          setCategories([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getCategoriesApi();
        if (!isMounted) return;
        setCategories(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách thể loại";
        setFeedback({ type: "error", message: msg });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [canRead]);

  // Manual refresh callback
  const refreshCategories = useCallback(async () => {
    if (!canRead) return;

    try {
      setIsLoading(true);
      const data = await getCategoriesApi();
      setCategories(data);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách thể loại";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [canRead]);

  // Client-side filtering
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        (cat.description && cat.description.toLowerCase().includes(term))
    );
  }, [categories, searchTerm]);

  // Open Detail Modal & fetch category with associated books
  const openDetailModal = useCallback(async (id: string) => {
    setSelectedCategoryId(id);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    setCategoryDetail(null);

    try {
      const detail = await getCategoryByIdApi(id);
      setCategoryDetail(detail);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi tải chi tiết thể loại";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedCategoryId(null);
    setCategoryDetail(null);
  }, []);

  // Update Category from Detail UI
  const handleUpdateCategory = useCallback(
    async (id: string, dto: UpdateCategoryDto): Promise<boolean> => {
      try {
        setIsUpdating(true);
        const updated = await updateCategoryApi(id, dto);

        // Update local list
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        );

        // Update current detail if opened
        setCategoryDetail((prev) =>
          prev && prev.id === id ? { ...prev, ...updated } : prev
        );

        setFeedback({
          type: "success",
          message: `Cập nhật thể loại "${updated.name}" thành công!`,
        });
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Cập nhật thể loại thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Create Modal Actions
  const openCreateModal = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateOpen(false);
  }, []);

  const handleCreateCategory = useCallback(
    async (dto: CreateCategoryDto): Promise<boolean> => {
      try {
        setIsCreating(true);
        const newCat = await createCategoryApi(dto);
        setCategories((prev) => [newCat, ...prev]);
        setFeedback({
          type: "success",
          message: `Thêm mới thể loại "${newCat.name}" thành công!`,
        });
        setIsCreateOpen(false);
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Thêm mới thể loại thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  // Delete Modal Actions
  const openDeleteModal = useCallback((category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setCategoryToDelete(null);
    setIsDeleteOpen(false);
  }, []);

  const handleDeleteCategory = useCallback(async (): Promise<boolean> => {
    if (!categoryToDelete) return false;

    try {
      setIsDeleting(true);
      await deleteCategoryApi(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));

      // If deleted category is currently open in detail modal, close it
      if (selectedCategoryId === categoryToDelete.id) {
        closeDetailModal();
      }

      setFeedback({
        type: "success",
        message: `Đã xóa thể loại "${categoryToDelete.name}" thành công!`,
      });
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
      return true;
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return false;
      const msg = err instanceof Error ? err.message : "Xóa thể loại thất bại";
      setFeedback({ type: "error", message: msg });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [categoryToDelete, selectedCategoryId, closeDetailModal]);

  return {
    categories,
    filteredCategories,
    searchTerm,
    setSearchTerm,
    isLoading,
    refreshCategories,
    feedback,
    setFeedback,
    isDetailOpen,
    selectedCategoryId,
    categoryDetail,
    isLoadingDetail,
    isUpdating,
    openDetailModal,
    closeDetailModal,
    handleUpdateCategory,
    isCreateOpen,
    isCreating,
    openCreateModal,
    closeCreateModal,
    handleCreateCategory,
    isDeleteOpen,
    categoryToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteCategory,
  };
}
