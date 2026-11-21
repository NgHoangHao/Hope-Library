export interface RoleItem {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface RoleFeedback {
  type: "success" | "error" | "info";
  message: string;
}
