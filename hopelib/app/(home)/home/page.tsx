"use client";

import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  BorrowerHomeFeaturedBooks,
  BorrowerBookDetailModal,
  useBorrowerHome,
} from "@/features/book";
import { useBorrowerHomeGuard, useAuthModal } from "@/features/auth";
import { getAvatarUrl } from "@/features/profile";

export default function BorrowerHomePage() {
  const { isAuthorized, isLoading: isGuardLoading } = useBorrowerHomeGuard();
  const { user } = useAuthModal();
  const [imageError, setImageError] = useState(false);

  const {
    topBooks,
    isLoadingTopBooks,
    authorMap,
    categoryMap,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    handleViewAll,
    isDetailOpen,
    selectedBookDetail,
    isLoadingDetail,
    handleSelectBook,
    handleCloseDetail,
  } = useBorrowerHome();

  // User display name & initials
  const displayName = user?.fullName || user?.username || "Độc giả";
  const initials = useMemo(() => {
    if (!displayName) return "HL";
    const parts = displayName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const avatarSrc = getAvatarUrl(user?.avatarUrl || user?.avartarUrl);

  if (isGuardLoading || !isAuthorized) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#F5B82E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
              Khám phá những cuốn sách phù hợp với cảm hứng của bạn tại Hope Library.
            </p>
          </div>

          {/* User Avatar Circle */}
          <div
            title={displayName}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#F5B82E] text-[#1A1A1A] font-bold text-sm sm:text-base flex items-center justify-center shadow-xs shrink-0 select-none mt-1 overflow-hidden"
          >
            {avatarSrc && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              initials
            )}
          </div>
        </section>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-2xl p-2 sm:p-2.5 pl-6 sm:pl-7 border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow flex items-center gap-3 sm:gap-4 mb-12"
        >
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sách, tác giả hoặc thể loại..."
            className="w-full bg-transparent outline-none text-[#1A1A1A] placeholder-neutral-400 text-sm sm:text-base font-normal"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
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

        {/* Featured Top Returned Books Section (data from /books/top-returned) */}
        <BorrowerHomeFeaturedBooks
          books={topBooks}
          isLoading={isLoadingTopBooks}
          onSelectBook={handleSelectBook}
          onViewAll={handleViewAll}
          authorMap={authorMap}
          categoryMap={categoryMap}
        />

        {/* Book Detail Modal (fetched via /books/:id) */}
        <BorrowerBookDetailModal
          isOpen={isDetailOpen}
          book={selectedBookDetail}
          isLoading={isLoadingDetail}
          onClose={handleCloseDetail}
          authorMap={authorMap}
          categoryMap={categoryMap}
        />
      </div>
    </div>
  );
}
