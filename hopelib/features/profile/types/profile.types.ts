import { AuthUser, UpdateProfilePayload, UserRoleItem } from "@/features/auth";
import { AlertFeedback } from "@/components/ui";

export type UserProfile = AuthUser;
export type { UserRoleItem };

export type ProfileFeedback = AlertFeedback;

export interface ProfileFormValues {
  fullName: string;
  phone: string;
}

export interface ProfileFormErrors {
  fullName?: string;
  phone?: string;
  avatar?: string;
}
