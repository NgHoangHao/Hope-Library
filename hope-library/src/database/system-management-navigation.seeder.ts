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
 * Hàm seed 2 navigation con của nhóm SYSTEM:
 * 1. Navigation Management (/system/navigation-management) - sortOrder: 3
 * 2. Permission Management (/system/permission-management) - sortOrder: 4
 * Đồng thời tự động phân quyền điều hướng cho vai trò ADMIN.
 */
export async function seedSystemManagementNavigation(dataSource: DataSource) {
  const navRepo = dataSource.getRepository(Navigation);
  const roleRepo = dataSource.getRepository(Role);
  const roleNavRepo = dataSource.getRepository(RoleNavigation);

  // Helper tìm theo code hoặc tạo mới, đồng thời cập nhật đúng path, parentId, sortOrder nếu đã có
  const createOrUpdateNavigation = async (data: Partial<Navigation>): Promise<Navigation> => {
    const existing = await navRepo.findOneBy({ code: data.code! });
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
        return navRepo.save(existing);
      }
      return existing;
    }

    return navRepo.save(navRepo.create(data));
  };

  console.log('--- Bắt đầu khởi tạo điều hướng Navigation Management & Permission Management ---');

  // 1. Kiểm tra hoặc khởi tạo nhóm menu cha SYSTEM
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

  // 2. Tạo menu con: Navigation Management (/system/navigation-management), sortOrder = 3
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
    `[OK] Menu điều hướng: ${navManagement.name} -> Path: ${navManagement.path} (sortOrder: ${navManagement.sortOrder})`
  );

  // 3. Tạo menu con: Permission Management (/system/permission-management), sortOrder = 4
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
    `[OK] Menu điều hướng: ${permManagement.name} -> Path: ${permManagement.path} (sortOrder: ${permManagement.sortOrder})`
  );

  // 4. Tìm vai trò ADMIN để gán quyền điều hướng
  const adminRole = await roleRepo.findOneBy({ name: 'ADMIN' });
  if (!adminRole) {
    console.warn('[CẢNH BÁO] Không tìm thấy vai trò ADMIN trong cơ sở dữ liệu. Bỏ qua bước gán quyền điều hướng.');
    return;
  }

  // 5. Gán 2 navigation này cho vai trò ADMIN
  const navigationsToAssign = [navManagement, permManagement];
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

  console.log('--- Hoàn tất seeding 2 navigation với sortOrder 3 và 4 thành công ---');
}

// Module độc lập để có thể chạy trực tiếp bằng dòng lệnh: npx tsx src/database/system-management-navigation.seeder.ts
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
    await seedSystemManagementNavigation(dataSource);
    console.log('Script seeder hoàn thành thành công!');
  } catch (error) {
    console.error('Lỗi khi thực thi seeder:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

// Nếu file được gọi trực tiếp bằng Node/tsx
if (process.argv[1]?.includes('system-management-navigation.seeder')) {
  void bootstrap();
}
