import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';

export default function DailyReminder() {
  const [showReminder, setShowReminder] = useState(true);
  if (!showReminder) return null;
  return (
    <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 flex items-start gap-4">
      <Clock size={24} className="text-blue-300 mt-1 flex-shrink-0" />
      <div className="flex-grow">
        <h3 className="font-semibold text-blue-200">Daily Reminder</h3>
        <p className="text-sm text-blue-300">Don't forget to review your goals for the day and plan your tasks. A little planning goes a long way!</p>
      </div>
      <button onClick={() => setShowReminder(false)} className="p-1 text-blue-300 hover:text-white">
        <X size={20} />
      </button>
    </div>
  );
}
