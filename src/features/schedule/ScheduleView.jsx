import React, { useMemo, useState } from 'react';
import { formatTime } from '../../utils/datetime';
import { fetchCalendarEvents } from '../../services/googleCalendar';
import { RefreshCw, CalendarDays } from 'lucide-react';

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
      dotColor: 'bg-purple-400',
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
          color: isOverdue ? 'bg-red-700' : 'bg-emerald-500',
          dotColor: isOverdue ? 'bg-red-400' : 'bg-emerald-400',
          isOverdue,
        };
      });

    return [...projectEvents, ...taskEvents, ...syncedEvents]
      .filter((e) => e.date && !isNaN(e.date))
      .sort((a, b) => a.date - b.date);
  }, [projects, tasks, syncedEvents]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Schedule</h1>
        <button
          onClick={handleSync}
          disabled={isLoading || !tokenClient}
          className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
          ) : (
            <RefreshCw size={13} />
          )}
          {isLoading ? 'Syncing…' : syncedEvents.length > 0 ? 'Refresh' : 'Sync Calendar'}
        </button>
      </div>

      {error && (
        <div className="text-red-300 bg-red-950/60 border border-red-700/50 p-3 rounded-2xl text-xs">{error}</div>
      )}

      {/* Events list */}
      <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
          <CalendarDays size={15} className="text-gray-500" />
          Upcoming Deadlines & Events
        </h2>
        <div className="space-y-2">
          {allEvents.length > 0 ? (
            allEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2.5 bg-gray-900/40 border border-gray-700/30 rounded-xl hover:border-gray-600/50 transition-all duration-150 group">
                {/* Date block */}
                <div className="flex flex-col items-center justify-center w-11 flex-shrink-0 text-center">
                  <span className="text-xs text-gray-500 leading-none">{event.date.toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-xl font-bold leading-tight text-white">{event.date.getDate()}</span>
                </div>
                {/* Color bar */}
                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${event.color}`} />
                {/* Info */}
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    {event.type}
                    {event.isOverdue && <span className="font-semibold text-red-400"> · Overdue</span>}
                    {event.type === 'Google Calendar' && ` · ${formatTime(event.date)}`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-6">No scheduled events with deadlines.</p>
          )}
        </div>
      </div>
    </div>
  );
}
