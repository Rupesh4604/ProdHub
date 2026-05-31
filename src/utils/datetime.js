export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = date instanceof Date ? date : date.toDate?.() ?? new Date(date);
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return 'All-day';
  }
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
};

export const getLocalDateKey = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

/**
 * Given a due date ('YYYY-MM-DD' or empty) and a recurrence, return the next
 * occurrence's date key. Falls back to today when there's no due date so a
 * recurring task without a date still advances sensibly.
 */
export const nextDueDate = (dueDate, recurrence) => {
  const base = dueDate ? new Date(`${dueDate}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return dueDate || '';
  switch (recurrence) {
    case 'daily':
      base.setDate(base.getDate() + 1);
      break;
    case 'weekly':
      base.setDate(base.getDate() + 7);
      break;
    case 'monthly':
      base.setMonth(base.getMonth() + 1);
      break;
    default:
      return dueDate || '';
  }
  return getLocalDateKey(base);
};
