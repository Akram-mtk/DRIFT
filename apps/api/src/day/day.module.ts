import { Module } from '@nestjs/common';
import { RoutinesModule } from '../routines/routines.module';
import { DayController, ReviewController } from './day.controller';
import { DayService } from './day.service';

@Module({
  imports: [RoutinesModule],
  controllers: [DayController, ReviewController],
  providers: [DayService],
})
export class DayModule {}
