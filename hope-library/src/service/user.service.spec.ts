import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service.js';
import { UserRepository } from '../repository/user.repository.js';
import { UserMapper } from '../mapper/user.mapper.js';
import { User, UserStatus } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import {
  CreateUserDto,
  PaginatedUserResponse,
  UserResponse,
  PaginatedUserSummaryResponse,
  UserSummaryResponse,
} from '../model/user/user.dto.js';
import { AppException } from '../common/app.exception.js';

import { FileStorageService } from '../utils/file-storage.service.js';

describe('UserService', () => {
  let service: UserService;
  let userRepo: Partial<Record<keyof UserRepository, ReturnType<typeof vi.fn>>>;
  let userMapper: Partial<Record<keyof UserMapper, ReturnType<typeof vi.fn>>>;
  let fileStorageService: Partial<Record<keyof FileStorageService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    userRepo = {
      findUsers: vi.fn(),
      findUsersWithLoanStats: vi.fn(),
      findById: vi.fn(),
      findByIdWithRelations: vi.fn(),
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      findRoleByNameOrId: vi.fn(),
      createUserWithRoles: vi.fn(),
      delete: vi.fn(),
    };

    userMapper = {
      toResponse: vi.fn(),
      toResponseList: vi.fn(),
      toPaginatedResponse: vi.fn(),
      toSummaryResponse: vi.fn(),
      toPaginatedSummaryResponse: vi.fn(),
    };

    fileStorageService = {
      saveImage: vi.fn(),
      deleteFile: vi.fn(),
      validateImageFile: vi.fn(),
    };

    service = new UserService(
      userRepo as unknown as UserRepository,
      userMapper as unknown as UserMapper,
      fileStorageService as unknown as FileStorageService,
    );
  });

  describe('getUsers', () => {
    it('phải phân trang và lọc người dùng chính xác', async () => {
      const mockUsers = [
        new User({
          id: 'u-1',
          username: 'user1',
          fullName: 'Nguyen Van A',
          status: UserStatus.ACTIVE,
        }),
      ];
      userRepo.findUsers!.mockResolvedValue([mockUsers, 1]);

      const mockPaginated = new PaginatedUserResponse({
        items: [
          new UserResponse({
            id: 'u-1',
            username: 'user1',
            fullName: 'Nguyen Van A',
          }),
        ],
        page: 1,
        size: 10,
        total: 1,
        totalPages: 1,
      });
      userMapper.toPaginatedResponse!.mockReturnValue(mockPaginated);

      const result = await service.getUsers({
        page: 1,
        size: 10,
        search: 'Nguyen',
        status: UserStatus.ACTIVE,
        role: 'BORROWER',
      });

      expect(userRepo.findUsers).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: 'Nguyen',
        status: UserStatus.ACTIVE,
        role: 'BORROWER',
      });
      expect(result).toBe(mockPaginated);
    });
  });

  describe('getUsersSummary', () => {
    it('phải phân trang, tìm kiếm theo code, lọc theo status và trả về thống kê mượn/phạt của user', async () => {
      const mockUser = new User({
        id: 'u-1',
        code: 'A-0001',
        username: 'user1',
        fullName: 'Nguyen Van A',
        status: UserStatus.ACTIVE,
      });

      const mockUsersWithStats = [
        {
          user: mockUser,
          borrowedBooksCount: 2,
          expiredLoansCount: 1,
          totalFineAmount: 50000,
        },
      ];
      userRepo.findUsersWithLoanStats!.mockResolvedValue([mockUsersWithStats, 1]);

      const mockPaginatedSummary = new PaginatedUserSummaryResponse({
        items: [
          new UserSummaryResponse({
            id: 'u-1',
            code: 'A-0001',
            username: 'user1',
            fullName: 'Nguyen Van A',
            status: UserStatus.ACTIVE,
            borrowedBooksCount: 2,
            expiredLoansCount: 1,
            totalFineAmount: 50000,
          }),
        ],
        page: 1,
        size: 10,
        total: 1,
        totalPages: 1,
      });
      userMapper.toPaginatedSummaryResponse!.mockReturnValue(mockPaginatedSummary);

      const result = await service.getUsersSummary({
        page: 1,
        size: 10,
        search: 'A-0001',
        status: UserStatus.ACTIVE,
      });

      expect(userRepo.findUsersWithLoanStats).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: 'A-0001',
        code: undefined,
        status: UserStatus.ACTIVE,
        role: 'BORROWER',
      });
      expect(result).toBe(mockPaginatedSummary);
      expect(result.items[0].borrowedBooksCount).toBe(2);
      expect(result.items[0].expiredLoansCount).toBe(1);
      expect(result.items[0].totalFineAmount).toBe(50000);
    });
  });

  describe('createUser', () => {
    it('phải ném lỗi nếu username rỗng hoặc ít hơn 3 ký tự', async () => {
      await expect(
        service.createUser(new CreateUserDto({ username: 'ab', email: 'test@example.com', password: '123' })),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu email không đúng định dạng', async () => {
      await expect(
        service.createUser(new CreateUserDto({ username: 'validuser', email: 'invalid-email', password: 'password123' })),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu mật khẩu dưới 6 ký tự', async () => {
      await expect(
        service.createUser(new CreateUserDto({ username: 'validuser', email: 'test@example.com', password: '123' })),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 409 nếu username đã tồn tại', async () => {
      userRepo.findByUsername!.mockResolvedValue(new User({ id: 'u-dup', username: 'existing' }));

      await expect(
        service.createUser(new CreateUserDto({ username: 'existing', email: 'test@example.com', password: 'password123' })),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 409 nếu email đã được sử dụng', async () => {
      userRepo.findByUsername!.mockResolvedValue(null);
      userRepo.findByEmail!.mockResolvedValue(new User({ id: 'u-dup', email: 'existing@example.com' }));

      await expect(
        service.createUser(new CreateUserDto({ username: 'newuser', email: 'existing@example.com', password: 'password123' })),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu vai trò chỉ định không tồn tại trong hệ thống', async () => {
      userRepo.findByUsername!.mockResolvedValue(null);
      userRepo.findByEmail!.mockResolvedValue(null);
      userRepo.findRoleByNameOrId!.mockResolvedValue(null);

      await expect(
        service.createUser(new CreateUserDto({
          username: 'newuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'UNKNOWN_ROLE',
        })),
      ).rejects.toThrow(AppException);
    });

    it('phải tạo user thành công với mật khẩu đã hash và vai trò mặc định BORROWER', async () => {
      userRepo.findByUsername!.mockResolvedValue(null);
      userRepo.findByEmail!.mockResolvedValue(null);
      const mockRole = new Role({ id: 'r-1', name: 'BORROWER' });
      userRepo.findRoleByNameOrId!.mockResolvedValue(mockRole);

      const createdUser = new User({
        id: 'u-created',
        code: 'A-0001',
        username: 'newuser',
        email: 'test@example.com',
        fullName: 'New User',
      });
      userRepo.createUserWithRoles!.mockResolvedValue(createdUser);

      const expectedResponse = new UserResponse({
        id: 'u-created',
        code: 'A-0001',
        username: 'newuser',
        email: 'test@example.com',
        roles: ['BORROWER'],
      });
      userMapper.toResponse!.mockReturnValue(expectedResponse);

      const result = await service.createUser(new CreateUserDto({
        username: 'newuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'New User',
      }));

      expect(userRepo.createUserWithRoles).toHaveBeenCalled();
      expect(result.id).toBe('u-created');
      expect(result.username).toBe('newuser');
    });

    it('phải tải lên file avatar thành công và lưu url vào database', async () => {
      userRepo.findByUsername!.mockResolvedValue(null);
      userRepo.findByEmail!.mockResolvedValue(null);
      const mockRole = new Role({ id: 'r-1', name: 'BORROWER' });
      userRepo.findRoleByNameOrId!.mockResolvedValue(mockRole);

      fileStorageService.saveImage!.mockResolvedValue({
        fileName: 'avatar-123.png',
        filePath: 'E:\\uploads\\avatars\\avatar-123.png',
        fileUrl: '/uploads/avatars/avatar-123.png',
      });

      const mockFile = {
        originalname: 'my-avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('fake-image-bytes'),
      } as Express.Multer.File;

      const createdUser = new User({
        id: 'u-with-avatar',
        username: 'avataruser',
        email: 'avatar@example.com',
        avartarUrl: '/uploads/avatars/avatar-123.png',
      });
      userRepo.createUserWithRoles!.mockResolvedValue(createdUser);

      userMapper.toResponse!.mockReturnValue(
        new UserResponse({
          id: 'u-with-avatar',
          username: 'avataruser',
          email: 'avatar@example.com',
          avatarUrl: '/uploads/avatars/avatar-123.png',
        }),
      );

      const result = await service.createUser(
        new CreateUserDto({
          username: 'avataruser',
          email: 'avatar@example.com',
          password: 'password123',
        }),
        mockFile,
      );

      expect(fileStorageService.saveImage).toHaveBeenCalledWith(mockFile, 'avatars');
      expect(userRepo.createUserWithRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          avartarUrl: '/uploads/avatars/avatar-123.png',
        }),
        expect.any(Array),
      );
      expect(result.avatarUrl).toBe('/uploads/avatars/avatar-123.png');
    });
  });

  describe('deleteUser', () => {
    it('phải ném lỗi nếu id rỗng', async () => {
      await expect(service.deleteUser('')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy người dùng', async () => {
      userRepo.findByIdWithRelations!.mockResolvedValue(null);

      await expect(service.deleteUser('not-found-id')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu người dùng đang có phiếu mượn (Loan)', async () => {
      const userWithLoans = new User({
        id: 'u-has-loans',
        username: 'borrower1',
        loans: [{ id: 'loan-1' } as any],
      });
      userRepo.findByIdWithRelations!.mockResolvedValue(userWithLoans);

      await expect(service.deleteUser('u-has-loans')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu người dùng đang có khoản phạt (Fine)', async () => {
      const userWithFines = new User({
        id: 'u-has-fines',
        username: 'borrower2',
        loans: [],
        fines: [{ id: 'fine-1' } as any],
      });
      userRepo.findByIdWithRelations!.mockResolvedValue(userWithFines);

      await expect(service.deleteUser('u-has-fines')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu người dùng có nhật ký kiểm toán (AuditLog)', async () => {
      const userWithLogs = new User({
        id: 'u-has-logs',
        username: 'admin1',
        loans: [],
        fines: [],
        auditLogs: [{ id: 'log-1' } as any],
      });
      userRepo.findByIdWithRelations!.mockResolvedValue(userWithLogs);

      await expect(service.deleteUser('u-has-logs')).rejects.toThrow(AppException);
    });

    it('phải xóa thành công khi người dùng không gắn với thực thể nào', async () => {
      const cleanUser = new User({
        id: 'u-clean',
        username: 'cleanuser',
        loans: [],
        fines: [],
        auditLogs: [],
      });
      userRepo.findByIdWithRelations!.mockResolvedValue(cleanUser);
      userRepo.delete!.mockResolvedValue(true);

      await service.deleteUser('u-clean');

      expect(userRepo.delete).toHaveBeenCalledWith('u-clean');
    });
  });
});
