import React, { useMemo, useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { ListFilter, ArrowUpDown, CheckSquare, Check, RotateCcw, Trash2, X } from 'lucide-react';
import TaskItem from '../../components/shared/TaskItem';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';

export default function AllTasksView({ tasks, projects }) {
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const userId = auth?.currentUser?.uid;

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;
    if (filter === 'Active') filtered = tasks.filter((t) => !t.completed);
    if (filter === 'Completed') filtered = tasks.filter((t) => t.completed);
    return [...filtered].sort((a, b) => {
      // Always keep completed tasks below incomplete ones.
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
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

  const visibleIds = filteredAndSortedTasks.map((t) => t.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const selectedCount = selectedIds.size;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (visibleIds.every((id) => prev.has(id))) return new Set();
      return new Set(visibleIds);
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const taskRef = (id) => doc(db, `artifacts/${appId}/users/${userId}/tasks`, id);

  const bulkSetCompleted = async (completed) => {
    if (!userId || !db || selectedCount === 0) return;
    const batch = writeBatch(db);
    selectedIds.forEach((id) => {
      batch.update(taskRef(id), { completed, completedAt: completed ? new Date() : null });
    });
    try {
      await batch.commit();
      exitSelectMode();
    } catch (e) {
      console.error('Bulk update failed:', e);
    }
  };

  const bulkDelete = async () => {
    setShowDeleteModal(false);
    if (!userId || !db || selectedCount === 0) return;
    const batch = writeBatch(db);
    selectedIds.forEach((id) => batch.delete(taskRef(id)));
    try {
      await batch.commit();
      exitSelectMode();
    } catch (e) {
      console.error('Bulk delete failed:', e);
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={bulkDelete}
        title="Delete Tasks"
        message={`Delete ${selectedCount} selected ${selectedCount === 1 ? 'task' : 'tasks'}? This cannot be undone.`}
      />

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">All Tasks</h1>
        <button
          onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            selectMode
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:border-gray-600'
          }`}
        >
          {selectMode ? <X size={14} /> : <CheckSquare size={14} />}
          {selectMode ? 'Cancel' : 'Select'}
        </button>
      </div>

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

      {/* Bulk action bar */}
      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-950/40 border border-blue-800/40 rounded-2xl backdrop-blur-sm">
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none mr-1">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded accent-blue-500"
            />
            {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
          </label>
          <div className="flex-grow" />
          <button
            onClick={() => bulkSetCompleted(true)}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={14} /> Complete
          </button>
          <button
            onClick={() => bulkSetCompleted(false)}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={14} /> Reopen
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      <div className="space-y-2">
        {filteredAndSortedTasks.length > 0 ? (
          filteredAndSortedTasks.map((task) =>
            selectMode ? (
              <label
                key={task.id}
                className="flex items-center gap-2.5 cursor-pointer rounded-2xl"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(task.id)}
                  onChange={() => toggleSelect(task.id)}
                  className="w-4 h-4 flex-shrink-0 rounded accent-blue-500"
                />
                <div className="flex-grow min-w-0 pointer-events-none">
                  <TaskItem task={task} projects={projects} />
                </div>
              </label>
            ) : (
              <TaskItem key={task.id} task={task} projects={projects} />
            )
          )
        ) : (
          <p className="text-gray-500 text-sm text-center py-10">No tasks found.</p>
        )}
      </div>
    </div>
  );
}
