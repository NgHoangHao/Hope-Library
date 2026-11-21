"use client";

import React, { useState, useMemo } from "react";
import { Shield, Search, X, Loader2, Layers } from "lucide-react";
import { RoleItem } from "../types/navigation.types";
import { cn } from "@/lib/utils";

export interface RoleNavigationListProps {
  roles: RoleItem[];
  selectedRoleId?: string;
  onSelectRole: (role: RoleItem) => void;
  roleMenuCounts: Record<string, number>;
  isLoading?: boolean;
}

export function RoleNavigationList({
  roles,
  selectedRoleId,
  onSelectRole,
  roleMenuCounts,
  isLoading = false,
}: RoleNavigationListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [roles, searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden sticky top-6">
      {/* Header */}
      <div className="p-4 border-b border-stone-200/80 bg-stone-50/70">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-stone-700" />
            <h2 className="font-bold text-stone-900 text-sm">Danh sách Vai trò</h2>
          </div>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-stone-200/80 text-stone-700">
            {roles.length} vai trò
          </span>
        </div>

        {/* Ô tìm kiếm vai trò */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm kiếm vai trò..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-stone-200 bg-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#F5B82E]/40"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Danh sách Role Items */}
      <div className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#B8860B]" />
            <span className="text-xs">Đang tải danh sách vai trò...</span>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-xs">
            Không tìm thấy vai trò phù hợp
          </div>
        ) : (
          filteredRoles.map((role) => {
            const isSelected = selectedRoleId === role.id;
            const assignedCount = roleMenuCounts[role.id] ?? 0;
            const isRoleAdmin = role.name.toUpperCase() === "ADMIN";
            const isRoleLibrarian = role.name.toUpperCase() === "LIBRARIAN";

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => onSelectRole(role)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start justify-between gap-3 border",
                  isSelected
                    ? "bg-amber-50/70 border-[#F5B82E] shadow-xs"
                    : "bg-white border-transparent hover:bg-stone-50 hover:border-stone-200"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-bold text-sm tracking-tight",
                        isSelected ? "text-amber-950" : "text-stone-900"
                      )}
                    >
                      {role.name}
                    </span>

                    {/* Badge vai trò hệ thống */}
                    {isRoleAdmin && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-200/80 text-amber-900">
                        Toàn quyền
                      </span>
                    )}
                    {isRoleLibrarian && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                        Thủ thư
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                    {role.description || "Chưa có mô tả vai trò"}
                  </p>
                </div>

                {/* Số lượng menu được gán */}
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full",
                      isSelected
                        ? "bg-[#F5B82E] text-stone-950"
                        : "bg-stone-100 text-stone-600"
                    )}
                  >
                    <Layers className="w-3 h-3" />
                    {assignedCount}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
