import { DataSource } from 'typeorm';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';

export async function seedNavigation(dataSource: DataSource) {
  const repository = dataSource.getRepository(Navigation);
  const roleRepo = dataSource.getRepository(Role);
  const roleNavRepo = dataSource.getRepository(RoleNavigation);

  // Helper: tìm theo code, nếu chưa có thì tạo mới
  const createIfNotExists = async (
    data: Partial<Navigation>,
  ): Promise<Navigation> => {
    const existing = await repository.findOneBy({
      code: data.code!,
    });

    if (existing) {
      if (data.path !== undefined && existing.path !== data.path) {
        existing.path = data.path;
        return repository.save(existing);
      }
      return existing;
    }

    return repository.save(repository.create(data));
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
  const adminRole = await roleRepo.findOneBy({ name: 'ADMIN' });
  if (adminRole) {
    const assignNavToRole = async (nav: Navigation) => {
      const existingRoleNav = await roleNavRepo.findOneBy({
        roleId: adminRole.id,
        navigationId: nav.id,
      });
      if (!existingRoleNav) {
        await roleNavRepo.save(
          roleNavRepo.create({
            roleId: adminRole.id,
            navigationId: nav.id,
          }),
        );
        console.log(`Assigned ${nav.code} navigation to ADMIN role`);
      }
    };

    await assignNavToRole(dashboard);

    const menusNav = await repository.findOneBy({ code: 'SYSTEM_MENUS' });
    if (menusNav) {
      await assignNavToRole(menusNav);
    }

    const permsNav = await repository.findOneBy({ code: 'SYSTEM_PERMISSIONS' });
    if (permsNav) {
      await assignNavToRole(permsNav);
    }

    const navMgmtNav = await repository.findOneBy({ code: 'SYSTEM_NAVIGATION_MANAGEMENT' });
    if (navMgmtNav) {
      await assignNavToRole(navMgmtNav);
    }

    const permMgmtNav = await repository.findOneBy({ code: 'SYSTEM_PERMISSION_MANAGEMENT' });
    if (permMgmtNav) {
      await assignNavToRole(permMgmtNav);
    }
  }

  console.log('Navigation seeding completed!');
}