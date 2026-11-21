import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from '../service/auth.service.js';
import { ApiResponse } from '../common/index.js';
import { UserResponse } from '../model/user/user.dto.js';
import type { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    authService = {
      register: vi.fn(),
      verifyOtp: vi.fn(),
      resendOtp: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      getMeByToken: vi.fn(),
      updateProfileByToken: vi.fn(),
      assignPermissionToRole: vi.fn(),
      assignNavigationToRole: vi.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  describe('register & verifyOtp (POST auth/register, POST auth/verify-otp)', () => {
    it('register thành công trả về ApiResponse kèm thông tin mã code A-xxxx', async () => {
      authService.register!.mockResolvedValue({
        email: 'user@example.com',
        expiresInSeconds: 300,
        message: 'OTP sent',
        code: 'A-0001',
      });

      const res = await controller.register({
        email: 'user@example.com',
        username: 'user01',
        password: 'Password123@',
      });

      expect(authService.register).toHaveBeenCalled();
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.response.code).toBe('A-0001');
    });

    it('verifyOtp thành công trả về UserResponse với mã code', async () => {
      const mockUser = new UserResponse({
        id: 'u-1',
        code: 'A-0001',
        username: 'user01',
        email: 'user@example.com',
        status: 'ACTIVE',
        roles: ['BORROWER'],
      });
      authService.verifyOtp!.mockResolvedValue(mockUser);

      const res = await controller.verifyOtp({
        email: 'user@example.com',
        otp: '123456',
      });

      expect(authService.verifyOtp).toHaveBeenCalled();
      expect(res.statusCode).toBe(201);
      expect(res.response.code).toBe('A-0001');
    });
  });

  describe('getMe (GET auth/profile hoặc auth/me)', () => {
    it('lấy thông tin tài khoản thành công kèm avartarUrl', async () => {
      const mockUser = new UserResponse({
        id: 'user-uuid-1',
        username: 'activeuser',
        email: 'active@gmail.com',
        fullName: 'Nguyễn Văn A',
        avartarUrl: '/uploads/avatars/user-avatar.png',
        status: 'ACTIVE',
        roles: ['BORROWER'],
      });
      authService.getMeByToken!.mockResolvedValue(mockUser);

      const mockReq = {
        headers: {
          authorization: 'Bearer valid_jwt_token',
        },
      } as unknown as Request;

      const result = await controller.getMe(mockReq);

      expect(authService.getMeByToken).toHaveBeenCalledWith('valid_jwt_token');
      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.response).toEqual(mockUser);
      expect(result.response.avartarUrl).toBe('/uploads/avatars/user-avatar.png');
      expect(result.message).toBe('Lấy thông tin tài khoản thành công');
    });
  });

  describe('updateProfile (PUT auth/profile hoặc auth/me)', () => {
    it('cập nhật thông tin và upload file avatar thành công', async () => {
      const mockUpdatedUser = new UserResponse({
        id: 'user-uuid-1',
        username: 'activeuser',
        email: 'active@gmail.com',
        fullName: 'Nguyễn Văn Mới',
        phone: '0912345678',
        avartarUrl: '/uploads/avatars/new-uploaded-avatar.png',
        status: 'ACTIVE',
        roles: ['BORROWER'],
      });
      authService.updateProfileByToken!.mockResolvedValue(mockUpdatedUser);

      const mockReq = {
        headers: {
          authorization: 'Bearer valid_jwt_token',
        },
      } as unknown as Request;

      const mockFile = {
        originalname: 'my-avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test-image'),
      } as Express.Multer.File;

      const body = {
        fullName: 'Nguyễn Văn Mới',
        phone: '0912345678',
      };

      const result = await controller.updateProfile(mockReq, body, mockFile);

      expect(authService.updateProfileByToken).toHaveBeenCalledWith(
        'valid_jwt_token',
        expect.objectContaining({
          fullName: 'Nguyễn Văn Mới',
          phone: '0912345678',
        }),
        mockFile,
      );
      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.response.avartarUrl).toBe('/uploads/avatars/new-uploaded-avatar.png');
      expect(result.message).toBe('Cập nhật thông tin cá nhân thành công');
    });

    it('cập nhật thông tin khi không tải lên file avatar (avatarFile là undefined)', async () => {
      const mockUpdatedUser = new UserResponse({
        id: 'user-uuid-1',
        fullName: 'Tên Không Đổi Ảnh',
        avartarUrl: '/uploads/avatars/existing.png',
      });
      authService.updateProfileByToken!.mockResolvedValue(mockUpdatedUser);

      const mockReq = {
        headers: {
          authorization: 'Bearer valid_jwt_token',
        },
      } as unknown as Request;

      const body = {
        fullName: 'Tên Không Đổi Ảnh',
      };

      const result = await controller.updateProfile(mockReq, body, undefined);

      expect(authService.updateProfileByToken).toHaveBeenCalledWith(
        'valid_jwt_token',
        expect.objectContaining({
          fullName: 'Tên Không Đổi Ảnh',
        }),
        undefined,
      );
      expect(result.response.avartarUrl).toBe('/uploads/avatars/existing.png');
    });
  });
});
