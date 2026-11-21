"use client";

import React, { useState } from "react";
import { X, Shield, Loader2 } from "lucide-react";
import {
  RoleItem,
  CreateRoleDto,
  UpdateRoleDto,
} from "../types/role.types";

export interface RoleFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  item?: RoleItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (dto: CreateRoleDto) => Promise<boolean>;
  onUpdate: (id: string, dto: UpdateRoleDto) => Promise<boolean>;
}

interface FormContentProps {
  mode: "create" | "edit";
  item?: RoleItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (dto: CreateRoleDto) => Promise<boolean>;
  onUpdate: (id: string, dto: UpdateRoleDto) => Promise<boolean>;
}

function RoleFormContent({
  mode,
  item,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: FormContentProps) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setValidationError("Tên vai trò không được để trống");
      return;
    }

    setValidationError(null);

    if (mode === "create") {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } else if (item) {
      await onUpdate(item.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="p-6 space-y-4">
        {validationError && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {validationError}
          </div>
        )}

        {/* Tên vai trò (Name) */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Tên vai trò (Role Name) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ví dụ: LIBRARIAN, MANAGER, STAFF, BORROWER..."
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            autoFocus
          />
          <p className="text-[11px] text-stone-400 mt-1">
            Quy ước: Nên đặt tên ngắn gọn, rõ ràng, dễ phân biệt giữa các chức vụ nghiệp vụ.
          </p>
        </div>

        {/* Mô tả chi tiết */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Mô tả chi tiết vai trò
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            placeholder="Mô tả phạm vi trách nhiệm và đối tượng sử dụng vai trò này..."
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all resize-none"
          />
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
            <span>{mode === "create" ? "Thêm mới vai trò" : "Lưu thay đổi"}</span>
          )}
        </button>
      </div>
    </form>
  );
}

export function RoleFormModal({
  isOpen,
  mode,
  item,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: RoleFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {mode === "create" ? "Thêm mới vai trò" : "Chỉnh sửa vai trò"}
              </h2>
              <p className="text-xs text-stone-500">
                {mode === "create"
                  ? "Tạo vai trò mới để cấp phát quyền hạn và phân công người dùng"
                  : `Cập nhật thông tin cho vai trò: ${item?.name || ""}`}
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
        <RoleFormContent
          key={`${mode}-${item?.id || "new"}`}
          mode={mode}
          item={item}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onCreate={onCreate}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
}
