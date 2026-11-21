import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppExceptionOptions {
  cause?: unknown;
  errorCode?: string;
  details?: unknown;
}

export class AppException extends HttpException {
  public readonly errorCode?: string;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    options?: AppExceptionOptions,
  ) {
    super(
      {
        statusCode,
        message,
        errorCode: options?.errorCode,
        details: options?.details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
      {
        cause: options?.cause,
      },
    );

    this.errorCode = options?.errorCode;
    this.details = options?.details;
    this.timestamp = new Date().toISOString();
  }

  static badRequest(message = 'Bad Request', details?: unknown, errorCode?: string): AppException {
    return new AppException(message, HttpStatus.BAD_REQUEST, { details, errorCode });
  }

  static unauthorized(message = 'Unauthorized', details?: unknown, errorCode?: string): AppException {
    return new AppException(message, HttpStatus.UNAUTHORIZED, { details, errorCode });
  }

  static forbidden(message = 'Forbidden', details?: unknown, errorCode?: string): AppException {
    return new AppException(message, HttpStatus.FORBIDDEN, { details, errorCode });
  }

  static notFound(message = 'Not Found', details?: unknown, errorCode?: string): AppException {
    return new AppException(message, HttpStatus.NOT_FOUND, { details, errorCode });
  }

  static conflict(message = 'Conflict', details?: unknown, errorCode?: string): AppException {
    return new AppException(message, HttpStatus.CONFLICT, { details, errorCode });
  }

  static internal(message = 'Internal Server Error', details?: unknown, errorCode?: string): AppException {
    return new AppException(message, HttpStatus.INTERNAL_SERVER_ERROR, { details, errorCode });
  }
}
