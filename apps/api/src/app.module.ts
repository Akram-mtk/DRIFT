import { Module } from '@nestjs/common';
import { DayModule } from './day/day.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RoutinesModule } from './routines/routines.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [PrismaModule, TasksModule, RoutinesModule, DayModule],
  controllers: [HealthController],
})
export class AppModule {}
