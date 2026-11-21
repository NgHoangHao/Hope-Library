"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  NavigationItem,
  NavigationTreeItem,
  CreateNavigationDto,
  UpdateNavigationDto,
  NavigationFeedback,
} from "../types/navigation.types";
import {
  getAllNavigationsApi,
  createNavigationApi,
  updateNavigationApi,
  deleteNavigationApi,
} from "../services/navigationApi";
import {
  buildNavigationTreeFromFlat,
  getDescendantIds,
} from "../utils/treeBuilder.helper";
import { isSessionExpiredError } from "@/features/auth";

export interface UseNavigationManagementProps {
  canRead?: boolean;
}

export interface UseNavigationManagementReturn {
  // Flat & Tree Data
  flatNavigations: NavigationItem[];
  treeData: NavigationTreeItem[];
  filteredTree: NavigationTreeItem[];
  isLoading: boolean;
  refreshNavigations: () => Promise<void>;

  // Search
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  activeSearch: string;
  handleSearchClick: () => void;
  handleSearchClear: () => void;
  matchingNodeIds: Set<string>;

  // Tree Expand / Collapse
  expandedNodeIds: Record<string, boolean>;
  toggleExpand: (nodeId: string) => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;

  // Feedback Banner
  feedback: NavigationFeedback | null;
  setFeedback: React.Dispatch<React.SetStateAction<NavigationFeedback | null>>;

  // Form Modal (Create / Edit)
  isFormOpen: boolean;
  formMode: "create" | "edit";
  itemToEdit: NavigationItem | null;
  isSubmitting: boolean;
  openCreateModal: (defaultParentId?: string | null) => void;
  openEditModal: (item: NavigationItem) => void;
  closeFormModal: () => void;
  handleCreateNavigation: (dto: CreateNavigationDto) => Promise<boolean>;
  handleUpdateNavigation: (id: string, dto: UpdateNavigationDto) => Promise<boolean>;

  // Delete Modal
  isDeleteOpen: boolean;
  itemToDelete: NavigationItem | null;
  isDeleting: boolean;
  openDeleteModal: (item: NavigationItem) => void;
  closeDeleteModal: () => void;
  handleDeleteNavigation: () => Promise<boolean>;

  // Dropdown parent options helper
  getParentDropdownOptions: (editingItemId?: string | null) => NavigationItem[];
}

