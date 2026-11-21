import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignPermissionDto {
  @AutoMap(() => String)
  @ApiProperty({
    description: 'Mã định danh vai trò (Role ID - UUID)',
    example: 'd3b07384-d113-40e1-bbd5-a3d8f31b67f1',
  })
  roleId: string;

  @AutoMap(() => String)
  @ApiProperty({
    description: 'Mã định danh quyền hạn (Permission ID - UUID)',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  permissionId: string;
}

export class RolePermissionResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã định danh vai trò (Role ID)' })
  roleId: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã định danh quyền hạn (Permission ID)' })
  permissionId: string;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Thời điểm gán quyền' })
  assignedAt: Date;

  @ApiPropertyOptional({ description: 'Tên vai trò' })
  roleName?: string;

  @ApiPropertyOptional({ description: 'Mã quyền hạn' })
  permissionCode?: string;

  constructor(partial?: Partial<RolePermissionResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
