import React, { useMemo, useState } from 'react';
import TaskItem from '../../components/shared/TaskItem';

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
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-white">All Tasks</h1>
      <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-800/60 rounded-lg">
        <div>
          <span className="text-sm font-medium text-gray-400 mr-2">Filter by:</span>
          <select
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-400 mr-2">Sort by:</span>
          <select
            onChange={(e) => setSortBy(e.target.value)}
            value={sortBy}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>
      <div className="space-y-3">
        {filteredAndSortedTasks.length > 0 ? (
          filteredAndSortedTasks.map((task) => <TaskItem key={task.id} task={task} projects={projects} />)
        ) : (
          <p className="text-gray-400 text-center py-8">No tasks found.</p>
        )}
      </div>
    </div>
  );
}
