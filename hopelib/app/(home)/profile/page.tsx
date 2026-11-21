"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home, UserCheck } from "lucide-react";
import { usePermissions, useBorrowerHomeGuard } from "@/features/auth";
import {
  ProfileHeader,
  ProfileAvatarCard,
  ProfileInfoForm,
  ProfileSecurityCard,
  ProfileSkeleton,
  useProfileManagement,
} from "@/features/profile";

export default function BorrowerProfilePage() {
  const { isAuthorized, isLoading: isGuardLoading } = useBorrowerHomeGuard();
  const { hasPermission } = usePermissions();

  const canRead = hasPermission("USER_PROFILE_READ");
  const canUpdate = hasPermission("USER_PROFILE_UPDATE");

  const {
    profile,
    isLoading,
    isUpdating,
    feedback,
    setFeedback,
    formValues,
    errors,
    avatarFile,
    avatarPreview,
    isDirty,
    handleFullNameChange,
    handlePhoneChange,
    handleAvatarSelect,
    handleRemoveSelectedAvatar,
    handleResetForm,
    handleSaveProfile,
    refetchProfile,
  } = useProfileManagement({ canRead });

  if (isGuardLoading || !isAuthorized) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#F5B82E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoading && !profile) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-2 font-medium">
          <Link
            href="/home"
            className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[#B8860B] font-semibold">Hồ sơ cá nhân</span>
        </nav>

        {/* Header trang và thông báo Alert nổi góc trên */}
        <ProfileHeader
          profile={profile}
          isLoading={isLoading}
          feedback={feedback}
          onClearFeedback={() => setFeedback(null)}
          onRefresh={refetchProfile}
        />

        {/* Nội dung chia 2 cột: Cột trái (Avatar & Metadata), Cột phải (Form chỉnh sửa & Security) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Card Avatar & Định danh */}
          <div className="space-y-6">
            <ProfileAvatarCard
              profile={profile}
              avatarPreview={avatarPreview}
              avatarFile={avatarFile}
              avatarError={errors.avatar}
              canUpdate={canUpdate}
              onAvatarSelect={handleAvatarSelect}
              onRemoveSelectedAvatar={handleRemoveSelectedAvatar}
            />

            <ProfileSecurityCard profile={profile} />
          </div>

          {/* Cột phải: Form cập nhật thông tin cá nhân (PUT /auth/me) */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileInfoForm
              profile={profile}
              formValues={formValues}
              errors={errors}
              isDirty={isDirty}
              isUpdating={isUpdating}
              canUpdate={canUpdate}
              onFullNameChange={handleFullNameChange}
              onPhoneChange={handlePhoneChange}
              onReset={handleResetForm}
              onSubmit={handleSaveProfile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
