"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { isSessionExpiredError } from "@/features/auth";
import {
  SystemConfigItem,
  SystemConfigFeedback,
  SystemConfigGroupOption,
} from "../types/system-config.types";
import {
  getAllSystemConfigsApi,
  updateSystemConfigValueApi,
} from "../services/systemConfigApi";
import {
  getGroupDisplayInfo,
  validateConfigValue,
} from "../utils/systemConfigMeta.helper";

export interface UseSystemConfigManagementProps {
  canRead?: boolean;
  canUpdate?: boolean;
}

export interface UseSystemConfigManagementReturn {
  configs: SystemConfigItem[];
  groupedConfigs: Array<{ groupKey: string; items: SystemConfigItem[] }>;
  groupOptions: SystemConfigGroupOption[];
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  draftValues: Record<string, string>;
  validationErrors: Record<string, string | null>;
  savingIds: Record<string, boolean>;
  isSavingAll: boolean;
  dirtyIds: string[];
  feedback: SystemConfigFeedback | null;
  setFeedback: React.Dispatch<React.SetStateAction<SystemConfigFeedback | null>>;
  handleDraftChange: (id: string, value: string) => void;
  handleResetItem: (id: string) => void;
  handleResetAll: () => void;
  handleSaveItem: (id: string) => Promise<boolean>;
  handleSaveAll: () => Promise<boolean>;
  refreshConfigs: () => Promise<void>;
}

const GROUP_SORT_ORDER = ["AUTH", "LOAN"];

