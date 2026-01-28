import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function GoalProgress({ goal, projects, onViewChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const goalProgress = useMemo(() => {
    if (!projects || projects.length === 0) return 0;
    const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
    return totalProgress / projects.length;
  }, [projects]);

  return (
    <div className="space-y-2">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-purple-300 flex items-center gap-2">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {goal.name}
          </span>
          <span className="text-sm text-gray-400">{Math.round(goalProgress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${goalProgress}%` }}></div>
        </div>
      </button>
      {isOpen && (
        <div className="pl-6 space-y-3 pt-2">
          {projects.map((p) => (
            <div key={p.id} className="cursor-pointer" onClick={() => onViewChange('project', p.id)}>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-medium text-gray-300">{p.name}</span>
                <span className="text-xs text-gray-400">{Math.round(p.progress || 0)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${p.progress || 0}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
