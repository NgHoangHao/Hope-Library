import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { LoanService } from '../service/loan.service.js';
import {
  CreateLoanDto,
  FulfillLoanDto,
  LoanDetailResponse,
  LoanStatus,
  MaxLoanDaysResponse,
  PaginatedLoanResponse,
  QueryLoanDto,
  RemainingBorrowBooksResponse,
  ReservationExpirationHoursResponse,
  ReserveBookDto,
  UpdateLoanDto,
} from '../model/loan/loan.dto.js';
import { ApiResponse } from '../common/index.js';
import { TokenHelper } from '../utils/token.helper.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  /**
   * GET /loans - Lấy danh sách phiếu mượn có phân trang, tìm kiếm và lọc
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LOAN_READ')
  @ApiOperation({
    summary: 'Lấy danh sách phiếu mượn có phân trang',
    description:
      'Hỗ trợ phân trang (page bắt đầu từ 1, size), tìm kiếm (search theo tên, email, username hoặc loan ID), lọc theo userId và trạng thái mượn (status).',
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
    description: 'Số lượng phiếu mượn mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Lọc theo ID người mượn (UUID)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: LoanStatus,
    description: 'Lọc theo trạng thái phiếu mượn (PENDING, BORROWED, RETURNED, OVERDUE, CANCELLED, EXPIRED)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên người dùng, email, username hoặc mã ID phiếu mượn',
  })
  async getAllLoans(
    @Query() query: QueryLoanDto,
  ): Promise<ApiResponse<PaginatedLoanResponse>> {
    const loans = await this.loanService.getAllLoans(query);
    return ApiResponse.success(loans, 'Lấy danh sách phiếu mượn thành công');
  }

  /**
   * GET /loans/me (hoặc /loans/my-loans) - Lấy danh sách phiếu mượn của độc giả đang đăng nhập
   */
  @Get(['me', 'my-loans'])
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LOAN_SELF_READ')
  @ApiOperation({
    summary: 'Lấy danh sách phiếu mượn của độc giả hiện tại (từ token)',
    description:
      'Lấy userId trực tiếp từ JWT Access Token. Hỗ trợ phân trang (page, size), tìm kiếm (search) và lọc theo trạng thái phiếu mượn (status).',
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
    description: 'Số lượng phiếu mượn mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: LoanStatus,
    description: 'Lọc theo trạng thái phiếu mượn (PENDING, BORROWED, RETURNED, OVERDUE, CANCELLED, EXPIRED)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo mã ID phiếu mượn',
  })
  async getMyLoans(
    @Req() req: Request,
    @Query('page') page?: number | string,
    @Query('size') size?: number | string,
    @Query('status') status?: LoanStatus,
    @Query('search') search?: string,
  ): Promise<ApiResponse<PaginatedLoanResponse>> {
    const token = TokenHelper.extractTokenFromRequest(req);
    const payload = TokenHelper.decodeToken(token);
    const userId = payload.userId || payload.sub;

    const loans = await this.loanService.getAllLoans({
      page,
      size,
      userId,
      status,
      search,
    });
    return ApiResponse.success(loans, 'Lấy danh sách phiếu mượn của bạn thành công');
  }

  /**
   * GET /loans/me/remaining-books - Lấy số sách độc giả hiện tại còn có thể mượn
   */
  @Get('me/remaining-books')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy số sách độc giả hiện tại còn có thể mượn',
    description:
      'Lấy userId trực tiếp từ JWT Access Token. Tính bằng giá trị cấu hình hệ thống MAX_BORROW_BOOKS (ưu tiên Redis, fallback DB) trừ đi số lượng LoanItem có trạng thái BORROWED của độc giả.',
  })
  async getMyRemainingBorrowBooks(
    @Req() req: Request,
  ): Promise<ApiResponse<RemainingBorrowBooksResponse>> {
    const token = TokenHelper.extractTokenFromRequest(req);
    const payload = TokenHelper.decodeToken(token);
    const userId = payload.userId || payload.sub || '';

    const result = await this.loanService.getRemainingBorrowBooks(userId);
    return ApiResponse.success(result, 'Lấy số sách còn có thể mượn thành công');
  }

  /**
   * GET /loans/reservation-expiration-hours - Lấy số giờ giữ chỗ tối đa khi đặt sách
   */
  @Get('reservation-expiration-hours')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy số giờ tối đa giữ chỗ đặt sách',
    description:
      'Đọc cấu hình hệ thống với key RESERVATION_EXPIRATION_HOURS (ưu tiên Redis, fallback DB và biến môi trường).',
  })
  async getReservationExpirationHours(): Promise<
    ApiResponse<ReservationExpirationHoursResponse>
  > {
    const result = await this.loanService.getReservationExpirationHoursConfig();
    return ApiResponse.success(
      result,
      'Lấy thời gian giữ chỗ đặt sách tối đa thành công',
    );
  }

  /**
   * GET /loans/max-loan-days - Lấy số ngày hạn trả sách mặc định (MAX_LOAN_DAYS)
   */
  @Get('max-loan-days')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy hạn trả sách mặc định (số ngày mượn tối đa)',
    description:
      'Đọc cấu hình hệ thống với key MAX_LOAN_DAYS (ưu tiên Redis, fallback DB và biến môi trường).',
  })
  async getMaxLoanDays(): Promise<ApiResponse<MaxLoanDaysResponse>> {
    const result = await this.loanService.getMaxLoanDaysConfig();
    return ApiResponse.success(
      result,
      'Lấy hạn trả sách mặc định thành công',
    );
  }

  /**
   * GET /loans/:id - Lấy thông tin chi tiết một phiếu mượn
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LOAN_READ')
  @ApiOperation({
    summary: 'Lấy chi tiết phiếu mượn theo ID',
    description: 'Trả về thông tin chi tiết của phiếu mượn bao gồm người mượn, danh sách các mục mượn (loanItems) và tiền phạt (fines).',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh phiếu mượn (UUID)',
    type: String,
  })
  async getLoanById(@Param('id') id: string): Promise<ApiResponse<LoanDetailResponse>> {
    const loan = await this.loanService.getLoanById(id);
    return ApiResponse.success(loan, 'Lấy chi tiết phiếu mượn thành công');
  }

  /**
   * POST /loans - Tạo mới phiếu mượn sách kèm danh sách LoanItem (Librarian tạo phiếu)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('LOAN_CREATE')
  @ApiOperation({
    summary: 'Tạo phiếu mượn sách mới bởi thủ thư (Librarian)',
    description:
      'Tạo phiếu mượn nhận vào loanRequest và danh sách các mục mượn (list LoanItemRequest). Sử dụng khóa phân tán Redis (SET NX PX) để chống xung đột/mượn trùng với độc giả đặt mượn online cùng thời điểm. Cập nhật trạng thái bản sao sách sang BORROWED và giảm số lượng bản sao khả dụng.',
  })
  async createLoan(@Body() dto: CreateLoanDto): Promise<ApiResponse<LoanDetailResponse>> {
    const createdLoan = await this.loanService.createLoan(dto);
    return ApiResponse.created(createdLoan, 'Tạo phiếu mượn sách thành công');
  }

  /**
   * POST /loans/reserve - Đặt mượn giữ chỗ sách cho độc giả (Borrower book sách)
   * Lấy ID độc giả trực tiếp từ JWT Access Token
   */
  @Post(['reserve', 'book'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Đặt mượn giữ chỗ sách trực tuyến cho độc giả',
    description:
      'Lấy userId trực tiếp từ access token. Kiểm tra điều kiện: tài khoản không bị khóa, không chạm trần 3 sách (PENDING + BORROWED), không có sách OVERDUE, không nợ tiền phạt. Khóa phân tán trên Redis chống mượn trùng. Phiếu tạo ở trạng thái PENDING với thời hạn 48 giờ.',
  })
  async reserveBooks(
    @Req() req: Request,
    @Body() dto: ReserveBookDto,
  ): Promise<ApiResponse<LoanDetailResponse>> {
    const token = TokenHelper.extractTokenFromRequest(req);
    const payload = TokenHelper.decodeToken(token);
    const userId = payload.userId;
    const loan = await this.loanService.reserveBooks(userId, dto);
    return ApiResponse.created(
      loan,
      'Đặt mượn giữ chỗ sách thành công! Vui lòng tới quầy thư viện nhận sách trong vòng 48 giờ.',
    );
  }

  /**
   * POST /loans/:id/fulfill - Thủ thư xác nhận giao sách tại quầy cho độc giả
   */
  @Post([':id/fulfill', ':id/handover'])
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LOAN_UPDATE')
  @ApiOperation({
    summary: 'Thủ thư xác nhận giao sách tại quầy cho độc giả',
    description:
      'Độc giả mang mã phiếu hoặc QR đến quầy. Thủ thư đối chiếu, chọn/quét đúng bản sao vật lý. Phiếu chuyển từ PENDING → BORROWED, bắt đầu tính ngày mượn và hạn trả.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh phiếu mượn (UUID)',
    type: String,
  })
  async fulfillLoan(
    @Param('id') id: string,
    @Body() dto?: FulfillLoanDto,
  ): Promise<ApiResponse<LoanDetailResponse>> {
    const loan = await this.loanService.fulfillLoan(id, dto);
    return ApiResponse.success(
      loan,
      'Xác nhận giao sách tại quầy thành công! Phiếu mượn đã chuyển sang trạng thái đang mượn.',
    );
  }

  /**
   * POST /loans/cancel-expired - Quét và hủy các phiếu mượn PENDING đã quá hạn 48 giờ
   */
  @Post('cancel-expired')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LOAN_UPDATE')
  @ApiOperation({
    summary: 'Kích hoạt quét và hủy các phiếu mượn PENDING quá hạn lấy sách',
    description:
      'Chuyển các phiếu PENDING đã quá hạn 48h sang EXPIRED và tự động hoàn trả lại số lượng sách khả dụng vào kho.',
  })
  async cancelExpiredLoans(): Promise<
    ApiResponse<{ cancelledCount: number; loanIds: string[] }>
  > {
    const result = await this.loanService.cancelExpiredReservations();
    return ApiResponse.success(
      result,
      `Đã quét và hủy ${result.cancelledCount} phiếu mượn PENDING quá hạn thành công`,
    );
  }

  /**
   * POST /loans/:id/cancel - Hủy phiếu đặt mượn sách PENDING
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hủy phiếu đặt mượn sách khi còn ở trạng thái PENDING',
    description:
      'Độc giả (chính chủ) hoặc thủ thư có thể hủy phiếu đặt mượn trước khi hết hạn. Bản sao sách sẽ được hoàn trả lại trạng thái AVAILABLE.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh phiếu mượn (UUID)',
    type: String,
  })
  async cancelReservation(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ApiResponse<LoanDetailResponse>> {
    const token = TokenHelper.extractTokenFromRequest(req);
    const payload = TokenHelper.decodeToken(token);
    const userId = payload.userId || payload.sub;
    const isStaff =
      payload.roles &&
      (payload.roles.includes('ADMIN') || payload.roles.includes('LIBRARIAN'));

    const loan = await this.loanService.cancelReservation(id, isStaff ? undefined : userId);
    return ApiResponse.success(loan, 'Hủy phiếu đặt mượn sách thành công');
  }

  /**
   * PUT /loans/:id - Cập nhật phiếu mượn và danh sách LoanItem
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LOAN_UPDATE')
  @ApiOperation({
    summary: 'Cập nhật phiếu mượn sách',
    description:
      'Cập nhật thông tin phiếu mượn và danh sách các LoanItem của Loan (thay đổi trạng thái từng LoanItem, thêm item mới hoặc xóa bớt item). Không cho phép cập nhật trực tiếp trạng thái (status) của Loan; khi tất cả LoanItem đều có trạng thái RETURNED, trạng thái của Loan sẽ tự động chuyển sang RETURNED.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh phiếu mượn (UUID)',
    type: String,
  })
  async updateLoan(
    @Param('id') id: string,
    @Body() dto: UpdateLoanDto,
  ): Promise<ApiResponse<LoanDetailResponse>> {
    const updatedLoan = await this.loanService.updateLoan(id, dto);
    return ApiResponse.success(updatedLoan, 'Cập nhật phiếu mượn sách thành công');
  }

  /**
   * DELETE /loans/:id - Xóa cứng phiếu mượn cùng loanItem và fine liên quan
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LOAN_DELETE')
  @ApiOperation({
    summary: 'Xóa cứng phiếu mượn',
    description:
      'Xóa cứng phiếu mượn cùng với toàn bộ các loanItem và fine liên quan. Phục hồi trạng thái AVAILABLE cho các bản sao sách đang mượn.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh phiếu mượn (UUID)',
    type: String,
  })
  async deleteLoan(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.loanService.deleteLoan(id);
    return ApiResponse.success(
      null,
      'Xóa phiếu mượn cùng các mục mượn và tiền phạt liên quan thành công',
    );
  }
}

