"use client";

import React from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

export interface SystemConfigSaveBarProps {
  dirtyCount: number;
  isSavingAll: boolean;
  canUpdate: boolean;
  onResetAll: () => void;
  onSaveAll: () => void;
}

export function SystemConfigSaveBar({
  dirtyCount,
  isSavingAll,
  canUpdate,
  onResetAll,
  onSaveAll,
}: SystemConfigSaveBarProps) {
  if (!canUpdate || dirtyCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-20">
      <div className="bg-stone-900 text-white rounded-2xl px-5 py-3.5 shadow-lg border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm">
          Bạn đang có{" "}
          <span className="font-bold text-[#F5B82E]">{dirtyCount}</span> thông số
          cấu hình chưa được lưu.
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onResetAll}
            disabled={isSavingAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 transition disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Hoàn tác tất cả</span>
          </button>

          <button
            type="button"
            onClick={onSaveAll}
            disabled={isSavingAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#F5B82E] hover:bg-amber-400 text-stone-950 transition disabled:opacity-60 cursor-pointer"
          >
            {isSavingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu tất cả thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
