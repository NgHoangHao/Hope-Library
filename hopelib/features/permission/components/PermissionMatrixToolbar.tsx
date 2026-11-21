"use client";

import React from "react";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PermissionMatrixToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  modules: string[];
  selectedModule: string;
  onSelectModule: (module: string) => void;
  totalFiltered: number;
}

export function PermissionMatrixToolbar({
  searchTerm,
  onSearchChange,
  modules,
  selectedModule,
  onSelectModule,
  totalFiltered,
}: PermissionMatrixToolbarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Ô tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm kiếm quyền theo tên (vd: Người dùng: Xem, Sách), mã CODE..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/60 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#F5B82E]/40 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter */}
        <div className="flex items-center gap-2 text-xs text-stone-500 shrink-0">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span>Hiển thị: </span>
          <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
            {totalFiltered} quyền
          </span>
        </div>
      </div>

      {/* Module Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs w-full">
        <button
          type="button"
          onClick={() => onSelectModule("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer",
            selectedModule === "ALL"
              ? "bg-stone-900 text-white shadow-xs"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
          )}
        >
          Tất cả module
        </button>

        {modules.map((mod) => (
          <button
            key={mod}
            type="button"
            onClick={() => onSelectModule(mod)}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer",
              selectedModule === mod
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
            )}
          >
            {mod}
          </button>
        ))}
      </div>
    </div>
  );
}
