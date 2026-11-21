"use client";

import React from "react";
import { Search, Plus, X } from "lucide-react";

export interface RoleManagementToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalFiltered: number;
  onOpenCreate: () => void;
  canCreate?: boolean;
}

export function RoleManagementToolbar({
  searchTerm,
  onSearchChange,
  totalFiltered,
  onOpenCreate,
  canCreate = true,
}: RoleManagementToolbarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên vai trò, mô tả hoặc ID..."
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
          Hiển thị <span className="text-stone-900 font-semibold">{totalFiltered}</span> vai trò
        </span>

        {canCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm vai trò</span>
          </button>
        )}
      </div>
    </div>
  );
}
