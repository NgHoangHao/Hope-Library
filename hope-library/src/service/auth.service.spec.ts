import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { AuthRepository } from '../repository/auth.repository.js';
import { AuthMapper } from '../mapper/auth.mapper.js';
import { MailService } from '../utils/mail.service.js';
import { RedisService } from '../utils/redis.service.js';
import { AppException } from '../common/index.js';
import { User, UserStatus } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserResponse, UpdateProfileDto } from '../model/user/user.dto.js';
import { RolePermissionMapper } from '../mapper/role-permission.mapper.js';
import { RoleNavigationMapper } from '../mapper/role-navigation.mapper.js';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';
import { RoleNavigationResponse } from '../model/role-navigation/role-navigation.dto.js';
import { Permission } from '../model/permission/permission.entity.js';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';
import { FileStorageService } from '../utils/file-storage.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let authRepo: Partial<AuthRepository>;
  let authMapper: Partial<AuthMapper>;
  let rolePermissionMapper: Partial<RolePermissionMapper>;
  let roleNavigationMapper: Partial<RoleNavigationMapper>;
  let mailService: Partial<MailService>;
  let redisService: Partial<RedisService>;
  let fileStorageService: Partial<Record<keyof FileStorageService, ReturnType<typeof vi.fn>>>;
  let jwtService: any;
  let configService: any;

  beforeEach(() => {
    authRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findByUsername: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
      saveUser: vi.fn().mockImplementation(async (user) => user),
      findRoleByName: vi.fn().mockResolvedValue(new Role({ id: 'role-1', name: 'BORROWER' })),
      findRoleById: vi.fn().mockResolvedValue(new Role({ id: 'role-1', name: 'BORROWER' })),
      findNavigationById: vi.fn().mockResolvedValue(new Navigation({ id: 'nav-1', name: 'Books', code: 'NAV_BOOKS' })),
      findRoleNavigation: vi.fn().mockResolvedValue(null),
      saveRoleNavigation: vi.fn().mockImplementation(async (rn) => rn),
      deleteRoleNavigation: vi.fn().mockResolvedValue(true),
      findPermissionById: vi.fn().mockResolvedValue(new Permission({ id: 'perm-1', code: 'BOOK_READ' })),
      findRolePermission: vi.fn().mockResolvedValue(null),
      saveRolePermission: vi.fn().mockImplementation(async (rp) => rp),
      deleteRolePermission: vi.fn().mockResolvedValue(true),
      createRole: vi.fn().mockResolvedValue(new Role({ id: 'role-1', name: 'BORROWER' })),
      generateNextUserCode: vi.fn().mockResolvedValue('A-0001'),
      createUserWithRole: vi.fn().mockImplementation(async (userData, role) => {
        return new User({
          id: 'user-uuid-1',
          code: userData.code || 'A-0001',
          username: userData.username,
          email: userData.email,
          fullName: userData.fullName,
          phone: userData.phone,
          status: userData.status || UserStatus.ACTIVE,
          userRoles: [{ role, userId: 'user-uuid-1', roleId: role.id } as any],
        });
      }),
    };

    authMapper = {
      toUserResponse: vi.fn().mockImplementation((user: User) => {
        return new UserResponse({
          id: user.id,
          code: user.code || 'A-0001',
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avartarUrl: user.avartarUrl,
          status: user.status,
          roles: ['BORROWER'],
        });
      }),
    };

    mailService = {
      sendOtpEmail: vi.fn().mockResolvedValue(undefined),
      sendForgotPasswordOtpEmail: vi.fn().mockResolvedValue(undefined),
    };

    redisService = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
    };

    jwtService = {
      sign: vi.fn().mockImplementation((payload: any, options: any) => {
        return `jwt_token_${options?.expiresIn || 'default'}`;
      }),
      verify: vi.fn().mockImplementation((token: string) => {
        if (token === 'invalid_token') {
          throw new Error('invalid token');
        }
        return {
          userId: 'user-uuid-1',
          email: 'test@gmail.com',
          roles: ['BORROWER'],
          username: 'testuser',
        };
      }),
    };

    configService = {
      get: vi.fn().mockImplementation((key: string, defaultValue: any) => defaultValue),
    };

    rolePermissionMapper = {
      toEntity: vi.fn().mockImplementation((dto) => dto as any),
      toResponse: vi.fn().mockImplementation((entity) => entity as any),
    };

    roleNavigationMapper = {
      toEntity: vi.fn().mockImplementation((dto) => new RoleNavigation(dto)),
      toResponse: vi.fn().mockImplementation((entity: RoleNavigation) => {
        return new RoleNavigationResponse({
          roleId: entity.roleId,
          navigationId: entity.navigationId,
          assignedAt: entity.assignedAt,
          roleName: entity.role?.name,
          navigationCode: entity.navigation?.code,
          navigationName: entity.navigation?.name,
        });
      }),
    };

    fileStorageService = {
      saveImage: vi.fn().mockResolvedValue({
        fileName: 'new-avatar.png',
        filePath: 'E:\\hope-library-uploads\\avatars\\new-avatar.png',
        fileUrl: '/uploads/avatars/new-avatar.png',
      }),
      deleteFile: vi.fn().mockResolvedValue(true),
      validateImageFile: vi.fn(),
    };

    authService = new AuthService(
      authRepo as AuthRepository,
      authMapper as AuthMapper,
      rolePermissionMapper as RolePermissionMapper,
      roleNavigationMapper as RoleNavigationMapper,
      mailService as MailService,
      redisService as RedisService,
      jwtService,
      configService,
      fileStorageService as unknown as FileStorageService,
    );
  });

  describe('register', () => {
    it('phải báo lỗi khi mật khẩu và xác nhận mật khẩu không khớp', async () => {
      await expect(
        authService.register({
          email: 'test@gmail.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'MismatchPassword',
        }),
      ).rejects.toThrow(AppException);
    });

    it('phải báo conflict khi username đã tồn tại trong DB', async () => {
      vi.mocked(authRepo.findByUsername!).mockResolvedValueOnce(new User({ id: '1', username: 'testuser' }));

      await expect(
        authService.register({
          email: 'test@gmail.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      ).rejects.toThrow(AppException);
    });

    it('phải báo conflict khi email đã tồn tại trong DB', async () => {
      vi.mocked(authRepo.findByEmail!).mockResolvedValueOnce(new User({ id: '1', email: 'test@gmail.com' }));

      await expect(
        authService.register({
          email: 'test@gmail.com',
          username: 'testuser',
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      ).rejects.toThrow(AppException);
    });

    it('phải tạo OTP, sinh mã A-xxxx, lưu vào Redis với TTL 300s và gửi email khi thông tin hợp lệ', async () => {
      const res = await authService.register({
        email: 'test@gmail.com',
        username: 'testuser',
        password: 'Password123',
        confirmpassword: 'Password123',
      });

      expect(res.email).toBe('test@gmail.com');
      expect(res.expiresInSeconds).toBe(300);
      expect(res.code).toBe('A-0001');
      expect(authRepo.generateNextUserCode).toHaveBeenCalledTimes(1);
      expect(redisService.set).toHaveBeenCalledTimes(1);
      expect(vi.mocked(redisService.set)!.mock.calls[0][0]).toBe('otp:register:test@gmail.com');
      const savedSession = JSON.parse(vi.mocked(redisService.set)!.mock.calls[0][1] as string);
      expect(savedSession.code).toBe('A-0001');
      expect(vi.mocked(redisService.set)!.mock.calls[0][2]).toBe(300);
      expect(mailService.sendOtpEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyOtp', () => {
    it('phải báo lỗi OTP_EXPIRED khi OTP không tồn tại trong Redis', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce(null);

      await expect(
        authService.verifyOtp({
          email: 'test@gmail.com',
          otp: '123456',
        }),
      ).rejects.toThrow(AppException);
    });

    it('phải báo lỗi OTP_WRONG khi mã OTP không trùng khớp', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce(
        JSON.stringify({
          otp: '654321',
          email: 'test@gmail.com',
          username: 'testuser',
          passwordHash: 'salt:hash',
        }),
      );

      await expect(
        authService.verifyOtp({
          email: 'test@gmail.com',
          otp: '123456',
        }),
      ).rejects.toThrow(AppException);
    });

    it('phải tạo User với role BORROWER, xóa Redis OTP và trả về UserResponse khi OTP hợp lệ', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce(
        JSON.stringify({
          otp: '123456',
          email: 'test@gmail.com',
          username: 'testuser',
          passwordHash: 'salt:hash',
          fullName: 'Test User',
          code: 'A-0001',
        }),
      );

      const userResponse = await authService.verifyOtp({
        email: 'test@gmail.com',
        otp: '123456',
      });

      expect(userResponse.username).toBe('testuser');
      expect(authRepo.createUserWithRole).toHaveBeenCalledTimes(1);
      expect(vi.mocked(authRepo.createUserWithRole)!.mock.calls[0][0].code).toBe('A-0001');
      expect(redisService.del).toHaveBeenCalledWith('otp:register:test@gmail.com');
      expect(authMapper.toUserResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('phải báo lỗi khi username hoặc password để trống', async () => {
      await expect(
        authService.login({ username: '', password: 'Password123' }),
      ).rejects.toThrow(AppException);

      await expect(
        authService.login({ username: 'testuser', password: '' }),
      ).rejects.toThrow(AppException);
    });

    it('phải báo lỗi INVALID_CREDENTIALS khi không tìm thấy user', async () => {
      vi.mocked(authRepo.findByUsername!).mockResolvedValueOnce(null);

      await expect(
        authService.login({ username: 'unknown', password: 'Password123' }),
      ).rejects.toThrow(AppException);
    });

    it('phải báo lỗi INVALID_CREDENTIALS khi mật khẩu không đúng', async () => {
      vi.mocked(authRepo.findByUsername!).mockResolvedValueOnce(
        new User({
          id: 'user-1',
          username: 'testuser',
          passwordHash: 'invalid:hash',
          status: UserStatus.ACTIVE,
        }),
      );

      await expect(
        authService.login({ username: 'testuser', password: 'WrongPassword' }),
      ).rejects.toThrow(AppException);
    });

    it('phải báo lỗi ACCOUNT_LOCKED khi tài khoản bị khóa', async () => {
      const { hashPassword } = await import('../utils/password.util.js');
      vi.mocked(authRepo.findByUsername!).mockResolvedValueOnce(
        new User({
          id: 'user-1',
          username: 'testuser',
          passwordHash: hashPassword('CorrectPassword123'),
          status: UserStatus.LOCKED,
        }),
      );

      await expect(
        authService.login({ username: 'testuser', password: 'CorrectPassword123' }),
      ).rejects.toThrow(AppException);
    });

    it('phải trả về accessToken, refreshToken và thông tin user khi đăng nhập thành công', async () => {
      const { hashPassword } = await import('../utils/password.util.js');
      const mockUser = new User({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: hashPassword('CorrectPassword123'),
        status: UserStatus.ACTIVE,
        userRoles: [
          {
            role: new Role({ id: 'role-1', name: 'BORROWER' }),
            userId: 'user-1',
            roleId: 'role-1',
          } as any,
        ],
      });

      vi.mocked(authRepo.findByUsername!).mockResolvedValueOnce(mockUser);

      const result = await authService.login({
        username: 'testuser',
        password: 'CorrectPassword123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('testuser');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('phải báo lỗi REFRESH_TOKEN_REQUIRED khi không có token', async () => {
      await expect(authService.refreshToken('')).rejects.toThrow(AppException);
    });

    it('phải báo lỗi INVALID_REFRESH_TOKEN khi token không hợp lệ', async () => {
      await expect(authService.refreshToken('invalid_token')).rejects.toThrow(AppException);
    });

    it('phải báo lỗi USER_NOT_FOUND khi người dùng không tồn tại', async () => {
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(null);

      await expect(authService.refreshToken('valid_token')).rejects.toThrow(AppException);
    });

    it('phải cấp accessToken mới khi refreshToken hợp lệ', async () => {
      const mockUser = new User({
        id: 'user-uuid-1',
        username: 'testuser',
        email: 'test@gmail.com',
        status: UserStatus.ACTIVE,
        userRoles: [
          {
            role: new Role({ id: 'role-1', name: 'BORROWER' }),
            userId: 'user-uuid-1',
            roleId: 'role-1',
          } as any,
        ],
      });

      vi.mocked(authRepo.findById!).mockResolvedValueOnce(mockUser);

      const result = await authService.refreshToken('valid_token');

      expect(result.accessToken).toBeDefined();
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });

  describe('getUserIdFromToken', () => {
    it('phải ném lỗi 401 khi token rỗng', () => {
      expect(() => authService.getUserIdFromToken('')).toThrow(AppException);
    });

    it('phải ném lỗi 401 khi token sai hoặc hết hạn', () => {
      expect(() => authService.getUserIdFromToken('invalid_token')).toThrow(AppException);
    });

    it('phải trích xuất được userId khi token hợp lệ', () => {
      const userId = authService.getUserIdFromToken('valid_bearer_token');
      expect(userId).toBe('user-uuid-1');
    });

    it('phải tự động loại bỏ tiền tố Bearer khi trích xuất', () => {
      const userId = authService.getUserIdFromToken('Bearer valid_bearer_token');
      expect(userId).toBe('user-uuid-1');
    });
  });

  describe('getMe', () => {
    it('phải ném lỗi 400 khi userId không hợp lệ', async () => {
      await expect(authService.getMe('')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 khi không tìm thấy người dùng', async () => {
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(null);
      await expect(authService.getMe('non-existent-id')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 403 khi tài khoản người dùng bị khóa', async () => {
      const lockedUser = new User({
        id: 'user-uuid-1',
        username: 'lockeduser',
        status: UserStatus.LOCKED,
      });
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(lockedUser);

      await expect(authService.getMe('user-uuid-1')).rejects.toThrow(AppException);
    });

    it('phải trả về UserResponse khi người dùng hợp lệ', async () => {
      const activeUser = new User({
        id: 'user-uuid-1',
        username: 'activeuser',
        email: 'active@gmail.com',
        status: UserStatus.ACTIVE,
      });
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(activeUser);

      const response = await authService.getMe('user-uuid-1');
      expect(response).toBeDefined();
      expect(response.id).toBe('user-uuid-1');
      expect(authMapper.toUserResponse).toHaveBeenCalledWith(activeUser);
    });
  });

  describe('getMeByToken', () => {
    it('phải trích xuất userId từ token và trả về UserResponse', async () => {
      const activeUser = new User({
        id: 'user-uuid-1',
        username: 'activeuser',
        email: 'active@gmail.com',
        status: UserStatus.ACTIVE,
      });
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(activeUser);

      const response = await authService.getMeByToken('Bearer valid_token');
      expect(response).toBeDefined();
      expect(response.id).toBe('user-uuid-1');
    });
  });

  describe('updateProfile', () => {
    it('phải ném lỗi 400 khi userId không hợp lệ', async () => {
      await expect(authService.updateProfile('', {})).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 khi người dùng không tồn tại', async () => {
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(null);
      await expect(
        authService.updateProfile('non-existent-id', { fullName: 'Test' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 403 khi tài khoản bị khóa', async () => {
      const lockedUser = new User({
        id: 'user-uuid-1',
        status: UserStatus.LOCKED,
      });
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(lockedUser);

      await expect(
        authService.updateProfile('user-uuid-1', { fullName: 'Test' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 400 khi số điện thoại sai định dạng', async () => {
      const user = new User({
        id: 'user-uuid-1',
        status: UserStatus.ACTIVE,
      });
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(user);

      await expect(
        authService.updateProfile('user-uuid-1', { phone: '123' }),
      ).rejects.toThrow(AppException);
    });

    it('phải cập nhật họ tên và số điện thoại thành công', async () => {
      const user = new User({
        id: 'user-uuid-1',
        username: 'activeuser',
        email: 'active@gmail.com',
        fullName: 'Old Name',
        phone: '0901111111',
        status: UserStatus.ACTIVE,
      });
      vi.mocked(authRepo.findById!)
        .mockResolvedValueOnce(user) // lần tìm đầu tiên
        .mockResolvedValueOnce(user); // lần nạp lại sau save

      const updateDto: UpdateProfileDto = {
        fullName: 'Nguyễn Văn Mới',
        phone: '0912345678',
      };

      const result = await authService.updateProfile('user-uuid-1', updateDto);

      expect(authRepo.saveUser).toHaveBeenCalled();
      expect(user.fullName).toBe('Nguyễn Văn Mới');
      expect(user.phone).toBe('0912345678');
      expect(result).toBeDefined();
    });

    it('phải cập nhật avatar thành công khi tải lên file ảnh và xóa avatar cũ nếu có', async () => {
      const user = new User({
        id: 'user-uuid-1',
        username: 'activeuser',
        email: 'active@gmail.com',
        fullName: 'Test User',
        avartarUrl: '/uploads/avatars/old-avatar.png',
        status: UserStatus.ACTIVE,
      });
      vi.mocked(authRepo.findById!)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(user);

      const mockAvatarFile = {
        originalname: 'my-avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('fake-image-bytes'),
      } as Express.Multer.File;

      const updateDto: UpdateProfileDto = {
        fullName: 'Test User Updated',
      };

      const result = await authService.updateProfile('user-uuid-1', updateDto, mockAvatarFile);

      expect(fileStorageService.saveImage).toHaveBeenCalledWith(mockAvatarFile, 'avatars');
      expect(user.avartarUrl).toBe('/uploads/avatars/new-avatar.png');
      expect(fileStorageService.deleteFile).toHaveBeenCalledWith('/uploads/avatars/old-avatar.png');
      expect(authRepo.saveUser).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('phải xóa file ảnh vừa upload nếu lưu DB thất bại', async () => {
      const user = new User({
        id: 'user-uuid-1',
        username: 'activeuser',
        status: UserStatus.ACTIVE,
      });
      vi.mocked(authRepo.findById!).mockResolvedValueOnce(user);
      vi.mocked(authRepo.saveUser!).mockRejectedValueOnce(new Error('Database write failure'));

      const mockAvatarFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('bytes'),
      } as Express.Multer.File;

      await expect(
        authService.updateProfile('user-uuid-1', {}, mockAvatarFile),
      ).rejects.toThrow('Database write failure');

      expect(fileStorageService.deleteFile).toHaveBeenCalledWith(
        'E:\\hope-library-uploads\\avatars\\new-avatar.png',
      );
    });
  });

  describe('updateProfileByToken', () => {
    it('phải giải mã token và thực hiện updateProfile', async () => {
      const user = new User({
        id: 'user-uuid-1',
        username: 'activeuser',
        status: UserStatus.ACTIVE,
      });
      vi.mocked(authRepo.findById!)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(user);

      const result = await authService.updateProfileByToken('Bearer valid_token', {
        fullName: 'Nguyễn Văn A',
      });

      expect(result).toBeDefined();
      expect(authRepo.saveUser).toHaveBeenCalled();
    });
  });

  describe('assignNavigationToRole', () => {
    it('phải ném lỗi 400 nếu roleId hoặc navigationId bị rỗng', async () => {
      await expect(
        authService.assignNavigationToRole({ roleId: '', navigationId: 'nav-1' }),
      ).rejects.toThrow(AppException);

      await expect(
        authService.assignNavigationToRole({ roleId: 'role-1', navigationId: '' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy vai trò', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(null);

      await expect(
        authService.assignNavigationToRole({ roleId: 'non-existent-role', navigationId: 'nav-1' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy điều hướng', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(new Role({ id: 'role-1', name: 'BORROWER' }));
      vi.mocked(authRepo.findNavigationById!).mockResolvedValueOnce(null);

      await expect(
        authService.assignNavigationToRole({ roleId: 'role-1', navigationId: 'non-existent-nav' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 409 nếu điều hướng đã được gán cho vai trò trước đó', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(new Role({ id: 'role-1', name: 'BORROWER' }));
      vi.mocked(authRepo.findNavigationById!).mockResolvedValueOnce(
        new Navigation({ id: 'nav-1', code: 'NAV_BOOKS', name: 'Quản lý sách' }),
      );
      vi.mocked(authRepo.findRoleNavigation!).mockResolvedValueOnce(
        new RoleNavigation({ roleId: 'role-1', navigationId: 'nav-1' }),
      );

      await expect(
        authService.assignNavigationToRole({ roleId: 'role-1', navigationId: 'nav-1' }),
      ).rejects.toThrow(AppException);
    });

    it('phải gán điều hướng cho vai trò thành công', async () => {
      const mockRole = new Role({ id: 'role-1', name: 'BORROWER' });
      const mockNav = new Navigation({ id: 'nav-1', code: 'NAV_BOOKS', name: 'Quản lý sách' });
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(mockRole);
      vi.mocked(authRepo.findNavigationById!).mockResolvedValueOnce(mockNav);
      vi.mocked(authRepo.findRoleNavigation!).mockResolvedValueOnce(null);

      const result = await authService.assignNavigationToRole({
        roleId: 'role-1',
        navigationId: 'nav-1',
      });

      expect(authRepo.saveRoleNavigation).toHaveBeenCalled();
      expect(result.roleId).toBe('role-1');
      expect(result.navigationId).toBe('nav-1');
      expect(result.roleName).toBe('BORROWER');
      expect(result.navigationCode).toBe('NAV_BOOKS');
      expect(result.navigationName).toBe('Quản lý sách');
    });
  });

  describe('removePermissionFromRole', () => {
    it('phải ném lỗi 400 nếu roleId hoặc permissionId bị rỗng', async () => {
      await expect(authService.removePermissionFromRole('', 'perm-1')).rejects.toThrow(
        AppException,
      );
      await expect(authService.removePermissionFromRole('role-1', '')).rejects.toThrow(
        AppException,
      );
    });

    it('phải ném lỗi 404 nếu không tìm thấy vai trò', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(null);
      await expect(
        authService.removePermissionFromRole('non-existent-role', 'perm-1'),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy quyền hạn', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(
        new Role({ id: 'role-1', name: 'BORROWER' }),
      );
      vi.mocked(authRepo.findPermissionById!).mockResolvedValueOnce(null);
      await expect(
        authService.removePermissionFromRole('role-1', 'non-existent-perm'),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu vai trò chưa được gán quyền hạn này', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(
        new Role({ id: 'role-1', name: 'BORROWER' }),
      );
      vi.mocked(authRepo.findPermissionById!).mockResolvedValueOnce(
        new Permission({ id: 'perm-1', code: 'BOOK_READ' }),
      );
      vi.mocked(authRepo.findRolePermission!).mockResolvedValueOnce(null);

      await expect(authService.removePermissionFromRole('role-1', 'perm-1')).rejects.toThrow(
        AppException,
      );
    });

    it('xóa quyền hạn khỏi vai trò thành công', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(
        new Role({ id: 'role-1', name: 'BORROWER' }),
      );
      vi.mocked(authRepo.findPermissionById!).mockResolvedValueOnce(
        new Permission({ id: 'perm-1', code: 'BOOK_READ' }),
      );
      vi.mocked(authRepo.findRolePermission!).mockResolvedValueOnce(
        new RolePermission({ roleId: 'role-1', permissionId: 'perm-1' }),
      );

      await authService.removePermissionFromRole('role-1', 'perm-1');
      expect(authRepo.deleteRolePermission).toHaveBeenCalledWith('role-1', 'perm-1');
    });
  });

  describe('removeNavigationFromRole', () => {
    it('phải ném lỗi 400 nếu roleId hoặc navigationId bị rỗng', async () => {
      await expect(authService.removeNavigationFromRole('', 'nav-1')).rejects.toThrow(
        AppException,
      );
      await expect(authService.removeNavigationFromRole('role-1', '')).rejects.toThrow(
        AppException,
      );
    });

    it('phải ném lỗi 404 nếu không tìm thấy vai trò', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(null);
      await expect(
        authService.removeNavigationFromRole('non-existent-role', 'nav-1'),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy điều hướng', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(
        new Role({ id: 'role-1', name: 'BORROWER' }),
      );
      vi.mocked(authRepo.findNavigationById!).mockResolvedValueOnce(null);
      await expect(
        authService.removeNavigationFromRole('role-1', 'non-existent-nav'),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu vai trò chưa được gán điều hướng này', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(
        new Role({ id: 'role-1', name: 'BORROWER' }),
      );
      vi.mocked(authRepo.findNavigationById!).mockResolvedValueOnce(
        new Navigation({ id: 'nav-1', code: 'NAV_BOOKS', name: 'Sách' }),
      );
      vi.mocked(authRepo.findRoleNavigation!).mockResolvedValueOnce(null);

      await expect(authService.removeNavigationFromRole('role-1', 'nav-1')).rejects.toThrow(
        AppException,
      );
    });

    it('xóa điều hướng khỏi vai trò thành công', async () => {
      vi.mocked(authRepo.findRoleById!).mockResolvedValueOnce(
        new Role({ id: 'role-1', name: 'BORROWER' }),
      );
      vi.mocked(authRepo.findNavigationById!).mockResolvedValueOnce(
        new Navigation({ id: 'nav-1', code: 'NAV_BOOKS', name: 'Sách' }),
      );
      vi.mocked(authRepo.findRoleNavigation!).mockResolvedValueOnce(
        new RoleNavigation({ roleId: 'role-1', navigationId: 'nav-1' }),
      );

      await authService.removeNavigationFromRole('role-1', 'nav-1');
      expect(authRepo.deleteRoleNavigation).toHaveBeenCalledWith('role-1', 'nav-1');
    });
  });

  describe('forgotPassword', () => {
    it('phải ném lỗi nếu email bị rỗng hoặc không đúng định dạng', async () => {
      await expect(authService.forgotPassword({ email: '' })).rejects.toThrow(AppException);
      await expect(authService.forgotPassword({ email: 'invalid-email' })).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy người dùng với email', async () => {
      vi.mocked(authRepo.findByEmail!).mockResolvedValueOnce(null);

      await expect(authService.forgotPassword({ email: 'unknown@gmail.com' })).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 403 nếu tài khoản bị khóa', async () => {
      vi.mocked(authRepo.findByEmail!).mockResolvedValueOnce(
        new User({ id: 'u1', email: 'locked@gmail.com', status: UserStatus.LOCKED }),
      );

      await expect(authService.forgotPassword({ email: 'locked@gmail.com' })).rejects.toThrow(AppException);
    });

    it('phải sinh OTP, lưu vào Redis 5 phút và gửi email thành công', async () => {
      vi.mocked(authRepo.findByEmail!).mockResolvedValueOnce(
        new User({ id: 'u1', email: 'test@gmail.com', status: UserStatus.ACTIVE }),
      );

      const result = await authService.forgotPassword({ email: 'test@gmail.com' });

      expect(redisService.set).toHaveBeenCalledWith(
        'otp:forgot-password:test@gmail.com',
        expect.any(String),
        300,
      );
      expect(mailService.sendForgotPasswordOtpEmail).toHaveBeenCalledWith(
        'test@gmail.com',
        expect.any(String),
      );
      expect(result.email).toBe('test@gmail.com');
      expect(result.expiresInSeconds).toBe(300);
    });
  });

  describe('verifyResetOtp', () => {
    it('phải ném lỗi nếu email hoặc OTP bị rỗng', async () => {
      await expect(authService.verifyResetOtp({ email: '', otp: '123456' })).rejects.toThrow(AppException);
      await expect(authService.verifyResetOtp({ email: 'test@gmail.com', otp: '' })).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu OTP hết hạn hoặc không tồn tại trong Redis', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce(null);

      await expect(
        authService.verifyResetOtp({ email: 'test@gmail.com', otp: '123456' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu OTP không khớp', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce('654321');

      await expect(
        authService.verifyResetOtp({ email: 'test@gmail.com', otp: '123456' }),
      ).rejects.toThrow(AppException);
    });

    it('phải xác thực OTP thành công, xóa OTP và cấp Reset Token lưu vào Redis', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce('123456');

      const result = await authService.verifyResetOtp({
        email: 'test@gmail.com',
        otp: '123456',
      });

      expect(redisService.del).toHaveBeenCalledWith('otp:forgot-password:test@gmail.com');
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('token:reset-password:'),
        expect.stringContaining('RESET_PASSWORD'),
        300,
      );
      expect(result.resetToken).toBeDefined();
      expect(result.expiresInSeconds).toBe(300);
    });
  });

  describe('resetPassword', () => {
    it('phải ném lỗi nếu resetToken bị rỗng', async () => {
      await expect(
        authService.resetPassword({ resetToken: '', newPassword: 'password123' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu resetToken không tồn tại hoặc đã hết hạn trong Redis', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce(null);

      await expect(
        authService.resetPassword({ resetToken: 'expired-token', newPassword: 'password123' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu mật khẩu mới dưới 6 ký tự', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce(
        JSON.stringify({ email: 'test@gmail.com', purpose: 'RESET_PASSWORD' }),
      );

      await expect(
        authService.resetPassword({ resetToken: 'valid-token', newPassword: '123' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi nếu xác nhận mật khẩu không khớp', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce(
        JSON.stringify({ email: 'test@gmail.com', purpose: 'RESET_PASSWORD' }),
      );

      await expect(
        authService.resetPassword({
          resetToken: 'valid-token',
          newPassword: 'password123',
          confirmPassword: 'password456',
        }),
      ).rejects.toThrow(AppException);
    });

    it('phải cập nhật mật khẩu mới và xóa resetToken khỏi Redis thành công', async () => {
      vi.mocked(redisService.get!).mockResolvedValueOnce(
        JSON.stringify({ email: 'test@gmail.com', purpose: 'RESET_PASSWORD' }),
      );
      const mockUser = new User({
        id: 'u1',
        email: 'test@gmail.com',
        passwordHash: 'old-hash',
      });
      vi.mocked(authRepo.findByEmail!).mockResolvedValueOnce(mockUser);

      const result = await authService.resetPassword({
        resetToken: 'valid-token',
        newPassword: 'NewPassword123@',
        confirmPassword: 'NewPassword123@',
      });

      expect(authRepo.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@gmail.com',
          passwordHash: expect.any(String),
        }),
      );
      expect(mockUser.passwordHash).not.toBe('old-hash');
      expect(redisService.del).toHaveBeenCalledWith('token:reset-password:valid-token');
      expect(result.message).toContain('Đặt lại mật khẩu thành công');
    });
  });
});
