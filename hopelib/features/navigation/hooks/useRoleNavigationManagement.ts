"use client";

import { useRoleNavigations, UseRoleNavigationsProps } from "./useRoleNavigations";
import { useNavigationTreeFilter } from "./useNavigationTreeFilter";

export type UseRoleNavigationManagementProps = UseRoleNavigationsProps;

export function useRoleNavigationManagement(props: UseRoleNavigationManagementProps = {}) {
  const roleNavState = useRoleNavigations(props);

  const filterState = useNavigationTreeFilter({
    tree: roleNavState.navigationTree,
    flatMap: roleNavState.flatMap,
  });

  return {
    ...roleNavState,
    ...filterState,
    currentLeafCount: roleNavState.currentLeafIds.size,
    totalLeafCount: roleNavState.allLeafIds.length,
    isLoading: roleNavState.isLoadingRoles || roleNavState.isLoadingTree,
  };
}
