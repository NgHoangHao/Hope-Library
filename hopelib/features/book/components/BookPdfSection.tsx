"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FileText,
  ExternalLink,
  Download,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { getBookPdfBlobApi } from "../services/bookApi";
import { isSessionExpiredError } from "@/features/auth";

export interface BookPdfSectionProps {
  bookId: string;
  bookTitle: string;
  pdfUrl?: string | null;
  variant?: "dashboard" | "borrower";
  showEmptyState?: boolean;
}

export function BookPdfSection({
  bookId,
  bookTitle,
  pdfUrl,
  variant = "dashboard",
  showEmptyState = false,
}: BookPdfSectionProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const hasPdf = Boolean(pdfUrl && pdfUrl.trim());
  const requestKey = hasPdf && bookId ? `${bookId}:${reloadKey}` : "";

  const [pdfState, setPdfState] = useState<{
    key: string;
    blobUrl: string | null;
    error: string | null;
  }>({
    key: "",
    blobUrl: null,
    error: null,
  });

  useEffect(() => {
    if (!requestKey || !bookId) {
      return;
    }

    let isActive = true;
    let createdObjectUrl: string | null = null;

    getBookPdfBlobApi(bookId)
      .then((blob) => {
        if (!isActive) return;
        createdObjectUrl = URL.createObjectURL(blob);
        setPdfState({
          key: requestKey,
          blobUrl: createdObjectUrl,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        if (isSessionExpiredError(err)) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải file PDF nội dung sách";
        setPdfState({
          key: requestKey,
          blobUrl: null,
          error: msg,
        });
      });

    return () => {
      isActive = false;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [bookId, requestKey]);

  const isLoading = Boolean(requestKey) && pdfState.key !== requestKey;
  const blobUrl =
    Boolean(requestKey) && pdfState.key === requestKey ? pdfState.blobUrl : null;
  const error =
    Boolean(requestKey) && pdfState.key === requestKey ? pdfState.error : null;

  const handleOpenInNewTab = useCallback(() => {
    if (!blobUrl) return;
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  }, [blobUrl]);

  const handleDownload = useCallback(() => {
    if (!blobUrl) return;
    const safeName =
      (bookTitle || "book")
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
        .trim() || "book";
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${safeName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [blobUrl, bookTitle]);

  if (!hasPdf) {
    if (!showEmptyState) return null;
    return (
      <div className="space-y-2 pt-2 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Tài liệu PDF nội dung sách
          </h4>
        </div>
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
          Chưa có file PDF đính kèm cho cuốn sách này.
        </div>
      </div>
    );
  }

  const isBorrower = variant === "borrower";

  return (
    <div
      className={
        isBorrower
          ? "pt-2 space-y-3"
          : "space-y-3 pt-2 border-t border-stone-100"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText
            aria-hidden="true"
            className={
              isBorrower
                ? "w-4 h-4 text-[#B8860B]"
                : "w-4 h-4 text-rose-600"
            }
          />
          <h4
            className={
              isBorrower
                ? "text-xs font-bold text-neutral-800 uppercase tracking-wider"
                : "text-xs font-bold uppercase tracking-wider text-stone-700"
            }
          >
            {isBorrower ? "Đọc tài liệu PDF trực tuyến" : "Tài liệu PDF nội dung sách"}
          </h4>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
            PDF
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {blobUrl && (
            <>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                title="Mở PDF ở tab mới"
              >
                <ExternalLink aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Mở tab mới</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                title="Tải file PDF về máy"
              >
                <Download aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Tải PDF</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Thu gọn</span>
              </>
            ) : (
              <>
                <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Xem PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div
          className={
            isBorrower
              ? "rounded-2xl overflow-hidden border border-black/10 bg-white shadow-xs"
              : "rounded-2xl overflow-hidden border border-stone-200 bg-stone-50"
          }
        >
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2.5 text-stone-500">
              <Loader2 className="w-7 h-7 animate-spin text-[#F5B82E]" />
              <span className="text-xs font-medium">
                Đang tải tài liệu PDF...
              </span>
            </div>
          ) : error ? (
            <div className="p-6 flex flex-col items-center justify-center gap-2.5 text-center">
              <AlertCircle className="w-7 h-7 text-rose-500" />
              <p className="text-xs text-rose-700 font-medium max-w-md">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
              >
                <RefreshCw aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Thử tải lại</span>
              </button>
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              title={`PDF - ${bookTitle}`}
              className="w-full h-[460px] bg-white"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
