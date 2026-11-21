import {
  NavigationItem,
  NavigationTreeItem,
} from "../types/navigation.types";

/**
 * Xây dựng lại cấu trúc cây (Hierarchical Tree) từ danh sách phẳng (Flat Array)
 */
export function buildNavigationTreeFromFlat(flatItems: NavigationItem[]): NavigationTreeItem[] {
  const itemMap = new Map<string, NavigationTreeItem>();

  // 1. Khởi tạo từng node với mảng children rỗng
  flatItems.forEach((item) => {
    itemMap.set(item.id, {
      id: item.id,
      code: item.code,
      name: item.name,
      path: item.path,
      parentId: item.parentId,
      icon: item.icon,
      sortOrder: item.sortOrder ?? 0,
      isVisible: item.isVisible ?? true,
      isActive: item.isActive ?? true,
      children: [],
    });
  });

  const roots: NavigationTreeItem[] = [];

  // 2. Gán quan hệ cha - con
  flatItems.forEach((item) => {
    const node = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      const parentNode = itemMap.get(item.parentId)!;
      parentNode.children = parentNode.children || [];
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 3. Sắp xếp thứ tự hiển thị tăng dần theo sortOrder
  const sortTreeNodes = (nodes: NavigationTreeItem[]) => {
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortTreeNodes(node.children);
      }
    });
  };

  sortTreeNodes(roots);
  return roots;
}

/**
 * Lấy toàn bộ ID của các node con, cháu của một node (để loại trừ khỏi dropdown cha khi update)
 */
export function getDescendantIds(
  nodeId: string,
  flatItems: NavigationItem[]
): Set<string> {
  const descendants = new Set<string>();
  const childrenMap = new Map<string, string[]>();

  flatItems.forEach((item) => {
    if (item.parentId) {
      const list = childrenMap.get(item.parentId) || [];
      list.push(item.id);
      childrenMap.set(item.parentId, list);
    }
  });

  function traverse(id: string) {
    const children = childrenMap.get(id) || [];
    children.forEach((childId) => {
      descendants.add(childId);
      traverse(childId);
    });
  }

  traverse(nodeId);
  return descendants;
}
