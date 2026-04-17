import React, { useMemo, useState } from 'react';
import { Book, Calendar, CheckSquare, ChevronDown, ChevronRight, Edit2, LogOut, Plus, Repeat, Save, Sparkles, Trash2, TrendingUp } from 'lucide-react';
import { collection, doc, addDoc, updateDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { appId } from '../../config/env';
import GoalPlannerModal from '../../components/modals/GoalPlannerModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

export default function Sidebar({ onViewChange, projects, goals, userId, handleSignOut }) {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('Course');
  const [newProjectCustomType, setNewProjectCustomType] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);

  const handleNavigate = (view, id) => {
    setIsAddingProject(false);
    onViewChange(view, id);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim() || !userId || !db) return;
    const selectedType = newProjectType === '__custom__' ? newProjectCustomType.trim() : newProjectType;
    if (!selectedType) return;
    const project = {
      name: newProjectName,
      type: selectedType,
      createdAt: new Date(),
      status: 'In Progress',
      progress: 0,
      goalId: null,
    };
    try {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/projects`), project);
      setNewProjectName('');
      setNewProjectType('Course');
      setNewProjectCustomType('');
      setIsAddingProject(false);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

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

  return (
    <>
      <GoalPlannerModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} userId={userId} />
      <aside className="w-full h-full md:w-64 bg-gray-900/50 md:border-r border-gray-700/50 p-4 flex flex-col">
        <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="hidden md:flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
              <Book size={24} /> ProdHub
            </h1>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              <CheckSquare size={20} /> Dashboard
            </button>
            <button
              onClick={() => handleNavigate('weekly_review')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              <TrendingUp size={20} /> Weekly Review
            </button>
            <button
              onClick={() => handleNavigate('habit_tracker')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              <Repeat size={20} /> Habit Tracker
            </button>
            <button
              onClick={() => handleNavigate('all_tasks')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              <CheckSquare size={20} /> All Tasks
            </button>
            <button
              onClick={() => handleNavigate('schedule')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              <Calendar size={20} /> Schedule
            </button>

            <div className="pt-4">
              <h2 className="text-sm font-semibold text-gray-500 px-3 mb-2">Goals</h2>
              <button
                onClick={() => setShowGoalModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-md text-purple-400 hover:bg-purple-900/50 transition-colors"
              >
                <Sparkles size={20} /> AI Goal Planner
              </button>
              {goals.map((goal) => (
                <GoalDropdown
                  key={goal.id}
                  goal={goal}
                  projects={goalProjects[goal.id] || []}
                  onViewChange={handleNavigate}
                  userId={userId}
                />
              ))}
            </div>

            <div className="pt-4">
              <h2 className="text-sm font-semibold text-gray-500 px-3 mb-2">Projects</h2>
              {standaloneProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleNavigate('project', p.id)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors truncate"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      p.type === 'Course'
                        ? 'bg-green-400'
                        : p.type === 'Seminar'
                        ? 'bg-purple-400'
                        : 'bg-yellow-400'
                    }`}
                  ></div>
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => setIsAddingProject(!isAddingProject)}
                className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-md text-blue-400 hover:bg-blue-900/50 transition-colors"
              >
                <Plus size={20} /> Add Project
              </button>
              {isAddingProject && (
                <form onSubmit={handleAddProject} className="p-3 bg-gray-800 rounded-md mt-2 space-y-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project Name"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Course">Course</option>
                    <option value="Conference">Conference</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Bootcamp">Bootcamp</option>
                    <option value="Personal">Personal</option>
                    <option value="__custom__">Custom tag...</option>
                  </select>
                  {newProjectType === '__custom__' && (
                    <input
                      type="text"
                      value={newProjectCustomType}
                      onChange={(e) => setNewProjectCustomType(e.target.value)}
                      placeholder="Enter custom tag"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-md py-1 text-sm font-semibold">
                    Save
                  </button>
                </form>
              )}
            </div>
          </nav>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex-shrink-0 flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:bg-red-900/50 hover:text-red-300 transition-colors mt-4"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </aside>
    </>
  );
}

function GoalDropdown({ goal, projects, onViewChange, userId }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(goal.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editedName.trim()) return;
    await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/goals`, goal.id), { name: editedName });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!userId || !db) return;
    setShowDeleteModal(false);
    const batch = writeBatch(db);

    batch.delete(doc(db, `artifacts/${appId}/users/${userId}/goals`, goal.id));

    for (const project of projects) {
      batch.delete(doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id));
      const tasksQuery = query(
        collection(db, `artifacts/${appId}/users/${userId}/tasks`),
        where('projectId', '==', project.id)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      tasksSnapshot.forEach((taskDoc) => batch.delete(taskDoc.ref));
    }
    await batch.commit();
  };

  return (
    <div className="text-sm">
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message={`Are you sure you want to delete the goal "${goal.name}" and all its projects and tasks?`}
      />
      <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-700/50 group">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex-grow flex items-center gap-2">
            <input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button type="submit" className="p-1 text-green-400 hover:text-white">
              <Save size={16} />
            </button>
          </form>
        ) : (
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 flex-grow text-left">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="font-semibold text-gray-200 truncate">{goal.name}</span>
          </button>
        )}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white">
            <Edit2 size={16} />
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="p-1 text-gray-400 hover:text-red-400">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="pl-6 border-l-2 border-gray-700 ml-5 my-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onViewChange('project', p.id)}
              className="w-full text-left flex items-center gap-3 px-3 py-1.5 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors truncate"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  p.type === 'Course'
                    ? 'bg-green-400'
                    : p.type === 'Seminar'
                    ? 'bg-purple-400'
                    : 'bg-yellow-400'
                }`}
              ></div>
              {p.name}
            </button>
          ))}
          {projects.length === 0 && <p className="px-3 py-1.5 text-xs text-gray-500">No projects yet.</p>}
        </div>
      )}
    </div>
  );
}
