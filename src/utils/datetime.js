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
