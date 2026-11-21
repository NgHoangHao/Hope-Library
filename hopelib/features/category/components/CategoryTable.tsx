"use client";

import React from "react";
import { Eye, Trash2, Bookmark, Loader2 } from "lucide-react";
import { Category } from "../types/category.types";

export interface CategoryTableProps {
  categories: Category[];
  isLoading: boolean;
  onViewDetail: (id: string) => void;
  onDelete: (category: Category) => void;
  canRead?: boolean;
  canDelete?: boolean;
}

export function CategoryTable({
  categories,
  isLoading,
  onViewDetail,
  onDelete,
  canRead = true,
  canDelete = true,
}: CategoryTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">Đang tải danh sách thể loại...</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <Bookmark className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy thể loại nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Không có thể loại nào phù hợp với điều kiện tìm kiếm hoặc danh mục thể loại hiện đang trống.
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
              <th scope="col" className="py-3.5 px-6 w-16 text-center">
                STT
              </th>
              <th scope="col" className="py-3.5 px-6 min-w-[200px]">
                Tên thể loại
              </th>
              <th scope="col" className="py-3.5 px-6 min-w-[320px]">
                Mô tả
              </th>
              <th scope="col" className="py-3.5 px-6 w-48 text-right">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.map((category, index) => (
              <tr
                key={category.id}
                className="hover:bg-stone-50/80 transition-colors group"
              >
                {/* STT */}
                <td className="py-4 px-6 text-center font-mono text-xs text-stone-400">
                  {index + 1}
                </td>

                {/* Tên thể loại */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60 font-semibold text-xs">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <span className="font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">
                        {category.name}
                      </span>
                      <span className="block text-[11px] font-mono text-stone-400 mt-0.5">
                        ID: {category.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </td>

                {/* Mô tả */}
                <td className="py-4 px-6">
                  {category.description ? (
                    <p className="text-stone-600 line-clamp-2 text-sm leading-relaxed">
                      {category.description}
                    </p>
                  ) : (
                    <span className="text-stone-400 italic text-xs">
                      Chưa có mô tả
                    </span>
                  )}
                </td>

                {/* Nút ViewDetail và Delete */}
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* ViewDetail button */}
                    <button
                      onClick={() => onViewDetail(category.id)}
                      disabled={!canRead}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={canRead ? "Xem chi tiết thể loại và sách liên kết" : "Không có quyền xem chi tiết"}
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-600" />
                      <span>ViewDetail</span>
                    </button>

                    {/* Delete button */}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(category)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200/50"
                        title="Xóa thể loại này"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
