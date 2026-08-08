import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { todayKey } from '../common/date.util';
import { Urgency } from '../common/types';
import { CreateTaskDto, ListTasksQueryDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListTasksQueryDto) {
    const where: Prisma.TaskWhereInput = {};

    if (query.date) {
      where.date = query.date;
    } else if (query.from || query.to) {
      where.date = { gte: query.from, lte: query.to };
    }
    if (query.urgency) where.urgency = query.urgency;
    if (!query.includeArchived) where.archivedAt = null;

    return this.prisma.task.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async get(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(dto: CreateTaskDto) {
    const urgency = dto.urgency ?? Urgency.MEDIUM;
    // Someday means "no particular day" — it is the absence of a date that
    // makes these float forward, so it can never carry one.
    const date = urgency === Urgency.SOMEDAY ? null : (dto.date ?? todayKey());

    return this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        dayPart: dto.dayPart ?? null,
        urgency,
        date,
        originalDate: date,
      },
    });
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.get(id);
    const data: Prisma.TaskUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.dayPart !== undefined) data.dayPart = dto.dayPart;
    if (dto.urgency !== undefined) data.urgency = dto.urgency;
    if (dto.date !== undefined) data.date = dto.date;

    // Keep the Someday invariant whichever half of the pair changed.
    const urgency = dto.urgency ?? task.urgency;
    if (urgency === Urgency.SOMEDAY) {
      data.date = null;
    } else if (task.urgency === Urgency.SOMEDAY && dto.date === undefined) {
      // Leaving Someday without naming a day lands the task on today.
      data.date = todayKey();
    }

    if (data.date && !task.originalDate) data.originalDate = data.date;

    return this.prisma.task.update({ where: { id }, data });
  }

  async toggle(id: string) {
    const task = await this.get(id);
    return this.prisma.task.update({
      where: { id },
      data: { completedAt: task.completedAt ? null : new Date() },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.task.delete({ where: { id } });
    return { ok: true };
  }
}
