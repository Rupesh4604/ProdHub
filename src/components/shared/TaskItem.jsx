import React, { useState } from 'react';
import { Book, Calendar, CheckSquare, Edit2, Save, Tag, Trash2 } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';
import { formatDate } from '../../utils/datetime';
import ConfirmModal from '../modals/ConfirmModal';

export default function TaskItem({ task, projects = [], isCompact = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority || 'Medium');
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
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!userId || !db) return;
    await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id));
    setShowDeleteModal(false);
  };

  const projectName = projects.find((p) => p.id === task.projectId)?.name;
  const priorityColor = { High: 'text-red-400', Medium: 'text-yellow-400', Low: 'text-green-400' };

  if (isCompact) {
    return (
      <div className="flex items-center justify-between text-sm p-2 rounded-md bg-gray-900/30 hover:bg-gray-900/50">
        <span className={`truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
        <div className="flex items-center gap-2 text-gray-400">
          {task.dueDate && <span>{formatDate(new Date(task.dueDate))}</span>}
          {projectName && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{projectName}</span>}
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
      <div className={`p-3 rounded-md transition-colors flex items-start gap-3 ${task.completed ? 'bg-gray-800/50' : 'bg-gray-900/50'}`}>
        <button onClick={handleToggleComplete} className="mt-1">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
            {task.completed && <CheckSquare size={16} className="text-white" />}
          </div>
        </button>
        <div className="flex-grow">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="flex gap-2 items-center">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <button type="submit" className="p-1.5 bg-green-600 hover:bg-green-700 rounded-md">
                <Save size={16} />
              </button>
            </form>
          ) : (
            <p className={`text-gray-200 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar size={12} /> {formatDate(new Date(task.dueDate))}
              </div>
            )}
            {task.priority && (
              <div className={`flex items-center gap-1 font-semibold ${priorityColor[task.priority]}`}>
                <Tag size={12} /> {task.priority}
              </div>
            )}
            {projectName && (
              <div className="flex items-center gap-1">
                <Book size={12} /> {projectName}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-md"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
