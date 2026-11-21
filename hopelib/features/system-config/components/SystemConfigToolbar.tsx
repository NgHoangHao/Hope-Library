"use client";

import React from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { SystemConfigGroupOption } from "../types/system-config.types";

export interface SystemConfigToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  groupOptions: SystemConfigGroupOption[];
  selectedGroup: string;
  onSelectGroup: (group: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function SystemConfigToolbar({
  searchTerm,
  onSearchChange,
  groupOptions,
  selectedGroup,
  onSelectGroup,
  isRefreshing,
  onRefresh,
}: SystemConfigToolbarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã khóa (key) hoặc mô tả cấu hình..."
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 focus:border-[#F5B82E] transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-md"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Nút làm mới */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-100 hover:bg-stone-200/80 text-stone-700 border border-stone-200 transition disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Đang tải..." : "Làm mới"}</span>
        </button>
      </div>

      {/* Bộ lọc nhóm cấu hình */}
      {groupOptions.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {groupOptions.map((option) => {
            const isActive = selectedGroup === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectGroup(option.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                }`}
              >
                <span>{option.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[11px] ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white text-stone-500"
                  }`}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
