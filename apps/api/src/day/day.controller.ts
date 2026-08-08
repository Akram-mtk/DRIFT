import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { IsOptional, Matches } from 'class-validator';
import { DAY_KEY_PATTERN, isDayKey, todayKey } from '../common/date.util';
import { DayService } from './day.service';

class MoveDto {
  /** Where to move to. Defaults to `today`. */
  @IsOptional()
  @Matches(DAY_KEY_PATTERN, { message: 'toDate must be YYYY-MM-DD' })
  toDate?: string;

  /** The browser's idea of today, used to pick the pending set for move-all. */
  @IsOptional()
  @Matches(DAY_KEY_PATTERN, { message: 'today must be YYYY-MM-DD' })
  today?: string;
}

@Controller('days')
export class DayController {
  constructor(private readonly day: DayService) {}

  @Get(':date')
  get(@Param('date') date: string) {
    return this.day.getDay(requireDay(date));
  }
}

@Controller('review')
export class ReviewController {
  constructor(private readonly day: DayService) {}

  @Get()
  list(@Query('today') today?: string) {
    return this.day.reviewFor(resolveDay(today));
  }

  @Post('move-all')
  moveAll(@Body() dto: MoveDto) {
    const today = resolveDay(dto.today);
    return this.day.moveAll(today, dto.toDate ?? today);
  }

  @Post(':taskId/move')
  move(@Param('taskId') taskId: string, @Body() dto: MoveDto) {
    return this.day.move(taskId, dto.toDate ?? resolveDay(dto.today));
  }

  @Post(':taskId/drop')
  drop(@Param('taskId') taskId: string) {
    return this.day.drop(taskId);
  }
}

function requireDay(value: string): string {
  if (!isDayKey(value)) {
    throw new BadRequestException('date must be YYYY-MM-DD');
  }
  return value;
}

function resolveDay(value?: string): string {
  return value === undefined ? todayKey() : requireDay(value);
}
