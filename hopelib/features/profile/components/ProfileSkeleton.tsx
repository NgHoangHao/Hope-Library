"use client";

import React from "react";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-200 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="w-48 h-6 bg-neutral-200 rounded-md" />
            <div className="w-72 h-4 bg-neutral-100 rounded-md" />
          </div>
        </div>
      </div>

      {/* Grid content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left card skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs flex flex-col items-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-neutral-200 mb-4" />
          <div className="w-36 h-5 bg-neutral-200 rounded-md mb-2" />
          <div className="w-24 h-4 bg-neutral-100 rounded-md mb-4" />
          <div className="w-full space-y-3 pt-4 border-t border-neutral-100">
            <div className="w-full h-4 bg-neutral-100 rounded-md" />
            <div className="w-full h-4 bg-neutral-100 rounded-md" />
            <div className="w-full h-4 bg-neutral-100 rounded-md" />
          </div>
        </div>

        {/* Right form skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6">
            <div className="w-40 h-5 bg-neutral-200 rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <div className="w-20 h-4 bg-neutral-200 rounded-md" />
                <div className="w-full h-10 bg-neutral-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-neutral-200 rounded-md" />
                <div className="w-full h-10 bg-neutral-100 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-neutral-100">
              <div className="space-y-2">
                <div className="w-24 h-4 bg-neutral-200 rounded-md" />
                <div className="w-full h-10 bg-neutral-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="w-20 h-4 bg-neutral-200 rounded-md" />
                <div className="w-full h-10 bg-neutral-100 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
