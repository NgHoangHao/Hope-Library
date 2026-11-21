import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleResponse } from '../role/role.dto.js';
import { UserStatus } from './user.entity.js';

export class RegisterDto {
  @ApiProperty({ description: 'Địa chỉ email người dùng', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Tên tài khoản / Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Secret123@' })
  password: string;

  @ApiPropertyOptional({ description: 'Xác nhận lại mật khẩu', example: 'Secret123@' })
  confirmPassword?: string;

  @ApiPropertyOptional({ description: 'Alias hỗ trợ viết liền (confirmpassword)', example: 'Secret123@' })
  confirmpassword?: string;

  @ApiPropertyOptional({ description: 'Họ và tên đầy đủ', example: 'John Doe' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ', example: '0912345678' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Mã người dùng (tùy chọn theo định dạng A-xxxx, hệ thống sẽ tự sinh nếu không truyền)',
    example: 'A-0001',
  })
  code?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'Địa chỉ email đăng ký', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Mã OTP gồm 6 chữ số gửi về Gmail', example: '123456' })
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ description: 'Địa chỉ email nhận lại mã OTP', example: 'user@example.com' })
  email: string;
}

export class UpdateProfileDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Họ và tên đầy đủ', example: 'Nguyễn Văn A' })
  fullName?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ', example: '0912345678' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'File ảnh đại diện (avatar / avartar) tải lên (png, jpg, jpeg, webp)',
    type: 'string',
    format: 'binary',
  })
  avatar?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'File ảnh đại diện (avartar) tải lên (png, jpg, jpeg, webp)',
    type: 'string',
    format: 'binary',
  })
  avartar?: Express.Multer.File;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn ảnh đại diện (avartarUrl)' })
  avartarUrl?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Alias cho đường dẫn ảnh đại diện (avatarUrl)' })
  avatarUrl?: string;

  constructor(partial?: Partial<UpdateProfileDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class UserResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã định danh User (UUID)' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã người dùng (định dạng A-xxxx)', example: 'A-0001' })
  code: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tên tài khoản' })
  username: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Email' })
  email: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Họ và tên' })
  fullName?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Số điện thoại' })
  phone?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn ảnh đại diện (avartarUrl)' })
  avartarUrl?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Alias ảnh đại diện (avatarUrl)' })
  avatarUrl?: string | null;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Trạng thái tài khoản' })
  status: string;

  @ApiProperty({ description: 'Danh sách tên các vai trò', type: [String], example: ['BORROWER'] })
  roles?: string[];

  @ApiPropertyOptional({
    description: 'Danh sách chi tiết các vai trò của người dùng (id, name, description)',
    type: () => [RoleResponse],
  })
  roleList?: RoleResponse[];

  @ApiPropertyOptional({
    description: 'Alias danh sách chi tiết các vai trò của người dùng',
    type: () => [RoleResponse],
  })
  roleDetails?: RoleResponse[];

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Thời điểm tạo tài khoản' })
  createdAt: Date;

  constructor(partial?: Partial<UserResponse>) {
    if (partial) {
      Object.assign(this, partial);
      if (partial.roleList !== undefined && this.roleDetails === undefined) {
        this.roleDetails = partial.roleList;
      }
      if (partial.roleDetails !== undefined && this.roleList === undefined) {
        this.roleList = partial.roleDetails;
      }
      if (partial.avartarUrl !== undefined && this.avatarUrl === undefined) {
        this.avatarUrl = partial.avartarUrl;
      }
      if (partial.avatarUrl !== undefined && this.avartarUrl === undefined) {
        this.avartarUrl = partial.avatarUrl;
      }
    }
  }
}

export class LoginDto {
  @ApiProperty({ description: 'Tên tài khoản / Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Secret123@' })
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Access Token (JWT)', example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken: string;

  @ApiPropertyOptional({ description: 'Thông tin tài khoản đăng nhập', type: () => UserResponse })
  user?: UserResponse;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'Access Token mới (JWT)', example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  username?: string;
  sub?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Địa chỉ email tài khoản cần lấy lại mật khẩu',
    example: 'user@example.com',
  })
  email: string;
}

export class VerifyResetOtpDto {
  @ApiProperty({
    description: 'Địa chỉ email tài khoản cần đặt lại mật khẩu',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Mã OTP gồm 6 chữ số gửi về Gmail',
    example: '123456',
  })
  otp: string;
}

export class VerifyResetOtpResponseDto {
  @ApiProperty({
    description: 'Reset Token dùng để đổi mật khẩu mới (hiệu lực 5 phút)',
    example: 'c1a7d6e4b8f23901a8d9b1c7e2f5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
  })
  resetToken: string;

  @ApiProperty({
    description: 'Thời gian hiệu lực tính bằng giây',
    example: 300,
  })
  expiresInSeconds: number;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset Token nhận được sau khi xác thực OTP thành công',
    example: 'c1a7d6e4b8f23901a8d9b1c7e2f5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
  })
  resetToken: string;

  @ApiProperty({
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    example: 'NewSecret123@',
  })
  newPassword: string;

  @ApiPropertyOptional({
    description: 'Xác nhận lại mật khẩu mới',
    example: 'NewSecret123@',
  })
  confirmPassword?: string;

  @ApiPropertyOptional({
    description: 'Alias hỗ trợ viết liền (confirmpassword)',
    example: 'NewSecret123@',
  })
  confirmpassword?: string;
}

