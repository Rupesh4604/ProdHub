import React, { useMemo, useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { CheckSquare, Check, RotateCcw, Search, Trash2, X } from 'lucide-react';
import TaskItem from '../../components/shared/TaskItem';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';

const STATUS_OPTIONS = ['All', 'Active', 'Completed'];
const PRIORITY_RANK = { High: 1, Medium: 2, Low: 3 };
const NO_PROJECT = '__none__';

const dueTime = (t) => {
  const ts = t.dueDate ? Date.parse(t.dueDate) : NaN;
  return Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY;
};

/** A compact labelled select that matches the dark toolbar. */
function ToolbarSelect({ label, value, onChange, children }) {
  return (
    <label className="flex items-center gap-2 h-9 pl-3 pr-1 rounded-xl bg-gray-800/80 border border-gray-700/60 text-sm focus-within:ring-2 focus-within:ring-blue-500/50">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-gray-200 pr-1 py-1 focus:outline-none cursor-pointer max-w-[11rem] truncate"
      >
        {children}
      </select>
    </label>
  );
}

export default function AllTasksView({ tasks, projects }) {
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const userId = auth?.currentUser?.uid;

  const projectNames = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const hasUnassigned = useMemo(() => tasks.some((t) => !projectNames.has(t.projectId)), [tasks, projectNames]);

  // Tasks matching search / project / priority, before the status filter, so
  // the status counts reflect the other filters.
  const scopedTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !(t.title || '').toLowerCase().includes(q)) return false;
      if (projectFilter === NO_PROJECT && projectNames.has(t.projectId)) return false;
      if (projectFilter !== 'all' && projectFilter !== NO_PROJECT && t.projectId !== projectFilter) return false;
      if (priorityFilter !== 'all' && (t.priority || 'Medium') !== priorityFilter) return false;
      return true;
    });
  }, [tasks, search, projectFilter, priorityFilter, projectNames]);

  const statusCounts = useMemo(() => {
    const completed = scopedTasks.filter((t) => t.completed).length;
    return { All: scopedTasks.length, Active: scopedTasks.length - completed, Completed: completed };
  }, [scopedTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = scopedTasks;
    if (filter === 'Active') filtered = scopedTasks.filter((t) => !t.completed);
    if (filter === 'Completed') filtered = scopedTasks.filter((t) => t.completed);
    const rank = (t) => PRIORITY_RANK[t.priority] ?? PRIORITY_RANK.Medium;
    return [...filtered].sort((a, b) => {
      // Always keep completed tasks below incomplete ones.
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      let cmp = 0;
      if (sortBy === 'priority') cmp = rank(a) - rank(b);
      if (sortBy === 'project') {
        cmp = (projectNames.get(a.projectId) || '').localeCompare(projectNames.get(b.projectId) || '');
      }
      // Due date is the primary sort, and the tie-breaker for the others.
      return cmp || dueTime(a) - dueTime(b);
    });
  }, [scopedTasks, projectNames, filter, sortBy]);

  const filtersActive =
    search.trim() !== '' || projectFilter !== 'all' || priorityFilter !== 'all' || filter !== 'All';
  const clearFilters = () => {
    setSearch('');
    setProjectFilter('all');
    setPriorityFilter('all');
    setFilter('All');
  };

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

      {/* Toolbar: search, status, project, priority, sort */}
      <div className="flex flex-col gap-3 p-3 bg-gray-800/40 border border-gray-700/40 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-gray-800/80 border border-gray-700/60 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div
            role="group"
            aria-label="Task status"
            className="flex h-9 p-0.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm flex-shrink-0"
          >
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 rounded-lg font-medium transition-colors ${
                  filter === option ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {option}
                <span className={`text-xs tabular-nums ${filter === option ? 'text-gray-300' : 'text-gray-500'}`}>
                  {statusCounts[option]}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarSelect label="Project" value={projectFilter} onChange={setProjectFilter}>
            <option value="all" className="bg-gray-800">All</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-gray-800">{p.name}</option>
            ))}
            {hasUnassigned && <option value={NO_PROJECT} className="bg-gray-800">No project</option>}
          </ToolbarSelect>
          <ToolbarSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter}>
            <option value="all" className="bg-gray-800">All</option>
            <option value="High" className="bg-gray-800">High</option>
            <option value="Medium" className="bg-gray-800">Medium</option>
            <option value="Low" className="bg-gray-800">Low</option>
          </ToolbarSelect>
          <ToolbarSelect label="Sort" value={sortBy} onChange={setSortBy}>
            <option value="dueDate" className="bg-gray-800">Due date</option>
            <option value="priority" className="bg-gray-800">Priority</option>
            <option value="project" className="bg-gray-800">Project</option>
          </ToolbarSelect>
          <div className="flex-grow" />
          <span className="text-xs text-gray-500 tabular-nums">
            {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? 'task' : 'tasks'}
          </span>
          {filtersActive && (
            <button onClick={clearFilters} className="text-xs font-medium text-blue-400 hover:text-blue-300">
              Clear filters
            </button>
          )}
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
              <label key={task.id} className="flex items-center gap-2.5 cursor-pointer rounded-2xl">
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
          <div className="text-center py-10 space-y-2">
            <p className="text-gray-500 text-sm">{filtersActive ? 'No tasks match these filters.' : 'No tasks yet.'}</p>
            {filtersActive && (
              <button onClick={clearFilters} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
