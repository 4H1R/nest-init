import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { transformValidationErrors } from 'src/utils';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: transformValidationErrors,
    }),
  );
  app.setGlobalPrefix('/api');
  await app.listen(configService.get('port'));
}
bootstrap();
