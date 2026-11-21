"use client";

import { useState, useMemo } from "react";
import { NavigationTreeItem, FlatNodeMap } from "../types/navigation.types";

export interface UseNavigationTreeFilterProps {
  tree: NavigationTreeItem[];
  flatMap: FlatNodeMap;
}

export interface UseNavigationTreeFilterReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  expandedNodeIds: Record<string, boolean>;
  setExpandedNodeIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toggleExpand: (nodeId: string) => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;
  filteredTree: NavigationTreeItem[];
  matchingNodeIds: Set<string>;
}

export function useNavigationTreeFilter({
  tree,
  flatMap,
}: UseNavigationTreeFilterProps): UseNavigationTreeFilterReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (nodeId: string) => {
    setExpandedNodeIds((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    Object.keys(flatMap).forEach((id) => {
      if (!flatMap[id].isLeaf) {
        allExpanded[id] = true;
      }
    });
    setExpandedNodeIds(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedNodeIds({});
  };

  const { filteredTree, matchingNodeIds } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { filteredTree: tree, matchingNodeIds: new Set<string>() };
    }

    const term = searchTerm.toLowerCase().trim();
    const matchIds = new Set<string>();
    const keepIds = new Set<string>();

    // Bước 1: Tìm tất cả node khớp từ khóa
    Object.values(flatMap).forEach(({ item }) => {
      const isMatch =
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        (item.path && item.path.toLowerCase().includes(term));

      if (isMatch) {
        matchIds.add(item.id);
        let curr = flatMap[item.id]?.parentId;
        while (curr) {
          keepIds.add(curr);
          curr = flatMap[curr]?.parentId;
        }
      }
    });

    // Bước 2: Lọc đệ quy cây
    function filterNodes(nodes: NavigationTreeItem[]): NavigationTreeItem[] {
      return nodes
        .map((node) => {
          const isDirectMatch = matchIds.has(node.id);
          const hasMatchingDescendant = keepIds.has(node.id);

          if (node.children && node.children.length > 0) {
            const filteredChildren = filterNodes(node.children);
            if (isDirectMatch || filteredChildren.length > 0 || hasMatchingDescendant) {
              return {
                ...node,
                children: filteredChildren,
              };
            }
            return null;
          }

          return isDirectMatch ? node : null;
        })
        .filter((n): n is NavigationTreeItem => n !== null);
    }

    return {
      filteredTree: filterNodes(tree),
      matchingNodeIds: matchIds,
    };
  }, [tree, searchTerm, flatMap]);

  return {
    searchTerm,
    setSearchTerm,
    expandedNodeIds,
    setExpandedNodeIds,
    toggleExpand,
    handleExpandAll,
    handleCollapseAll,
    filteredTree,
    matchingNodeIds,
  };
}
