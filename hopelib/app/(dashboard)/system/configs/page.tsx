"use client";

import React, { useMemo } from "react";
import { Lock, SlidersHorizontal } from "lucide-react";
import { usePermissions } from "@/features/auth";
import {
  SystemConfigHeader,
  SystemConfigToolbar,
  SystemConfigGroupSection,
  SystemConfigSaveBar,
  useSystemConfigManagement,
} from "@/features/system-config";

export default function SystemConfigsPage() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("SYSTEM_CONFIG_READ");
  const canUpdate = hasPermission("SYSTEM_CONFIG_UPDATE");

  const {
    configs,
    groupedConfigs,
    groupOptions,
    selectedGroup,
    setSelectedGroup,
    searchTerm,
    setSearchTerm,
    isLoading,
    isRefreshing,
    draftValues,
    validationErrors,
    savingIds,
    isSavingAll,
    dirtyIds,
    feedback,
    setFeedback,
    handleDraftChange,
    handleResetItem,
    handleResetAll,
    handleSaveItem,
    handleSaveAll,
    refreshConfigs,
  } = useSystemConfigManagement({ canRead, canUpdate });

  const dirtyIdSet = useMemo(() => new Set(dirtyIds), [dirtyIds]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header thống kê & Banner phản hồi */}
      <SystemConfigHeader
        totalCount={configs.length}
        groupCount={Math.max(0, groupOptions.length - 1)}
        dirtyCount={dirtyIds.length}
        feedback={feedback}
        onClearFeedback={() => setFeedback(null)}
      />

      {!canRead ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200/80 text-center space-y-2">
          <Lock className="w-10 h-10 text-stone-400 mx-auto" />
          <h2 className="text-base font-semibold text-stone-900">
            Không có quyền truy cập cấu hình hệ thống
          </h2>
          <p className="text-sm text-stone-500">
            Tài khoản của bạn chưa được cấp quyền xem danh sách cấu hình hệ thống.
          </p>
        </div>
      ) : (
        <>
          {/* Thanh tìm kiếm, lọc nhóm và làm mới */}
          <SystemConfigToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            groupOptions={groupOptions}
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            isRefreshing={isRefreshing}
            onRefresh={refreshConfigs}
          />

          {/* Nội dung danh sách cấu hình theo nhóm */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="bg-white rounded-2xl border border-stone-200/80 p-6 animate-pulse space-y-4"
                >
                  <div className="h-5 w-48 bg-stone-200 rounded-lg" />
                  <div className="h-14 w-full bg-stone-100 rounded-xl" />
                  <div className="h-14 w-full bg-stone-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : groupedConfigs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-stone-200/80 text-center space-y-2">
              <SlidersHorizontal className="w-10 h-10 text-stone-300 mx-auto" />
              <h2 className="text-base font-semibold text-stone-800">
                Không tìm thấy cấu hình phù hợp
              </h2>
              <p className="text-sm text-stone-500">
                Thử thay đổi từ khóa tìm kiếm hoặc chọn nhóm cấu hình khác.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedConfigs.map(({ groupKey, items }) => (
                <SystemConfigGroupSection
                  key={groupKey}
                  groupKey={groupKey}
                  items={items}
                  draftValues={draftValues}
                  validationErrors={validationErrors}
                  savingIds={savingIds}
                  dirtyIdSet={dirtyIdSet}
                  canUpdate={canUpdate}
                  onChangeValue={handleDraftChange}
                  onSaveItem={handleSaveItem}
                  onResetItem={handleResetItem}
                />
              ))}
            </div>
          )}

          {/* Thanh lưu nhanh nổi phía dưới khi có thay đổi */}
          <SystemConfigSaveBar
            dirtyCount={dirtyIds.length}
            isSavingAll={isSavingAll}
            canUpdate={canUpdate}
            onResetAll={handleResetAll}
            onSaveAll={handleSaveAll}
          />
        </>
      )}
    </div>
  );
}
