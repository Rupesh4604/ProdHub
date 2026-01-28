const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export const loadGoogleIdentityScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = reject;
    document.body.appendChild(script);
  });

export const createCalendarTokenClient = ({ clientId, onToken, onError }) => {
  if (!window.google?.accounts?.oauth2) return null;
  const client = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: CALENDAR_SCOPE,
    callback: (tokenResponse) => {
      if (tokenResponse?.access_token) {
        onToken(tokenResponse.access_token);
      } else if (onError) {
        onError(new Error('No access token returned'));
      }
    },
  });
  return client;
};

export const fetchCalendarEvents = async (accessToken) => {
  const startTime = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startTime}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error('Failed to fetch calendar events');
  const data = await response.json();
  return data.items
    .filter((item) => !(item.summary && item.summary.toLowerCase().includes('birthday')))
    .map((item) => ({
      id: `gcal-${item.id}`,
      title: item.summary,
      date: item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date),
      type: 'Google Calendar',
      color: 'bg-red-500',
    }));
};
