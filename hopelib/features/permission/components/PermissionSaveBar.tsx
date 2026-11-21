"use client";

import React from "react";
import { Sparkles, RotateCcw, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PermissionSaveBarProps {
  hasChanges: boolean;
  addedCount: number;
  removedCount: number;
  isSaving: boolean;
  canAssign?: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function PermissionSaveBar({
  hasChanges,
  addedCount,
  removedCount,
  isSaving,
  canAssign = true,
  onReset,
  onSave,
}: PermissionSaveBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-auto z-40 transition-all duration-300 transform",
        hasChanges
          ? "translate-y-0 opacity-100"
          : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <div className="bg-stone-900 text-white rounded-2xl p-3.5 sm:px-6 sm:py-3.5 shadow-2xl border border-stone-800 flex flex-col sm:flex-row items-center gap-4">
        {/* Thông tin chênh lệch Diff */}
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="font-semibold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Có thay đổi chưa lưu:
          </span>

          <div className="flex items-center gap-2">
            {addedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                +{addedCount} thêm mới
              </span>
            )}
            {removedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                -{removedCount} gỡ bỏ
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:block w-px h-6 bg-stone-700" />

        {/* Nút Hoàn tác & Nút Lưu */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving}
            className="px-3.5 py-2 text-xs font-medium rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Hoàn tác
          </button>

          {canAssign && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#F5B82E] hover:bg-[#E5A926] text-stone-950 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu vào hệ thống...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu thay đổi ({addedCount + removedCount})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
