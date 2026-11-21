import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { NestFactory } from '@nestjs/core';
import type { Connection, Model } from 'mongoose';

import { mongooseModels } from '../model/index.js';
import { getMongoConnectionOptions } from './mongo.config.js';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';

/**
 * Hàm seed 2 navigation con của nhóm SYSTEM:
 * 1. Navigation Management (/system/navigation-management) - sortOrder: 3
 * 2. Permission Management (/system/permission-management) - sortOrder: 4
 * Đồng thời tự động phân quyền điều hướng cho vai trò ADMIN.
 */
export async function seedSystemManagementNavigation(connection: Connection) {
  const navModel = connection.model<Navigation>(Navigation.name) as Model<Navigation>;
  const roleModel = connection.model<Role>(Role.name) as Model<Role>;
  const roleNavModel = connection.model<RoleNavigation>(RoleNavigation.name) as Model<RoleNavigation>;

  const createOrUpdateNavigation = async (data: Partial<Navigation>): Promise<Navigation> => {
    const existing = await navModel.findOne({ code: data.code! }).exec();
    if (existing) {
      let needsUpdate = false;

      if (data.name !== undefined && existing.name !== data.name) {
        existing.name = data.name;
        needsUpdate = true;
      }
      if (data.path !== undefined && existing.path !== data.path) {
        existing.path = data.path;
        needsUpdate = true;
      }
      if (data.parentId !== undefined && existing.parentId !== data.parentId) {
        existing.parentId = data.parentId;
        needsUpdate = true;
      }
      if (data.icon !== undefined && existing.icon !== data.icon) {
        existing.icon = data.icon;
        needsUpdate = true;
      }
      if (data.sortOrder !== undefined && existing.sortOrder !== data.sortOrder) {
        existing.sortOrder = data.sortOrder;
        needsUpdate = true;
      }
      if (data.isVisible !== undefined && existing.isVisible !== data.isVisible) {
        existing.isVisible = data.isVisible;
        needsUpdate = true;
      }
      if (data.isActive !== undefined && existing.isActive !== data.isActive) {
        existing.isActive = data.isActive;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await existing.save();
      }
      return existing;
    }

    return navModel.create({
      id: randomUUID(),
      sortOrder: 0,
      isVisible: true,
      isActive: true,
      ...data,
    });
  };

  console.log('--- Bắt đầu khởi tạo điều hướng Navigation Management & Permission Management ---');

  const systemParent = await createOrUpdateNavigation({
    code: 'SYSTEM',
    name: 'System',
    path: null,
    parentId: null,
    icon: 'settings',
    sortOrder: 4,
    isVisible: true,
    isActive: true,
  });
  console.log(`[OK] Nhóm menu cha: ${systemParent.name} (Code: ${systemParent.code})`);

  const navManagement = await createOrUpdateNavigation({
    code: 'SYSTEM_NAVIGATION_MANAGEMENT',
    name: 'Navigation Management',
    path: '/system/navigation-management',
    parentId: systemParent.id,
    icon: 'folder-tree',
    sortOrder: 3,
    isVisible: true,
    isActive: true,
  });
  console.log(
    `[OK] Menu điều hướng: ${navManagement.name} -> Path: ${navManagement.path} (sortOrder: ${navManagement.sortOrder})`,
  );

  const permManagement = await createOrUpdateNavigation({
    code: 'SYSTEM_PERMISSION_MANAGEMENT',
    name: 'Permission Management',
    path: '/system/permission-management',
    parentId: systemParent.id,
    icon: 'key-round',
    sortOrder: 4,
    isVisible: true,
    isActive: true,
  });
  console.log(
    `[OK] Menu điều hướng: ${permManagement.name} -> Path: ${permManagement.path} (sortOrder: ${permManagement.sortOrder})`,
  );

  const adminRole = await roleModel.findOne({ name: 'ADMIN' }).exec();
  if (!adminRole) {
    console.warn('[CẢNH BÁO] Không tìm thấy vai trò ADMIN trong cơ sở dữ liệu. Bỏ qua bước gán quyền điều hướng.');
    return;
  }

  const navigationsToAssign = [navManagement, permManagement];
  for (const nav of navigationsToAssign) {
    const existingRoleNav = await roleNavModel
      .findOne({
        roleId: adminRole.id,
        navigationId: nav.id,
      })
      .exec();

    if (!existingRoleNav) {
      await roleNavModel.create({
        roleId: adminRole.id,
        navigationId: nav.id,
        assignedAt: new Date(),
      });
      console.log(`[OK] Đã gán thành công menu "${nav.name}" (${nav.path}) cho vai trò ADMIN`);
    } else {
      console.log(`[INFO] Menu "${nav.name}" (${nav.path}) đã được gán cho ADMIN từ trước`);
    }
  }

  console.log('--- Hoàn tất seeding 2 navigation với sortOrder 3 và 4 thành công ---');
}

// Module độc lập để có thể chạy trực tiếp bằng dòng lệnh: npx tsx src/database/system-management-navigation.seeder.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getMongoConnectionOptions(config),
    }),
    MongooseModule.forFeature(mongooseModels),
  ],
})
class StandaloneSeedModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(StandaloneSeedModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());
    await seedSystemManagementNavigation(connection);
    console.log('Script seeder hoàn thành thành công!');
  } catch (error) {
    console.error('Lỗi khi thực thi seeder:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

if (process.argv[1]?.includes('system-management-navigation.seeder')) {
  void bootstrap();
}
