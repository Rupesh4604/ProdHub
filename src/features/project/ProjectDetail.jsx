import React, { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { Edit2, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';
import { auth, db } from '../../config/firebase';
import { appId, GEMINI_API_KEY } from '../../config/env';
import { callGeminiWithRetry } from '../../services/geminiService';
import TaskItem from '../../components/shared/TaskItem';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AiContextModal from '../../components/modals/AiContextModal';

export default function ProjectDetail({ project, allTasks, syncedEvents }) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'Medium' });
  const [sortMode, setSortMode] = useState('deadline');
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [geminiError, setGeminiError] = useState('');
  const [showAiContextModal, setShowAiContextModal] = useState(false);

  const userId = auth?.currentUser?.uid;
  const tasks = useMemo(() => {
    const priorityOrderHigh = { High: 0, Medium: 1, Low: 2 };
    const priorityOrderLow = { Low: 0, Medium: 1, High: 2 };
    const filtered = allTasks.filter((t) => t.projectId === project.id);

    if (sortMode === 'random') {
      return filtered.slice().sort(() => Math.random() - 0.5);
    }

    const parseDueDate = (value) => {
      const ts = Date.parse(value);
      return Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY;
    };

    const sorted = filtered.slice().sort((a, b) => {
      // Always keep incomplete tasks above completed tasks
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      let cmp = 0;
      switch (sortMode) {
        case 'priority-high-low':
          cmp = (priorityOrderHigh[a.priority] ?? 99) - (priorityOrderHigh[b.priority] ?? 99);
          break;
        case 'priority-low-high':
          cmp = (priorityOrderLow[a.priority] ?? 99) - (priorityOrderLow[b.priority] ?? 99);
          break;
        case 'deadline':
          cmp = parseDueDate(a.dueDate) - parseDueDate(b.dueDate);
          break;
        default:
          cmp = 0;
      }
      return cmp;
    });

    return sorted;
  }, [allTasks, project.id, sortMode]);

  useEffect(() => {
    if (!userId || !project || !db) return;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    if (project.progress !== progress) {
      const projectRef = doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id);
      updateDoc(projectRef, { progress });
    }
  }, [tasks, project, userId]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !userId || !db) return;
    const task = { ...newTask, projectId: project.id, completed: false, createdAt: new Date() };
    await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), task);
    setNewTask({ title: '', dueDate: '', priority: 'Medium' });
    setIsAddingTask(false);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject.name.trim() || !userId || !db) return;
    await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id), {
      name: editingProject.name,
      type: editingProject.type,
    });
    setEditingProject(null);
  };

  const handleDeleteProject = async () => {
    if (!userId || !db) return;
    setShowDeleteModal(null);
    for (const task of tasks) {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id));
    }
    await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id));
  };

  const handleGenerateTasks = async (customContext) => {
    setShowAiContextModal(false);
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      setGeminiError('Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your .env.local file.');
      return;
    }
    if (!userId || !db) return;
    setIsGenerating(true);
    setGeminiError('');

    const projectKeywords = project.name.toLowerCase().split(' ').filter((k) => k.length > 2);
    const relevantEvents = syncedEvents.filter((event) => {
      const eventTitle = event.title.toLowerCase();
      return projectKeywords.some((keyword) => eventTitle.includes(keyword));
    });

    let calendarContext = '';
    if (relevantEvents.length > 0) {
      const eventList = relevantEvents.map((e) => `- "${e.title}" on ${e.date.toDateString()}`).join('\n');
      calendarContext = `For background context, here are some of my upcoming, related events from my Google Calendar:\n${eventList}\n\n`;
    }

    const userContext = customContext ? `Your main instruction is: "${customContext}"\n\n` : '';

    const prompt = `You are a project planning assistant. Your primary goal is to generate a list of actionable to-do items based on the user's main instruction. Use the other information as background context.

**Main Instruction from User:**
${userContext || 'Break down the project into actionable steps.'}

**Background Context:**
- Project Name: "${project.name}"
- Project Type: "${project.type}"
${calendarContext}

Based on the user's main instruction and the background context, generate a list of 5 to 7 to-do items. For each item, provide a title and estimate its difficulty as 'High', 'Medium', or 'Low'. Do not create tasks that are identical to the calendar events, but rather tasks that lead up to them.`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            tasks: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  title: { type: 'STRING' },
                  priority: { type: 'STRING', enum: ['High', 'Medium', 'Low'] },
                },
                required: ['title', 'priority'],
              },
            },
          },
          required: ['tasks'],
        },
      },
    };
    try {
      const result = await callGeminiWithRetry(payload, apiKey);
      if (result.candidates && result.candidates[0].content.parts[0].text) {
        const generated = JSON.parse(result.candidates[0].content.parts[0].text);
        if (generated.tasks && generated.tasks.length > 0) {
          for (const task of generated.tasks) {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), {
              title: task.title,
              priority: task.priority,
              projectId: project.id,
              completed: false,
              createdAt: new Date(),
              dueDate: '',
            });
          }
        }
      } else {
        throw new Error('No tasks were generated.');
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      setGeminiError(error.message || 'An error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AiContextModal
        isOpen={showAiContextModal}
        onClose={() => setShowAiContextModal(false)}
        onConfirm={handleGenerateTasks}
      />
      <ConfirmModal
        isOpen={showDeleteModal === 'project'}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}" and all its tasks?`}
      />
      {editingProject ? (
        <form onSubmit={handleUpdateProject} className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg">
          <input
            type="text"
            value={editingProject.name}
            onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={editingProject.type}
            onChange={(e) => setEditingProject({ ...editingProject, type: e.target.value })}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Course</option>
            <option>Conference</option>
            <option>Seminar</option>
            <option>Bootcamp</option>
            <option>Personal</option>
          </select>
          <button type="submit" className="p-2 bg-green-600 hover:bg-green-700 rounded-md">
            <Save size={20} />
          </button>
          <button onClick={() => setEditingProject(null)} className="p-2 bg-gray-600 hover:bg-gray-700 rounded-md">
            <X size={20} />
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-white">{project.name}</h1>
            <span className="text-sm font-medium bg-blue-900/70 text-blue-300 px-3 py-1 rounded-full">
              {project.type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditingProject({ ...project })} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">
              <Edit2 size={20} />
            </button>
            <button onClick={() => setShowDeleteModal('project')} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-md">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      )}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-400">Progress</span>
          <span className="text-sm font-medium text-white">{Math.round(project.progress || 0)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }}></div>
        </div>
      </div>
      <div className="bg-gray-800/60 rounded-lg p-6">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">To-Do List</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-sm text-gray-300">Sort</label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="deadline">Deadline: Earliest First</option>
              <option value="priority-low-high">Priority: Low → High</option>
              <option value="priority-high-low">Priority: High → Low</option>
              <option value="random">Random</option>
            </select>
            <button
              onClick={() => setShowAiContextModal(true)}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-semibold transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed"
            >
              {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Sparkles size={18} />}
              {isGenerating ? 'Generating...' : '✨ Generate Tasks'}
            </button>
            <button
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold transition-colors"
            >
              <Plus size={18} /> {isAddingTask ? 'Cancel' : 'Add Task'}
            </button>
          </div>
        </div>
        {geminiError && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4 text-sm">{geminiError}</div>}
        {isAddingTask && (
          <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-900/50 rounded-md">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task title..."
              className="md:col-span-2 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <button type="submit" className="md:col-span-3 w-full bg-green-600 hover:bg-green-700 rounded-md py-2 font-semibold">
              Save Task
            </button>
          </form>
        )}
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task) => <TaskItem key={task.id} task={task} />)
          ) : (
            <p className="text-gray-400 text-center py-4">No tasks for this project yet. Try generating some with AI!</p>
          )}
        </div>
      </div>
    </div>
  );
}
