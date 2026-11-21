import { HttpStatus } from '@nestjs/common';

export class ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  response?: T;
  timestamp: string;

  constructor(statusCode: number = HttpStatus.OK, message = 'Success', response?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.response = response;
    this.timestamp = new Date().toISOString();
  }

  get data(): T | undefined {
    return this.response;
  }

  set data(value: T | undefined) {
    this.response = value;
  }

  static success<T>(
    response?: T,
    message = 'Success',
    statusCode: number = HttpStatus.OK,
  ): ApiResponse<T> {
    return new ApiResponse<T>(statusCode, message, response);
  }

  static created<T>(
    response?: T,
    message = 'Resource created successfully',
  ): ApiResponse<T> {
    return new ApiResponse<T>(HttpStatus.CREATED, message, response);
  }

  static error<T = null>(
    message = 'An error occurred',
    statusCode: number = HttpStatus.BAD_REQUEST,
    response?: T,
  ): ApiResponse<T> {
    return new ApiResponse<T>(statusCode, message, response);
  }
}
