import { formatDate, formatTime, getLocalDateKey, nextDueDate, RECURRENCE_OPTIONS } from './datetime';

describe('getLocalDateKey', () => {
  it('returns a YYYY-MM-DD key for a local date', () => {
    const d = new Date(2026, 0, 15, 10, 30); // 15 Jan 2026, local
    expect(getLocalDateKey(d)).toBe('2026-01-15');
  });

  it('is stable regardless of the time of day', () => {
    const morning = new Date(2026, 5, 1, 0, 1);
    const night = new Date(2026, 5, 1, 23, 59);
    expect(getLocalDateKey(morning)).toBe('2026-06-01');
    expect(getLocalDateKey(night)).toBe('2026-06-01');
  });
});

describe('formatDate', () => {
  it('formats a Date', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('Jan 15, 2026');
  });

  it('returns N/A for falsy input', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('supports Firestore-style { toDate() } values', () => {
    const ts = { toDate: () => new Date(2026, 11, 25) };
    expect(formatDate(ts)).toBe('Dec 25, 2026');
  });
});

describe('formatTime', () => {
  it('labels midnight UTC as All-day', () => {
    expect(formatTime('2026-01-15T00:00:00.000Z')).toBe('All-day');
  });

  it('returns empty string for falsy input', () => {
    expect(formatTime(null)).toBe('');
  });
});

describe('RECURRENCE_OPTIONS', () => {
  it('exposes the expected recurrence values', () => {
    expect(RECURRENCE_OPTIONS.map((o) => o.value)).toEqual(['none', 'daily', 'weekly', 'monthly']);
  });
});

describe('nextDueDate', () => {
  it('advances by one day for daily', () => {
    expect(nextDueDate('2026-01-15', 'daily')).toBe('2026-01-16');
  });

  it('advances by seven days for weekly', () => {
    expect(nextDueDate('2026-01-15', 'weekly')).toBe('2026-01-22');
  });

  it('advances by one month for monthly', () => {
    expect(nextDueDate('2026-01-15', 'monthly')).toBe('2026-02-15');
  });

  it('rolls over month boundaries for daily', () => {
    expect(nextDueDate('2026-01-31', 'daily')).toBe('2026-02-01');
  });

  it('rolls over year boundaries for monthly', () => {
    expect(nextDueDate('2026-12-15', 'monthly')).toBe('2027-01-15');
  });

  it('returns the same date for "none"', () => {
    expect(nextDueDate('2026-01-15', 'none')).toBe('2026-01-15');
  });

  it('falls back to a valid key when there is no due date', () => {
    expect(nextDueDate('', 'daily')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
