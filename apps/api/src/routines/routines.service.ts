import { Injectable, NotFoundException } from '@nestjs/common';
import { todayKey } from '../common/date.util';
import { FeedItem, Repeat, Urgency } from '../common/types';
import { Routine } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import {
  computeRate,
  computeStreak,
  isScheduledOn,
  last7,
  repeatLabel,
} from './streaks.util';

type RoutineWithCompletions = Routine & { completions: { date: string }[] };

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  private loadAll(): Promise<RoutineWithCompletions[]> {
    return this.prisma.routine.findMany({
      include: { completions: { select: { date: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  private static datesOf(routine: RoutineWithCompletions): Set<string> {
    return new Set(routine.completions.map((c) => c.date));
  }

  /** The Habits screen: every routine plus its streak, rate and week strip. */
  async findAllWithStats(today = todayKey()) {
    const routines = await this.loadAll();
    return routines.map((routine) => {
      const done = RoutinesService.datesOf(routine);
      return {
        // Listed explicitly rather than spread: this is the Habits screen's
        // contract, and the raw completions must not ride along with it.
        id: routine.id,
        title: routine.title,
        dayPart: routine.dayPart,
        urgency: routine.urgency,
        repeat: routine.repeat,
        weekdays: routine.weekdays,
        startDate: routine.startDate,
        endDate: routine.endDate,
        active: routine.active,
        repeatLabel: repeatLabel(routine),
        scheduledToday: isScheduledOn(routine, today),
        completedToday: done.has(today),
        streak: computeStreak(routine, done, today),
        rate: computeRate(routine, done, today),
        last7: last7(routine, done, today),
      };
    });
  }

  /**
   * Routines that fall on `date`, shaped as feed rows. These are synthetic —
   * nothing is written until the row is actually toggled.
   */
  async occurrencesFor(date: string): Promise<FeedItem[]> {
    const routines = await this.loadAll();
    return routines
      .filter((routine) => isScheduledOn(routine, date))
      .map((routine) => {
        const done = RoutinesService.datesOf(routine);
        return {
          id: `routine:${routine.id}:${date}`,
          kind: 'routine' as const,
          routineId: routine.id,
          title: routine.title,
          dayPart: routine.dayPart,
          urgency: routine.urgency,
          completed: done.has(date),
          repeatLabel: repeatLabel(routine),
          streak: computeStreak(routine, done, date),
        };
      });
  }

  async get(id: string) {
    const routine = await this.prisma.routine.findUnique({ where: { id } });
    if (!routine) throw new NotFoundException(`Routine ${id} not found`);
    return routine;
  }

  create(dto: CreateRoutineDto) {
    const repeat = dto.repeat ?? Repeat.DAILY;
    return this.prisma.routine.create({
      data: {
        title: dto.title.trim(),
        dayPart: dto.dayPart ?? null,
        urgency: dto.urgency ?? Urgency.MEDIUM,
        repeat,
        weekdays:
          repeat === Repeat.DAILY
            ? [0, 1, 2, 3, 4, 5, 6]
            : (dto.weekdays ?? [1, 2, 3, 4, 5]),
        startDate: dto.startDate ?? todayKey(),
        endDate: dto.endDate ?? null,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateRoutineDto) {
    const routine = await this.get(id);
    const repeat = dto.repeat ?? routine.repeat;

    return this.prisma.routine.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.dayPart !== undefined && { dayPart: dto.dayPart }),
        ...(dto.urgency !== undefined && { urgency: dto.urgency }),
        ...(dto.repeat !== undefined && { repeat }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.active !== undefined && { active: dto.active }),
        // A routine switched to DAILY covers the whole week regardless of
        // whatever weekday selection it used to carry.
        ...(repeat === Repeat.DAILY
          ? { weekdays: [0, 1, 2, 3, 4, 5, 6] }
          : dto.weekdays !== undefined && { weekdays: dto.weekdays }),
      },
    });
  }

  /** Check/uncheck a routine for one day. */
  async toggle(id: string, date: string) {
    await this.get(id);
    const existing = await this.prisma.completion.findUnique({
      where: { routineId_date: { routineId: id, date } },
    });

    if (existing) {
      await this.prisma.completion.delete({ where: { id: existing.id } });
      return { routineId: id, date, completed: false };
    }

    await this.prisma.completion.create({ data: { routineId: id, date } });
    return { routineId: id, date, completed: true };
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.routine.delete({ where: { id } });
    return { ok: true };
  }
}
