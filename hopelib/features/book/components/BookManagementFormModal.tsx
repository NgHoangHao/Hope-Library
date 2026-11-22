"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Loader2,
  BookOpen,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import {
  BookEntity,
  BookFormData,
  BookStatus,
  BookCopyInput,
  BookCopyStatus,
} from "../types/book.types";
import { getBookCoverUrl } from "../utils/bookImage.helper";
import { BookCopiesFormSection, FormCopyItem } from "./BookCopiesFormSection";
import { Author } from "@/features/author";
import { Category } from "@/features/category";

export interface BookManagementFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  book?: BookEntity | null;
  isLoadingDetail?: boolean;
  authors: Author[];
  categories: Category[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: BookFormData) => Promise<boolean>;
}

interface BookFormContentProps {
  mode: "create" | "edit";
  book?: BookEntity | null;
  isLoadingDetail?: boolean;
  authors: Author[];
  categories: Category[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: BookFormData) => Promise<boolean>;
}

function mapBookCopiesToFormItems(book?: BookEntity | null): FormCopyItem[] {
  if (!book?.copies || !Array.isArray(book.copies)) {
    return [];
  }
  return book.copies.map((c, idx) => ({
    localKey: c.id || `existing-copy-${idx}-${c.barcode}`,
    id: c.id,
    barcode: c.barcode || "",
    shelfLocation: c.shelfLocation || "",
    status: (c.status as BookCopyStatus) || "AVAILABLE",
  }));
}

