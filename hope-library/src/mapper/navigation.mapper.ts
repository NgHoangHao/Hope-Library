import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Navigation } from '../model/navigation/navigation.entity.js';
import {
  CreateNavigationDto,
  NavigationResponse,
  NavigationTreeResponse,
  UpdateNavigationDto,
} from '../model/navigation/navigation.dto.js';

@Injectable()
export class NavigationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, Navigation, NavigationResponse);
      createMap(mapper, Navigation, NavigationTreeResponse);
      createMap(mapper, CreateNavigationDto, Navigation);
      createMap(mapper, UpdateNavigationDto, Navigation);
    };
  }

  /**
   * Chuyển đổi thực thể Navigation sang NavigationResponse
   */
  toResponse(navigation: Navigation): NavigationResponse {
    return this.mapper.map(navigation, Navigation, NavigationResponse);
  }

  /**
   * Chuyển đổi danh sách Navigation sang NavigationResponse[]
   */
  toResponseList(navigations: Navigation[]): NavigationResponse[] {
    return this.mapper.mapArray(navigations, Navigation, NavigationResponse);
  }

  /**
   * Chuyển đổi thực thể Navigation kèm phân cấp con sang NavigationTreeResponse
   */
  toTreeResponse(navigation: Navigation): NavigationTreeResponse {
    const response = this.mapper.map(navigation, Navigation, NavigationTreeResponse);
    if (navigation.children && navigation.children.length > 0) {
      response.children = this.toTreeResponseList(navigation.children);
    } else {
      response.children = [];
    }
    return response;
  }

  /**
   * Chuyển đổi danh sách Navigation sang dạng cây NavigationTreeResponse[]
   */
  toTreeResponseList(navigations: Navigation[]): NavigationTreeResponse[] {
    return navigations.map((nav) => this.toTreeResponse(nav));
  }

  /**
   * Xây dựng cấu trúc cây NavigationTreeResponse[] từ danh sách phẳng Navigation
   */
  toTreeResponseListFromFlatList(navigations: Navigation[]): NavigationTreeResponse[] {
    const itemMap = new Map<string, NavigationTreeResponse>();
    const rootNodes: NavigationTreeResponse[] = [];

    // Map từng thực thể sang NavigationTreeResponse và khởi tạo mảng con
    for (const nav of navigations) {
      const treeNode = this.mapper.map(nav, Navigation, NavigationTreeResponse);
      treeNode.children = [];
      itemMap.set(nav.id, treeNode);
    }

    // Thiết lập phân cấp cha - con
    for (const nav of navigations) {
      const node = itemMap.get(nav.id)!;
      if (nav.parentId && itemMap.has(nav.parentId)) {
        const parentNode = itemMap.get(nav.parentId)!;
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    return rootNodes;
  }

  /**
   * Chuyển đổi CreateNavigationDto sang thực thể Navigation
   */
  toEntity(dto: CreateNavigationDto): Navigation {
    return this.mapper.map(dto, CreateNavigationDto, Navigation);
  }
}

export { NavigationProfile as NavigationMapper };
