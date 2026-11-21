"use client";

import React from "react";
import { Search, Plus, Filter, X, Shield } from "lucide-react";
import { ModuleFilterOption } from "../hooks/usePermissionManagement";
import { cn } from "@/lib/utils";

export interface PermissionManagementToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  modules: ModuleFilterOption[];
  selectedModule: string;
  onSelectModule: (moduleKey: string) => void;
  totalFiltered: number;
  onOpenCreate: () => void;
  canCreate?: boolean;
}

export function PermissionManagementToolbar({
  searchTerm,
  onSearchChange,
  modules,
  selectedModule,
  onSelectModule,
  totalFiltered,
  onOpenCreate,
  canCreate = true,
}: PermissionManagementToolbarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-4">
      {/* Hàng 1: Ô tìm kiếm & Nút thêm mới */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã quyền (BOOK_CREATE), đối tượng hoặc mô tả..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm border border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 cursor-pointer"
              title="Xóa từ khóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-stone-500 font-medium">
            Hiển thị <span className="text-stone-900 font-semibold">{totalFiltered}</span> quyền
          </span>

          {canCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm quyền hạn</span>
            </button>
          )}
        </div>
      </div>

      {/* Hàng 2: Bộ lọc theo các mục đối tượng (Module Filter Pills) */}
      <div className="pt-2 border-t border-stone-100 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Lọc theo mục đối tượng:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full">
          {modules.map((mod) => {
            const isSelected = selectedModule === mod.key;
            return (
              <button
                key={mod.key}
                type="button"
                onClick={() => onSelectModule(mod.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-stone-100 hover:bg-stone-200/80 text-stone-600 hover:text-stone-900"
                )}
              >
                {mod.key === "ALL" && <Shield className="w-3 h-3" />}
                <span>{mod.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-stone-200/80 text-stone-600"
                  )}
                >
                  {mod.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
