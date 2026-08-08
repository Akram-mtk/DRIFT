import {
  computeRate,
  computeStreak,
  isScheduledOn,
  last7,
  repeatLabel,
  Schedule,
} from './streaks.util';

const daily: Schedule = {
  repeat: 'DAILY',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  startDate: '2026-01-01',
  endDate: null,
  active: true,
};

// 2026-08-07 is a Friday.
const mwf: Schedule = {
  ...daily,
  repeat: 'WEEKLY',
  weekdays: [1, 3, 5], // Mon, Wed, Fri
};

const on = (...dates: string[]) => new Set(dates);

describe('isScheduledOn', () => {
  it('covers every day for a daily routine', () => {
    expect(isScheduledOn(daily, '2026-08-07')).toBe(true);
    expect(isScheduledOn(daily, '2026-08-08')).toBe(true);
  });

  it('only matches the chosen weekdays', () => {
    expect(isScheduledOn(mwf, '2026-08-07')).toBe(true); // Friday
    expect(isScheduledOn(mwf, '2026-08-08')).toBe(false); // Saturday
    expect(isScheduledOn(mwf, '2026-08-10')).toBe(true); // Monday
  });

  it('respects startDate, endDate and active', () => {
    expect(isScheduledOn(daily, '2025-12-31')).toBe(false);
    expect(
      isScheduledOn({ ...daily, endDate: '2026-08-01' }, '2026-08-07'),
    ).toBe(false);
    expect(isScheduledOn({ ...daily, active: false }, '2026-08-07')).toBe(
      false,
    );
  });
});

describe('computeStreak', () => {
  it('counts consecutive completed days', () => {
    const done = on('2026-08-05', '2026-08-06', '2026-08-07');
    expect(computeStreak(daily, done, '2026-08-07')).toBe(3);
  });

  it('does not break the streak when today is merely not done yet', () => {
    const done = on('2026-08-04', '2026-08-05', '2026-08-06');
    expect(computeStreak(daily, done, '2026-08-07')).toBe(3);
  });

  it('breaks at the first missed scheduled day', () => {
    const done = on('2026-08-03', '2026-08-04', '2026-08-06', '2026-08-07');
    expect(computeStreak(daily, done, '2026-08-07')).toBe(2);
  });

  it('ignores unscheduled days between weekly occurrences', () => {
    // Fri 07, Wed 05, Mon 03 — the weekend in between is not a miss.
    const done = on('2026-08-07', '2026-08-05', '2026-08-03');
    expect(computeStreak(mwf, done, '2026-08-07')).toBe(3);
  });

  it('is zero when the most recent scheduled day was missed', () => {
    const done = on('2026-08-01');
    expect(computeStreak(daily, done, '2026-08-07')).toBe(0);
  });
});

describe('computeRate', () => {
  it('is a percentage of scheduled days in the window', () => {
    const done = on('2026-08-05', '2026-08-06', '2026-08-07');
    expect(computeRate(daily, done, '2026-08-07', 6)).toBe(50);
  });

  it('counts only scheduled days for weekly routines', () => {
    // Aug 2–7 contains Mon 03, Wed 05, Fri 07 for a MWF routine.
    const done = on('2026-08-03', '2026-08-05', '2026-08-07');
    expect(computeRate(mwf, done, '2026-08-07', 6)).toBe(100);
  });

  it('is zero rather than NaN when nothing is scheduled', () => {
    const future: Schedule = { ...daily, startDate: '2030-01-01' };
    expect(computeRate(future, on(), '2026-08-07', 30)).toBe(0);
  });
});

describe('last7', () => {
  it('returns seven chronological days ending today', () => {
    const strip = last7(daily, on('2026-08-07'), '2026-08-07');
    expect(strip).toHaveLength(7);
    expect(strip[0].date).toBe('2026-08-01');
    expect(strip[6]).toMatchObject({
      date: '2026-08-07',
      done: true,
      isToday: true,
    });
  });

  it('marks unscheduled days so the strip can grey them out', () => {
    const strip = last7(mwf, on(), '2026-08-07');
    expect(strip.find((d) => d.date === '2026-08-08')).toBeUndefined();
    expect(strip.find((d) => d.date === '2026-08-02')!.scheduled).toBe(false);
    expect(strip.find((d) => d.date === '2026-08-03')!.scheduled).toBe(true);
  });
});

describe('repeatLabel', () => {
  it('names the common shapes', () => {
    expect(repeatLabel(daily)).toBe('Daily');
    expect(repeatLabel({ ...mwf, weekdays: [1, 2, 3, 4, 5] })).toBe('Weekdays');
    expect(repeatLabel({ ...mwf, weekdays: [0, 6] })).toBe('Weekends');
    expect(repeatLabel(mwf)).toBe('Mon, Wed, Fri');
  });
});
