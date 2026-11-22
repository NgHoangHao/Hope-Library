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
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookService } from '../service/book.service.js';
import {
  CreateBookDto,
  UpdateBookDto,
  BookDetailResponse,
  BookResponse,
  QueryBookDto,
  PaginatedBookResponse,
} from '../model/book/book.dto.js';
import { ApiResponse, AppException } from '../common/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

interface BookUploadFiles {
  image?: Express.Multer.File[];
  pdf?: Express.Multer.File[];
}

@ApiTags('Books')
@ApiBearerAuth()
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  /**
   * POST /books - Thêm sách mới kèm upload file ảnh bìa, file PDF nội dung sách và danh sách bản sao (multipart/form-data)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('BOOK_CREATE')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Thêm mới sách',
    description:
      'Thêm sách với thông tin chi tiết, upload 1 file ảnh bìa (png, jpg, webp), 1 file PDF nội dung sách (pdf) và danh sách bản sao (copies).',
  })
  @ApiBody({
    type: CreateBookDto,
  })
  async createBook(
    @Body() body: Record<string, any>,
    @UploadedFiles() files?: BookUploadFiles,
  ): Promise<ApiResponse<BookDetailResponse>> {
    const imageFile = files?.image?.[0];
    const pdfFile = files?.pdf?.[0];

    const createBookDto: CreateBookDto = {
      title: body.title,
      isbn: body.isbn,
      authorId: body.authorId,
      categoryId: body.categoryId,
      publisher: body.publisher,
      publicationYear: body.publicationYear !== undefined ? Number(body.publicationYear) : undefined,
      edition: body.edition,
      description: body.description,
      image: imageFile,
      pdf: pdfFile,
    };

    // Parse copies nếu được gửi dưới dạng JSON string trong multipart/form-data
    if (body.copies) {
      if (typeof body.copies === 'string') {
        try {
          createBookDto.copies = JSON.parse(body.copies);
        } catch {
          throw AppException.badRequest(
            'Dữ liệu danh sách bản sao (copies) phải là chuỗi JSON hợp lệ',
            { received: body.copies },
            'INVALID_COPIES_JSON_FORMAT',
          );
        }
      } else if (Array.isArray(body.copies)) {
        createBookDto.copies = body.copies;
      }
    }

    const createdBook = await this.bookService.createBook(createBookDto, imageFile, pdfFile);
    return ApiResponse.created(createdBook, 'Thêm mới sách thành công');
  }

  /**
   * GET /books - Lấy danh sách sách có phân trang, tìm kiếm và lọc
   */
  @Get()
  @RequirePermissions('BOOK_READ')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả sách có phân trang, tìm kiếm và lọc',
    description:
      'Hỗ trợ phân trang (page bắt đầu từ 1, size), tìm kiếm theo tên sách (search), và lọc theo categoryId hoặc author (hỗ trợ lọc cả 2 điều kiện).',
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
    description: 'Số lượng sách mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên sách (title)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Lọc theo ID thể loại (UUID)',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    type: String,
    description: 'Lọc theo tác giả (UUID của tác giả hoặc tên tác giả)',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: String,
    description: 'Lọc theo ID tác giả (UUID)',
  })
  async getAllBooks(
    @Query() query: QueryBookDto,
  ): Promise<ApiResponse<PaginatedBookResponse>> {
    const books = await this.bookService.getAllBooks(query);
    return ApiResponse.success(books, 'Lấy danh sách sách thành công');
  }

  /**
   * GET /books/top-returned - Lấy top sách có số lượng mượn trả (RETURNED) nhiều nhất
   */
  @Get('top-returned')
  @RequirePermissions('BOOK_READ')
  @ApiOperation({
    summary: 'Lấy top sách có số lượng mượn trả (RETURNED) nhiều nhất',
    description:
      'Lấy danh sách các cuốn sách (mặc định top 4) có số lượng loanItem ở trạng thái RETURNED nhiều nhất.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng sách cần lấy (mặc định 4)',
    example: 4,
  })
  async getTopReturnedBooks(
    @Query('limit') limit?: number,
  ): Promise<ApiResponse<BookResponse[]>> {
    const books = await this.bookService.getTopReturnedBooks(limit ? Number(limit) : 4);
    return ApiResponse.success(books, 'Lấy danh sách top sách mượn trả nhiều nhất thành công');
  }

  /**
   * GET /books/:id/pdf - Xem trực tiếp file PDF nội dung sách theo ID
   */
  @Get(':id/pdf')
  @RequirePermissions('BOOK_READ')
  @ApiProduces('application/pdf')
  @ApiOperation({
    summary: 'Xem file PDF nội dung sách theo ID',
    description:
      'Trả về nội dung file PDF (Content-Disposition: inline) để người dùng xem trực tiếp trên trình duyệt.',
  })
  async viewBookPdf(@Param('id') id: string): Promise<StreamableFile> {
    const { buffer, fileName } = await this.bookService.getBookPdf(id);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });
  }

  /**
   * GET /books/:id - Lấy thông tin chi tiết sách theo ID (bao gồm pdfUrl để xem nội dung PDF)
   */
  @Get(':id')
  @RequirePermissions('BOOK_READ')
  @ApiOperation({
    summary: 'Lấy chi tiết sách theo ID',
    description: 'Trả về thông tin chi tiết sách bao gồm ảnh bìa (bookUrl), file PDF nội dung (pdfUrl) và danh sách bản sao.',
  })
  async getBookById(@Param('id') id: string): Promise<ApiResponse<BookDetailResponse>> {
    const book = await this.bookService.getBookById(id);
    return ApiResponse.success(book, 'Lấy thông tin sách thành công');
  }

  /**
   * PUT /books/:id - Cập nhật sách cùng danh sách bản sao (copies), nếu file ảnh/PDF nhận vào null thì không thay đổi
   */
  @Put(':id')
  @RequirePermissions('BOOK_UPDATE')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Cập nhật sách',
    description:
      'Cập nhật thông tin sách cùng danh sách bản sao (copies: hỗ trợ cập nhật barcode, shelfLocation/location, status). Nếu file ảnh hoặc file PDF nhận vào null hoặc không gửi thì không thay đổi file tương ứng.',
  })
  @ApiBody({
    type: UpdateBookDto,
  })
  async updateBook(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @UploadedFiles() files?: BookUploadFiles,
  ): Promise<ApiResponse<BookDetailResponse>> {
    const imageFile = files?.image?.[0];
    const pdfFile = files?.pdf?.[0];
    const updateBookDto: UpdateBookDto = {};

    if (body.title !== undefined) updateBookDto.title = body.title;
    if (body.isbn !== undefined) updateBookDto.isbn = body.isbn;
    if (body.authorId !== undefined) updateBookDto.authorId = body.authorId;
    if (body.categoryId !== undefined) updateBookDto.categoryId = body.categoryId;
    if (body.publisher !== undefined) updateBookDto.publisher = body.publisher;
    if (
      body.publicationYear !== undefined &&
      body.publicationYear !== null &&
      body.publicationYear !== ''
    ) {
      updateBookDto.publicationYear = Number(body.publicationYear);
    }
    if (body.edition !== undefined) updateBookDto.edition = body.edition;
    if (body.description !== undefined) updateBookDto.description = body.description;
    if (body.status !== undefined) updateBookDto.status = body.status;
    updateBookDto.image = imageFile;
    updateBookDto.pdf = pdfFile;

    // Parse copies nếu được gửi dưới dạng JSON string trong multipart/form-data
    if (body.copies !== undefined && body.copies !== null) {
      if (typeof body.copies === 'string') {
        if (body.copies.trim() !== '') {
          try {
            const parsedCopies = JSON.parse(body.copies);
            if (!Array.isArray(parsedCopies)) {
              throw AppException.badRequest(
                'Dữ liệu danh sách bản sao (copies) phải là mảng JSON hợp lệ',
                { received: body.copies },
                'INVALID_COPIES_JSON_FORMAT',
              );
            }
            updateBookDto.copies = parsedCopies;
          } catch (error) {
            if (error instanceof AppException) {
              throw error;
            }
            throw AppException.badRequest(
              'Dữ liệu danh sách bản sao (copies) phải là chuỗi JSON hợp lệ',
              { received: body.copies },
              'INVALID_COPIES_JSON_FORMAT',
            );
          }
        }
      } else if (Array.isArray(body.copies)) {
        updateBookDto.copies = body.copies;
      } else {
        throw AppException.badRequest(
          'Dữ liệu danh sách bản sao (copies) phải là mảng hợp lệ',
          { received: body.copies },
          'INVALID_COPIES_FORMAT',
        );
      }
    }

    const updatedBook = await this.bookService.updateBook(id, updateBookDto, imageFile, pdfFile);
    return ApiResponse.success(updatedBook, 'Cập nhật thông tin sách thành công');
  }

  /**
   * DELETE /books/:id - Xóa sách và toàn bộ các đối tượng liên quan (bản sao sách, lịch sử mượn, file ảnh)
   */
  @Delete(':id')
  @RequirePermissions('BOOK_DELETE')
  @ApiOperation({
    summary: 'Xóa sách',
    description:
      'Xóa sách cùng toàn bộ đối tượng liên quan (bản sao sách, lịch sử mượn đã hoàn tất, file ảnh bìa). Nếu sách có bản sao đang được mượn thì trả về ngoại lệ.',
  })
  async deleteBook(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.bookService.deleteBook(id);
    return ApiResponse.success(null, 'Xóa sách thành công');
  }
}
