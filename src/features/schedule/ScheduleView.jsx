import React, { useMemo, useState } from 'react';
import { formatTime } from '../../utils/datetime';
import { fetchCalendarEvents } from '../../services/googleCalendar';

export default function ScheduleView({ projects, tasks, syncedEvents, setSyncedEvents, tokenClient }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSync = () => {
    if (tokenClient) {
      tokenClient.callback = async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setIsLoading(true);
          setError(null);
          try {
            const formattedEvents = await fetchCalendarEvents(tokenResponse.access_token);
            setSyncedEvents(formattedEvents);
          } catch (e) {
            setError('Could not fetch events. Please try again.');
            console.error(e);
          } finally {
            setIsLoading(false);
          }
        }
      };
      tokenClient.requestAccessToken();
    } else {
      setError('Google Auth is not ready. Please wait a moment and try again.');
    }
  };

  const allEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const projectEvents = projects.map((p) => ({
      id: `proj-${p.id}`,
      title: p.name,
      date: p.deadline ? new Date(p.deadline) : null,
      type: 'Project Deadline',
      color: 'bg-purple-500',
    }));

    const taskEvents = tasks
      .filter((t) => !t.completed)
      .map((t) => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        const isOverdue = dueDate && dueDate < today;
        return {
          id: `task-${t.id}`,
          title: t.title,
          date: dueDate,
          type: 'Task Deadline',
          color: isOverdue ? 'bg-red-700' : 'bg-green-500',
          isOverdue,
        };
      });

    return [...projectEvents, ...taskEvents, ...syncedEvents]
      .filter((e) => e.date && !isNaN(e.date))
      .sort((a, b) => a.date - b.date);
  }, [projects, tasks, syncedEvents]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">Schedule</h1>
        <button
          onClick={handleSync}
          disabled={isLoading || !tokenClient}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-semibold transition-colors disabled:bg-red-800 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M3 10h18" />
            </svg>
          )}
          {isLoading ? 'Syncing...' : syncedEvents.length > 0 ? 'Refresh Calendar' : 'Sync with Google Calendar'}
        </button>
      </div>
      {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm">{error}</div>}
      <div className="bg-gray-800/60 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Deadlines & Events</h2>
        <div className="space-y-4">
          {allEvents.length > 0 ? (
            allEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-md">
                <div className="flex flex-col items-center justify-center w-20 text-center">
                  <span className="text-sm text-gray-400">{event.date.toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-2xl font-bold">{event.date.getDate()}</span>
                </div>
                <div className={`w-1.5 h-12 rounded-full ${event.color}`}></div>
                <div>
                  <p className="font-semibold text-gray-200">{event.title}</p>
                  <p className="text-sm text-gray-400">
                    {event.type}
                    {event.isOverdue && <span className="font-semibold text-red-400"> (Overdue)</span>}
                    {event.type === 'Google Calendar' && ` at ${formatTime(event.date)}`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No scheduled events with deadlines.</p>
          )}
        </div>
      </div>
    </div>
  );
}
