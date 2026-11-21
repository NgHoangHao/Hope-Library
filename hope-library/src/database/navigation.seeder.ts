import { randomUUID } from 'node:crypto';
import type { Connection, Model } from 'mongoose';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';

export async function seedNavigation(connection: Connection) {
  const navModel = connection.model<Navigation>(Navigation.name) as Model<Navigation>;
  const roleModel = connection.model<Role>(Role.name) as Model<Role>;
  const roleNavModel = connection.model<RoleNavigation>(RoleNavigation.name) as Model<RoleNavigation>;

  // Helper: tìm theo code, nếu chưa có thì tạo mới
  const createIfNotExists = async (
    data: Partial<Navigation>,
  ): Promise<Navigation> => {
    const existing = await navModel.findOne({ code: data.code! }).exec();

    if (existing) {
      if (data.path !== undefined && existing.path !== data.path) {
        existing.path = data.path;
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

  // 1. Dashboard (Mục menu đơn)
  const dashboard = await createIfNotExists({
    code: 'DASHBOARD',
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'layout-dashboard',
    sortOrder: 1,
    parentId: null,
  });

  // 2. Parent User
  const user = await createIfNotExists({
    code: 'USER',
    name: 'User',
    path: null,
    parentId: null,
    icon: 'users',
    sortOrder: 2,
  });

  // 3. Parent Book
  const book = await createIfNotExists({
    code: 'BOOK',
    name: 'Book',
    path: null,
    parentId: null,
    icon: 'book-open',
    sortOrder: 3,
  });

  // 3. Child User
  const userChildren = [
    {
      code: 'USER_LIBRARIAN',
      name: 'Librarian',
      path: '/users/librarians',
      icon: 'user-cog',
      sortOrder: 1,
    },
    {
      code: 'USER_BORROWER',
      name: 'Borrower',
      path: '/users/borrowers',
      icon: 'book-user',
      sortOrder: 2,
    },
  ];

  // 4. Child Book
  const bookChildren = [
    {
      code: 'BOOK_LIST',
      name: 'Book List',
      path: '/books/book-list',
      icon: 'library',
      sortOrder: 1,
    },
    {
      code: 'BOOK_CATEGORY',
      name: 'Category',
      path: '/books/categories',
      icon: 'tags',
      sortOrder: 2,
    },
    {
      code: 'BOOK_AUTHOR',
      name: 'Author',
      path: '/books/authors',
      icon: 'feather',
      sortOrder: 3,
    },
    {
      code: 'BOOK_LOAN',
      name: 'Loan',
      path: '/books/loans',
      icon: 'book-copy',
      sortOrder: 4,
    },
  ];

  // 4. Parent System
  const system = await createIfNotExists({
    code: 'SYSTEM',
    name: 'System',
    path: null,
    parentId: null,
    icon: 'settings',
    sortOrder: 4,
  });

  // 5. Child System
  const systemChildren = [
    {
      code: 'SYSTEM_MENUS',
      name: 'Menus',
      path: '/system/menus',
      icon: 'panel-left',
      sortOrder: 1,
    },
    {
      code: 'SYSTEM_PERMISSIONS',
      name: 'Permissions',
      path: '/system/permissions',
      icon: 'shield-check',
      sortOrder: 2,
    },
    {
      code: 'SYSTEM_NAVIGATION_MANAGEMENT',
      name: 'Navigation Management',
      path: '/system/navigation-management',
      icon: 'folder-tree',
      sortOrder: 3,
    },
    {
      code: 'SYSTEM_PERMISSION_MANAGEMENT',
      name: 'Permission Management',
      path: '/system/permission-management',
      icon: 'key-round',
      sortOrder: 4,
    },
  ];

  for (const item of userChildren) {
    await createIfNotExists({
      ...item,
      parentId: user.id,
    });
  }

  for (const item of bookChildren) {
    await createIfNotExists({
      ...item,
      parentId: book.id,
    });
  }

  for (const item of systemChildren) {
    await createIfNotExists({
      ...item,
      parentId: system.id,
    });
  }

  // 6. Gán quyền điều hướng cho role ADMIN nếu chưa có
  const adminRole = await roleModel.findOne({ name: 'ADMIN' }).exec();
  if (adminRole) {
    const assignNavToRole = async (nav: Navigation) => {
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
        console.log(`Assigned ${nav.code} navigation to ADMIN role`);
      }
    };

    await assignNavToRole(dashboard);

    const menusNav = await navModel.findOne({ code: 'SYSTEM_MENUS' }).exec();
    if (menusNav) {
      await assignNavToRole(menusNav);
    }

    const permsNav = await navModel.findOne({ code: 'SYSTEM_PERMISSIONS' }).exec();
    if (permsNav) {
      await assignNavToRole(permsNav);
    }

    const navMgmtNav = await navModel.findOne({ code: 'SYSTEM_NAVIGATION_MANAGEMENT' }).exec();
    if (navMgmtNav) {
      await assignNavToRole(navMgmtNav);
    }

    const permMgmtNav = await navModel.findOne({ code: 'SYSTEM_PERMISSION_MANAGEMENT' }).exec();
    if (permMgmtNav) {
      await assignNavToRole(permMgmtNav);
    }
  }

  console.log('Navigation seeding completed!');
}
