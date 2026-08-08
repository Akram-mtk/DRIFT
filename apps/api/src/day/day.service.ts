import { Injectable, NotFoundException } from '@nestjs/common';
import { formatDayLabel } from '../common/date.util';
import {
  DAY_PART_SECTIONS,
  DayFeed,
  FeedItem,
  URGENCY_ORDER,
} from '../common/types';
import { Task } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoutinesService } from '../routines/routines.service';

/** Feed row plus the tiebreaker used for ordering, stripped before it ships. */
interface Sortable {
  item: FeedItem;
  createdAt: number;
}

@Injectable()
export class DayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routines: RoutinesService,
  ) {}

  /** Everything the Today screen renders, in one round trip. */
  async getDay(date: string): Promise<DayFeed> {
    const [dated, someday, occurrences, review] = await Promise.all([
      this.prisma.task.findMany({ where: { date, archivedAt: null } }),
      // Undated tasks have no day to be late for, so they simply appear on
      // every day until they are completed. That is the whole rollover rule.
      this.prisma.task.findMany({
        where: { date: null, completedAt: null, archivedAt: null },
      }),
      this.routines.occurrencesFor(date),
      this.reviewFor(date),
    ]);

    const rows: Sortable[] = [
      ...dated.map(toSortable),
      ...someday.map(toSortable),
      ...occurrences.map((item) => ({ item, createdAt: 0 })),
    ];

    const sections = DAY_PART_SECTIONS.map(({ dayPart, label }) => ({
      dayPart,
      label,
      items: rows
        .filter((row) => row.item.dayPart === dayPart)
        .sort(compare)
        .map((row) => row.item),
    }));

    const items = sections.flatMap((section) => section.items);

    return {
      date,
      label: formatDayLabel(date),
      progress: {
        done: items.filter((item) => item.completed).length,
        total: items.length,
      },
      review,
      sections,
    };
  }

  /** Unfinished dated tasks from before `today`, awaiting a move-or-drop call. */
  async reviewFor(today: string): Promise<FeedItem[]> {
    const overdue = await this.prisma.task.findMany({
      where: {
        date: { lt: today, not: null },
        completedAt: null,
        archivedAt: null,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    return overdue.map(toFeedItem);
  }

  async move(taskId: string, toDate: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        date: toDate,
        carryCount: { increment: 1 },
        // Preserve the first date it was ever meant for, so the row can keep
        // saying where it came from no matter how often it is pushed.
        originalDate: task.originalDate ?? task.date,
      },
    });
  }

  async moveAll(today: string, toDate: string) {
    const pending = await this.prisma.task.findMany({
      where: {
        date: { lt: today, not: null },
        completedAt: null,
        archivedAt: null,
      },
      select: { id: true },
    });

    for (const { id } of pending) {
      await this.move(id, toDate);
    }
    return { moved: pending.length, toDate };
  }

  async drop(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { archivedAt: new Date() },
    });
  }
}

function toFeedItem(task: Task): FeedItem {
  return {
    id: task.id,
    kind: 'task',
    taskId: task.id,
    title: task.title,
    dayPart: task.dayPart,
    urgency: task.urgency,
    completed: task.completedAt !== null,
    date: task.date,
    ...(task.carryCount > 0 &&
      task.originalDate && { carriedFrom: task.originalDate }),
  };
}

function toSortable(task: Task): Sortable {
  return { item: toFeedItem(task), createdAt: task.createdAt.getTime() };
}

/** Done sinks to the bottom; above that, most urgent first, then oldest first. */
function compare(a: Sortable, b: Sortable): number {
  if (a.item.completed !== b.item.completed) return a.item.completed ? 1 : -1;
  const urgency = URGENCY_ORDER[a.item.urgency] - URGENCY_ORDER[b.item.urgency];
  if (urgency !== 0) return urgency;
  return a.createdAt - b.createdAt;
}
