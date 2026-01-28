import React, { useMemo } from 'react';
import TaskItem from '../../components/shared/TaskItem';
import { formatDate, getLocalDateKey } from '../../utils/datetime';

export default function WeeklyReviewView({ tasks, projects, habits, entries }) {
  const lastWeek = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return { start, end };
  }, []);

  const completedTasks = tasks.filter((t) => t.completed && t.completedAt && t.completedAt.toDate() >= lastWeek.start);

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
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white">Weekly Review</h1>
      <p className="text-gray-400">Summary of your activity from {formatDate(lastWeek.start)} to {formatDate(lastWeek.end)}.</p>

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
  );
}
