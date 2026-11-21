"use client";

import React from "react";
import {
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  FolderTree,
  ExternalLink,
} from "lucide-react";
import { NavigationTreeItem, NavigationItem } from "../types/navigation.types";
import { DynamicIcon } from "./DynamicIcon";
import { cn } from "@/lib/utils";

export interface NavigationManagementTreeTableProps {
  tree: NavigationTreeItem[];
  isLoading: boolean;
  expandedNodeIds: Record<string, boolean>;
  onToggleExpand: (nodeId: string) => void;
  matchingNodeIds: Set<string>;
  activeSearch: string;
  onEdit: (item: NavigationItem) => void;
  onDelete: (item: NavigationItem) => void;
  onAddChild: (parentId: string) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

interface TreeRowProps {
  node: NavigationTreeItem;
  level: number;
  expandedNodeIds: Record<string, boolean>;
  onToggleExpand: (nodeId: string) => void;
  matchingNodeIds: Set<string>;
  activeSearch: string;
  onEdit: (item: NavigationItem) => void;
  onDelete: (item: NavigationItem) => void;
  onAddChild: (parentId: string) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

function TreeRow({
  node,
  level,
  expandedNodeIds,
  onToggleExpand,
  matchingNodeIds,
  activeSearch,
  onEdit,
  onDelete,
  onAddChild,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
}: TreeRowProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodeIds[node.id] ?? false;
  const isMatch = matchingNodeIds.has(node.id) && Boolean(activeSearch.trim());

  return (
    <>
      <tr
        className={cn(
          "hover:bg-stone-50/90 transition-colors group border-b border-stone-100",
          isMatch && "bg-amber-50/60 hover:bg-amber-100/60"
        )}
      >
        {/* Menu & Icon với thụt đầu dòng theo cấp bậc (level) */}
        <td className="py-3 px-4">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {/* Nút đóng / mở node con */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleExpand(node.id)}
                className="p-1 text-stone-400 hover:text-stone-800 rounded-md hover:bg-stone-200/60 transition-colors cursor-pointer"
                title={isExpanded ? "Thu gọn" : "Mở rộng"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-stone-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-stone-600" />
                )}
              </button>
            ) : (
              <span className="w-6 inline-block" />
            )}

            {/* Icon của menu */}
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                level === 0
                  ? "bg-amber-100/80 text-amber-800 border-amber-200"
                  : "bg-stone-100 text-stone-600 border-stone-200"
              )}
            >
              <DynamicIcon name={node.icon} className="w-3.5 h-3.5" />
            </div>

            {/* Tên hiển thị menu */}
            <div>
              <span
                className={cn(
                  "font-semibold text-stone-900 group-hover:text-amber-800 transition-colors text-sm",
                  level === 0 && "font-bold text-stone-950",
                  isMatch && "text-amber-900 underline decoration-amber-400 decoration-2 font-bold"
                )}
              >
                {node.name}
              </span>
              {hasChildren && (
                <span className="text-[11px] text-stone-400 font-mono ml-2">
                  ({node.children!.length} menu con)
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Mã điều hướng (Code) */}
        <td className="py-3 px-4">
          <span className="text-xs font-mono font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
            {node.code}
          </span>
        </td>

        {/* Đường dẫn URL (Path) */}
        <td className="py-3 px-4">
          {node.path ? (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-sky-700 hover:underline">
              <ExternalLink className="w-3 h-3 text-sky-500 shrink-0" />
              <span>{node.path}</span>
            </span>
          ) : (
            <span className="text-xs text-stone-400 italic">Không có đường dẫn</span>
          )}
        </td>

        {/* Thứ tự hiển thị */}
        <td className="py-3 px-4 text-center">
          <span className="text-xs font-mono font-semibold text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
            {node.sortOrder ?? 0}
          </span>
        </td>

        {/* Hiển thị trên thanh điều hướng */}
        <td className="py-3 px-4 text-center">
          <span
            className={cn(
              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md",
              node.isVisible
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-stone-100 text-stone-500 border border-stone-200"
            )}
          >
            {node.isVisible ? "Hiển thị" : "Ẩn"}
          </span>
        </td>

        {/* Trạng thái kích hoạt */}
        <td className="py-3 px-4 text-center">
          <span
            className={cn(
              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md",
              node.isActive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            )}
          >
            {node.isActive ? "Kích hoạt" : "Vô hiệu"}
          </span>
        </td>

        {/* Thao tác (Edit, Delete, Add Child) - Không có nút ViewDetail */}
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {/* Nút Thêm menu con */}
            {canCreate && (
              <button
                type="button"
                onClick={() => onAddChild(node.id)}
                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                title={`Thêm menu con cho "${node.name}"`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {/* Nút Chỉnh sửa (Update) */}
            {canUpdate && (
              <button
                type="button"
                onClick={() => onEdit(node)}
                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                title="Chỉnh sửa menu này"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {/* Nút Xóa (Delete) */}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(node)}
                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Xóa menu này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Render đệ quy các cấp con nếu đang mở rộng */}
      {hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            level={level + 1}
            expandedNodeIds={expandedNodeIds}
            onToggleExpand={onToggleExpand}
            matchingNodeIds={matchingNodeIds}
            activeSearch={activeSearch}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        ))}
    </>
  );
}

export function NavigationManagementTreeTable({
  tree,
  isLoading,
  expandedNodeIds,
  onToggleExpand,
  matchingNodeIds,
  activeSearch,
  onEdit,
  onDelete,
  onAddChild,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
}: NavigationManagementTreeTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-20 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">Đang tải và xây dựng cây điều hướng...</span>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <FolderTree className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy menu điều hướng nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          {activeSearch
            ? "Không có menu nào khớp với từ khóa tìm kiếm trên FE."
            : "Hệ thống chưa có menu điều hướng nào."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-700 border-collapse">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/75 text-xs font-semibold text-stone-500 uppercase tracking-wider select-none">
              <th scope="col" className="py-3.5 px-4 min-w-[300px]">
                Menu & Cấp bậc
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[180px]">
                Mã (Code)
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[200px]">
                Đường dẫn (Path)
              </th>
              <th scope="col" className="py-3.5 px-4 w-24 text-center">
                Thứ tự
              </th>
              <th scope="col" className="py-3.5 px-4 w-28 text-center">
                Hiển thị
              </th>
              <th scope="col" className="py-3.5 px-4 w-28 text-center">
                Trạng thái
              </th>
              <th scope="col" className="py-3.5 px-4 w-36 text-right">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {tree.map((rootNode) => (
              <TreeRow
                key={rootNode.id}
                node={rootNode}
                level={0}
                expandedNodeIds={expandedNodeIds}
                onToggleExpand={onToggleExpand}
                matchingNodeIds={matchingNodeIds}
                activeSearch={activeSearch}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                canCreate={canCreate}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
