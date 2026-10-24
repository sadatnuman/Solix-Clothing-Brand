import type { ServerResponse } from 'http';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { DatabaseFilter } from './common/database.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseFilter());
  mkdirSync(join(process.cwd(), 'uploads'), { recursive: true });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res: ServerResponse) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
