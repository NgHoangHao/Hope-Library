"use client";

import React, { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { CreateAuthorDto } from "../types/author.types";

export interface AuthorCreateModalProps {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (dto: CreateAuthorDto) => Promise<boolean>;
}

export function AuthorCreateModal({
  isOpen,
  isCreating,
  onClose,
  onCreate,
}: AuthorCreateModalProps) {
  const [name, setName] = useState("");
  const [biography, setBiography] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError("Tên tác giả không được để trống");
      return;
    }

    setValidationError(null);
    const success = await onCreate({
      name: name.trim(),
      biography: biography.trim() || undefined,
    });

    if (success) {
      setName("");
      setBiography("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Thêm tác giả mới
              </h2>
              <p className="text-xs text-stone-500">
                Thêm hồ sơ tác giả vào hệ thống thư viện Hope Library
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {validationError && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                {validationError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Tên tác giả <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Robert C. Martin, Martin Fowler..."
                disabled={isCreating}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Tiểu sử tác giả
              </label>
              <textarea
                rows={3}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                placeholder="Giới thiệu sơ lược về tác giả, quá trình công tác..."
                disabled={isCreating}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <span>Tạo tác giả</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