function BookFormContent({
  mode,
  book,
  isLoadingDetail = false,
  authors,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: BookFormContentProps) {
  const [title, setTitle] = useState(book?.title || "");
  const [isbn, setIsbn] = useState(book?.isbn || "");
  const [authorId, setAuthorId] = useState(book?.authorId || "");
  const [categoryId, setCategoryId] = useState(book?.categoryId || "");
  const [publisher, setPublisher] = useState(book?.publisher || "");
  const [publicationYear, setPublicationYear] = useState<number | "">(
    book?.publicationYear ?? ""
  );
  const [edition, setEdition] = useState(book?.edition || "");
  const [description, setDescription] = useState(book?.description || "");
  const [status, setStatus] = useState<BookStatus>(book?.status || "ACTIVE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    getBookCoverUrl(book?.bookUrl) || null
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const existingPdfUrl = book?.pdfUrl || null;

  const hasLoadedCopies = mode === "create" || Array.isArray(book?.copies);
  const [copies, setCopies] = useState<FormCopyItem[]>(() => {
    if (mode === "edit") {
      return mapBookCopiesToFormItems(book);
    }
    return [
      {
        localKey: "copy-1",
        barcode: "",
        shelfLocation: "",
        status: "AVAILABLE",
      },
    ];
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdfMime = file.type.toLowerCase() === "application/pdf";
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      setValidationError("Chỉ cho phép tải lên file định dạng PDF (.pdf).");
      e.target.value = "";
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setValidationError("Dung lượng file PDF không được vượt quá 10 MB.");
      e.target.value = "";
      return;
    }

    setValidationError(null);
    setPdfFile(file);
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleAddCopy = () => {
    setCopies((prev) => {
      let nextBarcode = "";
      let defaultShelf = "";
      if (prev.length > 0) {
        const lastCopy = prev[prev.length - 1];
        defaultShelf = lastCopy.shelfLocation || "";
        const match = lastCopy.barcode.trim().match(/^(.*?)(\d+)$/);
        if (match) {
          const prefix = match[1];
          const numStr = match[2];
          const nextNum = String(parseInt(numStr, 10) + 1).padStart(numStr.length, "0");
          nextBarcode = `${prefix}${nextNum}`;
        }
      }
      return [
        ...prev,
        {
          localKey: `copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          barcode: nextBarcode,
          shelfLocation: defaultShelf,
          status: "AVAILABLE",
        },
      ];
    });
  };

  const handleRemoveCopy = (localKey: string) => {
    setCopies((prev) => prev.filter((item) => item.localKey !== localKey));
  };

  const handleCopyChange = (
    localKey: string,
    field: "barcode" | "shelfLocation" | "status",
    value: string
  ) => {
    setCopies((prev) =>
      prev.map((item) =>
        item.localKey === localKey
          ? {
              ...item,
              [field]: field === "status" ? (value as BookCopyStatus) : value,
            }
          : item
      )
    );
  };

  const handleBatchAddCopies = (newGenerated: FormCopyItem[]) => {
    setCopies((prev) => {
      const nonEmpties = prev.filter((c) => c.barcode.trim() || c.id);
      return [...nonEmpties, ...newGenerated];
    });
  };

  const handleClearAllCopies = () => {
    if (mode === "edit") {
      setCopies((prev) =>
        prev.filter(
          (c) => Boolean(c.id) && (c.status === "BORROWED" || c.status === "RESERVED")
        )
      );
      return;
    }
    setCopies([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setValidationError("Tiêu đề sách không được để trống");
      return;
    }

    const shouldSyncCopies = hasLoadedCopies;

    // Validate copies
    if (shouldSyncCopies && copies.length > 0) {
      const emptyExistingIdx = copies.findIndex((c) => Boolean(c.id) && !c.barcode.trim());
      if (emptyExistingIdx !== -1) {
        setValidationError(
          `Bản sao thứ ${emptyExistingIdx + 1} không được để trống mã Barcode.`
        );
        return;
      }

      const invalidCopyIndex = copies.findIndex(
        (c) => !c.barcode.trim() && c.shelfLocation.trim()
      );
      if (invalidCopyIndex !== -1) {
        setValidationError(
          `Bản sao thứ ${invalidCopyIndex + 1} đã có vị trí kệ nhưng chưa nhập mã Barcode.`
        );
        return;
      }

      const filledCopies = copies.filter((c) => c.barcode.trim());
      const barcodeList = filledCopies.map((c) => c.barcode.trim().toUpperCase());
      const duplicateBarcode = barcodeList.find(
        (code, idx) => barcodeList.indexOf(code) !== idx
      );
      if (duplicateBarcode) {
        setValidationError(
          `Mã Barcode "${duplicateBarcode}" bị trùng lặp trong danh sách bản sao.`
        );
        return;
      }
    }

    setValidationError(null);

    const validCopies: BookCopyInput[] | undefined = shouldSyncCopies
      ? copies
          .filter((c) => c.barcode.trim())
          .map((c) =>
            mode === "edit"
              ? {
                  ...(c.id ? { id: c.id } : {}),
                  barcode: c.barcode.trim(),
                  shelfLocation: c.shelfLocation.trim(),
                  status: c.status,
                }
              : {
                  barcode: c.barcode.trim(),
                  shelfLocation: c.shelfLocation.trim() || undefined,
                }
          )
      : undefined;

    await onSubmit({
      title: title.trim(),
      isbn: isbn.trim() || undefined,
      authorId: authorId || undefined,
      categoryId: categoryId || undefined,
      publisher: publisher.trim() || undefined,
      publicationYear: publicationYear !== "" ? Number(publicationYear) : undefined,
      edition: edition.trim() || undefined,
      description: description.trim() || undefined,
      status: mode === "edit" ? status : undefined,
      image: imageFile,
      pdf: pdfFile,
      copies: validCopies,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {validationError && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {validationError}
          </div>
        )}

        {/* Tiêu đề sách */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Tiêu đề sách <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ví dụ: Clean Code: A Handbook of Agile Software Craftsmanship"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            autoFocus
          />
        </div>

        {/* ISBN & Phiên bản */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Mã ISBN
            </label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              disabled={isSubmitting}
              placeholder="978-0132350884"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Phiên bản (Edition)
            </label>
            <input
              type="text"
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              disabled={isSubmitting}
              placeholder="1st Edition"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>
        </div>

        {/* Tác giả & Thể loại (Comboboxes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tác giả
            </label>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all cursor-pointer"
            >
              <option value="">-- Chọn tác giả --</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Thể loại
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all cursor-pointer"
            >
              <option value="">-- Chọn thể loại --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nhà xuất bản & Năm xuất bản */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Nhà xuất bản
            </label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              disabled={isSubmitting}
              placeholder="Prentice Hall, O'Reilly..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Năm xuất bản
            </label>
            <input
              type="number"
              value={publicationYear}
              onChange={(e) =>
                setPublicationYear(e.target.value ? Number(e.target.value) : "")
              }
              disabled={isSubmitting}
              placeholder="2024"
              min={1000}
              max={new Date().getFullYear() + 1}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
            />
          </div>
        </div>

        {/* Trạng thái (chỉ hiện khi chỉnh sửa) */}
        {mode === "edit" && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Trạng thái sách
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookStatus)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all cursor-pointer"
            >
              <option value="ACTIVE">ACTIVE (Khả dụng)</option>
              <option value="INACTIVE">INACTIVE (Tạm ngưng)</option>
              <option value="ARCHIVED">ARCHIVED (Lưu trữ)</option>
            </select>
          </div>
        )}

        {/* Mô tả sách */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Mô tả tóm tắt
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            placeholder="Mô tả nội dung cuốn sách..."
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all resize-none"
          />
        </div>

        {/* Upload Ảnh bìa sách */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Ảnh bìa sách (PNG, JPG)
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-xl bg-stone-100 border border-stone-200 shrink-0 overflow-hidden flex items-center justify-center">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-stone-300" />
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                id="book-image-upload"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <label
                htmlFor="book-image-upload"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{imagePreview ? "Thay đổi ảnh" : "Tải ảnh lên"}</span>
              </label>

              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="block text-[11px] text-rose-600 hover:underline cursor-pointer"
                >
                  Xóa ảnh
                </button>
              )}
              <p className="text-[11px] text-stone-400">
                Định dạng hỗ trợ: JPG, PNG (tối đa 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Upload File PDF nội dung sách */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            File PDF nội dung sách (Tùy chọn)
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-rose-50/70 border border-rose-200/80 shrink-0 flex items-center justify-center">
              <FileText
                className={`w-7 h-7 ${
                  pdfFile || existingPdfUrl ? "text-rose-600" : "text-stone-300"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                id="book-pdf-upload"
                onChange={handlePdfChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="book-pdf-upload"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {pdfFile || existingPdfUrl ? "Thay đổi file PDF" : "Tải file PDF lên"}
                  </span>
                </label>

                {pdfFile && (
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    disabled={isSubmitting}
                    className="text-[11px] font-medium text-rose-600 hover:underline cursor-pointer"
                  >
                    Bỏ chọn file
                  </button>
                )}
              </div>

              {pdfFile ? (
                <p className="text-xs font-medium text-emerald-700 truncate">
                  Đã chọn: {pdfFile.name} ({formatFileSize(pdfFile.size)})
                </p>
              ) : existingPdfUrl ? (
                <p className="text-xs text-stone-600">
                  Sách hiện đã có file PDF đính kèm (tải file mới lên nếu muốn thay thế).
                </p>
              ) : (
                <p className="text-[11px] text-stone-400">
                  Định dạng hỗ trợ: PDF (.pdf, tối đa 10MB)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quản lý danh sách bản sao sách (Create & Edit) */}
        <BookCopiesFormSection
          mode={mode}
          copies={copies}
          isLoadingCopies={mode === "edit" && isLoadingDetail && !hasLoadedCopies}
          isSubmitting={isSubmitting}
          onAddCopy={handleAddCopy}
          onRemoveCopy={handleRemoveCopy}
          onCopyChange={handleCopyChange}
          onBatchAddCopies={handleBatchAddCopies}
          onClearAllCopies={handleClearAllCopies}
          onValidationError={setValidationError}
        />
      </div>

      {/* Footer */}
      <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors disabled:opacity-50"
        >
          Hủy bỏ
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <span>{mode === "create" ? "Thêm mới sách" : "Lưu thay đổi"}</span>
          )}
        </button>
      </div>
    </form>
  );
}

export function BookManagementFormModal({
  isOpen,
  mode,
  book,
  isLoadingDetail = false,
  authors,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: BookManagementFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {mode === "create" ? "Thêm sách mới" : "Chỉnh sửa thông tin sách"}
              </h2>
              <p className="text-xs text-stone-500">
                {mode === "create"
                  ? "Điền thông tin xuất bản và bản sao sách để nhập vào thư viện"
                  : `Cập nhật thông tin chi tiết và bản sao cho: ${book?.title || ""}`}
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

        {/* Dynamic Form Content */}
        <BookFormContent
          key={`${mode}-${book?.id || "new"}-${Array.isArray(book?.copies) ? "loaded" : "pending"}`}
          mode={mode}
          book={book}
          isLoadingDetail={isLoadingDetail}
          authors={authors}
          categories={categories}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
