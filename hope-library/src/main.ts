
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { getUploadDirectory } from './utils/file-storage.service.js';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Bật CORS cho phép frontend (Next.js) gửi credentials (cookies)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // Cấu hình cookie parser để đọc cookies từ request
  app.use(cookieParser());

  // Phục vụ các file ảnh tĩnh từ thư mục uploads trên cùng ổ đĩa
  const uploadDir = getUploadDirectory();
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('Hope Library API')
    .setDescription(
      'API documentation for Hope Library Management System',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}

await bootstrap();
