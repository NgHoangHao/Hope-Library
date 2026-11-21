"use client";

import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { NavigationTreeItem } from "../types/navigation.types";
import { DynamicIcon } from "./DynamicIcon";
import { TriStateCheckbox } from "./TriStateCheckbox";
import { cn } from "@/lib/utils";

export interface NavigationTreeNodeProps {
  node: NavigationTreeItem;
  depth?: number;
  nodeState: "checked" | "unchecked" | "indeterminate";
  isExpanded: boolean;
  isMatch?: boolean;
  canAssign?: boolean;
  isLoading?: boolean;
  onToggleExpand: (nodeId: string) => void;
  onToggleCheck: (nodeId: string) => void;
  getNodeCheckState: (nodeId: string) => "checked" | "unchecked" | "indeterminate";
  isNodeExpanded: (nodeId: string) => boolean;
  isNodeMatch?: (nodeId: string) => boolean;
}

export function NavigationTreeNode({
  node,
  depth = 0,
  nodeState,
  isExpanded,
  isMatch = false,
  canAssign = true,
  isLoading = false,
  onToggleExpand,
  onToggleCheck,
  getNodeCheckState,
  isNodeExpanded,
  isNodeMatch,
}: NavigationTreeNodeProps) {
  const isLeaf = !node.children || node.children.length === 0;

  return (
    <div className="select-none">
      <div
        onClick={() => {
          if (!isLeaf) {
            onToggleExpand(node.id);
          } else if (canAssign && !isLoading) {
            onToggleCheck(node.id);
          }
        }}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer",
          "hover:bg-stone-50",
          depth > 0 && "ml-6 mt-1.5",
          depth === 0 && "mt-2",
          isMatch
            ? "border-amber-400 bg-amber-50/40"
            : "border-stone-200/80 bg-white",
          nodeState === "checked" && !isMatch && "border-amber-200 bg-amber-50/20"
        )}
      >
        {/* Nút Chevron thu gọn / mở rộng cho nhánh cha */}
        <div className="w-5 flex items-center justify-center shrink-0">
          {!isLeaf ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="p-0.5 text-stone-500 hover:text-stone-900 rounded-sm hover:bg-stone-200/60"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          )}
        </div>

        {/* Tri-state Checkbox */}
        <TriStateCheckbox
          state={nodeState}
          disabled={!canAssign || isLoading}
          onToggle={() => onToggleCheck(node.id)}
        />

        {/* Icon của Menu */}
        <div
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
            !isLeaf
              ? "bg-stone-100 text-stone-700 font-semibold"
              : "bg-amber-100/70 text-amber-800"
          )}
        >
          <DynamicIcon name={node.icon} className="w-4 h-4" />
        </div>

        {/* Tiêu đề & Thông tin chi tiết Menu */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span
              className={cn(
                "truncate text-sm",
                !isLeaf ? "font-semibold text-stone-900" : "font-medium text-stone-800"
              )}
            >
              {node.name}
            </span>

            {/* Tag mã Code */}
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono rounded bg-stone-100 text-stone-600 border border-stone-200 shrink-0">
              {node.code}
            </span>
          </div>

          {/* Chi tiết phụ: Đường dẫn URL và Thứ tự sắp xếp */}
          <div className="flex items-center gap-2 shrink-0">
            {node.path ? (
              <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                {node.path}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[11px] rounded bg-stone-50 text-stone-400 italic">
                Nhóm menu
              </span>
            )}

            {/* Hiển thị số lượng con nếu là node cha */}
            {!isLeaf && node.children && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 text-stone-700">
                {node.children.length} mục con
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Render danh sách con đệ quy nếu đang mở rộng */}
      {!isLeaf && isExpanded && node.children && (
        <div className="relative pl-2">
          {/* Đường chỉ dẫn cấu trúc cây (Tree guide line) */}
          <div className="absolute left-5 top-2 bottom-2 w-px bg-stone-200/80 pointer-events-none" />
          <div className="flex flex-col">
            {node.children.map((child) => (
              <NavigationTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                nodeState={getNodeCheckState(child.id)}
                isExpanded={isNodeExpanded(child.id)}
                isMatch={isNodeMatch ? isNodeMatch(child.id) : false}
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
        </div>
      )}
    </div>
  );
}
