import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../service/audit-log.service.js';
import { TokenHelper } from '../utils/token.helper.js';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const method = request.method?.toUpperCase();
    const url = request.originalUrl || request.url || '';

    // Chỉ ghi audit log khi người dùng thực hiện các thao tác thay đổi dữ liệu: POST, PUT, DELETE, PATCH (bỏ qua GET, OPTIONS, HEAD...)
    const auditableMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (!method || !auditableMethods.includes(method)) {
      return next.handle();
    }

    // Bỏ qua các endpoint swagger, file tĩnh, health check hoặc chính audit-logs để tránh vòng lặp log
    if (
      url.startsWith('/api-docs') ||
      url.startsWith('/swagger') ||
      url.startsWith('/uploads') ||
      url.startsWith('/audit-logs') ||
      url === '/favicon.ico'
    ) {
      return next.handle();
    }

    const startTime = Date.now();
    const userId = this.extractUserId(request);
    const ipAddress = this.extractIp(request);
    const userAgent = (request.headers['user-agent'] as string) || null;

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          this.auditLogService.logAsync({
            userId,
            action: method,
            targetResource: url,
            ipAddress,
            userAgent,
            details: {
              statusCode: response.statusCode,
              durationMs,
              params: request.params,
              query: request.query,
              body: this.sanitizeBody(request.body),
            },
          });
        },
        error: (err) => {
          const durationMs = Date.now() - startTime;
          this.auditLogService.logAsync({
            userId,
            action: method,
            targetResource: url,
            ipAddress,
            userAgent,
            details: {
              statusCode: err.status || err.statusCode || 500,
              durationMs,
              error: err.message,
              params: request.params,
              query: request.query,
              body: this.sanitizeBody(request.body),
            },
          });
        },
      }),
    );
  }

  private extractUserId(request: Request): string | null {
    try {
      const authHeader = request.headers.authorization;
      let token: string | undefined;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else {
        token = (request as any).cookies?.['accessToken'] || (request as any).cookies?.['token'];
      }

      if (token) {
        const payload = TokenHelper.decodeToken(token);
        return payload.userId || (payload as any).sub || null;
      }
    } catch {
      // Bỏ qua nếu chưa đăng nhập hoặc token không hợp lệ
    }

    return (request as any).user?.id || (request as any).user?.userId || null;
  }

  private extractIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    }
    return request.ip || request.socket?.remoteAddress || null;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveKeys = [
      'password',
      'confirmPassword',
      'confirmpassword',
      'passwordHash',
      'token',
      'refreshToken',
      'secret',
    ];
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '***';
      }
    }
    return sanitized;
  }
}

