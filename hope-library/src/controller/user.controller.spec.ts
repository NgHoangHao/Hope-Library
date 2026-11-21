import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserController } from './user.controller.js';
import { UserService } from '../service/user.service.js';
import {
  CreateUserDto,
  PaginatedUserResponse,
  UserResponse,
  PaginatedUserSummaryResponse,
  UserSummaryResponse,
} from '../model/user/user.dto.js';
import { UserStatus } from '../model/user/user.entity.js';
import { ApiResponse } from '../common/api.response.js';

describe('UserController', () => {
  let controller: UserController;
  let userService: Partial<Record<keyof UserService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    userService = {
      getUsers: vi.fn(),
      getUsersSummary: vi.fn(),
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    };

    controller = new UserController(userService as unknown as UserService);
  });

  describe('getUsers (GET /users)', () => {
    it('nên trả về danh sách người dùng có phân trang bọc trong ApiResponse.success', async () => {
      const mockResult = new PaginatedUserResponse({
        items: [
          new UserResponse({
            id: 'u-1',
            username: 'user1',
            email: 'user1@example.com',
            fullName: 'Nguyen Van A',
            status: UserStatus.ACTIVE,
            roles: ['BORROWER'],
          }),
        ],
        page: 1,
        size: 10,
        total: 1,
        totalPages: 1,
      });

      userService.getUsers!.mockResolvedValue(mockResult);

      const res = await controller.getUsers({
        page: 1,
        size: 10,
        search: 'Nguyen',
        status: UserStatus.ACTIVE,
        role: 'BORROWER',
      });

      expect(userService.getUsers).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: 'Nguyen',
        status: UserStatus.ACTIVE,
        role: 'BORROWER',
      });
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.statusCode).toBe(200);
      expect(res.message).toBe('Lấy danh sách người dùng thành công');
      expect(res.response).toBe(mockResult);
      expect(res.response.items).toHaveLength(1);
    });
  });

  describe('getUsersSummary (GET /users/summary)', () => {
    it('nên trả về danh sách thông tin user kèm số lượng sách đang mượn, số loan EXPIRED và tổng tiền fine', async () => {
      const mockSummaryResult = new PaginatedUserSummaryResponse({
        items: [
          new UserSummaryResponse({
            id: 'u-1',
            code: 'A-0001',
            username: 'user1',
            email: 'user1@example.com',
            fullName: 'Nguyen Van A',
            status: UserStatus.ACTIVE,
            roles: ['BORROWER'],
            borrowedBooksCount: 3,
            expiredLoansCount: 1,
            totalFineAmount: 75000,
          }),
        ],
        page: 1,
        size: 10,
        total: 1,
        totalPages: 1,
      });

      userService.getUsersSummary!.mockResolvedValue(mockSummaryResult);

      const res = await controller.getUsersSummary({
        page: 1,
        size: 10,
        search: 'A-0001',
        status: UserStatus.ACTIVE,
      });

      expect(userService.getUsersSummary).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: 'A-0001',
        status: UserStatus.ACTIVE,
      });
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.statusCode).toBe(200);
      expect(res.response.items[0].code).toBe('A-0001');
      expect(res.response.items[0].borrowedBooksCount).toBe(3);
      expect(res.response.items[0].expiredLoansCount).toBe(1);
      expect(res.response.items[0].totalFineAmount).toBe(75000);
    });
  });

  describe('createUser (POST /users)', () => {
    it('nên tạo mới người dùng và trả về ApiResponse.created', async () => {
      const createDto = new CreateUserDto({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123@',
        fullName: 'Tran Thi B',
        role: 'LIBRARIAN',
      });

      const mockCreatedUser = new UserResponse({
        id: 'u-new',
        code: 'A-0001',
        username: 'newuser',
        email: 'newuser@example.com',
        fullName: 'Tran Thi B',
        status: UserStatus.ACTIVE,
        roles: ['LIBRARIAN'],
      });

      userService.createUser!.mockResolvedValue(mockCreatedUser);

      const res = await controller.createUser(createDto);

      expect(userService.createUser).toHaveBeenCalledWith(createDto, undefined);
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.statusCode).toBe(201);
      expect(res.message).toBe('Thêm mới người dùng thành công');
      expect(res.response.id).toBe('u-new');
      expect(res.response.username).toBe('newuser');
    });

    it('nên truyền avatarFile xuống userService khi có file đính kèm', async () => {
      const createDto = new CreateUserDto({
        username: 'withavatar',
        email: 'avatar@example.com',
        password: 'Password123@',
      });
      const mockFile = { originalname: 'avatar.png' } as Express.Multer.File;
      userService.createUser!.mockResolvedValue(new UserResponse({ id: 'u-1', username: 'withavatar' }));

      const res = await controller.createUser(createDto, mockFile);

      expect(userService.createUser).toHaveBeenCalledWith(createDto, mockFile);
      expect(res.statusCode).toBe(201);
    });
  });

  describe('deleteUser (DELETE /users/:id)', () => {
    it('nên xóa người dùng và trả về ApiResponse.success(null)', async () => {
      userService.deleteUser!.mockResolvedValue(undefined);

      const res = await controller.deleteUser('u-1');

      expect(userService.deleteUser).toHaveBeenCalledWith('u-1');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.statusCode).toBe(200);
      expect(res.message).toBe('Xóa người dùng thành công');
      expect(res.response).toBeNull();
    });
  });
});
