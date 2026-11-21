"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PermissionItem,
  RoleItem,
  PermissionDiffItem,
  RolePermissionMap,
} from "../types/permission.types";
import {
  getAllPermissionsApi,
  getPermissionsByRoleIdApi,
  getRolesApi,
  assignPermissionToRoleApi,
  removePermissionFromRoleApi,
} from "../services/permissionApi";
import { formatPermissionDisplay } from "../utils/permissionLabel.helper";
import { fetchAndStorePermissions, isSessionExpiredError } from "@/features/auth";

export interface UsePermissionMatrixProps {
  canAssign?: boolean;
}

export interface UsePermissionMatrixReturn {
  // Data
  roles: RoleItem[];
  permissions: PermissionItem[];
  filteredPermissions: PermissionItem[];
  modules: string[];
  selectedModule: string;
  setSelectedModule: (mod: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Matrix state
  hasPermissionInMatrix: (roleId: string, permissionId: string) => boolean;
  toggleCell: (roleId: string, permissionId: string) => void;
  toggleRow: (permissionId: string) => void;
  toggleColumn: (roleId: string) => void;
  isRowFullyChecked: (permissionId: string) => boolean;
  isColumnFullyChecked: (roleId: string) => boolean;

  // Loading & Saving
  isLoading: boolean;
  isSaving: boolean;

  // Diff
  addedDiff: PermissionDiffItem[];
  removedDiff: PermissionDiffItem[];
  hasChanges: boolean;

  // Actions
  handleSaveChanges: () => Promise<void>;
  handleResetChanges: () => void;
  reloadMatrix: () => Promise<void>;

  // Feedback banner
  feedback: { type: "success" | "error" | "info"; message: string } | null;
  setFeedback: React.Dispatch<
    React.SetStateAction<{ type: "success" | "error" | "info"; message: string } | null>
  >;
}

export function usePermissionMatrix({
  canAssign = true,
}: UsePermissionMatrixProps = {}): UsePermissionMatrixReturn {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);

  // initialMatrix vs currentMatrix: { [roleId]: Set<permissionId> }
  const [initialMatrix, setInitialMatrix] = useState<RolePermissionMap>({});
  const [currentMatrix, setCurrentMatrix] = useState<RolePermissionMap>({});

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Tải lại dữ liệu (dùng cho sau khi lưu hoặc gọi lại từ bên ngoài)
  const reloadMatrix = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const [rolesData, permsData] = await Promise.all([
        getRolesApi(),
        getAllPermissionsApi(),
      ]);

      setRoles(rolesData);
      setPermissions(permsData);

      const rolePermMap: RolePermissionMap = {};
      await Promise.all(
        rolesData.map(async (r) => {
          try {
            const rolePerms = await getPermissionsByRoleIdApi(r.id);
            rolePermMap[r.id] = new Set(rolePerms.map((p) => p.id));
          } catch {
            rolePermMap[r.id] = new Set();
          }
        })
      );

      const matrixCopy: RolePermissionMap = {};
      for (const roleId in rolePermMap) {
        matrixCopy[roleId] = new Set(rolePermMap[roleId]);
      }

      setInitialMatrix(rolePermMap);
      setCurrentMatrix(matrixCopy);
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải ma trận phân quyền hệ thống";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Khởi tạo dữ liệu ban đầu
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [rolesData, permsData] = await Promise.all([
          getRolesApi(),
          getAllPermissionsApi(),
        ]);

        if (!isMounted) return;
        setRoles(rolesData);
        setPermissions(permsData);

        const rolePermMap: RolePermissionMap = {};
        await Promise.all(
          rolesData.map(async (r) => {
            try {
              const rolePerms = await getPermissionsByRoleIdApi(r.id);
              rolePermMap[r.id] = new Set(rolePerms.map((p) => p.id));
            } catch {
              rolePermMap[r.id] = new Set();
            }
          })
        );

        if (!isMounted) return;
        const matrixCopy: RolePermissionMap = {};
        for (const roleId in rolePermMap) {
          matrixCopy[roleId] = new Set(rolePermMap[roleId]);
        }

