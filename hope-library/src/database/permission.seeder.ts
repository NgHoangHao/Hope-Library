import { DataSource } from 'typeorm';
import { Permission } from '../model/permission/permission.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';

export interface ApiPermissionItem {
  code: string;
  description: string;
  module: string;
  apiEndpoints: string[];
}

/**
 * Danh sách toàn bộ quyền hạn tương ứng với các API trong hệ thống Hope Library
 */
export const API_PERMISSIONS: ApiPermissionItem[] = [
  // ==========================================
  // 1. Quản lý Sách (Book Module - /books)
  // ==========================================
  {
    code: 'BOOK_CREATE',
    description: 'Quyền tạo mới sách và danh sách bản sao',
    module: 'Books',
    apiEndpoints: ['POST /books'],
  },
  {
    code: 'BOOK_READ',
    description: 'Quyền xem danh sách sách có phân trang, tìm kiếm và xem chi tiết sách',
    module: 'Books',
    apiEndpoints: ['GET /books', 'GET /books/:id'],
  },
  {
    code: 'BOOK_UPDATE',
    description: 'Quyền cập nhật thông tin sách và danh sách bản sao',
    module: 'Books',
    apiEndpoints: ['PUT /books/:id'],
  },
  {
    code: 'BOOK_DELETE',
    description: 'Quyền xóa sách và file ảnh bìa trên ổ đĩa',
    module: 'Books',
    apiEndpoints: ['DELETE /books/:id'],
  },

  // ==========================================
  // 2. Quản lý Tác giả (Author Module - /authors)
  // ==========================================
  {
    code: 'AUTHOR_CREATE',
    description: 'Quyền tạo mới tác giả',
    module: 'Authors',
    apiEndpoints: ['POST /authors'],
  },
  {
    code: 'AUTHOR_READ',
    description: 'Quyền xem danh sách tác giả và chi tiết tác giả kèm danh sách sách',
    module: 'Authors',
    apiEndpoints: ['GET /authors', 'GET /authors/:id'],
  },
  {
    code: 'AUTHOR_UPDATE',
    description: 'Quyền cập nhật thông tin tác giả',
    module: 'Authors',
    apiEndpoints: ['PUT /authors/:id'],
  },
  {
    code: 'AUTHOR_DELETE',
    description: 'Quyền xóa tác giả',
    module: 'Authors',
    apiEndpoints: ['DELETE /authors/:id'],
  },

  // ==========================================
  // 3. Quản lý Thể loại sách (Category Module - /categories)
  // ==========================================
  {
    code: 'CATEGORY_CREATE',
    description: 'Quyền tạo mới thể loại sách',
    module: 'Categories',
    apiEndpoints: ['POST /categories'],
  },
  {
    code: 'CATEGORY_READ',
    description: 'Quyền xem danh sách và chi tiết thể loại sách kèm danh sách sách',
    module: 'Categories',
    apiEndpoints: ['GET /categories', 'GET /categories/:id'],
  },
  {
    code: 'CATEGORY_UPDATE',
    description: 'Quyền cập nhật thông tin thể loại sách',
    module: 'Categories',
    apiEndpoints: ['PUT /categories/:id'],
  },
  {
    code: 'CATEGORY_DELETE',
    description: 'Quyền xóa thể loại sách',
    module: 'Categories',
    apiEndpoints: ['DELETE /categories/:id'],
  },

  // ==========================================
  // 4. Quản lý Mượn trả sách (Loan Module - /loans)
  // ==========================================
  {
    code: 'LOAN_CREATE',
    description: 'Quyền tạo mới phiếu mượn sách kèm danh sách mục mượn',
    module: 'Loans',
    apiEndpoints: ['POST /loans'],
  },
  {
    code: 'LOAN_READ',
    description: 'Quyền xem danh sách phiếu mượn có phân trang, tìm kiếm và chi tiết phiếu mượn',
    module: 'Loans',
    apiEndpoints: ['GET /loans', 'GET /loans/:id'],
  },
  {
    code: 'LOAN_SELF_READ',
    description: 'Quyền xem danh sách phiếu mượn cá nhân của độc giả hiện tại',
    module: 'Loans',
    apiEndpoints: ['GET /loans/me', 'GET /loans/my-loans'],
  },
  {
    code: 'LOAN_UPDATE',
    description: 'Quyền cập nhật thông tin phiếu mượn và danh sách mục mượn/trả',
    module: 'Loans',
    apiEndpoints: ['PUT /loans/:id'],
  },
  {
    code: 'LOAN_DELETE',
    description: 'Quyền xóa cứng phiếu mượn cùng các mục mượn và tiền phạt liên quan',
    module: 'Loans',
    apiEndpoints: ['DELETE /loans/:id'],
  },

  // ==========================================
  // 5. Quản lý Người dùng & Hồ sơ cá nhân (User & Profile Module)
  // ==========================================
  {
    code: 'USER_PROFILE_READ',
    description: 'Quyền xem thông tin tài khoản cá nhân hiện tại',
    module: 'Users',
    apiEndpoints: ['GET /auth/me', 'GET /auth/profile'],
  },
  {
    code: 'USER_PROFILE_UPDATE',
    description: 'Quyền cập nhật thông tin tài khoản cá nhân hiện tại',
    module: 'Users',
    apiEndpoints: ['PUT /auth/profile', 'PUT /auth/me'],
  },
  {
    code: 'USER_CREATE',
    description: 'Quyền tạo mới người dùng trong hệ thống',
    module: 'Users',
    apiEndpoints: ['POST /users', 'POST /auth/register'],
  },
  {
    code: 'USER_READ',
    description: 'Quyền xem danh sách và chi tiết người dùng',
    module: 'Users',
    apiEndpoints: ['GET /users', 'GET /users/:id'],
  },
  {
    code: 'USER_UPDATE',
    description: 'Quyền cập nhật thông tin người dùng',
    module: 'Users',
    apiEndpoints: ['PUT /users/:id'],
  },
  {
    code: 'USER_DELETE',
    description: 'Quyền xóa người dùng khỏi hệ thống',
    module: 'Users',
    apiEndpoints: ['DELETE /users/:id'],
  },

  // ==========================================
  // 6. Quản lý Vai trò (Role Module - /roles)
  // ==========================================
  {
    code: 'ROLE_CREATE',
    description: 'Quyền tạo mới vai trò',
    module: 'Roles',
    apiEndpoints: ['POST /roles'],
  },
  {
    code: 'ROLE_READ',
    description: 'Quyền xem danh sách và chi tiết vai trò',
    module: 'Roles',
    apiEndpoints: ['GET /roles', 'GET /roles/:id'],
  },
  {
    code: 'ROLE_UPDATE',
    description: 'Quyền cập nhật thông tin vai trò',
    module: 'Roles',
    apiEndpoints: ['PUT /roles/:id'],
  },
  {
    code: 'ROLE_DELETE',
    description: 'Quyền xóa vai trò',
    module: 'Roles',
    apiEndpoints: ['DELETE /roles/:id'],
  },

  // ==========================================
  // 7. Quản lý Quyền hạn (Permission Module - /permissions)
  // ==========================================
  {
    code: 'PERMISSION_CREATE',
    description: 'Quyền tạo mới quyền hạn',
    module: 'Permissions',
    apiEndpoints: ['POST /permissions'],
  },
  {
    code: 'PERMISSION_READ',
    description: 'Quyền xem danh sách quyền hạn, quyền hạn theo vai trò và chi tiết quyền hạn',
    module: 'Permissions',
    apiEndpoints: ['GET /permissions', 'GET /permissions/role/:roleId', 'GET /permissions/:id'],
  },
  {
    code: 'PERMISSION_UPDATE',
    description: 'Quyền cập nhật thông tin quyền hạn',
    module: 'Permissions',
    apiEndpoints: ['PUT /permissions/:id'],
  },
  {
    code: 'PERMISSION_DELETE',
    description: 'Quyền xóa quyền hạn khỏi hệ thống',
    module: 'Permissions',
    apiEndpoints: ['DELETE /permissions/:id'],
  },

  // ==========================================
  // 8. Phân quyền & Điều hướng cho Vai trò (Role Assignment Module - /auth)
  // ==========================================
  {
    code: 'ROLE_PERMISSION_ASSIGN',
    description: 'Quyền gán quyền hạn cho vai trò',
    module: 'RoleAssignment',
    apiEndpoints: ['POST /auth/assign-permission', 'POST /auth/roles/permissions'],
  },
  {
    code: 'ROLE_NAVIGATION_ASSIGN',
    description: 'Quyền gán menu điều hướng cho vai trò',
    module: 'RoleAssignment',
    apiEndpoints: ['POST /auth/assign-navigation', 'POST /auth/roles/navigations'],
  },

  // ==========================================
  // 9. Quản lý Menu Điều hướng (Navigation Module - /navigations)
  // ==========================================
  {
    code: 'NAVIGATION_CREATE',
    description: 'Quyền tạo mới menu điều hướng hệ thống',
    module: 'Navigations',
    apiEndpoints: ['POST /navigations'],
  },
  {
    code: 'NAVIGATION_READ',
    description: 'Quyền xem danh sách và cây phân cấp điều hướng hệ thống',
    module: 'Navigations',
    apiEndpoints: ['GET /navigations', 'GET /navigations/tree', 'GET /navigations/role', 'GET /navigations/:id'],
  },
  {
    code: 'NAVIGATION_UPDATE',
    description: 'Quyền cập nhật thông tin menu điều hướng',
    module: 'Navigations',
    apiEndpoints: ['PUT /navigations/:id'],
  },
  {
    code: 'NAVIGATION_DELETE',
    description: 'Quyền xóa menu điều hướng khỏi hệ thống',
    module: 'Navigations',
    apiEndpoints: ['DELETE /navigations/:id'],
  },

  // ==========================================
  // 10. Quản lý Nhật ký kiểm toán (Audit Log Module - /audit-logs)
  // ==========================================
  {
    code: 'AUDIT_LOG_READ',
    description: 'Quyền xem danh sách và chi tiết nhật ký kiểm toán hệ thống có phân trang và lọc',
    module: 'AuditLogs',
    apiEndpoints: ['GET /audit-logs', 'GET /audit-logs/:id'],
  },

  // ==========================================
  // 11. Quản lý Tiền phạt (Fine Module - /fines)
  // ==========================================
  {
    code: 'FINE_UPDATE',
    description: 'Quyền cập nhật trạng thái khoản tiền phạt (UNPAID, PAID, WAIVED)',
    module: 'Fines',
    apiEndpoints: ['PATCH /fines/:id/status'],
  },

  // ==========================================
  // 12. Quản lý Cấu hình Hệ thống (System Config Module - /system-configs)
  // ==========================================
  {
    code: 'SYSTEM_CONFIG_CREATE',
    description: 'Quyền tạo mới thông số cấu hình hệ thống',
    module: 'SystemConfigs',
    apiEndpoints: ['POST /system-configs'],
  },
  {
    code: 'SYSTEM_CONFIG_READ',
    description: 'Quyền xem danh sách và chi tiết thông số cấu hình hệ thống',
    module: 'SystemConfigs',
    apiEndpoints: ['GET /system-configs', 'GET /system-configs/key/:key', 'GET /system-configs/:id'],
  },
  {
    code: 'SYSTEM_CONFIG_UPDATE',
    description: 'Quyền cập nhật thông số cấu hình hệ thống và đồng bộ Redis Cache',
    module: 'SystemConfigs',
    apiEndpoints: ['PUT /system-configs/:id', 'PUT /system-configs/key/:key'],
  },
  {
    code: 'SYSTEM_CONFIG_DELETE',
    description: 'Quyền xóa thông số cấu hình hệ thống',
    module: 'SystemConfigs',
    apiEndpoints: ['DELETE /system-configs/:id'],
  },
];

