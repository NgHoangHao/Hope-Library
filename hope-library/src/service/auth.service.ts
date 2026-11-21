import { Injectable, Logger, Optional } from '@nestjs/common';
import { randomBytes, randomInt } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../repository/auth.repository.js';
import { AuthMapper, RoleNavigationMapper, RolePermissionMapper } from '../mapper/index.js';
import { MailService, RedisService, hashPassword, comparePassword } from '../utils/index.js';
import {
  RegisterDto,
  VerifyOtpDto,
  ResendOtpDto,
  UserResponse,
  LoginDto,
  JwtPayload,
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
import { User, UserStatus } from '../model/user/user.entity.js';
import { AppException } from '../common/index.js';
import { FileStorageService, type SaveImageResult } from '../utils/file-storage.service.js';
import { SystemConfigService } from './system-config.service.js';

interface PendingRegistrationSession {
  otp: string;
  email: string;
  username: string;
  passwordHash: string;
  fullName?: string | null;
  phone?: string | null;
  code?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_TTL_SECONDS = 300; // 5 phút (300 giây)
  private readonly DEFAULT_ROLE_NAME = 'BORROWER';
  private static readonly PASSWORD_MIN_LENGTH_CONFIG_KEY = 'PASSWORD_MIN_LENGTH';

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly authMapper: AuthMapper,
    private readonly rolePermissionMapper: RolePermissionMapper,
    private readonly roleNavigationMapper: RoleNavigationMapper,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
    @Optional() private readonly systemConfigService?: SystemConfigService,
  ) {}

  /**
   * Lấy độ dài tối thiểu của mật khẩu:
   * - Ưu tiên đọc từ SystemConfigService (Redis cache -> DB) theo key `PASSWORD_MIN_LENGTH`
   * - Nếu null/không tồn tại hoặc lỗi -> fallback sang biến môi trường `PASSWORD_MIN_LENGTH`
   */
  private async getPasswordMinLength(): Promise<number> {
    const envRaw = this.configService.get<string>(
      AuthService.PASSWORD_MIN_LENGTH_CONFIG_KEY,
      '8',
    );
    const envParsed = Number(envRaw);
    const envFallback = Number.isFinite(envParsed) && envParsed > 0 ? envParsed : 8;

    if (!this.systemConfigService) {
      return envFallback;
    }

    try {
      const rawValue = await this.systemConfigService.getValue(
        AuthService.PASSWORD_MIN_LENGTH_CONFIG_KEY,
      );
      if (rawValue === null || rawValue === undefined || rawValue.trim() === '') {
        return envFallback;
      }

      const parsed = Number(rawValue);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : envFallback;
    } catch (error: any) {
      this.logger.warn(
        `Không thể đọc cấu hình ${AuthService.PASSWORD_MIN_LENGTH_CONFIG_KEY} từ SystemConfig, fallback sang env (${envFallback} ký tự): ${error?.message ?? error}`,
      );
      return envFallback;
    }
  }

  /**
   * Helper tạo redis key cho mã OTP đăng ký của email
   */
  private getRegisterOtpKey(email: string): string {
    return `otp:register:${email.toLowerCase().trim()}`;
  }

  /**
   * Bước 1: Tiếp nhận thông tin đăng ký, sinh OTP, lưu vào Redis 5 phút và gửi OTP về Gmail
   */
  async register(dto: RegisterDto): Promise<{ email: string; expiresInSeconds: number; message: string; code?: string }> {
    // 1. Validate Email
    if (!dto.email || !dto.email.trim()) {
      throw AppException.badRequest('Email không được để trống', { field: 'email' }, 'EMAIL_REQUIRED');
    }
    const email = dto.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppException.badRequest('Định dạng email không hợp lệ', { field: 'email' }, 'INVALID_EMAIL');
    }

    // 2. Validate Username
    if (!dto.username || !dto.username.trim()) {
      throw AppException.badRequest('Tên đăng nhập không được để trống', { field: 'username' }, 'USERNAME_REQUIRED');
    }
    const username = dto.username.trim();
    if (username.length < 3 || username.length > 50) {
      throw AppException.badRequest(
        'Tên đăng nhập phải có độ dài từ 3 đến 50 ký tự',
        { field: 'username' },
        'INVALID_USERNAME_LENGTH',
      );
    }

    // 3. Validate Password
    if (!dto.password) {
      throw AppException.badRequest('Mật khẩu không được để trống', { field: 'password' }, 'PASSWORD_REQUIRED');
    }
    const passwordMinLength = await this.getPasswordMinLength();
    if (dto.password.length < passwordMinLength) {
      throw AppException.badRequest(
        `Mật khẩu phải có độ dài tối thiểu ${passwordMinLength} ký tự`,
        { field: 'password', minLength: passwordMinLength },
        'WEAK_PASSWORD',
      );
    }

    // 4. Validate Confirm Password (hỗ trợ cả confirmPassword và alias confirmpassword)
    const confirmPassword = dto.confirmPassword ?? dto.confirmpassword;
    if (!confirmPassword) {
      throw AppException.badRequest(
        'Xác nhận mật khẩu không được để trống',
        { field: 'confirmPassword' },
        'CONFIRM_PASSWORD_REQUIRED',
      );
    }
    if (dto.password !== confirmPassword) {
      throw AppException.badRequest(
        'Mật khẩu và xác nhận mật khẩu không trùng khớp',
        { field: 'confirmPassword' },
        'PASSWORD_MISMATCH',
      );
    }

    // 5. Kiểm tra tính duy nhất của username trong hệ thống
    const existingUsername = await this.authRepo.findByUsername(username);
    if (existingUsername) {
      throw AppException.conflict(
        `Tên đăng nhập '${username}' đã tồn tại trong hệ thống`,
        { field: 'username' },
        'USERNAME_ALREADY_EXISTS',
      );
    }

    // 6. Kiểm tra tính duy nhất của email trong hệ thống
    const existingEmail = await this.authRepo.findByEmail(email);
    if (existingEmail) {
      throw AppException.conflict(
        `Địa chỉ email '${email}' đã được đăng ký tài khoản trong hệ thống`,
        { field: 'email' },
        'EMAIL_ALREADY_EXISTS',
      );
    }

    // 7. Sinh mã OTP ngẫu nhiên gồm 6 chữ số
    const otp = randomInt(100000, 1000000).toString();

    // 8. Băm mật khẩu an toàn
    const passwordHash = hashPassword(dto.password);

    // Sinh mã user code cho người đăng ký theo quy tắc A-xxxx
    const code = dto.code?.trim() || (await this.authRepo.generateNextUserCode());

    // 9. Lưu phiên đăng ký và mã OTP lên Redis với TTL 5 phút (300 giây)
    const sessionData: PendingRegistrationSession = {
      otp,
      email,
      username,
      passwordHash,
      fullName: dto.fullName?.trim() || null,
      phone: dto.phone?.trim() || null,
      code,
    };

    const redisKey = this.getRegisterOtpKey(email);
    await this.redisService.set(redisKey, JSON.stringify(sessionData), this.OTP_TTL_SECONDS);
    this.logger.log(`Đã lưu OTP cho ${email} vào Redis (key: ${redisKey}, code: ${code}, TTL: ${this.OTP_TTL_SECONDS}s)`);

    // 10. Gửi mã OTP về Gmail người dùng thông qua MailService trong src/utils
    await this.mailService.sendOtpEmail(email, otp);

    return {
      email,
      expiresInSeconds: this.OTP_TTL_SECONDS,
      message: 'Mã xác thực OTP đã được gửi về Gmail của bạn, có hiệu lực trong vòng 5 phút',
      code,
    };
  }

  /**
   * Bước 2: Kiểm tra mã OTP trên Redis (check expired or wrong) và tạo user với role BORROWER
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<UserResponse> {
    if (!dto.email || !dto.email.trim()) {
      throw AppException.badRequest('Email không được để trống', { field: 'email' }, 'EMAIL_REQUIRED');
    }
    if (!dto.otp || !dto.otp.trim()) {
      throw AppException.badRequest('Mã OTP không được để trống', { field: 'otp' }, 'OTP_REQUIRED');
    }

    const email = dto.email.trim().toLowerCase();
    const otp = dto.otp.trim();
    const redisKey = this.getRegisterOtpKey(email);

    // 1. Lấy dữ liệu đăng ký tạm thời từ Redis
    const rawSession = await this.redisService.get(redisKey);

    // 2. Kiểm tra nếu OTP không tồn tại hoặc đã hết hạn trên Redis
    if (!rawSession) {
      throw AppException.badRequest(
        'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng thực hiện đăng ký lại',
        { email },
        'OTP_EXPIRED',
      );
    }

    const session: PendingRegistrationSession = JSON.parse(rawSession);

    // 3. Kiểm tra mã OTP có chính xác không (sai OTP)
    if (session.otp !== otp) {
      throw AppException.badRequest(
        'Mã OTP không chính xác. Vui lòng kiểm tra lại email của bạn',
        { field: 'otp' },
        'OTP_WRONG',
      );
    }

    // 4. Tìm kiếm hoặc tạo mới Role BORROWER mặc định
    let role = await this.authRepo.findRoleByName(this.DEFAULT_ROLE_NAME);
    if (!role) {
      this.logger.log(`Role '${this.DEFAULT_ROLE_NAME}' chưa tồn tại. Đang tự động khởi tạo...`);
      role = await this.authRepo.createRole(
        this.DEFAULT_ROLE_NAME,
        'Vai trò người mượn sách mặc định khi đăng ký tài khoản',
      );
    }

    // 5. Kiểm tra phòng ngừa trùng lặp trước khi ghi nhận vào DB
    const duplicateEmail = await this.authRepo.findByEmail(session.email);
    if (duplicateEmail) {
      await this.redisService.del(redisKey);
      throw AppException.conflict(
        'Tài khoản với email này đã được kích hoạt trước đó',
        { email: session.email },
        'EMAIL_ALREADY_EXISTS',
      );
    }

    // 6. Tạo người dùng mới và gán role BORROWER trong một Transaction
    const createdUser = await this.authRepo.createUserWithRole(
      {
        username: session.username,
        email: session.email,
        passwordHash: session.passwordHash,
        fullName: session.fullName,
        phone: session.phone,
        code: session.code,
        status: UserStatus.ACTIVE,
      },
      role,
    );

    // 7. Xóa mã OTP khỏi Redis sau khi xác thực thành công để tránh tái sử dụng
    await this.redisService.del(redisKey);
    this.logger.log(`Xác thực thành công và kích hoạt tài khoản ${createdUser.username} (${createdUser.email}) với vai trò ${this.DEFAULT_ROLE_NAME}`);

    // 8. Chuyển đổi sang UserResponse thông qua wrapper method của AuthMapper
    return this.authMapper.toUserResponse(createdUser);
  }

  /**
   * Hỗ trợ gửi lại mã OTP mới trong trường hợp người dùng chưa nhận được hoặc muốn cấp mã mới (vẫn trong 5p)
   */
  async resendOtp(dto: ResendOtpDto): Promise<{ email: string; expiresInSeconds: number; message: string }> {
    if (!dto.email || !dto.email.trim()) {
      throw AppException.badRequest('Email không được để trống', { field: 'email' }, 'EMAIL_REQUIRED');
    }

    const email = dto.email.trim().toLowerCase();
    const redisKey = this.getRegisterOtpKey(email);
    const rawSession = await this.redisService.get(redisKey);

    if (!rawSession) {
      throw AppException.badRequest(
        'Phiên đăng ký đã hết hạn hoặc không tồn tại. Vui lòng nhập lại thông tin đăng ký',
        { email },
        'OTP_SESSION_EXPIRED',
      );
    }

    const session: PendingRegistrationSession = JSON.parse(rawSession);
    const newOtp = randomInt(100000, 1000000).toString();
    session.otp = newOtp;

    // Gia hạn thêm 5 phút với mã OTP mới
    await this.redisService.set(redisKey, JSON.stringify(session), this.OTP_TTL_SECONDS);

    // Gửi email mã mới
    await this.mailService.sendOtpEmail(email, newOtp);

    return {
      email,
      expiresInSeconds: this.OTP_TTL_SECONDS,
      message: 'Mã OTP mới đã được gửi về Gmail của bạn, có hiệu lực trong vòng 5 phút',
    };
  }

  /**
   * Tạo Access Token và Refresh Token từ thông tin người dùng
   * Payload chứa: userId, email, list role (roles)
   */
  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const roles =
      user.userRoles
        ?.map((ur) => ur.role?.name)
        .filter((name): name is string => Boolean(name)) ?? [];

    const payload: JwtPayload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      roles,
      username: user.username,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_SECRET',
      'hope-library-access-secret-key-2026',
    );
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'hope-library-refresh-secret-key-2026',
    );
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Tạo Access Token mới chứa userId, email, list roles
   */
  generateAccessToken(user: User): string {
    const roles =
      user.userRoles
        ?.map((ur) => ur.role?.name)
        .filter((name): name is string => Boolean(name)) ?? [];

    const payload: JwtPayload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      roles,
      username: user.username,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_SECRET',
      'hope-library-access-secret-key-2026',
    );
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');

    return this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn as any,
    });
  }

  /**
   * Đăng nhập: xác thực username & password, trả về accessToken và refreshToken
   */
  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> {
    if (!dto.username || !dto.username.trim()) {
      throw AppException.badRequest(
        'Tên đăng nhập không được để trống',
        { field: 'username' },
        'USERNAME_REQUIRED',
      );
    }
    if (!dto.password) {
      throw AppException.badRequest(
        'Mật khẩu không được để trống',
        { field: 'password' },
        'PASSWORD_REQUIRED',
      );
    }

    const username = dto.username.trim();
    let user = await this.authRepo.findByUsername(username);
    if (!user && username.includes('@')) {
      user = await this.authRepo.findByEmail(username.toLowerCase());
    }

    if (!user) {
      throw AppException.unauthorized(
        'Tên đăng nhập hoặc mật khẩu không chính xác',
        null,
        'INVALID_CREDENTIALS',
      );
    }

    const isPasswordValid = comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppException.unauthorized(
        'Tên đăng nhập hoặc mật khẩu không chính xác',
        null,
        'INVALID_CREDENTIALS',
      );
    }

    if (user.status === UserStatus.LOCKED) {
      throw AppException.forbidden(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên',
        null,
        'ACCOUNT_LOCKED',
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      throw AppException.forbidden(
        'Tài khoản chưa được kích hoạt',
        null,
        'ACCOUNT_INACTIVE',
      );
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    const userResponse = this.authMapper.toUserResponse(user);

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }

  /**
   * Làm mới Access Token từ Refresh Token
   */
  async refreshToken(token: string): Promise<{ accessToken: string }> {
    if (!token) {
      throw AppException.unauthorized(
        'Không tìm thấy refresh token trong cookie. Vui lòng đăng nhập lại',
        null,
        'REFRESH_TOKEN_REQUIRED',
      );
    }

    let payload: JwtPayload;
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'hope-library-refresh-secret-key-2026',
      );
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: refreshSecret,
      });
    } catch (error) {
      throw AppException.unauthorized(
        'Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại',
        error,
        'INVALID_REFRESH_TOKEN',
      );
    }

    const userId = payload.userId || payload.sub;
    if (!userId) {
      throw AppException.unauthorized(
        'Dữ liệu payload của refresh token không hợp lệ',
        null,
        'INVALID_TOKEN_PAYLOAD',
      );
    }

    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw AppException.unauthorized(
        'Người dùng không tồn tại hoặc đã bị xóa khỏi hệ thống',
        null,
        'USER_NOT_FOUND',
      );
    }

    if (user.status === UserStatus.LOCKED) {
      throw AppException.forbidden(
        'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên',
        null,
        'ACCOUNT_LOCKED',
      );
    }

    const accessToken = this.generateAccessToken(user);

    return { accessToken };
  }

  /**
   * Giải mã và xác thực access token, trích xuất userId từ payload
   */
  getUserIdFromToken(token: string): string {
    if (!token) {
      throw AppException.unauthorized(
        'Access token không được để trống',
        null,
        'TOKEN_REQUIRED',
      );
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    if (!cleanToken) {
      throw AppException.unauthorized(
        'Định dạng Bearer token không hợp lệ',
        null,
        'INVALID_TOKEN_FORMAT',
      );
    }

    try {
      const accessSecret = this.configService.get<string>(
        'JWT_SECRET',
        'hope-library-access-secret-key-2026',
      );
      const payload = this.jwtService.verify<JwtPayload>(cleanToken, {
        secret: accessSecret,
      });

      const userId = payload.userId || payload.sub;
      if (!userId) {
        throw AppException.unauthorized(
          'Dữ liệu payload của token không hợp lệ (không chứa userId)',
          null,
          'INVALID_TOKEN_PAYLOAD',
        );
      }
      return userId;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw AppException.unauthorized(
        'Access token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại',
        error,
        'INVALID_ACCESS_TOKEN',
      );
    }
  }

  /**
   * Truy vấn thông tin người dùng hiện tại theo userId và trả về UserResponse
   */
  async getMe(userId: string): Promise<UserResponse> {
    if (!userId || !userId.trim()) {
      throw AppException.badRequest(
        'Mã định danh người dùng (userId) không hợp lệ',
        { userId },
        'INVALID_USER_ID',
      );
    }

    const user = await this.authRepo.findById(userId.trim());
    if (!user) {
      throw AppException.notFound(
        'Không tìm thấy thông tin tài khoản người dùng',
        { userId },
        'USER_NOT_FOUND',
      );
    }

    if (user.status === UserStatus.LOCKED) {
      throw AppException.forbidden(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên',
        null,
        'ACCOUNT_LOCKED',
      );
    }

    return this.authMapper.toUserResponse(user);
  }

  /**
   * Lấy thông tin tài khoản hiện tại từ Access Token
   */
  async getMeByToken(token: string): Promise<UserResponse> {
    const userId = this.getUserIdFromToken(token);
    return this.getMe(userId);
  }

  /**
   * Cập nhật thông tin trang cá nhân của người dùng và trả về UserResponse đã cập nhật
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ): Promise<UserResponse> {
    if (!userId || !userId.trim()) {
      throw AppException.badRequest(
        'Mã định danh người dùng (userId) không hợp lệ',
        { userId },
        'INVALID_USER_ID',
      );
    }

    const user = await this.authRepo.findById(userId.trim());
    if (!user) {
      throw AppException.notFound(
        'Không tìm thấy thông tin người dùng để cập nhật',
        { userId },
        'USER_NOT_FOUND',
      );
    }

    if (user.status === UserStatus.LOCKED) {
      throw AppException.forbidden(
        'Tài khoản của bạn đã bị khóa. Không thể thực hiện cập nhật',
        null,
        'ACCOUNT_LOCKED',
      );
    }

    const oldAvatarUrl = user.avartarUrl;
    let uploadResult: SaveImageResult | null = null;
    const fileToUpload = avatarFile ?? dto.avatar ?? dto.avartar;

    if (fileToUpload) {
      uploadResult = await this.fileStorageService.saveImage(fileToUpload, 'avatars');
      user.avartarUrl = uploadResult.fileUrl;
    } else if (dto.avartarUrl !== undefined) {
      user.avartarUrl = dto.avartarUrl;
    } else if (dto.avatarUrl !== undefined) {
      user.avartarUrl = dto.avatarUrl;
    }

    // Validate và cập nhật fullName
    if (dto.fullName !== undefined) {
      const trimmedFullName = dto.fullName?.trim() ?? '';
      if (trimmedFullName.length > 100) {
        if (uploadResult) {
          await this.fileStorageService.deleteFile(uploadResult.filePath).catch(() => {});
        }
        throw AppException.badRequest(
          'Họ và tên không được vượt quá 100 ký tự',
          { field: 'fullName' },
          'INVALID_FULL_NAME_LENGTH',
        );
      }
      user.fullName = trimmedFullName;
    }

    // Validate và cập nhật phone
    if (dto.phone !== undefined) {
      const trimmedPhone = dto.phone?.trim() ?? '';
      if (trimmedPhone) {
        const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
        if (!phoneRegex.test(trimmedPhone)) {
          if (uploadResult) {
            await this.fileStorageService.deleteFile(uploadResult.filePath).catch(() => {});
          }
          throw AppException.badRequest(
            'Số điện thoại không hợp lệ (yêu cầu định dạng 10 chữ số, ví dụ 0912345678 hoặc +84912345678)',
            { field: 'phone' },
            'INVALID_PHONE_FORMAT',
          );
        }
        user.phone = trimmedPhone;
      } else {
        user.phone = null;
      }
    }

    user.updatedAt = new Date();

    try {
      await this.authRepo.saveUser(user);
    } catch (error) {
      if (uploadResult) {
        await this.fileStorageService.deleteFile(uploadResult.filePath).catch(() => {});
      }
      throw error;
    }

    // Nếu đã upload thành công avatar mới và trước đó có avatar cũ, xóa file avatar cũ
    if (uploadResult && oldAvatarUrl && oldAvatarUrl !== uploadResult.fileUrl) {
      try {
        await this.fileStorageService.deleteFile(oldAvatarUrl);
      } catch (err) {
        this.logger.warn(`Không thể xóa avatar cũ (${oldAvatarUrl}): ${(err as Error).message}`);
      }
    }

    // Nạp lại thông tin user kèm relations roles để AutoMapper xử lý
    const refreshedUser = await this.authRepo.findById(user.id);
    return this.authMapper.toUserResponse(refreshedUser ?? user);
  }

  /**
   * Cập nhật thông tin cá nhân từ Access Token
   */
  async updateProfileByToken(
    token: string,
    dto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ): Promise<UserResponse> {
    const userId = this.getUserIdFromToken(token);
    return this.updateProfile(userId, dto, avatarFile);
  }

  /**
   * Gán quyền hạn (permission) cho vai trò (role)
   */
  async assignPermissionToRole(dto: AssignPermissionDto): Promise<RolePermissionResponse> {
    if (!dto.roleId || !dto.roleId.trim()) {
      throw AppException.badRequest(
        'Mã định danh vai trò (roleId) không được để trống',
        { field: 'roleId' },
        'ROLE_ID_REQUIRED',
      );
    }

    if (!dto.permissionId || !dto.permissionId.trim()) {
      throw AppException.badRequest(
        'Mã định danh quyền hạn (permissionId) không được để trống',
        { field: 'permissionId' },
        'PERMISSION_ID_REQUIRED',
      );
    }

    const roleId = dto.roleId.trim();
    const permissionId = dto.permissionId.trim();

    // 1. Kiểm tra vai trò có tồn tại không
    const role = await this.authRepo.findRoleById(roleId);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${roleId}`,
        { roleId },
        'ROLE_NOT_FOUND',
      );
    }

    // 2. Kiểm tra quyền hạn có tồn tại không
    const permission = await this.authRepo.findPermissionById(permissionId);
    if (!permission) {
      throw AppException.notFound(
        `Không tìm thấy quyền hạn với ID: ${permissionId}`,
        { permissionId },
        'PERMISSION_NOT_FOUND',
      );
    }

    // 3. Kiểm tra vai trò đã có quyền hạn này chưa
    const existingRolePermission = await this.authRepo.findRolePermission(roleId, permissionId);
    if (existingRolePermission) {
      throw AppException.conflict(
        `Vai trò '${role.name}' đã được gán quyền hạn '${permission.code}' trước đó`,
        { roleId, permissionId, roleName: role.name, permissionCode: permission.code },
        'PERMISSION_ALREADY_ASSIGNED',
      );
    }

    // 4. Map DTO sang Entity thông qua hàm wrapper của RolePermissionMapper
    const rolePermission = this.rolePermissionMapper.toEntity(dto);
    rolePermission.roleId = role.id;
    rolePermission.permissionId = permission.id;
    rolePermission.assignedAt = new Date();

    const savedRolePermission = await this.authRepo.saveRolePermission(rolePermission);
    savedRolePermission.role = role;
    savedRolePermission.permission = permission;

    this.logger.log(`Gán quyền hạn ${permission.code} cho vai trò ${role.name} thành công`);

    // 5. Chuyển đổi sang RolePermissionResponse thông qua wrapper method của RolePermissionMapper
    return this.rolePermissionMapper.toResponse(savedRolePermission);
  }

  /**
   * Gán điều hướng cho vai trò (Role)
   */
  async assignNavigationToRole(dto: AssignNavigationDto): Promise<RoleNavigationResponse> {
    if (!dto.roleId || !dto.roleId.trim()) {
      throw AppException.badRequest(
        'Mã định danh vai trò (roleId) không được để trống',
        { field: 'roleId' },
        'ROLE_ID_REQUIRED',
      );
    }

    if (!dto.navigationId || !dto.navigationId.trim()) {
      throw AppException.badRequest(
        'Mã định danh điều hướng (navigationId) không được để trống',
        { field: 'navigationId' },
        'NAVIGATION_ID_REQUIRED',
      );
    }

    const roleId = dto.roleId.trim();
    const navigationId = dto.navigationId.trim();

    // 1. Kiểm tra vai trò có tồn tại không
    const role = await this.authRepo.findRoleById(roleId);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${roleId}`,
        { roleId },
        'ROLE_NOT_FOUND',
      );
    }

    // 2. Kiểm tra điều hướng có tồn tại không
    const navigation = await this.authRepo.findNavigationById(navigationId);
    if (!navigation) {
      throw AppException.notFound(
        `Không tìm thấy điều hướng với ID: ${navigationId}`,
        { navigationId },
        'NAVIGATION_NOT_FOUND',
      );
    }

    // 3. Kiểm tra vai trò đã có điều hướng này chưa
    const existingRoleNavigation = await this.authRepo.findRoleNavigation(roleId, navigationId);
    if (existingRoleNavigation) {
      throw AppException.conflict(
        `Vai trò '${role.name}' đã được gán điều hướng '${navigation.name}' (${navigation.code}) trước đó`,
        { roleId, navigationId, roleName: role.name, navigationCode: navigation.code },
        'NAVIGATION_ALREADY_ASSIGNED',
      );
    }

    // 4. Map DTO sang Entity thông qua hàm wrapper của RoleNavigationMapper
    const roleNavigation = this.roleNavigationMapper.toEntity(dto);
    roleNavigation.roleId = role.id;
    roleNavigation.navigationId = navigation.id;
    roleNavigation.assignedAt = new Date();

    const savedRoleNavigation = await this.authRepo.saveRoleNavigation(roleNavigation);
    savedRoleNavigation.role = role;
    savedRoleNavigation.navigation = navigation;

    this.logger.log(`Gán điều hướng ${navigation.code} cho vai trò ${role.name} thành công`);

    // 5. Chuyển đổi sang RoleNavigationResponse thông qua wrapper method của RoleNavigationMapper
    return this.roleNavigationMapper.toResponse(savedRoleNavigation);
  }

  /**
   * Xóa bỏ (gỡ / thu hồi) quyền hạn khỏi vai trò
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    if (!roleId || !roleId.trim()) {
      throw AppException.badRequest(
        'Mã định danh vai trò (roleId) không được để trống',
        { field: 'roleId' },
        'ROLE_ID_REQUIRED',
      );
    }

    if (!permissionId || !permissionId.trim()) {
      throw AppException.badRequest(
        'Mã định danh quyền hạn (permissionId) không được để trống',
        { field: 'permissionId' },
        'PERMISSION_ID_REQUIRED',
      );
    }

    const cleanRoleId = roleId.trim();
    const cleanPermissionId = permissionId.trim();

    // 1. Kiểm tra vai trò có tồn tại không
    const role = await this.authRepo.findRoleById(cleanRoleId);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${cleanRoleId}`,
        { roleId: cleanRoleId },
        'ROLE_NOT_FOUND',
      );
    }

    // 2. Kiểm tra quyền hạn có tồn tại không
    const permission = await this.authRepo.findPermissionById(cleanPermissionId);
    if (!permission) {
      throw AppException.notFound(
        `Không tìm thấy quyền hạn với ID: ${cleanPermissionId}`,
        { permissionId: cleanPermissionId },
        'PERMISSION_NOT_FOUND',
      );
    }

    // 3. Kiểm tra vai trò có đang sở hữu quyền hạn này không
    const existingRolePermission = await this.authRepo.findRolePermission(cleanRoleId, cleanPermissionId);
    if (!existingRolePermission) {
      throw AppException.notFound(
        `Vai trò '${role.name}' chưa được gán quyền hạn '${permission.code}'`,
        { roleId: cleanRoleId, permissionId: cleanPermissionId, roleName: role.name, permissionCode: permission.code },
        'ROLE_PERMISSION_NOT_FOUND',
      );
    }

    // 4. Thực hiện xóa liên kết RolePermission
    await this.authRepo.deleteRolePermission(cleanRoleId, cleanPermissionId);
    this.logger.log(`Đã xóa quyền hạn ${permission.code} khỏi vai trò ${role.name}`);
  }

  /**
   * Xóa bỏ (gỡ / thu hồi) điều hướng khỏi vai trò
   */
  async removeNavigationFromRole(roleId: string, navigationId: string): Promise<void> {
    if (!roleId || !roleId.trim()) {
      throw AppException.badRequest(
        'Mã định danh vai trò (roleId) không được để trống',
        { field: 'roleId' },
        'ROLE_ID_REQUIRED',
      );
    }

    if (!navigationId || !navigationId.trim()) {
      throw AppException.badRequest(
        'Mã định danh điều hướng (navigationId) không được để trống',
        { field: 'navigationId' },
        'NAVIGATION_ID_REQUIRED',
      );
    }

    const cleanRoleId = roleId.trim();
    const cleanNavigationId = navigationId.trim();

    // 1. Kiểm tra vai trò có tồn tại không
    const role = await this.authRepo.findRoleById(cleanRoleId);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${cleanRoleId}`,
        { roleId: cleanRoleId },
        'ROLE_NOT_FOUND',
      );
    }

    // 2. Kiểm tra điều hướng có tồn tại không
    const navigation = await this.authRepo.findNavigationById(cleanNavigationId);
    if (!navigation) {
      throw AppException.notFound(
        `Không tìm thấy điều hướng với ID: ${cleanNavigationId}`,
        { navigationId: cleanNavigationId },
        'NAVIGATION_NOT_FOUND',
      );
    }

    // 3. Kiểm tra vai trò có đang sở hữu điều hướng này không
    const existingRoleNavigation = await this.authRepo.findRoleNavigation(cleanRoleId, cleanNavigationId);
    if (!existingRoleNavigation) {
      throw AppException.notFound(
        `Vai trò '${role.name}' chưa được gán điều hướng '${navigation.name}' (${navigation.code})`,
        { roleId: cleanRoleId, navigationId: cleanNavigationId, roleName: role.name, navigationCode: navigation.code },
        'ROLE_NAVIGATION_NOT_FOUND',
      );
    }

    // 4. Thực hiện xóa liên kết RoleNavigation
    await this.authRepo.deleteRoleNavigation(cleanRoleId, cleanNavigationId);
    this.logger.log(`Đã xóa điều hướng ${navigation.code} khỏi vai trò ${role.name}`);
  }

  /**
   * Helper tạo redis key cho mã OTP quên mật khẩu của email
   */
  private getForgotPasswordOtpKey(email: string): string {
    return `otp:forgot-password:${email.toLowerCase().trim()}`;
  }

  /**
   * Helper tạo redis key cho Reset Token đổi mật khẩu
   */
  private getResetTokenKey(token: string): string {
    return `token:reset-password:${token.trim()}`;
  }

  /**
   * Bước 1: Quên mật khẩu - Kiểm tra email, sinh OTP 6 chữ số, lưu vào Redis 5 phút và gửi email
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ email: string; expiresInSeconds: number; message: string }> {
    if (!dto.email || !dto.email.trim()) {
      throw AppException.badRequest('Email không được để trống', { field: 'email' }, 'EMAIL_REQUIRED');
    }
    const email = dto.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppException.badRequest('Định dạng email không hợp lệ', { field: 'email' }, 'INVALID_EMAIL');
    }

    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      throw AppException.notFound(
        `Không tìm thấy tài khoản người dùng với email: ${email}`,
        { email },
        'USER_NOT_FOUND',
      );
    }

    if (user.status === UserStatus.LOCKED) {
      throw AppException.forbidden(
        'Tài khoản này hiện đang bị khóa. Vui lòng liên hệ quản trị viên',
        { email, status: user.status },
        'ACCOUNT_LOCKED',
      );
    }

    // Sinh OTP 6 chữ số
    const otp = randomInt(100000, 1000000).toString();
    const otpKey = this.getForgotPasswordOtpKey(email);

    // Lưu vào Redis với TTL 5 phút (300 giây)
    await this.redisService.set(otpKey, otp, this.OTP_TTL_SECONDS);

    // Gửi email OTP bằng template quên mật khẩu
    await this.mailService.sendForgotPasswordOtpEmail(email, otp);

    this.logger.log(`Đã gửi OTP quên mật khẩu tới ${email}`);
    return {
      email,
      expiresInSeconds: this.OTP_TTL_SECONDS,
      message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn',
    };
  }

  /**
   * Bước 2 & 3: Xác thực OTP quên mật khẩu và cấp Reset Token (lưu Redis 5 phút)
   */
  async verifyResetOtp(dto: VerifyResetOtpDto): Promise<VerifyResetOtpResponseDto> {
    if (!dto.email || !dto.email.trim()) {
      throw AppException.badRequest('Email không được để trống', { field: 'email' }, 'EMAIL_REQUIRED');
    }
    if (!dto.otp || !dto.otp.trim()) {
      throw AppException.badRequest('Mã OTP không được để trống', { field: 'otp' }, 'OTP_REQUIRED');
    }

    const email = dto.email.trim().toLowerCase();
    const otpKey = this.getForgotPasswordOtpKey(email);
    const cachedOtp = await this.redisService.get(otpKey);

    if (!cachedOtp) {
      throw AppException.badRequest(
        'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã OTP mới',
        { email },
        'RESET_OTP_EXPIRED',
      );
    }

    if (cachedOtp !== dto.otp.trim()) {
      throw AppException.badRequest(
        'Mã OTP không chính xác. Vui lòng kiểm tra lại',
        { email },
        'INVALID_RESET_OTP',
      );
    }

    // Xóa OTP sau khi xác thực thành công
    await this.redisService.del(otpKey);

    // Tạo Reset Token ngẫu nhiên an toàn (64 ký tự hex)
    const resetToken = randomBytes(32).toString('hex');
    const tokenKey = this.getResetTokenKey(resetToken);

    // Lưu Reset Token vào Redis với TTL 5 phút (300 giây)
    const sessionData = JSON.stringify({
      email,
      purpose: 'RESET_PASSWORD',
      createdAt: Date.now(),
    });
    await this.redisService.set(tokenKey, sessionData, this.OTP_TTL_SECONDS);

    this.logger.log(`Đã cấp Reset Token thành công cho ${email}`);
    return {
      resetToken,
      expiresInSeconds: this.OTP_TTL_SECONDS,
    };
  }

  /**
   * Bước 4 & 5: Đặt lại mật khẩu mới bằng Reset Token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (!dto.resetToken || !dto.resetToken.trim()) {
      throw AppException.badRequest(
        'Reset token không được để trống',
        { field: 'resetToken' },
        'RESET_TOKEN_REQUIRED',
      );
    }

    const tokenKey = this.getResetTokenKey(dto.resetToken);
    const sessionJson = await this.redisService.get(tokenKey);

    if (!sessionJson) {
      throw AppException.badRequest(
        'Reset token không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ đầu',
        { resetToken: dto.resetToken },
        'INVALID_RESET_TOKEN',
      );
    }

    let session: { email: string; purpose: string };
    try {
      session = JSON.parse(sessionJson);
    } catch {
      throw AppException.badRequest(
        'Dữ liệu reset token không hợp lệ',
        null,
        'INVALID_RESET_TOKEN_DATA',
      );
    }

    if (session.purpose !== 'RESET_PASSWORD') {
      throw AppException.badRequest(
        'Mục đích sử dụng của token không hợp lệ',
        { purpose: session.purpose },
        'INVALID_TOKEN_PURPOSE',
      );
    }

    // Validate mật khẩu mới
    if (!dto.newPassword) {
      throw AppException.badRequest(
        'Mật khẩu mới không được để trống',
        { field: 'newPassword' },
        'PASSWORD_REQUIRED',
      );
    }

    const passwordMinLength = await this.getPasswordMinLength();
    if (dto.newPassword.length < passwordMinLength) {
      throw AppException.badRequest(
        `Mật khẩu mới phải có độ dài tối thiểu ${passwordMinLength} ký tự`,
        { field: 'newPassword', minLength: passwordMinLength },
        'WEAK_PASSWORD',
      );
    }

    const confirmPassword = dto.confirmPassword || dto.confirmpassword;
    if (confirmPassword && dto.newPassword !== confirmPassword) {
      throw AppException.badRequest(
        'Xác nhận mật khẩu mới không khớp',
        { field: 'confirmPassword' },
        'PASSWORD_MISMATCH',
      );
    }

    // Tìm user và cập nhật mật khẩu
    const user = await this.authRepo.findByEmail(session.email);
    if (!user) {
      throw AppException.notFound(
        `Không tìm thấy tài khoản người dùng với email: ${session.email}`,
        { email: session.email },
        'USER_NOT_FOUND',
      );
    }

    user.passwordHash = hashPassword(dto.newPassword);
    await this.authRepo.saveUser(user);

    // Xóa Reset Token khỏi Redis để ngăn tái sử dụng
    await this.redisService.del(tokenKey);

    this.logger.log(`Đặt lại mật khẩu thành công cho người dùng: ${session.email}`);
    return {
      message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới',
    };
  }
}
