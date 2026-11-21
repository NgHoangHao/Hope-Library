"use client";

import React from "react";
import { Search, Plus, X, Filter } from "lucide-react";
import { AccountRoleItem } from "../types/account.types";

export interface AccountToolbarProps {
  searchTerm: string;
  statusFilter: string;
  roleFilter: string;
  availableRoles: AccountRoleItem[];
  canCreate: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onOpenCreate: () => void;
}

export function AccountToolbar({
  searchTerm,
  statusFilter,
  roleFilter,
  availableRoles,
  canCreate,
  onSearchChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onOpenCreate,
}: AccountToolbarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo họ tên, username hoặc email..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm border border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Các bộ lọc và Nút Thêm mới */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Lọc theo Trạng thái */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 focus:border-[#F5B82E] transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Không hoạt động (INACTIVE)</option>
            <option value="LOCKED">Bị khóa (LOCKED)</option>
          </select>
        </div>

        {/* Lọc theo Vai trò */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 focus:border-[#F5B82E] transition-all cursor-pointer"
        >
          <option value="ALL">Tất cả vai trò</option>
          {availableRoles.map((role) => (
            <option key={role.id || role.name} value={role.name}>
              {role.name}
            </option>
          ))}
        </select>

        {/* Nút Thêm mới tài khoản */}
        {canCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </button>
        )}
      </div>
    </div>
  );
}
