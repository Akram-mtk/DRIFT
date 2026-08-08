// Loads apps/api/.env locally; on Render the variables are already in the
// environment and this is a no-op.
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Render routes traffic to 0.0.0.0; binding to the Node default would fail
  // the health check and mark the deploy unhealthy.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
