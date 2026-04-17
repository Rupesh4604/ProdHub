import React, { useState } from 'react';
import { Calendar, Edit2, Trash2, Book } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';
import { formatDate } from '../../utils/datetime';
import ConfirmModal from '../modals/ConfirmModal';

export default function TaskItem({ task, projects = [], isCompact = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority || 'Medium');
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const userId = auth?.currentUser?.uid;

  const handleToggleComplete = async () => {
    if (!userId || !db) return;
    await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id), {
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : null,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!userId || !editTitle.trim() || !db) return;
    await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id), {
      title: editTitle,
      priority: editPriority,
      // Store as ISO date string (YYYY-MM-DD) or null to clear
      dueDate: editDueDate || null,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!userId || !db) return;
    await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id));
    setShowDeleteModal(false);
  };

  const projectName = projects.find((p) => p.id === task.projectId)?.name;
  const priorityColor = { High: 'text-red-400', Medium: 'text-amber-400', Low: 'text-emerald-400' };
  const priorityDot = { High: 'bg-red-400', Medium: 'bg-amber-400', Low: 'bg-emerald-400' };

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 text-xs p-2 rounded-xl bg-gray-900/40 border border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-900/60 transition-all duration-150">
        <button onClick={handleToggleComplete} className="flex-shrink-0">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-gray-400'}`}>
            {task.completed && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
        </button>
        <span className={`flex-1 truncate ${task.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>{task.title}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-500">
          {task.priority && <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />}
          {task.dueDate && <span>{formatDate(new Date(task.dueDate))}</span>}
          {projectName && <span className="text-xs bg-gray-700/80 px-1.5 py-0.5 rounded-md text-gray-400 max-w-[60px] truncate">{projectName}</span>}
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete this task: "${task.title}"?`}
      />
      <div className={`p-3 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${task.completed ? 'bg-gray-800/30 border-gray-700/20' : 'bg-gray-800/50 border-gray-700/40 hover:border-gray-600/60'}`}>
        <div className="flex items-start gap-3">
          <button onClick={handleToggleComplete} className="mt-0.5 flex-shrink-0">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500 hover:border-blue-400'}`}>
              {task.completed && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
          <div className="flex-grow min-w-0">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="flex flex-col gap-2">

                {/* ── MOBILE / extension: stacked layout ── */}
                <div className="lg:hidden flex flex-col gap-2">
                  {/* Row 1: Title */}
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task title"
                    className="w-full bg-gray-700/80 border border-gray-600 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    autoFocus
                  />
                  {/* Row 2: Priority + Date */}
                  <div className="flex items-center gap-2">
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="flex-1 bg-gray-700/80 border border-gray-600 rounded-xl px-2 py-1.5 text-xs focus:outline-none"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                    <div className="flex items-center flex-1 gap-1 bg-gray-700/80 border border-gray-600 rounded-xl px-2 py-1.5 text-xs">
                      <Calendar size={11} className="text-gray-400 flex-shrink-0" />
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-gray-300 focus:outline-none [color-scheme:dark]"
                        title="Due date (optional)"
                      />
                      {editDueDate && (
                        <button type="button" onClick={() => setEditDueDate('')} className="flex-shrink-0 text-gray-500 hover:text-red-400 transition-colors" title="Clear date">×</button>
                      )}
                    </div>
                  </div>
                  {/* Row 3: Buttons */}
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold transition-colors">
                      Save
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-xl text-xs font-semibold transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>

                {/* ── DESKTOP (lg+): single inline row ── */}
                <div className="hidden lg:flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task title"
                    className="flex-1 bg-gray-700/80 border border-gray-600 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    autoFocus
                  />
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-28 bg-gray-700/80 border border-gray-600 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <div className="flex items-center gap-1 bg-gray-700/80 border border-gray-600 rounded-xl px-2 py-1.5 text-xs">
                    <Calendar size={11} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-28 bg-transparent text-gray-300 focus:outline-none [color-scheme:dark]"
                      title="Due date (optional)"
                    />
                    {editDueDate && (
                      <button type="button" onClick={() => setEditDueDate('')} className="text-gray-500 hover:text-red-400 transition-colors" title="Clear date">×</button>
                    )}
                  </div>
                  <button type="submit" className="flex-shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold transition-colors">
                    Save
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-shrink-0 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-xl text-xs font-semibold transition-colors">
                    Cancel
                  </button>
                </div>

              </form>
            ) : (
              <p className={`text-sm leading-snug ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</p>
            )}
            <div className="flex items-center flex-wrap gap-2.5 text-xs text-gray-500 mt-1.5">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(new Date(task.dueDate))}
                </div>
              )}
              {task.priority && (
                <div className={`flex items-center gap-1 font-medium ${priorityColor[task.priority]}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
                  {task.priority}
                </div>
              )}
              {projectName && (
                <div className="flex items-center gap-1">
                  <Book size={11} />
                  <span className="truncate max-w-[80px]">{projectName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
