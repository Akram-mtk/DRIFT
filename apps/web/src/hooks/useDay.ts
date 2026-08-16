import { useCallback } from 'react';
import { api, toggleItem } from '../api/client';
import type { CreateTaskInput, DayFeed, FeedItem } from '../api/types';
import { useRemote } from './useRemote';

export function useDay(date: string) {
  const remote = useRemote<DayFeed>('day', date, () => api.getDay(date));
  const { data, patch, reload } = remote;

  /** Flip the checkbox straight away, then reconcile with the server. */
  const toggle = useCallback(
    async (item: FeedItem) => {
      if (data) patch(applyToggle(data, item.id));
      try {
        await toggleItem(item, date);
      } finally {
        await reload();
      }
    },
    [data, date, patch, reload],
  );

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      await api.createTask({ date, ...input });
      await reload();
    },
    [date, reload],
  );

  const moveToDay = useCallback(
    async (taskId: string, toDate: string) => {
      await api.moveTask(taskId, toDate);
      await reload();
    },
    [reload],
  );

  const drop = useCallback(
    async (taskId: string) => {
      await api.dropTask(taskId);
      await reload();
    },
    [reload],
  );

  const moveAll = useCallback(
    async (toDate: string) => {
      await api.moveAll(date, toDate);
      await reload();
    },
    [date, reload],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      await api.deleteTask(taskId);
      await reload();
    },
    [reload],
  );

  return { ...remote, toggle, addTask, moveToDay, drop, moveAll, removeTask };
}

/** Pure optimistic update: flip one row and re-count the progress ring. */
function applyToggle(feed: DayFeed, itemId: string): DayFeed {
  const sections = feed.sections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    ),
  }));

  const items = sections.flatMap((section) => section.items);
  return {
    ...feed,
    sections,
    progress: {
      done: items.filter((item) => item.completed).length,
      total: items.length,
    },
  };
}