/**
 * Hàm thực thi seed quyền hạn vào cơ sở dữ liệu
 */
export async function seedPermission(dataSource: DataSource): Promise<void> {
  const permRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const rolePermRepo = dataSource.getRepository(RolePermission);

  console.log(`Bắt đầu khởi tạo ${API_PERMISSIONS.length} quyền hạn ứng với các API...`);

  // 1. Khởi tạo / cập nhật danh sách quyền hạn
  for (const item of API_PERMISSIONS) {
    const existing = await permRepo.findOneBy({ code: item.code });
    if (!existing) {
      await permRepo.save(
        permRepo.create({
          code: item.code,
          description: item.description,
        }),
      );
    } else if (existing.description !== item.description) {
      existing.description = item.description;
      await permRepo.save(existing);
    }
  }

  // 2. Tự động khởi tạo vai trò ADMIN nếu chưa tồn tại
  let adminRole = await roleRepo.findOneBy({ name: 'ADMIN' });
  if (!adminRole) {
    adminRole = await roleRepo.save(
      roleRepo.create({
        name: 'ADMIN',
        description: 'Quản trị viên toàn quyền hệ thống',
      }),
    );
    console.log('Đã tạo vai trò ADMIN mặc định');
  }

  // 3. Gán toàn bộ quyền hạn cho vai trò ADMIN
  if (adminRole) {
    const allPermissions = await permRepo.find();
    let assignedAdminCount = 0;

    for (const perm of allPermissions) {
      const existingAssignment = await rolePermRepo.findOneBy({
        roleId: adminRole.id,
        permissionId: perm.id,
      });

      if (!existingAssignment) {
        await rolePermRepo.save(
          rolePermRepo.create({
            roleId: adminRole.id,
            permissionId: perm.id,
          }),
        );
        assignedAdminCount++;
      }
    }

    if (assignedAdminCount > 0) {
      console.log(`Đã gán ${assignedAdminCount} quyền hạn cho vai trò ADMIN`);
    }
  }

  // 4. Gán quyền cơ bản cho vai trò THỦ THƯ (LIBRARIAN) nếu có
  const librarianRole = await roleRepo.findOneBy({ name: 'LIBRARIAN' });
  if (librarianRole) {
    const librarianPermCodes = [
      'BOOK_CREATE', 'BOOK_READ', 'BOOK_UPDATE', 'BOOK_DELETE',
      'AUTHOR_CREATE', 'AUTHOR_READ', 'AUTHOR_UPDATE', 'AUTHOR_DELETE',
      'CATEGORY_CREATE', 'CATEGORY_READ', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
      'LOAN_CREATE', 'LOAN_READ', 'LOAN_SELF_READ', 'LOAN_UPDATE', 'LOAN_DELETE',
      'FINE_UPDATE',
      'USER_READ', 'USER_PROFILE_READ', 'USER_PROFILE_UPDATE',
      'NAVIGATION_READ',
    ];

    for (const code of librarianPermCodes) {
      const perm = await permRepo.findOneBy({ code });
      if (perm) {
        const existingAssignment = await rolePermRepo.findOneBy({
          roleId: librarianRole.id,
          permissionId: perm.id,
        });
        if (!existingAssignment) {
          await rolePermRepo.save(
            rolePermRepo.create({
              roleId: librarianRole.id,
              permissionId: perm.id,
            }),
          );
        }
      }
    }
    console.log('Đã gán quyền nghiệp vụ cho vai trò LIBRARIAN');
  }

  // 5. Gán quyền cơ bản cho vai trò ĐỌC GIẢ (BORROWER) nếu có
  const borrowerRole = await roleRepo.findOneBy({ name: 'BORROWER' });
  if (borrowerRole) {
    const borrowerPermCodes = [
      'BOOK_READ',
      'AUTHOR_READ',
      'CATEGORY_READ',
      'LOAN_READ',
      'LOAN_SELF_READ',
      'USER_PROFILE_READ',
      'USER_PROFILE_UPDATE',
      'NAVIGATION_READ',
    ];

    for (const code of borrowerPermCodes) {
      const perm = await permRepo.findOneBy({ code });
      if (perm) {
        const existingAssignment = await rolePermRepo.findOneBy({
          roleId: borrowerRole.id,
          permissionId: perm.id,
        });
        if (!existingAssignment) {
          await rolePermRepo.save(
            rolePermRepo.create({
              roleId: borrowerRole.id,
              permissionId: perm.id,
            }),
          );
        }
      }
    }
    console.log('Đã gán quyền đọc và tài khoản cá nhân cho vai trò BORROWER');
  }

  console.log('Hoàn thành khởi tạo quyền hạn (Permission seeding completed)!');
}
