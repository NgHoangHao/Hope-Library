"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  NavigationTreeItem,
  RoleItem,
  FlatNodeMap,
} from "../types/navigation.types";
import {
  getAllNavigationTreeApi,
  getNavigationsByRoleIdApi,
  getRolesApi,
  assignNavigationToRoleApi,
  removeNavigationFromRoleApi,
} from "../services/navigationApi";
import { isSessionExpiredError } from "@/features/auth";

export interface UseRoleNavigationsProps {
  canAssign?: boolean;
}

export interface UseRoleNavigationsReturn {
  // Data
  roles: RoleItem[];
  selectedRole: RoleItem | null;
  setSelectedRole: (role: RoleItem | null) => void;
  navigationTree: NavigationTreeItem[];
  flatMap: FlatNodeMap;
  allLeafIds: string[];
  initialLeafIds: Set<string>;
  currentLeafIds: Set<string>;
  roleMenuCounts: Record<string, number>;

  // Loading
  isLoadingRoles: boolean;
  isLoadingTree: boolean;
  isLoadingRoleNavs: boolean;
  isSaving: boolean;

  // Diff
  addedLeafIds: string[];
  removedLeafIds: string[];
  hasChanges: boolean;

  // Feedback & State
  feedback: { type: "success" | "error" | "info"; message: string } | null;
  setFeedback: React.Dispatch<
    React.SetStateAction<{ type: "success" | "error" | "info"; message: string } | null>
  >;

  // Selection actions
  getNodeCheckState: (nodeId: string) => "checked" | "unchecked" | "indeterminate";
  handleToggleNode: (nodeId: string) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleResetChanges: () => void;

  // Role actions
  handleSelectRole: (role: RoleItem) => void;
  pendingRoleSwitch: RoleItem | null;
  confirmRoleSwitch: (discard: boolean) => void;

  // Save & Clone
  handleSaveChanges: () => Promise<void>;
  handleApplyClone: (sourceRoleId: string) => Promise<void>;

  // Preview
  previewSidebarTree: NavigationTreeItem[];
}

