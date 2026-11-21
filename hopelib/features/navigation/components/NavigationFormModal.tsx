"use client";

import React, { useState } from "react";
import { X, FolderTree, Loader2 } from "lucide-react";
import {
  NavigationItem,
  CreateNavigationDto,
  UpdateNavigationDto,
} from "../types/navigation.types";
import { DynamicIcon, NAVIGATION_ICON_OPTIONS } from "./DynamicIcon";
import { cn } from "@/lib/utils";

export interface NavigationFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  item?: NavigationItem | null;
  parentOptions: NavigationItem[];
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (dto: CreateNavigationDto) => Promise<boolean>;
  onUpdate: (id: string, dto: UpdateNavigationDto) => Promise<boolean>;
}

interface FormContentProps {
  mode: "create" | "edit";
  item?: NavigationItem | null;
  parentOptions: NavigationItem[];
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (dto: CreateNavigationDto) => Promise<boolean>;
  onUpdate: (id: string, dto: UpdateNavigationDto) => Promise<boolean>;
}

const ICON_GROUPS = [
  "Tất cả",
  "Tổng quan",
  "Sách & Mượn trả",
  "Người dùng",
  "Hệ thống",
] as const;

type IconGroupFilter = (typeof ICON_GROUPS)[number];

function NavigationFormContent({
  mode,
  item,
  parentOptions,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: FormContentProps) {
  const [name, setName] = useState(item?.name || "");
  const [code, setCode] = useState(item?.code || "");
  const [parentId, setParentId] = useState(item?.parentId || "");
  const [path, setPath] = useState(item?.path || "");
  const [icon, setIcon] = useState(item?.icon || "");
  const [sortOrder, setSortOrder] = useState<number | "">(item?.sortOrder ?? 0);
  const [isVisible, setIsVisible] = useState<boolean>(item?.isVisible ?? true);
  const [isActive, setIsActive] = useState<boolean>(item?.isActive ?? true);
  const [iconGroup, setIconGroup] = useState<IconGroupFilter>("Tất cả");

  const [validationError, setValidationError] = useState<string | null>(null);

  const normalizedIcon = icon.trim().toLowerCase().replace(/[-_\s]/g, "");
  const filteredIconOptions =
    iconGroup === "Tất cả"
      ? NAVIGATION_ICON_OPTIONS
      : NAVIGATION_ICON_OPTIONS.filter((opt) => opt.group === iconGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setValidationError("Tên menu không được để trống");
      return;
    }

    if (!code.trim()) {
      setValidationError("Mã điều hướng (code) không được để trống");
      return;
    }

    setValidationError(null);

    if (mode === "create") {
      await onCreate({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        parentId: parentId || null,
        path: path.trim() || undefined,
        icon: icon.trim() || undefined,
        sortOrder: sortOrder !== "" ? Number(sortOrder) : 0,
        isVisible,
        isActive,
      });
    } else if (item) {
      await onUpdate(item.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        parentId: parentId || null,
        path: path.trim() || null,
        icon: icon.trim() || null,
        sortOrder: sortOrder !== "" ? Number(sortOrder) : 0,
        isVisible,
        isActive,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {validationError && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {validationError}
          </div>
        )}

        {/* Tên Menu & Mã Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tên menu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Ví dụ: Quản lý thể loại"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Mã điều hướng (Code) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitting}
              placeholder="NAV_BOOK_CATEGORIES"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>
        </div>

        {/* Dropdown chọn menu cha (Tận dụng mảng gốc phẳng) */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Menu cha (Parent Menu)
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all cursor-pointer"
          >
            <option value="">— Không có (Đây là Menu gốc) —</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name} ({opt.code} {opt.path ? `— ${opt.path}` : ""})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-stone-400 mt-1">
            Chọn menu cấp trên trực tiếp quản lý menu này, hoặc để trống nếu là menu cấp cao nhất.
          </p>
        </div>

        {/* Đường dẫn URL & Thứ tự hiển thị */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Đường dẫn liên kết (Path)
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              disabled={isSubmitting}
              placeholder="Ví dụ: /books/categories"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Thứ tự hiển thị
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value ? Number(e.target.value) : "")
              }
              disabled={isSubmitting}
              placeholder="0"
              min={0}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>
        </div>

        {/* Icon đại diện */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Biểu tượng đại diện (Icon)
          </label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <DynamicIcon name={icon} className="w-5 h-5 text-amber-800" />
            </div>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập tên icon (ví dụ: layout-dashboard, book-open, folder-tree...)"
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>

          {/* Bộ lọc nhóm icon gợi ý */}
          <div className="mt-3 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-stone-600">
                Gợi ý icon cho hệ thống:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {ICON_GROUPS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIconGroup(group)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                      iconGroup === group
                        ? "bg-stone-900 text-white"
                        : "bg-white text-stone-600 hover:bg-stone-200/70 border border-stone-200"
                    )}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {filteredIconOptions.map((opt) => {
                const isSelected =
                  normalizedIcon === opt.value.replace(/[-_\s]/g, "");
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIcon(opt.value)}
                    title={`${opt.label} (${opt.value})`}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs border transition-all cursor-pointer",
                      isSelected
                        ? "bg-amber-50 border-[#F5B82E] text-amber-950 font-semibold shadow-2xs"
                        : "bg-white border-stone-200/80 text-stone-700 hover:border-stone-300 hover:bg-stone-100/70"
                    )}
                  >
                    <DynamicIcon
                      name={opt.value}
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isSelected ? "text-amber-700" : "text-stone-500"
                      )}
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cấu hình hiển thị và kích hoạt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-stone-800 block">
                Hiển thị trên menu
              </span>
              <span className="text-[11px] text-stone-500">
                Hiển thị trên sidebar điều hướng người dùng
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-stone-800 block">
                Kích hoạt menu
              </span>
              <span className="text-[11px] text-stone-500">
                Cho phép người dùng truy cập định tuyến này
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          Hủy bỏ
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <span>{mode === "create" ? "Thêm mới menu" : "Lưu thay đổi"}</span>
          )}
        </button>
      </div>
    </form>
  );
}

export function NavigationFormModal({
  isOpen,
  mode,
  item,
  parentOptions,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: NavigationFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {mode === "create" ? "Thêm menu điều hướng" : "Chỉnh sửa menu điều hướng"}
              </h2>
              <p className="text-xs text-stone-500">
                {mode === "create"
                  ? "Tạo mục menu mới và thiết lập vị trí trong cây phân cấp"
                  : `Cập nhật thông tin cho menu: ${item?.name || ""}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Form Content */}
        <NavigationFormContent
          key={`${mode}-${item?.id || "new"}`}
          mode={mode}
          item={item}
          parentOptions={parentOptions}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onCreate={onCreate}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
}