        setInitialMatrix(rolePermMap);
        setCurrentMatrix(matrixCopy);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải ma trận phân quyền hệ thống";
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
  }, []);

  // Danh sách các Module duy nhất
  const modules = useMemo(() => {
    const set = new Set<string>();
    permissions.forEach((p) => {
      const formatted = formatPermissionDisplay(p.code, p.description);
      set.add(formatted.module);
    });
    return Array.from(set).sort();
  }, [permissions]);

  // Lọc danh sách Permissions theo Search và Module
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const formatted = formatPermissionDisplay(p.code, p.description);

      // Lọc theo module
      if (selectedModule !== "ALL" && formatted.module !== selectedModule) {
        return false;
      }

      // Lọc theo search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesCode = p.code.toLowerCase().includes(term);
        const matchesDesc = (p.description || "").toLowerCase().includes(term);
        const matchesDisplay = formatted.displayText.toLowerCase().includes(term);
        return matchesCode || matchesDesc || matchesDisplay;
      }

      return true;
    });
  }, [permissions, selectedModule, searchTerm]);

  // Kiểm tra 1 ô xem vai trò có quyền không
  const hasPermissionInMatrix = useCallback(
    (roleId: string, permissionId: string): boolean => {
      return !!currentMatrix[roleId]?.has(permissionId);
    },
    [currentMatrix]
  );

  // Toggle 1 ô (cell)
  const toggleCell = useCallback(
    (roleId: string, permissionId: string) => {
      if (!canAssign) return;

      setCurrentMatrix((prev) => {
        const roleSet = new Set(prev[roleId] || []);
        if (roleSet.has(permissionId)) {
          roleSet.delete(permissionId);
        } else {
          roleSet.add(permissionId);
        }

        return {
          ...prev,
          [roleId]: roleSet,
        };
      });
    },
    [canAssign]
  );

  // Toggle toàn bộ hàng (1 permission cho tất cả roles)
  const toggleRow = useCallback(
    (permissionId: string) => {
      if (!canAssign || roles.length === 0) return;

      // Kiểm tra xem hiện tại tất cả roles đã có quyền này chưa
      const allChecked = roles.every((r) => currentMatrix[r.id]?.has(permissionId));

      setCurrentMatrix((prev) => {
        const next: RolePermissionMap = { ...prev };
        roles.forEach((r) => {
          const roleSet = new Set(next[r.id] || []);
          if (allChecked) {
            roleSet.delete(permissionId);
          } else {
            roleSet.add(permissionId);
          }
          next[r.id] = roleSet;
        });
        return next;
      });
    },
    [canAssign, roles, currentMatrix]
  );

  // Toggle toàn bộ cột (tất cả permissions cho 1 role)
  const toggleColumn = useCallback(
    (roleId: string) => {
      if (!canAssign || permissions.length === 0) return;

      const currentRoleSet = currentMatrix[roleId] || new Set();
      const allChecked = permissions.every((p) => currentRoleSet.has(p.id));

      setCurrentMatrix((prev) => {
        const roleSet = new Set<string>();
        if (!allChecked) {
          permissions.forEach((p) => roleSet.add(p.id));
        }
        return {
          ...prev,
          [roleId]: roleSet,
        };
      });
    },
    [canAssign, permissions, currentMatrix]
  );

  const isRowFullyChecked = useCallback(
    (permissionId: string): boolean => {
      if (roles.length === 0) return false;
      return roles.every((r) => currentMatrix[r.id]?.has(permissionId));
    },
    [roles, currentMatrix]
  );

  const isColumnFullyChecked = useCallback(
    (roleId: string): boolean => {
      if (permissions.length === 0) return false;
      const roleSet = currentMatrix[roleId];
      if (!roleSet) return false;
      return permissions.every((p) => roleSet.has(p.id));
    },
    [permissions, currentMatrix]
  );

  // Tính toán Diff thay đổi giữa initialMatrix và currentMatrix
  const { addedDiff, removedDiff, hasChanges } = useMemo(() => {
    const added: PermissionDiffItem[] = [];
    const removed: PermissionDiffItem[] = [];

    const permMap = new Map(permissions.map((p) => [p.id, p.code]));
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    roles.forEach((r) => {
      const initialSet = initialMatrix[r.id] || new Set();
      const currentSet = currentMatrix[r.id] || new Set();

      // Thêm mới
      currentSet.forEach((permId) => {
        if (!initialSet.has(permId)) {
          added.push({
            roleId: r.id,
            permissionId: permId,
            permissionCode: permMap.get(permId) || permId,
            roleName: roleMap.get(r.id) || r.name,
          });
        }
      });

      // Gỡ bỏ
      initialSet.forEach((permId) => {
        if (!currentSet.has(permId)) {
          removed.push({
            roleId: r.id,
            permissionId: permId,
            permissionCode: permMap.get(permId) || permId,
            roleName: roleMap.get(r.id) || r.name,
          });
        }
      });
    });

    return {
      addedDiff: added,
      removedDiff: removed,
      hasChanges: added.length > 0 || removed.length > 0,
    };
  }, [roles, permissions, initialMatrix, currentMatrix]);

  // Hoàn tác thay đổi
  const handleResetChanges = useCallback(() => {
    const resetCopy: RolePermissionMap = {};
    for (const roleId in initialMatrix) {
      resetCopy[roleId] = new Set(initialMatrix[roleId]);
    }
    setCurrentMatrix(resetCopy);
    setFeedback({
      type: "info",
      message: "Đã hoàn tác các thay đổi chưa lưu về cấu hình ban đầu.",
    });
  }, [initialMatrix]);

  // Lưu các thay đổi Diff theo lô
  const handleSaveChanges = useCallback(async () => {
    if (!hasChanges || !canAssign) return;

    setIsSaving(true);
    setFeedback(null);

    let addedSuccess = 0;
    let removedSuccess = 0;
    const errors: string[] = [];

    try {
      // 1. Gán thêm quyền (POST auth/roles/permissions)
      for (const item of addedDiff) {
        try {
          await assignPermissionToRoleApi(item.roleId, item.permissionId);
          addedSuccess++;
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : "Lỗi thêm";
          errors.push(`Gán [${item.permissionCode}] cho [${item.roleName}]: ${detail}`);
        }
      }

      // 2. Xóa bỏ quyền (DELETE auth/roles/permissions)
      for (const item of removedDiff) {
        try {
          await removePermissionFromRoleApi(item.roleId, item.permissionId);
          removedSuccess++;
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : "Lỗi gỡ";
          errors.push(`Gỡ [${item.permissionCode}] khỏi [${item.roleName}]: ${detail}`);
        }
      }

      // 3. Tải lại dữ liệu đồng bộ
      await reloadMatrix();

      // 4. Đồng bộ quyền hạn mới nhất cho người dùng đang thao tác và xóa cache của Next.js Router
      try {
        await fetchAndStorePermissions();
        router.refresh();
      } catch (syncErr) {
        console.warn("[usePermissionMatrix] Không thể làm mới quyền hạn phiên hiện tại:", syncErr);
      }

      if (errors.length === 0) {
        setFeedback({
          type: "success",
          message: `Lưu ma trận phân quyền thành công! (+${addedSuccess} thêm mới, -${removedSuccess} gỡ bỏ)`,
        });
      } else {
        setFeedback({
          type: "error",
          message: `Đã cập nhật một phần (+${addedSuccess}, -${removedSuccess}). Có ${errors.length} lỗi: ${errors[0]}`,
        });
      }
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi không xác định khi lưu ma trận";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, canAssign, addedDiff, removedDiff, reloadMatrix]);

  return {
    roles,
    permissions,
    filteredPermissions,
    modules,
    selectedModule,
    setSelectedModule,
    searchTerm,
    setSearchTerm,
    hasPermissionInMatrix,
    toggleCell,
    toggleRow,
    toggleColumn,
    isRowFullyChecked,
    isColumnFullyChecked,
    isLoading,
    isSaving,
    addedDiff,
    removedDiff,
    hasChanges,
    handleSaveChanges,
    handleResetChanges,
    reloadMatrix,
    feedback,
    setFeedback,
  };
}
