import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { TokenHelper } from './token.helper.js';
import { AppException } from '../common/index.js';

describe('TokenHelper', () => {
  it('phải trích xuất được token từ header Authorization: Bearer <token>', () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer my-access-token',
      },
      cookies: {},
    } as unknown as Request;

    const token = TokenHelper.extractTokenFromRequest(mockReq);
    expect(token).toBe('my-access-token');
  });

  it('phải trích xuất được token từ cookie accessToken nếu không có header', () => {
    const mockReq = {
      headers: {},
      cookies: {
        accessToken: 'cookie-access-token',
      },
    } as unknown as Request;

    const token = TokenHelper.extractTokenFromRequest(mockReq);
    expect(token).toBe('cookie-access-token');
  });

  it('phải trích xuất được token từ cookie token nếu không có header và accessToken', () => {
    const mockReq = {
      headers: {},
      cookies: {
        token: 'cookie-raw-token',
      },
    } as unknown as Request;

    const token = TokenHelper.extractTokenFromRequest(mockReq);
    expect(token).toBe('cookie-raw-token');
  });

  it('phải ném lỗi 401 khi không tìm thấy token ở cả header và cookie', () => {
    const mockReq = {
      headers: {},
      cookies: {},
    } as unknown as Request;

    expect(() => TokenHelper.extractTokenFromRequest(mockReq)).toThrow(AppException);
  });
});
