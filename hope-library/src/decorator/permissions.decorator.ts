import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator yêu cầu một hoặc nhiều quyền hạn để truy cập API
 * @param permissions Danh sách mã quyền hạn (ví dụ: 'BOOK_CREATE', 'BOOK_READ')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export { RequirePermissions as Permissions, RequirePermissions as RequirePermission };
