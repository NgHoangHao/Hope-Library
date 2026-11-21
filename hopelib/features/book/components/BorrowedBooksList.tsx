"use client";

import React, { useState } from "react";
import { Clock, Calendar, CheckCircle, RotateCw } from "lucide-react";
import { BorrowRecord } from "../types/book.types";

interface BorrowedBooksListProps {
  records: BorrowRecord[];
}

export function BorrowedBooksList({ records: initialRecords }: BorrowedBooksListProps) {
  const [records, setRecords] = useState(initialRecords);
  const [renewedId, setRenewedId] = useState<string | null>(null);

  const handleRenew = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            daysRemaining: r.daysRemaining + 14,
            status: "borrowing",
          };
        }
        return r;
      })
    );
    setRenewedId(id);
    setTimeout(() => setRenewedId(null), 3000);
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-xs my-6">
        <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-neutral-800">Chưa có lượt mượn nào</h3>
        <p className="text-sm text-neutral-500 mt-1">
          Hãy khám phá tủ sách và chọn những cuốn sách bạn yêu thích để bắt đầu hành trình đọc.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
        <span>Đang hiển thị {records.length} cuốn sách đang trong thời gian mượn</span>
        <span>Hạn chuẩn tối đa 14 ngày/lần gia hạn</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {records.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-black/5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex gap-4">
                {/* Mini Book Cover */}
                <div
                  className="w-16 h-22 rounded-lg flex flex-col justify-between p-2 shrink-0 shadow-sm border border-black/5"
                  style={{ backgroundColor: item.coverBg }}
                >
                  <span
                    className="text-[6px] font-bold tracking-widest uppercase"
                    style={{ color: item.subtextColor }}
                  >
                    HOPE
                  </span>
                  <span
                    className="text-[9px] font-bold leading-tight line-clamp-2"
                    style={{ color: item.textColor }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="text-[7px] truncate"
                    style={{ color: item.subtextColor }}
                  >
                    {item.author}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                      item.status === "due_soon"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {item.status === "due_soon" ? "Sắp đến hạn" : "Đang mượn"}
                  </span>
                  <h4 className="font-bold text-sm text-neutral-900 truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-500 truncate">{item.author}</p>
                  <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                    Mã: {item.barcode}
                  </p>
                </div>
              </div>

              {/* Borrow Timeline */}
              <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-xs text-neutral-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ngày mượn</span>
                  </span>
                  <span className="font-medium text-neutral-700">{item.borrowDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Hạn trả</span>
                  </span>
                  <span
                    className={`font-semibold ${
                      item.daysRemaining <= 3 ? "text-amber-600" : "text-neutral-800"
                    }`}
                  >
                    {item.dueDate} ({item.daysRemaining} ngày)
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-neutral-100">
              {renewedId === item.id ? (
                <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-xl">
                  <CheckCircle className="w-4 h-4" />
                  <span>Đã gia hạn thêm 14 ngày!</span>
                </div>
              ) : (
                <button
                  onClick={() => handleRenew(item.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-50 hover:bg-[#F5B82E]/20 text-neutral-700 hover:text-neutral-900 border border-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Gia hạn mượn</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
