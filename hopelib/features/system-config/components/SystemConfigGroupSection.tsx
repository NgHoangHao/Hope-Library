"use client";

import React from "react";
import { BookOpen, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { SystemConfigItem } from "../types/system-config.types";
import { getGroupDisplayInfo } from "../utils/systemConfigMeta.helper";
import { SystemConfigItemRow } from "./SystemConfigItemRow";

export interface SystemConfigGroupSectionProps {
  groupKey: string;
  items: SystemConfigItem[];
  draftValues: Record<string, string>;
  validationErrors: Record<string, string | null>;
  savingIds: Record<string, boolean>;
  dirtyIdSet: Set<string>;
  canUpdate: boolean;
  onChangeValue: (id: string, value: string) => void;
  onSaveItem: (id: string) => void;
  onResetItem: (id: string) => void;
}

function renderGroupIcon(groupKey: string) {
  switch (groupKey.toUpperCase()) {
    case "AUTH":
      return <ShieldCheck className="w-5 h-5 text-amber-700" />;
    case "LOAN":
      return <BookOpen className="w-5 h-5 text-amber-700" />;
    default:
      return <SlidersHorizontal className="w-5 h-5 text-amber-700" />;
  }
}

export function SystemConfigGroupSection({
  groupKey,
  items,
  draftValues,
  validationErrors,
  savingIds,
  dirtyIdSet,
  canUpdate,
  onChangeValue,
  onSaveItem,
  onResetItem,
}: SystemConfigGroupSectionProps) {
  const info = getGroupDisplayInfo(groupKey);

  return (
    <section className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
      {/* Header của nhóm cấu hình */}
      <div className="px-5 py-4 bg-stone-50/80 border-b border-stone-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-200/70 flex items-center justify-center shrink-0">
            {renderGroupIcon(groupKey)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">{info.label}</h2>
              <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[11px] font-mono font-semibold text-stone-600">
                {groupKey}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{info.description}</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-stone-500 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shrink-0">
          {items.length} thông số
        </span>
      </div>

      {/* Danh sách các cấu hình thuộc nhóm */}
      <div className="divide-y divide-stone-100">
        {items.map((config) => (
          <SystemConfigItemRow
            key={config.id}
            config={config}
            draftValue={draftValues[config.id] ?? config.value}
            validationError={validationErrors[config.id] ?? null}
            isDirty={dirtyIdSet.has(config.id)}
            isSaving={Boolean(savingIds[config.id])}
            canUpdate={canUpdate}
            onChangeValue={onChangeValue}
            onSave={onSaveItem}
            onReset={onResetItem}
          />
        ))}
      </div>
    </section>
  );
}
