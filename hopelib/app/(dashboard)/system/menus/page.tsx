"use client";

import React, { useState } from "react";
import { FolderTree, Info } from "lucide-react";
import { TopCornerAlert } from "@/components/ui";
import {
  RoleNavigationList,
  NavigationTreeViewer,
  RoleNavigationSaveBar,
  NavigationSidebarPreviewModal,
  CloneNavigationModal,
  ConfirmDiscardModal,
  useRoleNavigationManagement,
} from "@/features/navigation";
import { usePermissions } from "@/features/auth";

export default function RoleNavigationManagementPage() {
  const { hasPermission } = usePermissions();
  const canAssign = hasPermission("ROLE_NAVIGATION_ASSIGN");

  // Modals UI state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  // Hook quản lý toàn bộ nghiệp vụ dữ liệu, filter và API
  const {
    roles,
    selectedRole,
    filteredTree,
    matchingNodeIds,
    currentLeafCount,
    totalLeafCount,
    isLoading,
    isLoadingRoleNavs,
    isSaving,
    hasChanges,
    addedLeafIds,
    removedLeafIds,
    searchTerm,
    setSearchTerm,
    expandedNodeIds,
    toggleExpand,
    handleExpandAll,
    handleCollapseAll,
    handleSelectAll,
    handleDeselectAll,
    handleToggleNode,
    getNodeCheckState,
    handleSelectRole,
    pendingRoleSwitch,
    confirmRoleSwitch,
    handleResetChanges,
    handleSaveChanges,
    handleApplyClone,
    previewSidebarTree,
    feedback,
    setFeedback,
    roleMenuCounts,
  } = useRoleNavigationManagement({ canAssign });

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5B82E] to-amber-600 flex items-center justify-center text-stone-950 shadow-xs">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Phân quyền Menu & Điều hướng
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Quản lý quyền truy cập danh mục menu điều hướng (Navigation Tree) cho từng vai trò người dùng trong Hope Library
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[90px]">
              <span className="block text-xs font-medium text-stone-500">Vai trò</span>
              <span className="text-lg font-bold text-stone-900">{roles.length}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[90px]">
              <span className="block text-xs font-medium text-stone-500">Tổng Menu Lá</span>
              <span className="text-lg font-bold text-[#B8860B]">{totalLeafCount}</span>
            </div>
          </div>
        </div>

        {/* Warning banner nếu không có quyền phân quyền */}
        {!canAssign && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bạn chỉ có quyền xem cấu hình menu. Cần quyền hạn{" "}
              <code className="font-mono font-semibold px-1 py-0.5 bg-amber-100 rounded">
                ROLE_NAVIGATION_ASSIGN
              </code>{" "}
              để chỉnh sửa hoặc lưu thay đổi phân quyền.
            </span>
          </div>
        )}

        {/* Thông báo dạng Alert nổi góc trên màn hình đồng bộ */}
        <TopCornerAlert feedback={feedback} onClose={() => setFeedback(null)} />
      </div>

      {/* 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Danh sách vai trò */}
        <div className="lg:col-span-4">
          <RoleNavigationList
            roles={roles}
            selectedRoleId={selectedRole?.id}
            onSelectRole={handleSelectRole}
            roleMenuCounts={roleMenuCounts}
            isLoading={isLoading}
          />
        </div>

        {/* Cột phải: Checkbox Tree */}
        <div className="lg:col-span-8">
          <NavigationTreeViewer
            selectedRole={selectedRole}
            tree={filteredTree}
            currentLeafCount={currentLeafCount}
            totalLeafCount={totalLeafCount}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            canAssign={canAssign}
            isLoading={isLoading || isLoadingRoleNavs}
            matchingNodeIds={matchingNodeIds}
            expandedNodeIds={expandedNodeIds}
            onToggleExpand={toggleExpand}
            onToggleCheck={handleToggleNode}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onOpenClone={() => setIsCloneModalOpen(true)}
            getNodeCheckState={getNodeCheckState}
          />
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <RoleNavigationSaveBar
        hasChanges={hasChanges}
        addedCount={addedLeafIds.length}
        removedCount={removedLeafIds.length}
        isSaving={isSaving}
        canAssign={canAssign}
        onReset={handleResetChanges}
        onSave={handleSaveChanges}
      />

      {/* Modal 1: Live Sidebar Preview */}
      <NavigationSidebarPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        selectedRole={selectedRole}
        tree={previewSidebarTree}
      />

      {/* Modal 2: Sao chép quyền từ vai trò khác */}
      <CloneNavigationModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        targetRole={selectedRole}
        roles={roles}
        onApplyClone={handleApplyClone}
      />

      {/* Modal 3: Xác nhận rời vai trò khi chưa lưu */}
      <ConfirmDiscardModal
        isOpen={!!pendingRoleSwitch}
        currentRole={selectedRole}
        targetRole={pendingRoleSwitch}
        onCancel={() => confirmRoleSwitch(false)}
        onConfirm={() => confirmRoleSwitch(true)}
      />
    </div>
  );
}
