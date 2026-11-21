"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { RoleItem } from "../types/navigation.types";

export interface ConfirmDiscardModalProps {
  isOpen: boolean;
  currentRole: RoleItem | null;
  targetRole: RoleItem | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDiscardModal({
  isOpen,
  currentRole,
  targetRole,
  onCancel,
  onConfirm,
}: ConfirmDiscardModalProps) {
  if (!isOpen || !targetRole) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onCancel} />

      <div className="relative z-50 w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              Thay đổi chưa được lưu!
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Bạn có thay đổi chưa lưu trên vai trò &ldquo;{currentRole?.name}&rdquo;.
              Bạn có muốn chuyển sang &ldquo;{targetRole.name}&rdquo; và hủy các thay đổi
              này không?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Ở lại trang
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
          >
            Bỏ thay đổi & Chuyển
          </button>
        </div>
      </div>
    </div>
  );
}
