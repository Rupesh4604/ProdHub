import React, { useMemo } from 'react';
import TaskItem from '../../components/shared/TaskItem';
import { formatDate, getLocalDateKey } from '../../utils/datetime';
import { CheckCircle2, Percent } from 'lucide-react';

export default function WeeklyReviewView({ tasks, projects, habits, entries }) {
  const lastWeek = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return { start, end };
  }, []);

  const completedTasks = tasks.filter(
    (t) => t.completed && t.completedAt && t.completedAt.toDate() >= lastWeek.start
  );

  const habitConsistency = useMemo(() => {
    if (habits.length === 0) return 0;
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return getLocalDateKey(d);
    });

    let totalPossible = habits.length * 7;
    let totalCompleted = 0;

    last7Days.forEach((dateKey) => {
      habits.forEach((habit) => {
        if (entries.some((e) => e.habitId === habit.id && e.date === dateKey && e.completed)) {
          totalCompleted++;
        }
      });
    });
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  }, [habits, entries]);

  return (
    <div className="space-y-4 md:space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight md:text-4xl">Weekly Review</h1>
        <p className="text-xs text-gray-500 mt-0.5 md:text-base md:text-gray-400 md:mt-0">
          Summary of your activity from {formatDate(lastWeek.start)} to {formatDate(lastWeek.end)}.
        </p>
      </div>

      {/* ── MOBILE / extension layout ── */}
      <div className="md:hidden space-y-4">
        {/* Compact 2-col stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 text-center backdrop-blur-sm">
            <CheckCircle2 size={22} className="text-emerald-400 mx-auto mb-1.5" />
            <p className="text-3xl font-bold text-emerald-400">{completedTasks.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Tasks Done</p>
          </div>
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 text-center backdrop-blur-sm">
            <Percent size={22} className="text-orange-400 mx-auto mb-1.5" />
            <p className="text-3xl font-bold text-orange-400">{habitConsistency}</p>
            <p className="text-xs text-gray-500 mt-0.5">Habit Rate</p>
          </div>
        </div>

        {/* Habit consistency bar */}
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-gray-300">Habit Consistency</p>
            <span className="text-xs text-orange-400 font-medium">{habitConsistency}%</span>
          </div>
          <div className="w-full bg-gray-700/60 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-yellow-400 h-2 rounded-full transition-all duration-700"
              style={{ width: `${habitConsistency}%` }}
            />
          </div>
        </div>

        {/* Completed tasks */}
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Completed This Week</h2>
          {completedTasks.length > 0 ? (
            <div className="space-y-1.5">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} projects={projects} isCompact />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No tasks completed this week. Let's get to it!</p>
          )}
        </div>
      </div>

      {/* ── DESKTOP layout (original) ── */}
      <div className="hidden md:block space-y-6">
        {/* Original large stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/60 p-6 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Tasks Completed</p>
            <p className="text-5xl font-bold text-green-400">{completedTasks.length}</p>
          </div>
          <div className="bg-gray-800/60 p-6 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Habit Consistency</p>
            <p className="text-5xl font-bold text-orange-400">{habitConsistency}%</p>
          </div>
        </div>

        {/* Completed tasks list */}
        <div className="bg-gray-800/60 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Completed Tasks This Week</h2>
          {completedTasks.length > 0 ? (
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} projects={projects} isCompact />
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No tasks completed this week. Let's get to it!</p>
          )}
        </div>
      </div>

    </div>
  );
}
