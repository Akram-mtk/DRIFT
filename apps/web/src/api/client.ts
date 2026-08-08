import type {
  CreateRoutineInput,
  CreateTaskInput,
  DayFeed,
  FeedItem,
  Routine,
} from './types';

/**
 * All calls are same-origin `/api/...`: Vite proxies to localhost:3000 in dev,
 * Netlify rewrites to the Render service in production. No CORS either way.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body
      ? { 'content-type': 'application/json', ...init.headers }
      : init?.headers,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText} — ${detail}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

const body = (data: unknown) => ({ body: JSON.stringify(data) });

export const api = {
  health: () => request<{ ok: boolean }>('/health'),

  getDay: (date: string) => request<DayFeed>(`/days/${date}`),

  createTask: (input: CreateTaskInput) =>
    request('/tasks', { method: 'POST', ...body(input) }),

  updateTask: (id: string, input: Partial<CreateTaskInput>) =>
    request(`/tasks/${id}`, { method: 'PATCH', ...body(input) }),

  toggleTask: (id: string) => request(`/tasks/${id}/toggle`, { method: 'POST' }),

  deleteTask: (id: string) => request(`/tasks/${id}`, { method: 'DELETE' }),

  getReview: (today: string) => request<FeedItem[]>(`/review?today=${today}`),

  moveTask: (taskId: string, toDate: string) =>
    request(`/review/${taskId}/move`, { method: 'POST', ...body({ toDate }) }),

  dropTask: (taskId: string) =>
    request(`/review/${taskId}/drop`, { method: 'POST' }),

  moveAll: (today: string, toDate: string) =>
    request('/review/move-all', { method: 'POST', ...body({ today, toDate }) }),

  getRoutines: (today: string) => request<Routine[]>(`/routines?today=${today}`),

  createRoutine: (input: CreateRoutineInput) =>
    request('/routines', { method: 'POST', ...body(input) }),

  toggleRoutine: (id: string, date: string) =>
    request(`/routines/${id}/toggle?date=${date}`, { method: 'POST' }),

  deleteRoutine: (id: string) =>
    request(`/routines/${id}`, { method: 'DELETE' }),
};

/** Toggle whichever kind of thing a feed row represents. */
export function toggleItem(item: FeedItem, date: string) {
  return item.kind === 'routine'
    ? api.toggleRoutine(item.routineId!, date)
    : api.toggleTask(item.taskId ?? item.id);
}
