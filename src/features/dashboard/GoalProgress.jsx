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
    <div className="space-y-1.5">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left group">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-purple-300 flex items-center gap-1.5 group-hover:text-purple-200 transition-colors">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="truncate">{goal.name}</span>
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-1">{Math.round(goalProgress)}%</span>
        </div>
        <div className="w-full bg-gray-700/60 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </button>
      {isOpen && (
        <div className="pl-4 border-l-2 border-purple-900/60 space-y-2 pt-1">
          {projects.map((p) => (
            <div
              key={p.id}
              className="cursor-pointer group/proj hover:-translate-y-0.5 transition-transform duration-150"
              onClick={() => onViewChange('project', p.id)}
            >
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-medium text-gray-400 group-hover/proj:text-gray-200 transition-colors truncate">{p.name}</span>
                <span className="text-gray-600 flex-shrink-0 ml-1">{Math.round(p.progress || 0)}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1 rounded-full transition-all duration-700"
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
