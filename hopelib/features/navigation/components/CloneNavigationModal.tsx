"use client";

import React, { useState } from "react";
import { Copy, X, Loader2 } from "lucide-react";
import { RoleItem } from "../types/navigation.types";

export interface CloneNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: RoleItem | null;
  roles: RoleItem[];
  onApplyClone: (sourceRoleId: string) => Promise<void>;
}

export function CloneNavigationModal({
  isOpen,
  onClose,
  targetRole,
  roles,
  onApplyClone,
}: CloneNavigationModalProps) {
  const availableRoles = roles.filter((r) => r.id !== targetRole?.id);
  const [sourceRoleId, setSourceRoleId] = useState<string>(
    availableRoles[0]?.id || ""
  );
  const [isCloning, setIsCloning] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!sourceRoleId) return;
    setIsCloning(true);
    try {
      await onApplyClone(sourceRoleId);
      onClose();
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Copy className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-stone-900 text-base">
                Sao chép quyền Menu
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-600 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Sao chép cấu hình menu từ một vai trò nguồn và áp dụng sang vai trò{" "}
            <span className="font-bold text-stone-900">{targetRole?.name}</span>.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Chọn vai trò nguồn cần sao chép:
            </label>
            <select
              value={sourceRoleId}
              onChange={(e) => setSourceRoleId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#F5B82E]"
            >
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - ({r.description || "Chưa có mô tả"})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Lưu ý:</strong> Hành động này sẽ thay thế danh sách menu đang chọn trên giao diện bằng danh sách của vai trò nguồn. Bạn cần bấm <strong>&quot;Lưu thay đổi&quot;</strong> sau khi sao chép để chính thức ghi vào cơ sở dữ liệu.
          </div>
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isCloning || !sourceRoleId}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isCloning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang sao chép...
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Áp dụng cấu hình
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
