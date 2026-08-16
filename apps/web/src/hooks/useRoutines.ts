import { useCallback } from 'react';
import { api } from '../api/client';
import type { CreateRoutineInput, Routine } from '../api/types';
import { useRemote } from './useRemote';

export function useRoutines(today: string) {
  const remote = useRemote<Routine[]>('routines', today, () =>
    api.getRoutines(today),
  );
  const { reload } = remote;

  const toggleOn = useCallback(
    async (id: string, date: string) => {
      await api.toggleRoutine(id, date);
      await reload();
    },
    [reload],
  );

  const add = useCallback(
    async (input: CreateRoutineInput) => {
      await api.createRoutine(input);
      await reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.deleteRoutine(id);
      await reload();
    },
    [reload],
  );

  return { ...remote, toggleOn, add, remove };
}
