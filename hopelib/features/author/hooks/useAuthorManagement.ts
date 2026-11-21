"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Author,
  AuthorDetail,
  CreateAuthorDto,
  UpdateAuthorDto,
  AuthorFeedback,
} from "../types/author.types";
import {
  getAuthorsApi,
  getAuthorByIdApi,
  createAuthorApi,
  updateAuthorApi,
  deleteAuthorApi,
} from "../services/authorApi";
import { isSessionExpiredError } from "@/features/auth";

export interface UseAuthorManagementProps {
  canRead?: boolean;
}

export interface UseAuthorManagementReturn {
  // Data & Filter
  authors: Author[];
  filteredAuthors: Author[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  refreshAuthors: () => Promise<void>;

  // Feedback notification
  feedback: AuthorFeedback | null;
  setFeedback: React.Dispatch<React.SetStateAction<AuthorFeedback | null>>;

  // Detail Modal State & Actions
  isDetailOpen: boolean;
  selectedAuthorId: string | null;
  authorDetail: AuthorDetail | null;
  isLoadingDetail: boolean;
  isUpdating: boolean;
  openDetailModal: (id: string) => Promise<void>;
  closeDetailModal: () => void;
  handleUpdateAuthor: (id: string, dto: UpdateAuthorDto) => Promise<boolean>;

  // Create Modal State & Actions
  isCreateOpen: boolean;
  isCreating: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  handleCreateAuthor: (dto: CreateAuthorDto) => Promise<boolean>;

  // Delete Modal State & Actions
  isDeleteOpen: boolean;
  authorToDelete: Author | null;
  isDeleting: boolean;
  openDeleteModal: (author: Author) => void;
  closeDeleteModal: () => void;
  handleDeleteAuthor: () => Promise<boolean>;
}

export function useAuthorManagement({
  canRead = true,
}: UseAuthorManagementProps = {}): UseAuthorManagementReturn {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<AuthorFeedback | null>(null);

  // Detail state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [authorDetail, setAuthorDetail] = useState<AuthorDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Create state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load authors initially
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!canRead) {
        if (isMounted) {
          setAuthors([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getAuthorsApi();
        if (!isMounted) return;
        setAuthors(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách tác giả";
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
  const refreshAuthors = useCallback(async () => {
    if (!canRead) return;

    try {
      setIsLoading(true);
      const data = await getAuthorsApi();
      setAuthors(data);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách tác giả";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [canRead]);

  // Client-side filtering
  const filteredAuthors = useMemo(() => {
    if (!searchTerm.trim()) return authors;
    const term = searchTerm.toLowerCase().trim();
    return authors.filter(
      (author) =>
        author.name.toLowerCase().includes(term) ||
        (author.biography && author.biography.toLowerCase().includes(term))
    );
  }, [authors, searchTerm]);

  // Open Detail Modal & fetch author with associated books
  const openDetailModal = useCallback(async (id: string) => {
    setSelectedAuthorId(id);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    setAuthorDetail(null);

    try {
      const detail = await getAuthorByIdApi(id);
      setAuthorDetail(detail);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi tải chi tiết tác giả";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedAuthorId(null);
    setAuthorDetail(null);
  }, []);

  // Update Author from Detail UI
  const handleUpdateAuthor = useCallback(
    async (id: string, dto: UpdateAuthorDto): Promise<boolean> => {
      try {
        setIsUpdating(true);
        const updated = await updateAuthorApi(id, dto);

        // Update local list
        setAuthors((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
        );

        // Update current detail if opened
        setAuthorDetail((prev) =>
          prev && prev.id === id ? { ...prev, ...updated } : prev
        );

        setFeedback({
          type: "success",
          message: `Cập nhật tác giả "${updated.name}" thành công!`,
        });
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Cập nhật tác giả thất bại";
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

  const handleCreateAuthor = useCallback(
    async (dto: CreateAuthorDto): Promise<boolean> => {
      try {
        setIsCreating(true);
        const newAuthor = await createAuthorApi(dto);
        setAuthors((prev) => [newAuthor, ...prev]);
        setFeedback({
          type: "success",
          message: `Thêm mới tác giả "${newAuthor.name}" thành công!`,
        });
        setIsCreateOpen(false);
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Thêm mới tác giả thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  // Delete Modal Actions
  const openDeleteModal = useCallback((author: Author) => {
    setAuthorToDelete(author);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setAuthorToDelete(null);
    setIsDeleteOpen(false);
  }, []);

  const handleDeleteAuthor = useCallback(async (): Promise<boolean> => {
    if (!authorToDelete) return false;

    try {
      setIsDeleting(true);
      await deleteAuthorApi(authorToDelete.id);
      setAuthors((prev) => prev.filter((a) => a.id !== authorToDelete.id));

      if (selectedAuthorId === authorToDelete.id) {
        closeDetailModal();
      }

      setFeedback({
        type: "success",
        message: `Đã xóa tác giả "${authorToDelete.name}" thành công!`,
      });
      setIsDeleteOpen(false);
      setAuthorToDelete(null);
      return true;
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return false;
      const msg = err instanceof Error ? err.message : "Xóa tác giả thất bại";
      setFeedback({ type: "error", message: msg });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [authorToDelete, selectedAuthorId, closeDetailModal]);

  return {
    authors,
    filteredAuthors,
    searchTerm,
    setSearchTerm,
    isLoading,
    refreshAuthors,
    feedback,
    setFeedback,
    isDetailOpen,
    selectedAuthorId,
    authorDetail,
    isLoadingDetail,
    isUpdating,
    openDetailModal,
    closeDetailModal,
    handleUpdateAuthor,
    isCreateOpen,
    isCreating,
    openCreateModal,
    closeCreateModal,
    handleCreateAuthor,
    isDeleteOpen,
    authorToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteAuthor,
  };
}
