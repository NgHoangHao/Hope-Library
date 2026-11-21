import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository.js';
import { UserMapper } from '../mapper/user.mapper.js';
import {
  CreateUserDto,
  QueryUserDto,
  PaginatedUserResponse,
  UserResponse,
  QueryUserSummaryDto,
  PaginatedUserSummaryResponse,
} from '../model/user/user.dto.js';
import { UserStatus } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import { AppException } from '../common/app.exception.js';
import { hashPassword } from '../utils/password.util.js';
import { FileStorageService, type SaveImageResult } from '../utils/file-storage.service.js';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly userMapper: UserMapper,
    private readonly fileStorageService: FileStorageService,
  ) {}

  /**
   * Lấy danh sách người dùng có phân trang, tìm kiếm theo tên hoặc username, lọc theo status và role
   */
  async getUsers(query?: QueryUserDto): Promise<PaginatedUserResponse> {
    const pageNumber = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query?.size) || 10));

    const [users, total] = await this.userRepo.findUsers({
      page: pageNumber,
      size: pageSize,
      search: query?.search,
      status: query?.status,
      role: query?.role,
    });

    return this.userMapper.toPaginatedResponse(users, total, pageNumber, pageSize);
  }

  /**
   * Lấy danh sách thông tin người dùng chỉ có role là BORROWER kèm thống kê:
   * - Số lượng sách đang mượn
   * - Số lượng loan có status EXPIRED
   * - Tổng số tiền fine
   * Hỗ trợ phân trang, tìm kiếm theo mã code, lọc theo status
   */
  async getUsersSummary(query?: QueryUserSummaryDto): Promise<PaginatedUserSummaryResponse> {
    const pageNumber = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query?.size) || 10));

    const [usersWithStats, total] = await this.userRepo.findUsersWithLoanStats({
      page: pageNumber,
      size: pageSize,
      search: query?.search,
      code: query?.code,
      status: query?.status,
      role: 'BORROWER',
    });

    return this.userMapper.toPaginatedSummaryResponse(
      usersWithStats,
      total,
      pageNumber,
      pageSize,
    );
  }

  /**
   * Thêm mới 1 người dùng vào DB kèm vai trò và mã hóa mật khẩu, hỗ trợ tải lên file avatar
   */
  async createUser(
    dto: CreateUserDto,
    avatarFile?: Express.Multer.File,
  ): Promise<UserResponse> {
    const trimmedUsername = dto.username?.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      throw AppException.badRequest(
        'Tên tài khoản (username) là bắt buộc và phải có ít nhất 3 ký tự',
        { field: 'username' },
        'INVALID_USERNAME',
      );
    }

    const trimmedEmail = dto.email?.trim().toLowerCase();
    if (!trimmedEmail) {
      throw AppException.badRequest(
        'Địa chỉ email là bắt buộc',
        { field: 'email' },
        'INVALID_EMAIL',
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw AppException.badRequest(
        'Địa chỉ email không đúng định dạng',
        { field: 'email' },
        'INVALID_EMAIL_FORMAT',
      );
    }

    if (!dto.password || dto.password.length < 6) {
      throw AppException.badRequest(
        'Mật khẩu phải có độ dài tối thiểu 6 ký tự',
        { field: 'password' },
        'INVALID_PASSWORD_LENGTH',
      );
    }

    // Kiểm tra trùng username
    const existingUsername = await this.userRepo.findByUsername(trimmedUsername);
    if (existingUsername) {
      throw AppException.conflict(
        `Tên tài khoản "${trimmedUsername}" đã tồn tại trong hệ thống`,
        { field: 'username', username: trimmedUsername },
        'USERNAME_ALREADY_EXISTS',
      );
    }

    // Kiểm tra trùng email
    const existingEmail = await this.userRepo.findByEmail(trimmedEmail);
    if (existingEmail) {
      throw AppException.conflict(
        `Địa chỉ email "${trimmedEmail}" đã được sử dụng bởi tài khoản khác`,
        { field: 'email', email: trimmedEmail },
        'EMAIL_ALREADY_EXISTS',
      );
    }

    // Validate số điện thoại nếu có
    const trimmedPhone = dto.phone?.trim() || null;
    if (trimmedPhone) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        throw AppException.badRequest(
          'Số điện thoại không hợp lệ (yêu cầu định dạng 10 chữ số, ví dụ 0912345678 hoặc +84912345678)',
          { field: 'phone' },
          'INVALID_PHONE_FORMAT',
        );
      }
    }

    // Xác định danh sách vai trò cần gán
    const rolesToAssign: Role[] = [];
    const roleIdentifiers: string[] = [];

    if (Array.isArray(dto.roles) && dto.roles.length > 0) {
      roleIdentifiers.push(...dto.roles);
    } else if (dto.role && dto.role.trim()) {
      roleIdentifiers.push(dto.role.trim());
    } else {
      roleIdentifiers.push('BORROWER');
    }

    for (const identifier of roleIdentifiers) {
      const role = await this.userRepo.findRoleByNameOrId(identifier);
      if (!role) {
        throw AppException.badRequest(
          `Không tìm thấy vai trò "${identifier}" trong hệ thống`,
          { role: identifier },
          'ROLE_NOT_FOUND',
        );
      }
      if (!rolesToAssign.some((r) => r.id === role.id)) {
        rolesToAssign.push(role);
      }
    }

    // Băm mật khẩu an toàn
    const passwordHash = hashPassword(dto.password);

    // Xử lý upload avatar nếu có file hoặc dto.avatar/dto.avartar
    let uploadResult: SaveImageResult | null = null;
    const fileToUpload = avatarFile ?? dto.avatar ?? dto.avartar;
    let finalAvatarUrl: string | null = dto.avatarUrl?.trim() || dto.avartarUrl?.trim() || null;

    if (fileToUpload) {
      uploadResult = await this.fileStorageService.saveImage(fileToUpload, 'avatars');
      finalAvatarUrl = uploadResult.fileUrl;
    }

    try {
      const createdUser = await this.userRepo.createUserWithRoles(
        {
          code: dto.code?.trim(),
          username: trimmedUsername,
          email: trimmedEmail,
          passwordHash,
          fullName: dto.fullName?.trim() || null,
          phone: trimmedPhone,
          avartarUrl: finalAvatarUrl,
          status: dto.status || UserStatus.ACTIVE,
        },
        rolesToAssign,
      );

      this.logger.log(`Đã thêm mới người dùng thành công: ${createdUser.username} (${createdUser.id})`);
      return this.userMapper.toResponse(createdUser);
    } catch (error) {
      if (uploadResult) {
        await this.fileStorageService.deleteFile(uploadResult.filePath).catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Xóa người dùng theo ID, nếu đang liên kết với entity khác thì ném ngoại lệ
   */
  async deleteUser(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw AppException.badRequest(
        'Mã định danh người dùng (id) không hợp lệ',
        { id },
        'INVALID_USER_ID',
      );
    }

    const user = await this.userRepo.findByIdWithRelations(id.trim());
    if (!user) {
      throw AppException.notFound(
        `Không tìm thấy người dùng với ID: ${id}`,
        { id },
        'USER_NOT_FOUND',
      );
    }

    // 1. Kiểm tra liên kết với phiếu mượn (Loan)
    if (user.loans && user.loans.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa người dùng vì vẫn còn ${user.loans.length} phiếu mượn liên kết trong hệ thống`,
        { id, loanCount: user.loans.length },
        'USER_HAS_ASSOCIATED_LOANS',
      );
    }

    // 2. Kiểm tra liên kết với khoản phạt (Fine)
    if (user.fines && user.fines.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa người dùng vì vẫn còn ${user.fines.length} khoản phạt liên kết trong hệ thống`,
        { id, fineCount: user.fines.length },
        'USER_HAS_ASSOCIATED_FINES',
      );
    }

    // 3. Kiểm tra liên kết với nhật ký kiểm toán (AuditLog)
    if (user.auditLogs && user.auditLogs.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa người dùng vì vẫn còn ${user.auditLogs.length} bản ghi nhật ký kiểm toán liên kết trong hệ thống`,
        { id, auditLogCount: user.auditLogs.length },
        'USER_HAS_ASSOCIATED_AUDIT_LOGS',
      );
    }

    const isDeleted = await this.userRepo.delete(id.trim());
    if (!isDeleted) {
      throw AppException.badRequest(
        `Xóa người dùng thất bại với ID: ${id}`,
        { id },
        'DELETE_USER_FAILED',
      );
    }

    this.logger.log(`Đã xóa người dùng thành công: ${user.username} (${id})`);
  }
}
