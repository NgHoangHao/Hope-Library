import { AutoMap } from '@automapper/classes';

export class CreateRoleDto {
  @AutoMap(() => String)
  name: string;

  @AutoMap(() => String)
  description?: string;
}

export class UpdateRoleDto {
  name?: string;
  description?: string;
}

export class RoleResponse {
  @AutoMap(() => String)
  id: string;

  @AutoMap(() => String)
  name: string;

  @AutoMap(() => String)
  description?: string | null;

  constructor(partial?: Partial<RoleResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