export function useRoleNavigations({
  canAssign = true,
}: UseRoleNavigationsProps = {}): UseRoleNavigationsReturn {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [navigationTree, setNavigationTree] = useState<NavigationTreeItem[]>([]);

  // State các leaf IDs được tick: Ban đầu từ DB vs Hiện tại đang sửa
  const [initialLeafIds, setInitialLeafIds] = useState<Set<string>>(new Set());
  const [currentLeafIds, setCurrentLeafIds] = useState<Set<string>>(new Set());

  // Thống kê số lượng menu gán cho từng role
  const [roleMenuCounts, setRoleMenuCounts] = useState<Record<string, number>>({});

  // Loading states
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingRoleNavs, setIsLoadingRoleNavs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Role switch confirmation
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<RoleItem | null>(null);

  // =========================================================================
  // 1. Phân tích cấu trúc phẳng của cây (Pre-indexing)
  // =========================================================================
  const { flatMap, allLeafIds } = useMemo(() => {
    const map: FlatNodeMap = {};
    const leaves: string[] = [];

    function traverse(node: NavigationTreeItem, parentId: string | null): string[] {
      const childLeaves: string[] = [];
      const childIds: string[] = [];

      if (!node.children || node.children.length === 0) {
        leaves.push(node.id);
        childLeaves.push(node.id);
        map[node.id] = {
          item: node,
          parentId,
          childIds: [],
          leafIds: [node.id],
          isLeaf: true,
        };
      } else {
        for (const child of node.children) {
          childIds.push(child.id);
          const subLeaves = traverse(child, node.id);
          childLeaves.push(...subLeaves);
        }
        map[node.id] = {
          item: node,
          parentId,
          childIds,
          leafIds: childLeaves,
          isLeaf: false,
        };
      }

      return childLeaves;
    }

    for (const root of navigationTree) {
      traverse(root, null);
    }

    return { flatMap: map, allLeafIds: leaves };
  }, [navigationTree]);

  // =========================================================================
  // 2. Tải dữ liệu ban đầu: Danh sách vai trò & Cây menu hệ thống
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      setIsLoadingRoles(true);
      setIsLoadingTree(true);

      try {
        const [rolesData, treeData] = await Promise.all([
          getRolesApi(),
          getAllNavigationTreeApi(),
        ]);

        if (!isMounted) return;

        setRoles(rolesData);
        setNavigationTree(treeData);

        if (rolesData.length > 0) {
          const defaultRole =
            rolesData.find((r) => r.name.toUpperCase() === "ADMIN") || rolesData[0];
          setSelectedRole(defaultRole);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg = err instanceof Error ? err.message : "Lỗi khi tải dữ liệu ban đầu";
        setFeedback({ type: "error", message: msg });
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
          setIsLoadingTree(false);
        }
      }
    }

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================================
  // 3. Tải danh sách menu của Role đang chọn
  // =========================================================================
  const fetchRoleNavigations = useCallback(
    async (roleId: string) => {
      setIsLoadingRoleNavs(true);
      setFeedback(null);
      try {
        const assignedNavs = await getNavigationsByRoleIdApi(roleId);

        // Chỉ lưu và đánh dấu các menu lá được gán
        const validLeafIds = new Set<string>();
        for (const nav of assignedNavs) {
          if (flatMap[nav.id]?.isLeaf) {
            validLeafIds.add(nav.id);
          }
        }

        setInitialLeafIds(validLeafIds);
        setCurrentLeafIds(new Set(validLeafIds));
        setRoleMenuCounts((prev) => ({
          ...prev,
          [roleId]: validLeafIds.size,
        }));
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách menu của vai trò được chọn";
        setFeedback({ type: "error", message: msg });
        setInitialLeafIds(new Set());
        setCurrentLeafIds(new Set());
      } finally {
        setIsLoadingRoleNavs(false);
      }
    },
    [flatMap]
  );

  useEffect(() => {
    let isMounted = true;
    if (!selectedRole || Object.keys(flatMap).length === 0) return;

    const roleId = selectedRole.id;
    getNavigationsByRoleIdApi(roleId)
      .then((assignedNavs) => {
        if (!isMounted) return;
        const validLeafIds = new Set<string>();
        for (const nav of assignedNavs) {
          if (flatMap[nav.id]?.isLeaf) {
            validLeafIds.add(nav.id);
          }
        }
        setInitialLeafIds(validLeafIds);
        setCurrentLeafIds(new Set(validLeafIds));
        setRoleMenuCounts((prev) => ({
          ...prev,
          [roleId]: validLeafIds.size,
        }));
        setIsLoadingRoleNavs(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách menu của vai trò được chọn";
        setFeedback({ type: "error", message: msg });
        setInitialLeafIds(new Set());
        setCurrentLeafIds(new Set());
        setIsLoadingRoleNavs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRole, flatMap]);

  // =========================================================================
  // 4. Tính toán Diff thay đổi (Pending changes)
  // =========================================================================
  const { addedLeafIds, removedLeafIds, hasChanges } = useMemo(() => {
    const added: string[] = [];
    const removed: string[] = [];

    currentLeafIds.forEach((id) => {
      if (!initialLeafIds.has(id)) {
        added.push(id);
      }
    });

    initialLeafIds.forEach((id) => {
      if (!currentLeafIds.has(id)) {
        removed.push(id);
      }
    });

    return {
      addedLeafIds: added,
      removedLeafIds: removed,
      hasChanges: added.length > 0 || removed.length > 0,
    };
  }, [initialLeafIds, currentLeafIds]);

  // =========================================================================
  // 5. Kiểm tra trạng thái Tri-state của 1 Node
  // =========================================================================
  const getNodeCheckState = useCallback(
    (nodeId: string): "checked" | "unchecked" | "indeterminate" => {
      const nodeInfo = flatMap[nodeId];
      if (!nodeInfo) return "unchecked";

      if (nodeInfo.isLeaf) {
        return currentLeafIds.has(nodeId) ? "checked" : "unchecked";
      }

      const totalLeaves = nodeInfo.leafIds.length;
      if (totalLeaves === 0) return "unchecked";

      let checkedCount = 0;
      for (const leafId of nodeInfo.leafIds) {
        if (currentLeafIds.has(leafId)) {
          checkedCount++;
        }
      }

      if (checkedCount === 0) return "unchecked";
      if (checkedCount === totalLeaves) return "checked";
      return "indeterminate";
    },
    [flatMap, currentLeafIds]
  );

  // =========================================================================
  // 6. Xử lý Toggle Checkbox (Tri-state click)
  // =========================================================================
  const handleToggleNode = useCallback(
    (nodeId: string) => {
      if (!canAssign) return;

      const nodeInfo = flatMap[nodeId];
      if (!nodeInfo) return;

      setCurrentLeafIds((prev) => {
        const next = new Set(prev);

        if (nodeInfo.isLeaf) {
          if (next.has(nodeId)) {
            next.delete(nodeId);
          } else {
            next.add(nodeId);
          }
        } else {
          const currentState = getNodeCheckState(nodeId);
          if (currentState === "checked") {
            for (const leafId of nodeInfo.leafIds) {
              next.delete(leafId);
            }
          } else {
            for (const leafId of nodeInfo.leafIds) {
              next.add(leafId);
            }
          }
        }

        return next;
      });
    },
    [canAssign, flatMap, getNodeCheckState]
  );

  const handleSelectAll = () => {
    if (!canAssign) return;
    setCurrentLeafIds(new Set(allLeafIds));
  };

  const handleDeselectAll = () => {
    if (!canAssign) return;
    setCurrentLeafIds(new Set());
  };

  const handleResetChanges = () => {
    setCurrentLeafIds(new Set(initialLeafIds));
    setFeedback({
      type: "info",
      message: "Đã hoàn tác các thay đổi chưa lưu về cấu hình ban đầu.",
    });
  };

  // =========================================================================
  // 7. Chuyển đổi vai trò an toàn (Cảnh báo khi chưa lưu)
  // =========================================================================
  const handleSelectRole = (role: RoleItem) => {
    if (selectedRole?.id === role.id) return;

    if (hasChanges) {
      setPendingRoleSwitch(role);
    } else {
      setSelectedRole(role);
    }
  };

  const confirmRoleSwitch = (discard: boolean) => {
    if (discard && pendingRoleSwitch) {
      setSelectedRole(pendingRoleSwitch);
      setPendingRoleSwitch(null);
    } else {
      setPendingRoleSwitch(null);
    }
  };

  // =========================================================================
  // 8. Lưu thay đổi theo lô (Batch Save Diff)
  // =========================================================================
  const handleSaveChanges = async () => {
    if (!selectedRole || !hasChanges || !canAssign) return;

    setIsSaving(true);
    setFeedback(null);

    const roleId = selectedRole.id;
    let addedSuccess = 0;
    let removedSuccess = 0;
    const errors: string[] = [];

    try {
      // 1. Thêm các menu mới (POST auth/roles/navigations)
      for (const navId of addedLeafIds) {
        try {
          await assignNavigationToRoleApi(roleId, navId);
          addedSuccess++;
        } catch (err: unknown) {
          const errDetail = err instanceof Error ? err.message : "Lỗi thêm";
          errors.push(`Thêm menu [${flatMap[navId]?.item.name || navId}]: ${errDetail}`);
        }
      }

      // 2. Xóa các menu bị gỡ (DELETE auth/roles/navigations)
      for (const navId of removedLeafIds) {
        try {
          await removeNavigationFromRoleApi(roleId, navId);
          removedSuccess++;
        } catch (err: unknown) {
          const errDetail = err instanceof Error ? err.message : "Lỗi xóa";
          errors.push(`Gỡ menu [${flatMap[navId]?.item.name || navId}]: ${errDetail}`);
        }
      }

      // 3. Tải lại dữ liệu chuẩn từ server
      await fetchRoleNavigations(roleId);

      if (errors.length === 0) {
        setFeedback({
          type: "success",
          message: `Lưu cấu hình menu cho vai trò "${selectedRole.name}" thành công! (+${addedSuccess} thêm mới, -${removedSuccess} gỡ bỏ)`,
        });
      } else {
        setFeedback({
          type: "error",
          message: `Cập nhật một phần: Thành công (+${addedSuccess}, -${removedSuccess}). Có ${errors.length} lỗi phát sinh: ${errors[0]}`,
        });
      }
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi không xác định khi lưu thay đổi";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // 9. Sao chép quyền từ vai trò khác (Clone Role Navigations)
  // =========================================================================
  const handleApplyClone = async (sourceRoleId: string) => {
    const sourceNavs = await getNavigationsByRoleIdApi(sourceRoleId);
    const clonedLeafIds = new Set<string>();

    for (const nav of sourceNavs) {
      if (flatMap[nav.id]?.isLeaf) {
        clonedLeafIds.add(nav.id);
      }
    }

    setCurrentLeafIds(clonedLeafIds);
    const sourceRole = roles.find((r) => r.id === sourceRoleId);
    setFeedback({
      type: "info",
      message: `Đã sao chép cấu hình từ vai trò "${sourceRole?.name}". Vui lòng kiểm tra và bấm "Lưu thay đổi" để áp dụng.`,
    });
  };

  // =========================================================================
  // 10. Dữ liệu cho Live Sidebar Preview
  // =========================================================================
  const previewSidebarTree = useMemo(() => {
    function filterActiveLeaves(nodes: NavigationTreeItem[]): NavigationTreeItem[] {
      return nodes
        .map((node) => {
          if (!node.children || node.children.length === 0) {
            return currentLeafIds.has(node.id) ? node : null;
          }

          const validChildren = filterActiveLeaves(node.children);
          if (validChildren.length > 0) {
            return {
              ...node,
              children: validChildren,
            };
          }
          return null;
        })
        .filter((n): n is NavigationTreeItem => n !== null);
    }

    return filterActiveLeaves(navigationTree);
  }, [navigationTree, currentLeafIds]);

  return {
    roles,
    selectedRole,
    setSelectedRole,
    navigationTree,
    flatMap,
    allLeafIds,
    initialLeafIds,
    currentLeafIds,
    roleMenuCounts,
    isLoadingRoles,
    isLoadingTree,
    isLoadingRoleNavs,
    isSaving,
    addedLeafIds,
    removedLeafIds,
    hasChanges,
    feedback,
    setFeedback,
    getNodeCheckState,
    handleToggleNode,
    handleSelectAll,
    handleDeselectAll,
    handleResetChanges,
    handleSelectRole,
    pendingRoleSwitch,
    confirmRoleSwitch,
    handleSaveChanges,
    handleApplyClone,
    previewSidebarTree,
  };
}
