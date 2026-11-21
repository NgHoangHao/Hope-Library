import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from '../service/user.service.js';
import { AvatarUploadInterceptor } from './auth.controller.js';
import {
  CreateUserDto,
  QueryUserDto,
  PaginatedUserResponse,
  UserResponse,
  QueryUserSummaryDto,
  PaginatedUserSummaryResponse,
} from '../model/user/user.dto.js';
import { UserStatus } from '../model/user/user.entity.js';
import { ApiResponse } from '../common/api.response.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller(['users', 'user'])
export class UserController {
  constructor(private readonly userService: UserService) { }

  /**
   * GET /users - Lấy danh sách người dùng có phân trang, tìm kiếm và lọc
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('USER_READ')
  @ApiOperation({
    summary: 'Lấy danh sách người dùng có phân trang',
    description:
      'Hỗ trợ phân trang (page bắt đầu từ 1, size), tìm kiếm theo tên đầy đủ (fullName) hoặc tên tài khoản (username), và lọc theo trạng thái (status: ACTIVE, INACTIVE, LOCKED) cùng vai trò (role: BORROWER, LIBRARIAN, ADMIN).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: 'Số lượng bản ghi mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo Họ và tên (fullName) hoặc Tên tài khoản (username)',
    example: 'nguyen',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UserStatus,
    description: 'Lọc theo trạng thái tài khoản (ACTIVE, INACTIVE, LOCKED)',
    example: UserStatus.ACTIVE,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Lọc theo tên vai trò (ví dụ: BORROWER, LIBRARIAN, ADMIN) hoặc ID vai trò',
    example: 'BORROWER',
  })
  async getUsers(
    @Query() query: QueryUserDto,
  ): Promise<ApiResponse<PaginatedUserResponse>> {
    const result = await this.userService.getUsers(query);
    return ApiResponse.success(result, 'Lấy danh sách người dùng thành công');
  }

  /**
   * GET /users/summary (hoặc GET /users/borrowers) - Lấy danh sách độc giả (chỉ có role BORROWER) kèm thống kê mượn sách và tiền phạt
   */
  @Get(['summary', 'borrowers'])
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('BORROWER_READ', 'USER_READ')
  @ApiOperation({
    summary: 'Lấy danh sách độc giả (chỉ có role BORROWER) kèm số sách đang mượn, số loan EXPIRED và tổng tiền phạt',
    description:
      'Chỉ trả về danh sách người dùng có vai trò là BORROWER gồm đầy đủ thông tin của UserResponse cùng với số lượng sách đang mượn (borrowedBooksCount), số lượng loan có status EXPIRED (expiredLoansCount) và tổng số tiền phạt (totalFineAmount). Hỗ trợ phân trang (page, size), tìm kiếm theo mã người dùng (code / search) và lọc theo trạng thái (status).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: 'Số lượng bản ghi mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo mã người dùng (code, ví dụ: A-0001)',
    example: 'A-0001',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    type: String,
    description: 'Tìm kiếm theo mã người dùng (code, ví dụ: A-0001)',
    example: 'A-0001',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UserStatus,
    description: 'Lọc theo trạng thái tài khoản (ACTIVE, INACTIVE, LOCKED)',
    example: UserStatus.ACTIVE,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Lọc theo tên vai trò (ví dụ: BORROWER, LIBRARIAN, ADMIN) hoặc ID vai trò',
    example: 'BORROWER',
  })
  async getUsersSummary(
    @Query() query: QueryUserSummaryDto,
  ): Promise<ApiResponse<PaginatedUserSummaryResponse>> {
    const result = await this.userService.getUsersSummary(query);
    return ApiResponse.success(
      result,
      'Lấy danh sách thông tin người dùng kèm thống kê mượn trả thành công',
    );
  }

  /**
   * POST /users - Thêm mới 1 người dùng vào CSDL (hỗ trợ upload avatar)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('USER_CREATE')
  @UseInterceptors(AvatarUploadInterceptor)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Thêm mới một người dùng vào hệ thống',
    description:
      'Tạo mới tài khoản người dùng với username, email, mật khẩu (tự động băm scrypt), thông tin cá nhân, file ảnh avatar và gán vai trò ban đầu (mặc định BORROWER).',
  })
  @ApiBody({ type: CreateUserDto })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ): Promise<ApiResponse<UserResponse>> {
    const createdUser = await this.userService.createUser(createUserDto, avatarFile);
    return ApiResponse.created(createdUser, 'Thêm mới người dùng thành công');
  }

  /**
   * DELETE /users/:id - Xóa người dùng khỏi hệ thống
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('USER_DELETE')
  @ApiOperation({
    summary: 'Xóa người dùng khỏi hệ thống',
    description:
      'Xóa tài khoản người dùng theo ID UUID. Nếu người dùng đang liên kết với các thực thể khác (phiếu mượn, khoản phạt, nhật ký kiểm toán) sẽ ném ngoại lệ ngăn chặn việc xóa.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh người dùng (UUID)',
    example: 'e0d7c570-32b0-4660-84c4-722a4bb4be7a',
  })
  async deleteUser(
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.userService.deleteUser(id);
    return ApiResponse.success(null, 'Xóa người dùng thành công');
  }
}
