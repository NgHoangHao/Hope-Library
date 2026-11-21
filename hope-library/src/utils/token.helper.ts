import type { Request } from 'express';
import { AppException } from '../common/index.js';
import type { JwtPayload } from '../model/user/user.dto.js';

export class TokenHelper {
  /**
   * Helper trích xuất Access Token từ request (Header Authorization: Bearer <token> hoặc cookie accessToken)
   */
  static extractTokenFromRequest(req: Request): string {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    const cookieToken = req.cookies?.['accessToken'] || req.cookies?.['token'];
    if (cookieToken) {
      return cookieToken;
    }
    throw AppException.unauthorized(
      'Không tìm thấy access token. Vui lòng đăng nhập hoặc truyền Bearer token qua header Authorization',
      null,
      'ACCESS_TOKEN_REQUIRED',
    );
  }

  /**
   * Giải mã Access Token thành payload (JwtPayload)
   */
  static decodeToken(token: string): JwtPayload {
    if (!token || !token.trim()) {
      throw AppException.unauthorized(
        'Access token không hợp lệ (rỗng)',
        null,
        'INVALID_ACCESS_TOKEN',
      );
    }
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const parts = cleanToken.split('.');
    if (parts.length < 2) {
      throw AppException.unauthorized(
        'Định dạng access token không hợp lệ',
        null,
        'INVALID_ACCESS_TOKEN_FORMAT',
      );
    }
    try {
      const payloadBase64 = parts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson) as JwtPayload;

      if (payload && (payload as any).exp && Date.now() >= (payload as any).exp * 1000) {
        throw AppException.unauthorized(
          'Access token đã hết hạn. Vui lòng đăng nhập lại',
          null,
          'ACCESS_TOKEN_EXPIRED',
        );
      }

      return payload;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw AppException.unauthorized(
        'Không thể giải mã access token. Vui lòng đăng nhập lại',
        error,
        'INVALID_ACCESS_TOKEN',
      );
    }
  }
}