export function useSystemConfigManagement({
  canRead = true,
  canUpdate = false,
}: UseSystemConfigManagementProps = {}): UseSystemConfigManagementReturn {
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [feedback, setFeedback] = useState<SystemConfigFeedback | null>(null);

  const syncConfigsToState = useCallback((items: SystemConfigItem[]) => {
    setConfigs(items);
    const nextDrafts: Record<string, string> = {};
    for (const item of items) {
      nextDrafts[item.id] = item.value ?? "";
    }
    setDraftValues(nextDrafts);
    setValidationErrors({});
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      if (!canRead) {
        if (isMounted) {
          setConfigs([]);
          setDraftValues({});
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getAllSystemConfigsApi();
        if (!isMounted) return;
        syncConfigsToState(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (isSessionExpiredError(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Lỗi khi tải danh sách cấu hình hệ thống";
        setFeedback({ type: "error", message: msg });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [canRead, syncConfigsToState]);

  const refreshConfigs = useCallback(async () => {
    if (!canRead) return;
    setIsRefreshing(true);
    try {
      const data = await getAllSystemConfigsApi();
      syncConfigsToState(data);
      setFeedback({
        type: "success",
        message: "Đã làm mới danh sách cấu hình hệ thống",
      });
    } catch (err: unknown) {
      if (isSessionExpiredError(err)) return;
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể làm mới danh sách cấu hình hệ thống";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsRefreshing(false);
    }
  }, [canRead, syncConfigsToState]);

  const groupOptions = useMemo<SystemConfigGroupOption[]>(() => {
    const counts = new Map<string, number>();
    for (const item of configs) {
      const key = (item.group || "OTHER").toUpperCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const sortedKeys = Array.from(counts.keys()).sort((a, b) => {
      const idxA = GROUP_SORT_ORDER.indexOf(a);
      const idxB = GROUP_SORT_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return [
      { key: "ALL", label: "Tất cả", count: configs.length },
      ...sortedKeys.map((key) => ({
        key,
        label: getGroupDisplayInfo(key).shortLabel,
        count: counts.get(key) ?? 0,
      })),
    ];
  }, [configs]);

  const groupedConfigs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = configs.filter((item) => {
      const groupKey = (item.group || "OTHER").toUpperCase();
      if (selectedGroup !== "ALL" && groupKey !== selectedGroup) {
        return false;
      }
      if (!keyword) return true;
      return (
        item.key.toLowerCase().includes(keyword) ||
        (item.description ?? "").toLowerCase().includes(keyword) ||
        item.value.toLowerCase().includes(keyword)
      );
    });

    const map = new Map<string, SystemConfigItem[]>();
    for (const item of filtered) {
      const groupKey = (item.group || "OTHER").toUpperCase();
      const list = map.get(groupKey) ?? [];
      list.push(item);
      map.set(groupKey, list);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const idxA = GROUP_SORT_ORDER.indexOf(a);
        const idxB = GROUP_SORT_ORDER.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      })
      .map(([groupKey, items]) => ({ groupKey, items }));
  }, [configs, selectedGroup, searchTerm]);

  const dirtyIds = useMemo(() => {
    return configs
      .filter((item) => {
        const draft = draftValues[item.id];
        return draft !== undefined && draft.trim() !== item.value.trim();
      })
      .map((item) => item.id);
  }, [configs, draftValues]);

  const handleDraftChange = useCallback(
    (id: string, value: string) => {
      if (!canUpdate) return;
      setDraftValues((prev) => ({ ...prev, [id]: value }));

      const target = configs.find((item) => item.id === id);
      if (target) {
        const error = validateConfigValue(value, target.valueType);
        setValidationErrors((prev) => ({ ...prev, [id]: error }));
      }
    },
    [canUpdate, configs]
  );

  const handleResetItem = useCallback(
    (id: string) => {
      const target = configs.find((item) => item.id === id);
      if (!target) return;
      setDraftValues((prev) => ({ ...prev, [id]: target.value }));
      setValidationErrors((prev) => ({ ...prev, [id]: null }));
    },
    [configs]
  );

  const handleResetAll = useCallback(() => {
    const nextDrafts: Record<string, string> = {};
    for (const item of configs) {
      nextDrafts[item.id] = item.value;
    }
    setDraftValues(nextDrafts);
    setValidationErrors({});
  }, [configs]);

  const handleSaveItem = useCallback(
    async (id: string): Promise<boolean> => {
      if (!canUpdate) return false;
      const target = configs.find((item) => item.id === id);
      if (!target) return false;

      const nextValue = (draftValues[id] ?? "").trim();
      const error = validateConfigValue(nextValue, target.valueType);
      if (error) {
        setValidationErrors((prev) => ({ ...prev, [id]: error }));
        setFeedback({ type: "error", message: `${target.key}: ${error}` });
        return false;
      }

      setSavingIds((prev) => ({ ...prev, [id]: true }));
      try {
        const updated = await updateSystemConfigValueApi(id, { value: nextValue });
        setConfigs((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
        );
        setDraftValues((prev) => ({ ...prev, [id]: updated.value }));
        setValidationErrors((prev) => ({ ...prev, [id]: null }));
        setFeedback({
          type: "success",
          message: `Đã cập nhật cấu hình ${target.key} thành ${updated.value}`,
        });
        return true;
      } catch (err: unknown) {
        if (isSessionExpiredError(err)) return false;
        const msg =
          err instanceof Error
            ? err.message
            : `Cập nhật cấu hình ${target.key} thất bại`;
        setFeedback({ type: "error", message: msg });
        return false;
      } finally {
        setSavingIds((prev) => ({ ...prev, [id]: false }));
      }
    },
    [canUpdate, configs, draftValues]
  );

  const handleSaveAll = useCallback(async (): Promise<boolean> => {
    if (!canUpdate || dirtyIds.length === 0) return false;

    const nextErrors: Record<string, string | null> = {};
    let hasValidationError = false;

    for (const id of dirtyIds) {
      const target = configs.find((item) => item.id === id);
      if (!target) continue;
      const err = validateConfigValue(draftValues[id] ?? "", target.valueType);
      nextErrors[id] = err;
      if (err) hasValidationError = true;
    }

    if (hasValidationError) {
      setValidationErrors((prev) => ({ ...prev, ...nextErrors }));
      setFeedback({
        type: "error",
        message: "Vui lòng kiểm tra lại các giá trị cấu hình chưa hợp lệ trước khi lưu",
      });
      return false;
    }

    setIsSavingAll(true);
    let successCount = 0;
    const failedKeys: string[] = [];

    try {
      for (const id of dirtyIds) {
        const target = configs.find((item) => item.id === id);
        if (!target) continue;
        const nextValue = (draftValues[id] ?? "").trim();

        setSavingIds((prev) => ({ ...prev, [id]: true }));
        try {
          const updated = await updateSystemConfigValueApi(id, { value: nextValue });
          setConfigs((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
          );
          setDraftValues((prev) => ({ ...prev, [id]: updated.value }));
          setValidationErrors((prev) => ({ ...prev, [id]: null }));
          successCount++;
        } catch (err: unknown) {
          if (isSessionExpiredError(err)) return false;
          failedKeys.push(target.key);
        } finally {
          setSavingIds((prev) => ({ ...prev, [id]: false }));
        }
      }

      if (failedKeys.length === 0) {
        setFeedback({
          type: "success",
          message: `Đã lưu thành công ${successCount} thông số cấu hình hệ thống`,
        });
        return true;
      }

      setFeedback({
        type: "error",
        message: `Đã lưu ${successCount} cấu hình, thất bại với: ${failedKeys.join(", ")}`,
      });
      return false;
    } finally {
      setIsSavingAll(false);
    }
  }, [canUpdate, configs, dirtyIds, draftValues]);

  return {
    configs,
    groupedConfigs,
    groupOptions,
    selectedGroup,
    setSelectedGroup,
    searchTerm,
    setSearchTerm,
    isLoading,
    isRefreshing,
    draftValues,
    validationErrors,
    savingIds,
    isSavingAll,
    dirtyIds,
    feedback,
    setFeedback,
    handleDraftChange,
    handleResetItem,
    handleResetAll,
    handleSaveItem,
    handleSaveAll,
    refreshConfigs,
  };
}
