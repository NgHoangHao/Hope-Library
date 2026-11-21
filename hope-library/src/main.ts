
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

function parseAllowedOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000,http://127.0.0.1:3000';

  return raw
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render chạy sau reverse proxy (HTTPS -> HTTP nội bộ)
  // Bật trust proxy để Express nhận diện đúng giao thức HTTPS (cookie secure) và IP thật của client
  app.set('trust proxy', 1);

  // Cho phép NestJS dọn dẹp kết nối DB / Redis gọn gàng khi Render gửi SIGTERM
  app.enableShutdownHooks();

  // Bật CORS linh hoạt theo biến môi trường CORS_ORIGINS / FRONTEND_URL
  const allowedOrigins = parseAllowedOrigins();
  const allowAllOrigins = allowedOrigins.includes('*');

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request không có Origin (health check, server-to-server, Postman/curl)
      if (!origin || allowAllOrigins) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      logger.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Cấu hình cookie parser để đọc cookies từ request
  app.use(cookieParser());

  // Bật Swagger (có thể tắt trên production bằng ENABLE_SWAGGER=false)
  if (process.env.ENABLE_SWAGGER !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('Hope Library API')
      .setDescription(
        'API documentation for Hope Library Management System',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = Number(process.env.PORT) || 3001;
  // Render yêu cầu bind vào 0.0.0.0 để health check & port scanner nhận diện được service
  await app.listen(port, '0.0.0.0');
  logger.log(
    `Hope Library API đang chạy tại http://0.0.0.0:${port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'})`,
  );
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}

await bootstrap();
