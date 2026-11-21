import {
  Body,
  CallHandler,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  NestInterceptor,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../service/auth.service.js';
import {
  RegisterDto,
  VerifyOtpDto,
  ResendOtpDto,
  UserResponse,
  LoginDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  UpdateProfileDto,
  ForgotPasswordDto,
  VerifyResetOtpDto,
  VerifyResetOtpResponseDto,
  ResetPasswordDto,
} from '../model/user/user.dto.js';
import {
  AssignPermissionDto,
  RolePermissionResponse,
} from '../model/role-permission/role-permission.dto.js';
import {
  AssignNavigationDto,
  RoleNavigationResponse,
} from '../model/role-navigation/role-navigation.dto.js';
import { ApiResponse, AppException } from '../common/index.js';
import { TokenHelper } from '../utils/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@Injectable()
export class AvatarUploadInterceptor implements NestInterceptor {
  private readonly anyFiles = new (AnyFilesInterceptor())();

  async intercept(context: ExecutionContext, next: CallHandler) {
    return this.anyFiles.intercept(context, {
      handle: () => {
        const req = context.switchToHttp().getRequest();
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
          req.file =
            req.files.find((f: Express.Multer.File) =>
              ['avatar', 'avartar', 'image', 'file'].includes(f.fieldname),
            ) ?? req.files[0];
        }
        return next.handle();
      },
    });
  }
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Tiếp nhận thông tin đăng ký (email, username, password, confirmpassword),
   * sinh OTP 6 số, lưu vào Redis trong 5 phút và gửi email xác thực.
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng ký tài khoản người dùng',
    description:
      'Gửi thông tin đăng ký với role mặc định là BORROWER, hệ thống sinh mã OTP có hiệu lực 5 phút gửi về Gmail và lưu trên Redis.',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<ApiResponse<{ email: string; expiresInSeconds: number; message: string; code?: string }>> {
    const result = await this.authService.register(registerDto);
    return ApiResponse.success(
      result,
      'Mã OTP xác thực tài khoản đã được gửi đến Gmail của bạn (hiệu lực 5 phút)',
    );
  }

  /**
   * POST /auth/verify-otp
   * Xác thực mã OTP từ Redis (kiểm tra expired hoặc wrong),
   * sau đó kích hoạt tài khoản và gán vai trò BORROWER.
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Xác thực OTP và hoàn tất đăng ký',
    description:
      'Kiểm tra mã OTP trên Redis (báo lỗi nếu hết hạn hoặc sai mã). Khi hợp lệ, tạo User trong CSDL với role mặc định là BORROWER.',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<ApiResponse<UserResponse>> {
    const user = await this.authService.verifyOtp(verifyOtpDto);
    return ApiResponse.created(
      user,
      'Xác thực mã OTP thành công. Tài khoản của bạn đã được kích hoạt với vai trò BORROWER',
    );
  }

  /**
   * POST /auth/resend-otp
   * Gửi lại mã OTP mới cho email đăng ký
   */
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gửi lại mã OTP xác thực',
    description: 'Cấp mã OTP mới với hiệu lực 5 phút gửi về Gmail nếu phiên đăng ký chưa kết thúc.',
  })
  async resendOtp(
    @Body() resendOtpDto: ResendOtpDto,
  ): Promise<ApiResponse<{ email: string; expiresInSeconds: number; message: string }>> {
    const result = await this.authService.resendOtp(resendOtpDto);
    return ApiResponse.success(
      result,
      'Mã OTP mới đã được gửi lại vào Gmail của bạn (hiệu lực 5 phút)',
    );
  }

  /**
   * POST /auth/login
   * Đăng nhập với username và password.
   * Tạo accessToken và refreshToken (chứa list role, userId, email),
   * lưu refreshToken vào HTTP-only cookie và trả về accessToken cùng thông tin user.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập vào hệ thống',
    description:
      'Đăng nhập bằng username và password. Khi thành công sẽ tạo accessToken và refreshToken chứa list role, userId, email; đồng thời lưu refreshToken vào HTTP Cookie.',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<LoginResponseDto>> {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return ApiResponse.success(
      { accessToken, user },
      'Đăng nhập thành công',
    );
  }

  /**
   * POST /auth/refresh-token
   * Lấy refreshToken từ HTTP cookie để xác thực và cấp accessToken mới
   */
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Làm mới Access Token',
    description:
      'Lấy refreshToken từ HTTP cookie, kiểm tra tính hợp lệ và cấp access token mới chứa list role, userId, email.',
  })
  async refreshToken(
    @Req() req: Request,
  ): Promise<ApiResponse<RefreshTokenResponseDto>> {
    const refreshToken = req.cookies?.['refreshToken'];
    if (!refreshToken) {
      throw AppException.unauthorized(
        'Không tìm thấy refresh token trong cookie. Vui lòng đăng nhập lại',
        null,
        'REFRESH_TOKEN_NOT_FOUND',
      );
    }

    const result = await this.authService.refreshToken(refreshToken);
    return ApiResponse.success(result, 'Làm mới access token thành công');
  }

  /**
   * POST /auth/logout
   * Đăng xuất và xóa refreshToken khỏi cookie
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng xuất khỏi hệ thống',
    description: 'Xóa refreshToken cookie khỏi trình duyệt.',
  })
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<null>> {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    return ApiResponse.success(null, 'Đăng xuất thành công');
  }

  /**
   * GET /auth/me (hỗ trợ cả alias /auth/profile)
   * Lấy thông tin tài khoản hiện tại từ Access Token
   */
  @Get(['me', 'profile'])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @RequirePermissions('USER_PROFILE_READ')
  @ApiOperation({
    summary: 'Lấy thông tin tài khoản hiện tại (Get Me / Profile)',
    description:
      'Lấy userId từ Access Token (Bearer trong header Authorization hoặc cookie) để truy vấn thông tin user trong CSDL và trả về UserResponse (bao gồm avartarUrl).',
  })
  async getMe(@Req() req: Request): Promise<ApiResponse<UserResponse>> {
    const token = TokenHelper.extractTokenFromRequest(req);
    const user = await this.authService.getMeByToken(token);
    return ApiResponse.success(user, 'Lấy thông tin tài khoản thành công');
  }

  /**
   * PUT /auth/profile (hỗ trợ alias /auth/me)
   * Cập nhật thông tin trang cá nhân của người dùng hiện tại
   */
  @Put(['profile', 'me'])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @RequirePermissions('USER_PROFILE_UPDATE')
  @UseInterceptors(AvatarUploadInterceptor)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Cập nhật thông tin trang cá nhân (Update Profile)',
    description:
      'Lấy userId từ Access Token để cập nhật họ tên, số điện thoại và tải lên file ảnh avatar (png, jpg, jpeg, webp) lưu qua FileStorageService. Trả về UserResponse đã cập nhật.',
  })
  @ApiBody({
    type: UpdateProfileDto,
  })
  async updateProfile(
    @Req() req: Request,
    @Body() body: Record<string, any>,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ): Promise<ApiResponse<UserResponse>> {
    const token = TokenHelper.extractTokenFromRequest(req);
    const updateProfileDto = new UpdateProfileDto({
      fullName: body.fullName,
      phone: body.phone,
      avartarUrl: body.avartarUrl ?? body.avatarUrl,
    });
    const fileToUpload = avatarFile ?? body.avatar ?? body.avartar;
    const updatedUser = await this.authService.updateProfileByToken(token, updateProfileDto, fileToUpload);
    return ApiResponse.success(updatedUser, 'Cập nhật thông tin cá nhân thành công');
  }

  /**
   * POST /auth/assign-permission (hỗ trợ alias /auth/roles/permissions)
   * Gán quyền hạn cho vai trò
   */
  @Post(['assign-permission', 'roles/permissions'])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @RequirePermissions('ROLE_PERMISSION_ASSIGN')
  @ApiOperation({
    summary: 'Gán quyền hạn cho vai trò',
    description:
      'Gán một quyền hạn cụ thể (permissionId) cho một vai trò (roleId) trong hệ thống và trả về kết quả qua ApiResponse.',
  })
  async assignPermission(
    @Body() assignPermissionDto: AssignPermissionDto,
  ): Promise<ApiResponse<RolePermissionResponse>> {
    const result = await this.authService.assignPermissionToRole(assignPermissionDto);
    return ApiResponse.created(result, 'Gán quyền hạn cho vai trò thành công');
  }

  /**
   * POST /auth/assign-navigation (hỗ trợ alias /auth/roles/navigations, /auth/roles/:roleId/navigations/:navigationId)
   * Gán điều hướng cho vai trò
   */
  @Post(['assign-navigation', 'roles/navigations', 'roles/:roleId/navigations/:navigationId'])
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @RequirePermissions('ROLE_NAVIGATION_ASSIGN')
  @ApiOperation({
    summary: 'Gán điều hướng cho vai trò',
    description:
      'Gán một điều hướng cụ thể (navigationId) cho một vai trò (roleId) trong hệ thống và trả về kết quả qua ApiResponse.',
  })
  async assignNavigation(
    @Body() assignNavigationDto: AssignNavigationDto,
    @Param('roleId') paramRoleId?: string,
    @Param('navigationId') paramNavId?: string,
  ): Promise<ApiResponse<RoleNavigationResponse>> {
    const dto: AssignNavigationDto = {
      roleId: assignNavigationDto?.roleId || paramRoleId || '',
      navigationId: assignNavigationDto?.navigationId || paramNavId || '',
    };
    const result = await this.authService.assignNavigationToRole(dto);
    return ApiResponse.created(result, 'Gán điều hướng cho vai trò thành công');
  }

  /**
   * DELETE /auth/roles/:roleId/permissions/:permissionId (hỗ trợ alias /auth/roles/permissions, /auth/remove-permission)
   * Xóa bỏ quyền hạn khỏi vai trò
   */
  @Delete(['roles/:roleId/permissions/:permissionId', 'roles/permissions', 'remove-permission'])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @RequirePermissions('ROLE_PERMISSION_ASSIGN')
  @ApiOperation({
    summary: 'Xóa bỏ quyền hạn khỏi vai trò',
    description:
      'Gỡ bỏ quyền hạn cụ thể (permissionId) khỏi một vai trò (roleId). Hỗ trợ truyền qua URL params hoặc qua Body.',
  })
  @ApiParam({
    name: 'roleId',
    required: false,
    description: 'Mã định danh vai trò (Role ID)',
  })
  @ApiParam({
    name: 'permissionId',
    required: false,
    description: 'Mã định danh quyền hạn (Permission ID)',
  })
  async removePermission(
    @Param('roleId') paramRoleId?: string,
    @Param('permissionId') paramPermissionId?: string,
    @Body() body?: Partial<AssignPermissionDto>,
  ): Promise<ApiResponse<null>> {
    const roleId = paramRoleId || body?.roleId || '';
    const permissionId = paramPermissionId || body?.permissionId || '';
    await this.authService.removePermissionFromRole(roleId, permissionId);
    return ApiResponse.success(null, 'Xóa bỏ quyền hạn khỏi vai trò thành công');
  }

  /**
   * DELETE /auth/roles/:roleId/navigations/:navigationId (hỗ trợ alias /auth/roles/navigations, /auth/remove-navigation)
   * Xóa bỏ điều hướng khỏi vai trò
   */
  @Delete(['roles/:roleId/navigations/:navigationId', 'roles/navigations', 'remove-navigation'])
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @RequirePermissions('ROLE_NAVIGATION_ASSIGN')
  @ApiOperation({
    summary: 'Xóa bỏ điều hướng khỏi vai trò',
    description:
      'Gỡ bỏ điều hướng cụ thể (navigationId) khỏi một vai trò (roleId). Hỗ trợ truyền qua URL params hoặc qua Body.',
  })
  @ApiParam({
    name: 'roleId',
    required: false,
    description: 'Mã định danh vai trò (Role ID)',
  })
  @ApiParam({
    name: 'navigationId',
    required: false,
    description: 'Mã định danh điều hướng (Navigation ID)',
  })
  async removeNavigation(
    @Param('roleId') paramRoleId?: string,
    @Param('navigationId') paramNavigationId?: string,
    @Body() body?: Partial<AssignNavigationDto>,
  ): Promise<ApiResponse<null>> {
    const roleId = paramRoleId || body?.roleId || '';
    const navigationId = paramNavigationId || body?.navigationId || '';
    await this.authService.removeNavigationFromRole(roleId, navigationId);
    return ApiResponse.success(null, 'Xóa bỏ điều hướng khỏi vai trò thành công');
  }

  /**
   * POST /auth/forgot-password
   * Bước 1: Tiếp nhận email, kiểm tra tài khoản, sinh OTP 6 số và gửi về Gmail
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yêu cầu đặt lại mật khẩu (quên mật khẩu)',
    description:
      'Nhập email tài khoản. Backend kiểm tra sự tồn tại của email và gửi mã OTP 6 chữ số (hiệu lực 5 phút) về Gmail.',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ApiResponse<{ email: string; expiresInSeconds: number; message: string }>> {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return ApiResponse.success(
      result,
      'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn (hiệu lực 5 phút)',
    );
  }

  /**
   * POST /auth/verify-reset-otp
   * Bước 2 & 3: Xác thực OTP và cấp Reset Token (hiệu lực 5 phút)
   */
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xác thực OTP đặt lại mật khẩu và nhận Reset Token',
    description:
      'Backend kiểm tra mã OTP có chính xác và còn hạn hay không. Nếu hợp lệ, tạo Reset Token ngẫu nhiên đủ mạnh lưu vào Redis (TTL 5 phút) và trả về cho client.',
  })
  async verifyResetOtp(
    @Body() verifyResetOtpDto: VerifyResetOtpDto,
  ): Promise<ApiResponse<VerifyResetOtpResponseDto>> {
    const result = await this.authService.verifyResetOtp(verifyResetOtpDto);
    return ApiResponse.success(
      result,
      'Xác thực mã OTP thành công. Reset Token có hiệu lực trong vòng 5 phút',
    );
  }

  /**
   * POST /auth/reset-password
   * Bước 4 & 5: Đổi mật khẩu mới bằng Reset Token
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đặt lại mật khẩu mới',
    description:
      'Client gửi Reset Token cùng mật khẩu mới. Backend xác thực token, kiểm tra thời hạn và trạng thái, cập nhật mật khẩu mới và xóa token.',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ApiResponse<{ message: string }>> {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return ApiResponse.success(result, 'Đặt lại mật khẩu thành công');
  }
}

