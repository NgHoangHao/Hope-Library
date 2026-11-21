export interface PermissionItem {
  id: string;
  code: string;
  description?: string | null;
  module?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string | null;
}

export interface PermissionDiffItem {
  roleId: string;
  permissionId: string;
  permissionCode: string;
  roleName: string;
}

export type RolePermissionMap = Record<string, Set<string>>;

export interface CreatePermissionDto {
  code: string;
  description?: string;
}

export interface UpdatePermissionDto {
  code?: string;
  description?: string;
}

export interface PermissionFeedback {
  type: "success" | "error" | "info";
  message: string;
}