export function useNavigationManagement({
  canRead = true,
}: UseNavigationManagementProps = {}): UseNavigationManagementReturn {
  const [flatNavigations, setFlatNavigations] = useState<NavigationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<NavigationFeedback | null>(null);

  // Search state
  const [searchDraft, setSearchDraft] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  // Expand state
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [itemToEdit, setItemToEdit] = useState<NavigationItem | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NavigationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load flat navigations on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!canRead) {
        if (isMounted) {
          setFlatNavigations([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getAllNavigationsApi();
        if (!isMounted) return;
        setFlatNavigations(data);

        // Mặc định mở rộng các node gốc
        const initialExpanded: Record<string, boolean> = {};
        data.forEach((item) => {
          if (!item.parentId) {
            initialExpanded[item.id] = true;
          }
        });
        setExpandedNodeIds(initialExpanded);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg = err instanceof Error ? err.message : "Lỗi khi tải danh sách menu điều hướng";
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
  const refreshNavigations = useCallback(async () => {
    if (!canRead) return;
    try {
      setIsLoading(true);
      const data = await getAllNavigationsApi();
      setFlatNavigations(data);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi khi làm mới menu";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [canRead]);

  // Dựng lại cây từ mảng phẳng gốc
  const treeData = useMemo(() => {
    return buildNavigationTreeFromFlat(flatNavigations);
  }, [flatNavigations]);

  // Lọc cây theo từ khóa tìm kiếm (theo tên hoặc path trên FE)
  const { filteredTree, matchingNodeIds } = useMemo(() => {
    if (!activeSearch.trim()) {
      return { filteredTree: treeData, matchingNodeIds: new Set<string>() };
    }

    const term = activeSearch.toLowerCase().trim();
    const matchIds = new Set<string>();
    const keepIds = new Set<string>();

    // Tìm các node khớp theo tên hoặc đường dẫn (path)
    flatNavigations.forEach((item) => {
      const matchName = item.name.toLowerCase().includes(term);
      const matchPath = item.path ? item.path.toLowerCase().includes(term) : false;
      const matchCode = item.code.toLowerCase().includes(term);

      if (matchName || matchPath || matchCode) {
        matchIds.add(item.id);

        // Đánh dấu các tổ tiên của node khớp để giữ lại trong cây
        let currParentId = item.parentId;
        while (currParentId) {
          keepIds.add(currParentId);
          const parentItem = flatNavigations.find((it) => it.id === currParentId);
          currParentId = parentItem?.parentId || null;
        }
      }
    });

    // Lọc cây đệ quy
    function filterNodes(nodes: NavigationTreeItem[]): NavigationTreeItem[] {
      return nodes
        .map((node) => {
          const isDirectMatch = matchIds.has(node.id);
          const hasMatchingDescendant = keepIds.has(node.id);

          if (node.children && node.children.length > 0) {
            const filteredChildren = filterNodes(node.children);
            if (isDirectMatch || filteredChildren.length > 0 || hasMatchingDescendant) {
              return {
                ...node,
                children: filteredChildren,
              };
            }
            return null;
          }

          return isDirectMatch ? node : null;
        })
        .filter((n): n is NavigationTreeItem => n !== null);
    }

    return {
      filteredTree: filterNodes(treeData),
      matchingNodeIds: matchIds,
    };
  }, [treeData, flatNavigations, activeSearch]);

  // Search actions
  const handleSearchClick = useCallback(() => {
    const term = searchDraft.trim();
    setActiveSearch(term);

    // Mở rộng các node khớp và tổ tiên của chúng khi bấm tìm kiếm
    if (term) {
      const lower = term.toLowerCase();
      setExpandedNodeIds((prev) => {
        const next = { ...prev };
        flatNavigations.forEach((item) => {
          const matchName = item.name.toLowerCase().includes(lower);
          const matchPath = item.path ? item.path.toLowerCase().includes(lower) : false;
          const matchCode = item.code.toLowerCase().includes(lower);
          if (matchName || matchPath || matchCode) {
            let curr = item.parentId;
            while (curr) {
              next[curr] = true;
              curr = flatNavigations.find((it) => it.id === curr)?.parentId;
            }
          }
        });
        return next;
      });
    }
  }, [searchDraft, flatNavigations]);

  const handleSearchClear = useCallback(() => {
    setSearchDraft("");
    setActiveSearch("");
  }, []);

  // Tree expand / collapse actions
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  const handleExpandAll = useCallback(() => {
    const allExpanded: Record<string, boolean> = {};
    flatNavigations.forEach((item) => {
      allExpanded[item.id] = true;
    });
    setExpandedNodeIds(allExpanded);
  }, [flatNavigations]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodeIds({});
  }, []);

  // Dropdown parent options: tận dụng mảng gốc phẳng, loại trừ chính nó và con cháu của nó khi sửa
  const getParentDropdownOptions = useCallback(
    (editingItemId?: string | null): NavigationItem[] => {
      if (!editingItemId) {
        return flatNavigations;
      }
      const forbiddenIds = getDescendantIds(editingItemId, flatNavigations);
      forbiddenIds.add(editingItemId);
      return flatNavigations.filter((item) => !forbiddenIds.has(item.id));
    },
    [flatNavigations]
  );

  // Form Modal Actions
  const openCreateModal = useCallback((parent?: string | null) => {
    setFormMode("create");
    setItemToEdit(null);
    setDefaultParentId(parent || null);
    setIsFormOpen(true);
  }, []);

  const openEditModal = useCallback((item: NavigationItem) => {
    setFormMode("edit");
    setItemToEdit(item);
    setDefaultParentId(null);
    setIsFormOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setItemToEdit(null);
    setDefaultParentId(null);
  }, []);

  const handleCreateNavigation = useCallback(
    async (dto: CreateNavigationDto): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        const newItem = await createNavigationApi(dto);
        setFeedback({
          type: "success",
          message: `Thêm mới menu "${newItem.name}" thành công!`,
        });
        setIsFormOpen(false);
        await refreshNavigations();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Thêm mới menu thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshNavigations]
  );

  const handleUpdateNavigation = useCallback(
    async (id: string, dto: UpdateNavigationDto): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        const updated = await updateNavigationApi(id, dto);
        setFeedback({
          type: "success",
          message: `Cập nhật menu "${updated.name}" thành công!`,
        });
        setIsFormOpen(false);
        setItemToEdit(null);
        await refreshNavigations();
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg = err instanceof Error ? err.message : "Cập nhật menu thất bại";
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshNavigations]
  );

  // Delete Modal Actions
  const openDeleteModal = useCallback((item: NavigationItem) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setItemToDelete(null);
    setIsDeleteOpen(false);
  }, []);

  const handleDeleteNavigation = useCallback(async (): Promise<boolean> => {
    if (!itemToDelete) return false;

    try {
      setIsDeleting(true);
      await deleteNavigationApi(itemToDelete.id);
      setFeedback({
        type: "success",
        message: `Đã xóa menu "${itemToDelete.name}" thành công!`,
      });
      setIsDeleteOpen(false);
      setItemToDelete(null);
      await refreshNavigations();
      return true;
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return false;
      const msg = err instanceof Error ? err.message : "Xóa menu thất bại";
      setFeedback({ type: "error", message: msg });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, refreshNavigations]);

  return {
    flatNavigations,
    treeData,
    filteredTree,
    isLoading,
    refreshNavigations,
    searchDraft,
    setSearchDraft,
    activeSearch,
    handleSearchClick,
    handleSearchClear,
    matchingNodeIds,
    expandedNodeIds,
    toggleExpand,
    handleExpandAll,
    handleCollapseAll,
    feedback,
    setFeedback,
    isFormOpen,
    formMode,
    itemToEdit: itemToEdit
      ? itemToEdit
      : defaultParentId
      ? ({ parentId: defaultParentId } as NavigationItem)
      : null,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeFormModal,
    handleCreateNavigation,
    handleUpdateNavigation,
    isDeleteOpen,
    itemToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteNavigation,
    getParentDropdownOptions,
  };
}
