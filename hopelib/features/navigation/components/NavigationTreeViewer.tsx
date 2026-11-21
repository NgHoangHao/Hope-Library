"use client";

import React from "react";
import {
  ShieldCheck,
  Eye,
  Copy,
  Search,
  X,
  Loader2,
  FolderTree,
} from "lucide-react";
import { NavigationTreeItem, RoleItem } from "../types/navigation.types";
import { NavigationTreeNode } from "./NavigationTreeNode";

export interface NavigationTreeViewerProps {
  selectedRole: RoleItem | null;
  tree: NavigationTreeItem[];
  currentLeafCount: number;
  totalLeafCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  canAssign?: boolean;
  isLoading?: boolean;
  matchingNodeIds: Set<string>;
  expandedNodeIds: Record<string, boolean>;
  onToggleExpand: (nodeId: string) => void;
  onToggleCheck: (nodeId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenPreview: () => void;
  onOpenClone: () => void;
  getNodeCheckState: (nodeId: string) => "checked" | "unchecked" | "indeterminate";
}

export function NavigationTreeViewer({
  selectedRole,
  tree,
  currentLeafCount,
  totalLeafCount,
  searchTerm,
  onSearchChange,
  canAssign = true,
  isLoading = false,
  matchingNodeIds,
  expandedNodeIds,
  onToggleExpand,
  onToggleCheck,
  onExpandAll,
  onCollapseAll,
  onSelectAll,
  onDeselectAll,
  onOpenPreview,
  onOpenClone,
  getNodeCheckState,
}: NavigationTreeViewerProps) {
  const isSearching = searchTerm.trim().length > 0;

  const isNodeExpanded = (nodeId: string) => {
    return isSearching ? true : !!expandedNodeIds[nodeId];
  };

  const isNodeMatch = (nodeId: string) => {
    return matchingNodeIds.has(nodeId);
  };

  return (
    <div className="space-y-4">
      {/* Header Card của Role đang chọn & Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
        {/* Hàng 1: Tiêu đề Role & Nút hành động */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900">
                  {selectedRole ? selectedRole.name : "Chưa chọn vai trò"}
                </h2>
                {selectedRole && (
                  <span className="px-2 py-0.5 text-xs font-mono rounded bg-stone-100 text-stone-600 border border-stone-200">
                    {currentLeafCount} / {totalLeafCount} menu lá
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {selectedRole?.description ||
                  "Thiết lập các quyền truy cập menu hiển thị trên sidebar"}
              </p>
            </div>
          </div>

          {/* Nút Xem trước Sidebar & Sao chép quyền */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              Xem trước Menu
            </button>

            {canAssign && (
              <button
                type="button"
                onClick={onOpenClone}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                Sao chép quyền
              </button>
            )}
          </div>
        </div>

        {/* Hàng 2: Toolbar tìm kiếm & Thao tác chọn theo lô */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Ô tìm kiếm trong cây menu */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Lọc menu theo tên, mã code hoặc url (/books, /users...)..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/60 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#F5B82E]/40 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Các nút tiện ích: Chọn tất cả, Bỏ chọn, Mở rộng, Thu gọn */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {canAssign && (
              <>
                <button
                  type="button"
                  onClick={onSelectAll}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Chọn toàn bộ cây menu"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={onDeselectAll}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Bỏ chọn toàn bộ menu"
                >
                  Bỏ chọn
                </button>
                <div className="w-px h-5 bg-stone-200 mx-1" />
              </>
            )}

            <button
              type="button"
              onClick={onExpandAll}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              title="Mở rộng tất cả các nhánh"
            >
              Mở rộng
            </button>
            <button
              type="button"
              onClick={onCollapseAll}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              title="Thu gọn các nhánh cha"
            >
              Thu gọn
            </button>
          </div>
        </div>
      </div>

      {/* Vùng hiển thị Cây Menu (Tree Area) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs min-h-[450px]">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-stone-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#B8860B]" />
            <span className="text-sm font-medium">
              Đang tải danh sách menu điều hướng...
            </span>
          </div>
        ) : tree.length === 0 ? (
          <div className="py-20 text-center">
            <FolderTree className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">
              Không tìm thấy menu phù hợp
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị lại toàn bộ cây điều hướng.
            </p>
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 rounded-lg hover:bg-amber-200 cursor-pointer"
              >
                Xóa từ khóa tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((rootNode) => (
              <NavigationTreeNode
                key={rootNode.id}
                node={rootNode}
                depth={0}
                nodeState={getNodeCheckState(rootNode.id)}
                isExpanded={isNodeExpanded(rootNode.id)}
                isMatch={isNodeMatch(rootNode.id)}
                canAssign={canAssign}
                isLoading={isLoading}
                onToggleExpand={onToggleExpand}
                onToggleCheck={onToggleCheck}
                getNodeCheckState={getNodeCheckState}
                isNodeExpanded={isNodeExpanded}
                isNodeMatch={isNodeMatch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
