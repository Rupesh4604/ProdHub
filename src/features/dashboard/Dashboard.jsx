import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { callGeminiWithRetry } from '../../services/geminiService';
import { GEMINI_API_KEY } from '../../config/env';
import { formatTime, getLocalDateKey } from '../../utils/datetime';
import TaskItem from '../../components/shared/TaskItem';
import GoalProgress from './GoalProgress';
import DailyPlannerModal from '../../components/modals/DailyPlannerModal';

export default function Dashboard({ projects, tasks, goals, onViewChange, syncedEvents }) {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [dailyPlan, setDailyPlan] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningError, setPlanningError] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = getLocalDateKey(new Date());

  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.dueDate)
    .map((t) => ({ ...t, dueDateObj: new Date(t.dueDate) }))
    .filter((t) => t.dueDateObj >= today)
    .sort((a, b) => a.dueDateObj - b.dueDateObj)
    .slice(0, 5);
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < today);

  const { standaloneProjects, goalProjects } = useMemo(() => {
    const standalone = projects.filter((p) => !p.goalId);
    const grouped = projects.reduce((acc, project) => {
      if (project.goalId) {
        (acc[project.goalId] = acc[project.goalId] || []).push(project);
      }
      return acc;
    }, {});
    return { standaloneProjects: standalone, goalProjects: grouped };
  }, [projects]);

  const handlePlanMyDay = async () => {
    setShowPlanModal(true);
    setIsPlanning(true);
    setDailyPlan('');
    setPlanningError('');

    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      setPlanningError('Gemini API key is not configured.');
      setIsPlanning(false);
      return;
    }

    const todaysTasks = tasks.filter((t) => !t.completed && t.dueDate === todayKey);
    const todaysEvents = syncedEvents.filter((e) => getLocalDateKey(e.date) === todayKey);

    let context = `Today is ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}.\n\n`;

    if (overdueTasks.length > 0) {
      context +=
        'Here are the overdue tasks that need urgent attention:\n' +
        overdueTasks.map((t) => `- ${t.title} (Priority: ${t.priority})`).join('\n') +
        '\n\n';
    }

    if (todaysTasks.length > 0) {
      context +=
        'Here are the tasks scheduled for today:\n' +
        todaysTasks.map((t) => `- ${t.title} (Priority: ${t.priority})`).join('\n') +
        '\n\n';
    }

    if (todaysEvents.length > 0) {
      context +=
        'Here are the fixed appointments from the calendar:\n' +
        todaysEvents.map((e) => `- ${e.title} at ${formatTime(e.date)}`).join('\n') +
        '\n\n';
    } else {
      context += 'There are no events synced from the calendar for today. You can add them from the Schedule page for a better plan.\n\n';
    }

    if (overdueTasks.length === 0 && todaysTasks.length === 0 && todaysEvents.length === 0) {
      setDailyPlan(
        'You have a clear schedule today! No overdue tasks, today\'s tasks, or calendar events. It\'s a great day to get ahead on a project or start planning your next steps.'
      );
      setIsPlanning(false);
      return;
    }

    const prompt = `You are a productivity coach. Based on the following information, create a prioritized, motivational, and realistic schedule for the day. Group tasks logically, suggest breaks, and slot tasks around fixed appointments. Start with the most critical items.

${context}

Generate a step-by-step plan.`;

    const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };

    try {
      const result = await callGeminiWithRetry(payload, apiKey);

      if (result.candidates && result.candidates[0].content.parts[0].text) {
        setDailyPlan(result.candidates[0].content.parts[0].text);
      } else {
        throw new Error('Received an invalid response from the AI.');
      }
    } catch (e) {
      console.error('AI Daily Planner Error:', e);
      setPlanningError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <>
      <DailyPlannerModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        plan={dailyPlan}
        isLoading={isPlanning}
        error={planningError}
        retry={handlePlanMyDay}
      />
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <button
            onClick={handlePlanMyDay}
            disabled={isPlanning}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isPlanning ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Sparkles size={15} />
            )}
            Plan My Day
          </button>
        </div>

        {/* Overdue Banner */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-950/60 border border-red-700/50 rounded-2xl p-3.5 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Overdue Tasks ({overdueTasks.length})
            </h2>
            <div className="space-y-1.5">
              {overdueTasks.map((task) => (
                <TaskItem key={task.id} task={task} projects={projects} isCompact={true} />
              ))}
            </div>
          </div>
        )}

        {/* Main grid — stacked on mobile/panel, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming Deadlines */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-gray-200 mb-3">Upcoming Deadlines</h2>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} projects={projects} isCompact={true} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming deadlines. Great job!</p>
            )}
          </div>

          {/* Projects Overview */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-gray-200 mb-3">Projects Overview</h2>
            <div className="space-y-3">
              {goals.map((goal) => (
                <GoalProgress key={goal.id} goal={goal} projects={goalProjects[goal.id] || []} onViewChange={onViewChange} />
              ))}
              {standaloneProjects.map((p) => (
                <div
                  key={p.id}
                  className="cursor-pointer group hover:-translate-y-0.5 transition-transform duration-200"
                  onClick={() => onViewChange('project', p.id)}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{p.name}</span>
                    <span className="text-xs text-gray-500">{Math.round(p.progress || 0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700/60 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${p.progress || 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No projects yet. Add one from the sidebar!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
