import React, { useMemo, useState } from 'react';
import TaskItem from '../../components/shared/TaskItem';
import { ListFilter, ArrowUpDown } from 'lucide-react';

export default function AllTasksView({ tasks, projects }) {
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;
    if (filter === 'Active') filtered = tasks.filter((t) => !t.completed);
    if (filter === 'Completed') filtered = tasks.filter((t) => t.completed);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'dueDate')
        return (a.dueDate ? new Date(a.dueDate) : new Date('2999-12-31')) -
          (b.dueDate ? new Date(b.dueDate) : new Date('2999-12-31'));
      if (sortBy === 'priority') {
        const priorityOrder = { High: 1, Medium: 2, Low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'project') {
        const projectA = projects.find((p) => p.id === a.projectId)?.name || '';
        const projectB = projects.find((p) => p.id === b.projectId)?.name || '';
        return projectA.localeCompare(projectB);
      }
      return 0;
    });
  }, [tasks, projects, filter, sortBy]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white tracking-tight">All Tasks</h1>

      {/* Filter & Sort bar */}
      <div className="flex gap-2 p-3 bg-gray-800/40 border border-gray-700/40 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <ListFilter size={14} className="text-gray-500 flex-shrink-0" />
          <select
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
            className="flex-1 min-w-0 bg-gray-700/80 border border-gray-600/50 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200"
          >
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <ArrowUpDown size={14} className="text-gray-500 flex-shrink-0" />
          <select
            onChange={(e) => setSortBy(e.target.value)}
            value={sortBy}
            className="flex-1 min-w-0 bg-gray-700/80 border border-gray-600/50 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filteredAndSortedTasks.length > 0 ? (
          filteredAndSortedTasks.map((task) => <TaskItem key={task.id} task={task} projects={projects} />)
        ) : (
          <p className="text-gray-500 text-sm text-center py-10">No tasks found.</p>
        )}
      </div>
    </div>
  );
}
