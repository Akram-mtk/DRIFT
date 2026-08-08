import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { isDayKey, todayKey } from '../common/date.util';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { RoutinesService } from './routines.service';

@Controller('routines')
export class RoutinesController {
  constructor(private readonly routines: RoutinesService) {}

  /** `today` is the client's day key; falls back to today in Algeria. */
  @Get()
  list(@Query('today') today?: string) {
    return this.routines.findAllWithStats(resolveDay(today));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.routines.get(id);
  }

  @Post()
  create(@Body() dto: CreateRoutineDto) {
    return this.routines.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoutineDto) {
    return this.routines.update(id, dto);
  }

  @Post(':id/toggle')
  toggle(@Param('id') id: string, @Query('date') date?: string) {
    return this.routines.toggle(id, resolveDay(date));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routines.remove(id);
  }
}

function resolveDay(value?: string): string {
  if (value === undefined) return todayKey();
  if (!isDayKey(value)) {
    throw new BadRequestException('date must be YYYY-MM-DD');
  }
  return value;
}
