export interface NavigationTreeItem {
  id: string;
  code: string;
  name: string;
  path?: string | null;
  parentId?: string | null;
  icon?: string | null;
  sortOrder: number;
  isVisible: boolean;
  isActive: boolean;
  children?: NavigationTreeItem[];
}

export interface NavigationItem {
  id: string;
  code: string;
  name: string;
  path?: string | null;
  parentId?: string | null;
  icon?: string | null;
  sortOrder: number;
  isVisible: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string | null;
}

export interface FlatNodeInfo {
  item: NavigationTreeItem;
  parentId: string | null;
  childIds: string[];
  leafIds: string[];
  isLeaf: boolean;
}

export type FlatNodeMap = Record<string, FlatNodeInfo>;

export interface CreateNavigationDto {
  code: string;
  name: string;
  path?: string;
  parentId?: string | null;
  icon?: string;
  sortOrder?: number;
  isVisible?: boolean;
  isActive?: boolean;
}

export interface UpdateNavigationDto {
  code?: string;
  name?: string;
  path?: string | null;
  parentId?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
  isActive?: boolean;
}

export interface NavigationFeedback {
  type: "success" | "error" | "info";
  message: string;
}
