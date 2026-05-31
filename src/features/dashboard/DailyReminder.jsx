import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';

export default function DailyReminder({ overdueCount = 0, todayCount = 0 }) {
  const [showReminder, setShowReminder] = useState(true);
  if (!showReminder) return null;

  let message;
  if (overdueCount > 0) {
    message = `You have ${overdueCount} overdue ${overdueCount === 1 ? 'task' : 'tasks'}${
      todayCount > 0 ? ` and ${todayCount} due today` : ''
    }. Tackle the overdue items first to get back on track.`;
  } else if (todayCount > 0) {
    message = `You have ${todayCount} ${todayCount === 1 ? 'task' : 'tasks'} due today. A little planning goes a long way—map out your day!`;
  } else {
    message = "Nothing overdue or due today. Great spot to get ahead on a project or plan your next steps.";
  }

  return (
    <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 flex items-start gap-4">
      <Clock size={24} className="text-blue-300 mt-1 flex-shrink-0" />
      <div className="flex-grow">
        <h3 className="font-semibold text-blue-200">Daily Reminder</h3>
        <p className="text-sm text-blue-300">{message}</p>
      </div>
      <button
        onClick={() => setShowReminder(false)}
        aria-label="Dismiss reminder"
        className="p-1 text-blue-300 hover:text-white"
      >
        <X size={20} />
      </button>
    </div>
  );
}