export class CreateUserDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã người dùng (tùy chọn theo quy tắc A-xxxx, hệ thống sẽ tự sinh nếu không truyền)',
    example: 'A-0001',
  })
  code?: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tên tài khoản (username)', example: 'nguyenvana' })
  username: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Địa chỉ email người dùng', example: 'nguyenvana@example.com' })
  email: string;

  @ApiProperty({ description: 'Mật khẩu người dùng (tối thiểu 6 ký tự)', example: 'Secret123@' })
  password: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Họ và tên đầy đủ', example: 'Nguyễn Văn A' })
  fullName?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0912345678' })
  phone?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Trạng thái tài khoản',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    example: UserStatus.ACTIVE,
  })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Tên vai trò hoặc ID vai trò gán cho người dùng (ví dụ: BORROWER, LIBRARIAN, ADMIN)',
    example: 'BORROWER',
    default: 'BORROWER',
  })
  role?: string;

  @ApiPropertyOptional({
    description: 'Danh sách các vai trò gán cho người dùng (hỗ trợ nhiều role)',
    type: [String],
    example: ['BORROWER'],
  })
  roles?: string[];

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn ảnh đại diện', example: '/uploads/avatars/avatar.png' })
  avatarUrl?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Alias đường dẫn ảnh đại diện' })
  avartarUrl?: string;

  @ApiPropertyOptional({
    description: 'File ảnh đại diện người dùng tải lên (png, jpg, jpeg, webp)',
    type: 'string',
    format: 'binary',
  })
  avatar?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Alias file ảnh đại diện tải lên',
    type: 'string',
    format: 'binary',
  })
  avartar?: Express.Multer.File;

  constructor(partial?: Partial<CreateUserDto>) {
    if (partial) {
      Object.assign(this, partial);
      if (partial.avartarUrl !== undefined && this.avatarUrl === undefined) {
        this.avatarUrl = partial.avartarUrl;
      }
      if (partial.avatarUrl !== undefined && this.avartarUrl === undefined) {
        this.avartarUrl = partial.avatarUrl;
      }
    }
  }
}

export class QueryUserDto {
  @ApiPropertyOptional({ description: 'Số trang (bắt đầu từ 1)', example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Số lượng mục trên mỗi trang', example: 10, default: 10 })
  size?: number;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo fullName hoặc username hoặc email', example: 'Nguyen' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái tài khoản',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Lọc theo vai trò (tên vai trò như BORROWER, LIBRARIAN, ADMIN hoặc UUID của vai trò)',
    example: 'BORROWER',
  })
  role?: string;
}

export class PaginatedUserResponse {
  @ApiProperty({
    type: () => [UserResponse],
    description: 'Danh sách người dùng của trang hiện tại',
  })
  items: UserResponse[];

  @ApiProperty({ example: 1, description: 'Số trang hiện tại (bắt đầu từ 1)' })
  page: number;

  @ApiProperty({ example: 10, description: 'Số lượng người dùng mỗi trang' })
  size: number;

  @ApiProperty({ example: 50, description: 'Tổng số người dùng thỏa mãn điều kiện' })
  total: number;

  @ApiProperty({ example: 5, description: 'Tổng số trang' })
  totalPages: number;

  constructor(partial?: Partial<PaginatedUserResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class QueryUserSummaryDto {
  @ApiPropertyOptional({ description: 'Số trang (bắt đầu từ 1)', example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Số lượng mục trên mỗi trang', example: 10, default: 10 })
  size?: number;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo mã người dùng (code, ví dụ: A-0001)', example: 'A-0001' })
  search?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo mã người dùng (code, ví dụ: A-0001)', example: 'A-0001' })
  code?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái tài khoản',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Lọc theo vai trò (tên vai trò như BORROWER, LIBRARIAN, ADMIN hoặc UUID của vai trò)',
    example: 'BORROWER',
  })
  role?: string;
}

export class UserSummaryResponse extends UserResponse {
  @AutoMap(() => Number)
  @ApiProperty({
    description: 'Số lượng sách người dùng đang mượn',
    example: 2,
    default: 0,
  })
  borrowedBooksCount: number;

  @AutoMap(() => Number)
  @ApiProperty({
    description: 'Số lượng phiếu mượn (loan) có trạng thái EXPIRED',
    example: 1,
    default: 0,
  })
  expiredLoansCount: number;

  @AutoMap(() => Number)
  @ApiProperty({
    description: 'Tổng số tiền phạt (fine) của người dùng',
    example: 50000,
    default: 0,
  })
  totalFineAmount: number;

  constructor(partial?: Partial<UserSummaryResponse>) {
    super(partial);
    this.borrowedBooksCount = partial?.borrowedBooksCount ?? 0;
    this.expiredLoansCount = partial?.expiredLoansCount ?? 0;
    this.totalFineAmount = partial?.totalFineAmount ?? 0;
  }
}

export class PaginatedUserSummaryResponse {
  @ApiProperty({
    type: () => [UserSummaryResponse],
    description: 'Danh sách người dùng kèm thống kê mượn sách và tiền phạt của trang hiện tại',
  })
  items: UserSummaryResponse[];

  @ApiProperty({ example: 1, description: 'Số trang hiện tại (bắt đầu từ 1)' })
  page: number;

  @ApiProperty({ example: 10, description: 'Số lượng người dùng mỗi trang' })
  size: number;

  @ApiProperty({ example: 50, description: 'Tổng số người dùng thỏa mãn điều kiện' })
  total: number;

  @ApiProperty({ example: 5, description: 'Tổng số trang' })
  totalPages: number;

  constructor(partial?: Partial<PaginatedUserSummaryResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}


