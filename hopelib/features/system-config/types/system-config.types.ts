export type SystemConfigValueType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

export interface SystemConfigItem {
  id: string;
  key: string;
  value: string;
  valueType: SystemConfigValueType;
  group?: string | null;
  description?: string | null;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSystemConfigValueDto {
  value: string;
}

export interface SystemConfigFeedback {
  type: "success" | "error";
  message: string;
}

export interface SystemConfigGroupOption {
  key: string;
  label: string;
  count: number;
}
