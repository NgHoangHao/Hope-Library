"use client";

import React, { useState, useMemo } from "react";
import { Search, ArrowRight, X } from "lucide-react";
import { BookCard } from "./BookCard";
import { BookDetailModal } from "./BookDetailModal";
import { BorrowedBooksList } from "./BorrowedBooksList";
import {
  MOCK_FEATURED_BOOKS,
  MOCK_ALL_BOOKS,
  MOCK_BORROWED_BOOKS,
} from "../data/mockBooks";
import { BookItem } from "../types/book.types";
import { useAuthModal } from "@/features/auth";

export function BookExplorerView() {
  const { user } = useAuthModal();
  const [activeTab, setActiveTab] = useState<"explore" | "borrowed">("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  // User display name & initials (falls back to Minh Anh from mock design)
  const displayName = user?.fullName || user?.username || "Minh Anh";
  const initials = useMemo(() => {
    if (!displayName) return "MA";
    const parts = displayName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  // Handle Search
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmittedQuery(searchQuery.trim());
    if (searchQuery.trim()) {
      setShowAllBooks(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSubmittedQuery("");
  };

  // Filtered books based on search and showAll
  const displayedBooks = useMemo(() => {
    let list = showAllBooks ? MOCK_ALL_BOOKS : MOCK_FEATURED_BOOKS;
    const query = submittedQuery.toLowerCase();
    if (query) {
      list = MOCK_ALL_BOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.author.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query)
      );
    }
    return list;
  }, [showAllBooks, submittedQuery]);

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Top User Greeting Section */}
        <section className="flex items-start justify-between gap-4 mb-8">
          <div>
            <span className="text-[#B8860B] font-semibold text-xs sm:text-[13px] tracking-[0.22em] uppercase block mb-2 sm:mb-2.5">
              KHÔNG GIAN CỦA BẠN
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-[#1A1A1A] leading-[1.15]">
              Chào {displayName}, hôm nay bạn muốn đọc gì?
            </h1>
            <p className="text-neutral-500 text-sm sm:text-base mt-2 font-normal">
              Khám phá những cuốn sách phù hợp với cảm hứng của bạn.
            </p>
          </div>

          {/* User Avatar Circle */}
          <div
            title={displayName}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#F5B82E] text-[#1A1A1A] font-bold text-sm sm:text-base flex items-center justify-center shadow-xs shrink-0 select-none mt-1"
          >
            {initials}
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="border-b border-neutral-200/90 mb-8">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab("explore")}
              className={`relative pb-3 text-sm sm:text-base font-semibold transition-colors cursor-pointer ${
                activeTab === "explore"
                  ? "text-[#1A1A1A]"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <span>Khám phá sách</span>
              {activeTab === "explore" && (
                <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#F5B82E] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("borrowed")}
              className={`relative pb-3 text-sm sm:text-base font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "borrowed"
                  ? "text-[#1A1A1A]"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <span>Lượt mượn của tôi</span>
              <span className="w-5 h-5 rounded-full bg-[#F5B82E] text-[#1A1A1A] text-[11px] font-bold inline-flex items-center justify-center">
                {MOCK_BORROWED_BOOKS.length}
              </span>
              {activeTab === "borrowed" && (
                <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#F5B82E] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Content depending on Active Tab */}
        {activeTab === "borrowed" ? (
          <BorrowedBooksList records={MOCK_BORROWED_BOOKS} />
        ) : (
          <>
            {/* Search Bar Container */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-2xl p-2 sm:p-2.5 pl-6 sm:pl-7 border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow flex items-center gap-3 sm:gap-4 mb-10"
            >
              <Search className="w-5 h-5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên sách hoặc tác giả..."
                className="w-full bg-transparent outline-none text-[#1A1A1A] placeholder-neutral-400 text-sm sm:text-base font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] font-semibold text-sm sm:text-base px-6 sm:px-8 py-3 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 active:scale-[0.98]"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Section: Tuyển chọn cho bạn */}
            <section className="mb-14">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="text-[#B8860B] font-semibold text-xs tracking-[0.2em] uppercase block mb-1">
                    TUYỂN CHỌN CHO BẠN
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A1A]">
                    {submittedQuery ? `Kết quả tìm kiếm cho "${submittedQuery}"` : "Sách nổi bật"}
                  </h2>
                </div>

                {!submittedQuery && (
                  <button
                    onClick={() => setShowAllBooks(!showAllBooks)}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#B8860B] hover:text-[#9A7008] transition-colors cursor-pointer group"
                  >
                    <span>{showAllBooks ? "Thu gọn" : "Xem tất cả"}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>

              {/* Books Grid */}
              {displayedBooks.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-xs my-6">
                  <p className="text-base font-semibold text-neutral-800">
                    Không tìm thấy cuốn sách nào phù hợp với từ khóa &ldquo;{submittedQuery}&rdquo;
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Vui lòng thử tìm kiếm bằng tên sách hoặc tên tác giả khác.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#F5B82E] text-[#1A1A1A] text-xs font-semibold hover:bg-[#EAA91D] transition-all cursor-pointer"
                  >
                    Xem tất cả sách
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
                  {displayedBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onSelect={(b) => setSelectedBook(b)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Book Detail Modal */}
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      </div>
    </div>
  );
}
