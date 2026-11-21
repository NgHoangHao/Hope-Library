"use client";

import React from "react";
import { Eye, X, ChevronDown } from "lucide-react";
import { NavigationTreeItem, RoleItem } from "../types/navigation.types";
import { DynamicIcon } from "./DynamicIcon";
import { HopeLogo } from "@/components/ui";

export interface NavigationSidebarPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: RoleItem | null;
  tree: NavigationTreeItem[];
}

export function NavigationSidebarPreviewModal({
  isOpen,
  onClose,
  selectedRole,
  tree,
}: NavigationSidebarPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-md bg-[#161616] text-stone-200 rounded-2xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-[#F5B82E]" />
            <div>
              <h3 className="font-bold text-sm text-white">Xem trước Thanh Sidebar</h3>
              <p className="text-[11px] text-stone-400">
                Giao diện thực tế của vai trò:{" "}
                <span className="text-[#F5B82E] font-semibold">
                  {selectedRole?.name}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simulated Sidebar Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* App Brand Header */}
          <div className="flex items-center px-2 py-1">
            <HopeLogo size="xs" variant="dark" />
          </div>

          {/* Navigation items list */}
          <div className="space-y-1.5 pt-2">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Menu khả dụng
            </span>

            {tree.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                Vai trò này chưa được chọn menu nào. Sidebar sẽ trống!
              </div>
            ) : (
              tree.map((item) => (
                <div key={item.id} className="space-y-1">
                  {/* Mục menu chính */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-stone-300 bg-stone-900/60 border border-stone-800/80">
                    <div className="flex items-center gap-2.5">
                      <DynamicIcon name={item.icon} className="w-4 h-4 text-[#F5B82E]" />
                      <span>{item.name}</span>
                    </div>
                    {item.children && item.children.length > 0 && (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </div>

                  {/* Các mục con (nếu có) */}
                  {item.children && item.children.length > 0 && (
                    <div className="pl-6 space-y-1 pt-1">
                      {item.children.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-white hover:bg-stone-800/50"
                        >
                          <div className="flex items-center gap-2">
                            <DynamicIcon
                              name={sub.icon}
                              className="w-3.5 h-3.5 text-stone-400 shrink-0"
                            />
                            <span>{sub.name}</span>
                          </div>
                          {sub.path && (
                            <span className="text-[10px] font-mono text-stone-500">
                              {sub.path}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-900/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-white cursor-pointer"
          >
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
}
