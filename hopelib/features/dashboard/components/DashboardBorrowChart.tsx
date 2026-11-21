"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  DashboardChartItemData,
  DashboardChartRangeData,
} from "../types/dashboard.types";

interface DashboardBorrowChartProps {
  data: DashboardChartItemData[];
  chartRange?: DashboardChartRangeData;
  weeklyGrowthPercent?: number | null;
  isLoading: boolean;
}

const DEFAULT_DAYS: DashboardChartItemData[] = [
  { day: "T2", date: "", count: 0 },
  { day: "T3", date: "", count: 0 },
  { day: "T4", date: "", count: 0 },
  { day: "T5", date: "", count: 0 },
  { day: "T6", date: "", count: 0 },
  { day: "T7", date: "", count: 0 },
  { day: "CN", date: "", count: 0 },
];

function formatShortDate(isoDate?: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

function computeYAxisScale(maxValue: number): number[] {
  if (maxValue <= 3) return [3, 2, 1, 0];
  if (maxValue <= 6) return [6, 4, 2, 0];
  if (maxValue <= 12) return [12, 8, 4, 0];
  const step = Math.ceil(maxValue / 3 / 5) * 5;
  return [step * 3, step * 2, step, 0];
}

export function DashboardBorrowChart({
  data,
  chartRange,
  weeklyGrowthPercent,
  isLoading,
}: DashboardBorrowChartProps) {
  const chartItems = data.length > 0 ? data : DEFAULT_DAYS;
  const maxCount = Math.max(...chartItems.map((item) => item.count), 0);
  const yTicks = computeYAxisScale(maxCount);
  const maxY = yTicks[0];

  const rangeLabel =
    chartRange?.from && chartRange?.to
      ? `Tuần trước (${formatShortDate(chartRange.from)} - ${formatShortDate(chartRange.to)})`
      : "Thống kê từ Thứ 2 đến Chủ nhật tuần trước";

  const growthValue = weeklyGrowthPercent ?? 0;
  const isPositiveGrowth = growthValue >= 0;
  const growthLabel = `${isPositiveGrowth ? "+" : ""}${growthValue}%`;

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-neutral-100 shadow-2xs">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Hoạt động mượn sách
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">{rangeLabel}</p>
        </div>
        {!isLoading && weeklyGrowthPercent !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border",
              isPositiveGrowth
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-rose-50 text-rose-700 border-rose-100"
            )}
          >
            {growthLabel}
          </span>
        )}
      </div>

      {/* Bar Chart Container */}
      <div className="relative pt-4 pb-2">
        {/* Grid Lines & Y Axis */}
        <div className="flex flex-col justify-between h-48 text-[11px] text-neutral-300 pointer-events-none select-none">
          {yTicks.map((tick, idx) => (
            <div key={tick} className="flex items-center gap-4">
              <span className="w-7 text-right">{tick}</span>
              <div
                className={cn(
                  "flex-1 border-b",
                  idx === yTicks.length - 1
                    ? "border-neutral-200/80"
                    : "border-dashed border-neutral-100"
                )}
              />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute top-4 left-11 right-4 h-48 flex items-end justify-between px-3 sm:px-6">
          {chartItems.map((item) => {
            const heightPercent =
              maxY > 0 && item.count > 0
                ? Math.max(4, Math.round((item.count / maxY) * 100))
                : 0;

            return (
              <div
                key={item.day}
                className="flex flex-col items-center h-full justify-end group cursor-pointer"
                title={
                  item.date
                    ? `${item.day} (${formatShortDate(item.date)}): ${item.count} lượt mượn`
                    : `${item.day}: ${item.count} lượt mượn`
                }
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm mb-1 whitespace-nowrap">
                  {item.count}
                </div>
                {/* Bar pillar */}
                <div
                  style={{
                    height: isLoading ? "20%" : `${heightPercent}%`,
                  }}
                  className={cn(
                    "w-4 sm:w-6 rounded-t-md transition-all origin-bottom",
                    isLoading
                      ? "bg-neutral-100 animate-pulse"
                      : item.count > 0
                        ? "bg-[#F5B82E] group-hover:bg-[#EAA91D] group-hover:scale-y-105"
                        : "bg-neutral-100 min-h-[3px]"
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* X Axis Day Labels */}
        <div className="ml-11 mr-4 mt-3 flex items-center justify-between px-3 sm:px-6">
          {chartItems.map((item) => (
            <span
              key={item.day}
              className="w-4 sm:w-6 text-center text-xs font-medium text-neutral-400"
            >
              {item.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
