import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { entities } from '../model/index.js';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';

/**
 * Hàm seed danh mục điều hướng System (Menus & Permissions) và gán vào role ADMIN
 */
export async function seedSystemNavigation(dataSource: DataSource) {
  const navRepo = dataSource.getRepository(Navigation);
  const roleRepo = dataSource.getRepository(Role);
  const roleNavRepo = dataSource.getRepository(RoleNavigation);

  // Helper tìm hoặc tạo Navigation
  const createIfNotExists = async (data: Partial<Navigation>): Promise<Navigation> => {
    const existing = await navRepo.findOneBy({ code: data.code! });
    if (existing) {
      let needsUpdate = false;
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
      if (needsUpdate) {
        return navRepo.save(existing);
      }
      return existing;
    }
    return navRepo.save(navRepo.create(data));
  };

  console.log('--- Bắt đầu khởi tạo điều hướng Hệ thống (System Navigations) ---');

  // 1. Tạo thư mục menu cha: SYSTEM (Hệ thống)
  const systemParent = await createIfNotExists({
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

  // 2. Tạo menu con: SYSTEM_MENUS (/system/menus)
  const menusNav = await createIfNotExists({
    code: 'SYSTEM_MENUS',
    name: 'Menus',
    path: '/system/menus',
    parentId: systemParent.id,
    icon: 'panel-left',
    sortOrder: 1,
    isVisible: true,
    isActive: true,
  });
  console.log(`[OK] Menu điều hướng: ${menusNav.name} -> Path: ${menusNav.path}`);

  // 3. Tạo menu con: SYSTEM_PERMISSIONS (/system/permissions)
  const permissionsNav = await createIfNotExists({
    code: 'SYSTEM_PERMISSIONS',
    name: 'Permissions',
    path: '/system/permissions',
    parentId: systemParent.id,
    icon: 'shield-check',
    sortOrder: 2,
    isVisible: true,
    isActive: true,
  });
  console.log(`[OK] Menu điều hướng: ${permissionsNav.name} -> Path: ${permissionsNav.path}`);

  // 4. Tạo menu con: SYSTEM_NAVIGATION_MANAGEMENT (/system/navigation-management), sortOrder = 3
  const navManagement = await createIfNotExists({
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
    `[OK] Menu điều hướng: ${navManagement.name} -> Path: ${navManagement.path} (sortOrder: ${navManagement.sortOrder})`
  );

  // 5. Tạo menu con: SYSTEM_PERMISSION_MANAGEMENT (/system/permission-management), sortOrder = 4
  const permManagement = await createIfNotExists({
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
    `[OK] Menu điều hướng: ${permManagement.name} -> Path: ${permManagement.path} (sortOrder: ${permManagement.sortOrder})`
  );

  // 6. Tìm vai trò ADMIN trong hệ thống
  const adminRole = await roleRepo.findOneBy({ name: 'ADMIN' });
  if (!adminRole) {
    console.warn('[CẢNH BÁO] Không tìm thấy vai trò ADMIN trong bảng roles. Bỏ qua bước gán quyền.');
    return;
  }

  // 7. Gán 4 navigation này vào vai trò ADMIN
  const navigationsToAssign = [menusNav, permissionsNav, navManagement, permManagement];
  for (const nav of navigationsToAssign) {
    const existingRoleNav = await roleNavRepo.findOneBy({
      roleId: adminRole.id,
      navigationId: nav.id,
    });

    if (!existingRoleNav) {
      await roleNavRepo.save(
        roleNavRepo.create({
          roleId: adminRole.id,
          navigationId: nav.id,
        })
      );
      console.log(`[OK] Đã gán thành công menu "${nav.name}" (${nav.path}) cho vai trò ADMIN`);
    } else {
      console.log(`[INFO] Menu "${nav.name}" (${nav.path}) đã được gán cho ADMIN từ trước`);
    }
  }

  console.log('--- Hoàn tất seeding điều hướng Hệ thống cho ADMIN ---');
}

// Module độc lập để có thể chạy trực tiếp bằng dòng lệnh: npx tsx src/database/system-navigation.seeder.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT', '1433')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities,
        autoLoadEntities: true,
        synchronize: false,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
  ],
})
class StandaloneSeedModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(StandaloneSeedModule);

  try {
    const dataSource = app.get(DataSource);
    await seedSystemNavigation(dataSource);
    console.log('Script seeder hoàn thành thành công!');
  } catch (error) {
    console.error('Lỗi khi thực thi seeder:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

// Nếu file được gọi trực tiếp bằng Node/tsx
if (process.argv[1]?.includes('system-navigation.seeder')) {
  void bootstrap();
}
