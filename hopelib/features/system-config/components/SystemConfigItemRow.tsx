"use client";

import React from "react";
import { Check, Clock, Loader2, RotateCcw, Save } from "lucide-react";
import { SystemConfigItem } from "../types/system-config.types";
import {
  formatConfigDateTime,
  getConfigUnit,
} from "../utils/systemConfigMeta.helper";

export interface SystemConfigItemRowProps {
  config: SystemConfigItem;
  draftValue: string;
  validationError: string | null;
  isDirty: boolean;
  isSaving: boolean;
  canUpdate: boolean;
  onChangeValue: (id: string, value: string) => void;
  onSave: (id: string) => void;
  onReset: (id: string) => void;
}

export function SystemConfigItemRow({
  config,
  draftValue,
  validationError,
  isDirty,
  isSaving,
  canUpdate,
  onChangeValue,
  onSave,
  onReset,
}: SystemConfigItemRowProps) {
  const unit = getConfigUnit(config);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isDirty && !validationError && !isSaving && canUpdate) {
      e.preventDefault();
      onSave(config.id);
    } else if (e.key === "Escape" && isDirty && !isSaving) {
      e.preventDefault();
      onReset(config.id);
    }
  };

  return (
    <div
      className={`p-5 transition-colors ${
        isDirty
          ? "bg-amber-50/40"
          : "bg-white hover:bg-stone-50/50"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Cột thông tin chỉ đọc (key, mô tả, loại dữ liệu, cập nhật gần nhất) */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-semibold text-stone-900">
              {config.description || config.key}
            </h3>
            {isDirty && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Chưa lưu
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap text-xs text-stone-500">
            <code className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono font-medium border border-stone-200/80">
              {config.key}
            </code>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
              {config.valueType}
            </span>
            <span className="inline-flex items-center gap-1 text-stone-400">
              <Clock className="w-3.5 h-3.5" />
              Cập nhật: {formatConfigDateTime(config.updatedAt)}
            </span>
          </div>
        </div>

        {/* Cột nhập liệu giá trị value & nút Lưu/Hoàn tác */}
        <div className="flex flex-col sm:flex-row sm:items-start lg:items-center gap-2.5 shrink-0">
          <div className="flex flex-col">
            {config.valueType === "BOOLEAN" ? (
              <button
                type="button"
                disabled={!canUpdate || isSaving}
                onClick={() =>
                  onChangeValue(
                    config.id,
                    draftValue.trim().toLowerCase() === "true" ? "false" : "true"
                  )
                }
                className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition ${
                  draftValue.trim().toLowerCase() === "true"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-stone-100 border-stone-200 text-stone-600"
                } ${canUpdate ? "cursor-pointer" : "opacity-75 cursor-not-allowed"}`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    draftValue.trim().toLowerCase() === "true"
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-400 text-white"
                  }`}
                >
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>
                  {draftValue.trim().toLowerCase() === "true" ? "Bật (true)" : "Tắt (false)"}
                </span>
              </button>
            ) : (
              <div className="relative flex items-center">
                <input
                  type={config.valueType === "NUMBER" ? "number" : "text"}
                  min={config.valueType === "NUMBER" ? 0 : undefined}
                  step={config.valueType === "NUMBER" ? "any" : undefined}
                  value={draftValue}
                  disabled={!canUpdate || isSaving}
                  onChange={(e) => onChangeValue(config.id, e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label={`Giá trị cấu hình ${config.key}`}
                  className={`w-full sm:w-52 py-2 text-sm font-semibold rounded-xl border transition focus:outline-none ${
                    unit ? "pl-3.5 pr-16" : "px-3.5"
                  } ${
                    !canUpdate
                      ? "bg-stone-100 border-stone-200 text-stone-600 cursor-not-allowed"
                      : validationError
                        ? "bg-red-50/50 border-red-300 text-red-900 focus:ring-2 focus:ring-red-200"
                        : isDirty
                          ? "bg-white border-amber-400 text-stone-900 focus:ring-2 focus:ring-[#F5B82E]/40"
                          : "bg-stone-50 border-stone-200 text-stone-900 focus:bg-white focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30"
                  }`}
                />
                {unit && (
                  <span className="absolute right-3 text-xs font-medium text-stone-500 pointer-events-none select-none">
                    {unit}
                  </span>
                )}
              </div>
            )}

            {validationError && (
              <p className="text-xs text-red-600 mt-1">{validationError}</p>
            )}
          </div>

          {/* Nút hành động cho từng cấu hình (chỉ hiện khi có quyền SYSTEM_CONFIG_UPDATE) */}
          {canUpdate && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onReset(config.id)}
                disabled={!isDirty || isSaving}
                title="Hoàn tác về giá trị hiện tại"
                className="inline-flex items-center justify-center p-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onSave(config.id)}
                disabled={!isDirty || Boolean(validationError) || isSaving}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#F5B82E] hover:bg-amber-400 text-stone-950 shadow-xs transition disabled:opacity-40 disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed cursor-pointer min-w-[84px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
