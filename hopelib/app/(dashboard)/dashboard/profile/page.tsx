"use client";

import React from "react";
import { usePermissions } from "@/features/auth";
import {
  ProfileHeader,
  ProfileAvatarCard,
  ProfileInfoForm,
  ProfileSecurityCard,
  ProfileSkeleton,
  useProfileManagement,
} from "@/features/profile";

export default function ProfilePage() {
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

  if (isLoading && !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6 pb-16">
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

        {/* Cột phải: Form cập nhật thông tin cá nhân */}
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
  );
}
