"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getProfileApi, updateProfileInfoApi } from "../services/profileApi";
import {
  UserProfile,
  ProfileFeedback,
  ProfileFormValues,
  ProfileFormErrors,
} from "../types/profile.types";
import { getAvatarUrl, validateAvatarFile } from "../utils/avatar.helper";

export interface UseProfileManagementOptions {
  canRead?: boolean;
}

export interface UseProfileManagementReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  feedback: ProfileFeedback | null;
  setFeedback: (feedback: ProfileFeedback | null) => void;
  formValues: ProfileFormValues;
  errors: ProfileFormErrors;
  avatarFile: File | null;
  avatarPreview: string | null;
  isDirty: boolean;
  handleFullNameChange: (value: string) => void;
  handlePhoneChange: (value: string) => void;
  handleAvatarSelect: (file: File | null) => void;
  handleRemoveSelectedAvatar: () => void;
  handleResetForm: () => void;
  handleSaveProfile: () => Promise<boolean>;
  refetchProfile: () => Promise<void>;
}

export function useProfileManagement(
  options: UseProfileManagementOptions = {}
): UseProfileManagementReturn {
  const { canRead = true } = options;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<ProfileFeedback | null>(null);

  // Form states
  const [formValues, setFormValues] = useState<ProfileFormValues>({
    fullName: "",
    phone: "",
  });
  const [initialValues, setInitialValues] = useState<ProfileFormValues>({
    fullName: "",
    phone: "",
  });
  const [errors, setErrors] = useState<ProfileFormErrors>({});

  // Avatar states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /**
   * Đồng bộ dữ liệu profile vào form state
   */
  const syncProfileToForm = useCallback((user: UserProfile) => {
    const rawAvatar = user.avatarUrl ?? user.avartarUrl ?? null;
    const initial: ProfileFormValues = {
      fullName: user.fullName || "",
      phone: user.phone || "",
    };
    setFormValues(initial);
    setInitialValues(initial);
    setAvatarFile(null);
    setAvatarPreview(getAvatarUrl(rawAvatar));
    setErrors({});
  }, []);

  /**
   * Gọi API GET /auth/me để lấy profile mới nhất
   */
  const fetchProfile = useCallback(async () => {
    if (!canRead) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getProfileApi();
      setProfile(data);
      syncProfileToForm(data);

      // Cập nhật thông tin vào localStorage để đồng bộ với topbar/layout
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("hope_user", JSON.stringify(data));
          window.dispatchEvent(
            new CustomEvent("hope_user_updated", { detail: data })
          );
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải thông tin trang cá nhân. Vui lòng thử lại sau.";
      setFeedback({
        type: "error",
        title: "Tải thông tin thất bại",
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [canRead, syncProfileToForm]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Kiểm tra xem form hoặc avatar đã thay đổi so với giá trị ban đầu chưa
   */
  const isDirty = useMemo(() => {
    const isTextDirty =
      formValues.fullName.trim() !== initialValues.fullName.trim() ||
      formValues.phone.trim() !== initialValues.phone.trim();
    const isAvatarDirty = avatarFile !== null;
    return isTextDirty || isAvatarDirty;
  }, [formValues, initialValues, avatarFile]);

  /**
   * Cập nhật họ và tên
   */
  const handleFullNameChange = useCallback((value: string) => {
    setFormValues((prev) => ({ ...prev, fullName: value }));
    setErrors((prev) => ({ ...prev, fullName: undefined }));
  }, []);

  /**
   * Cập nhật số điện thoại
   */
  const handlePhoneChange = useCallback((value: string) => {
    setFormValues((prev) => ({ ...prev, phone: value }));
    setErrors((prev) => ({ ...prev, phone: undefined }));
  }, []);

  /**
   * Xử lý khi chọn file avatar mới
   */
  const handleAvatarSelect = useCallback(
    (file: File | null) => {
      if (!file) return;

      const validation = validateAvatarFile(file);
      if (!validation.isValid) {
        setErrors((prev) => ({ ...prev, avatar: validation.error }));
        setFeedback({
          type: "warning",
          title: "File không hợp lệ",
          message: validation.error || "File ảnh không hợp lệ",
        });
        return;
      }

      setErrors((prev) => ({ ...prev, avatar: undefined }));
      setAvatarFile(file);

      // Tạo Blob preview tạm thời
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    },
    []
  );

  /**
   * Hủy chọn avatar mới, hoàn tác về avatar ban đầu
   */
  const handleRemoveSelectedAvatar = useCallback(() => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    const rawAvatar = profile?.avatarUrl ?? profile?.avartarUrl ?? null;
    setAvatarPreview(getAvatarUrl(rawAvatar));
    setErrors((prev) => ({ ...prev, avatar: undefined }));
  }, [avatarPreview, profile]);

  /**
   * Khôi phục form về trạng thái ban đầu
   */
  const handleResetForm = useCallback(() => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setFormValues(initialValues);
    setAvatarFile(null);
    const rawAvatar = profile?.avatarUrl ?? profile?.avartarUrl ?? null;
    setAvatarPreview(getAvatarUrl(rawAvatar));
    setErrors({});
  }, [avatarPreview, initialValues, profile]);

  /**
   * Validate dữ liệu form phía client trước khi submit
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ProfileFormErrors = {};
    const trimmedFullName = formValues.fullName.trim();
    const trimmedPhone = formValues.phone.trim();

    if (trimmedFullName.length > 100) {
      newErrors.fullName = "Họ và tên không được vượt quá 100 ký tự.";
    }

    if (trimmedPhone) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        newErrors.phone =
          "Số điện thoại không đúng định dạng (Ví dụ: 0912345678 hoặc +84912345678).";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formValues]);

  /**
   * Gọi API PUT /auth/me để cập nhật profile
   */
  const handleSaveProfile = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      setFeedback({
        type: "error",
        title: "Dữ liệu chưa hợp lệ",
        message: "Vui lòng kiểm tra lại các trường thông tin báo đỏ trên biểu mẫu.",
      });
      return false;
    }

    setIsUpdating(true);
    setFeedback(null);

    try {
      const updatedUser = await updateProfileInfoApi({
        fullName: formValues.fullName.trim(),
        phone: formValues.phone.trim() || undefined,
        avatarFile: avatarFile ?? undefined,
      });

      setProfile(updatedUser);
      syncProfileToForm(updatedUser);

      // Cập nhật localStorage & phát sự kiện toàn cục để topbar cập nhật ngay
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("hope_user", JSON.stringify(updatedUser));
          window.dispatchEvent(
            new CustomEvent("hope_user_updated", { detail: updatedUser })
          );
        } catch {
          // ignore
        }
      }

      setFeedback({
        type: "success",
        title: "Thành công",
        message: "Cập nhật thông tin cá nhân thành công!",
      });
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Cập nhật thông tin cá nhân thất bại. Vui lòng thử lại.";
      setFeedback({
        type: "error",
        title: "Cập nhật thất bại",
        message: msg,
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [validateForm, formValues, avatarFile, syncProfileToForm]);

  return {
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
    refetchProfile: fetchProfile,
  };
}
