import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { Search, Book, CheckSquare, Plus, CornerDownLeft } from 'lucide-react';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';

/**
 * Ctrl/Cmd+K command palette: fuzzy-search projects and tasks to jump to them,
 * or quick-add a task to a chosen project — from anywhere in the app.
 */
export default function CommandPalette({ isOpen, onClose, projects, tasks, onNavigate, defaultProjectId }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [addProjectId, setAddProjectId] = useState(defaultProjectId || projects[0]?.id || '');
  const inputRef = useRef(null);
  const userId = auth?.currentUser?.uid;

  // Reset when opened.
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setAddProjectId(defaultProjectId || projects[0]?.id || '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, defaultProjectId, projects]);

  const q = query.trim().toLowerCase();

  const items = useMemo(() => {
    const list = [];
    if (q) {
      projects
        .filter((p) => p.name?.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((p) => list.push({ type: 'project', id: p.id, label: p.name, sublabel: p.type }));

      tasks
        .filter((t) => t.title?.toLowerCase().includes(q))
        .slice(0, 6)
        .forEach((t) =>
          list.push({
            type: 'task',
            id: t.id,
            label: t.title,
            projectId: t.projectId,
            sublabel: projects.find((p) => p.id === t.projectId)?.name || 'No project',
            completed: t.completed,
          })
        );

      if (projects.length > 0) {
        list.push({ type: 'add', label: query.trim() });
      }
    } else {
      projects
        .slice(0, 6)
        .forEach((p) => list.push({ type: 'project', id: p.id, label: p.name, sublabel: p.type }));
    }
    return list;
  }, [q, query, projects, tasks]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  const runItem = async (item) => {
    if (!item) return;
    if (item.type === 'project') {
      onNavigate('project', item.id);
      onClose();
    } else if (item.type === 'task') {
      if (item.projectId) onNavigate('project', item.projectId);
      onClose();
    } else if (item.type === 'add') {
      const targetProject = addProjectId || projects[0]?.id;
      if (!userId || !db || !targetProject || !item.label) return;
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), {
        title: item.label,
        priority: 'Medium',
        projectId: targetProject,
        completed: false,
        createdAt: new Date(),
        dueDate: '',
      });
      onNavigate('project', targetProject);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(1, items.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runItem(items[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
          <Search size={18} className="text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects & tasks, or type to add a task…"
            className="flex-grow bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline text-[10px] text-gray-500 border border-gray-600 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {/* Results */}
        <ul className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-500">
              {q ? 'No matches.' : 'No projects yet — add one from the sidebar.'}
            </li>
          )}
          {items.map((item, i) => {
            const active = i === activeIndex;
            if (item.type === 'add') {
              return (
                <li
                  key="add"
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`mx-2 px-3 py-2.5 rounded-xl flex items-center gap-3 ${active ? 'bg-blue-600/30' : ''}`}
                >
                  <Plus size={16} className="text-emerald-400 flex-shrink-0" />
                  <button onClick={() => runItem(item)} className="flex-grow text-left min-w-0">
                    <span className="text-sm text-gray-200">
                      Add task: <span className="font-semibold text-white">“{item.label}”</span>
                    </span>
                  </button>
                  <select
                    value={addProjectId}
                    onChange={(e) => setAddProjectId(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 max-w-[40%] bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {active && <CornerDownLeft size={14} className="text-gray-500 flex-shrink-0" />}
                </li>
              );
            }
            return (
              <li key={`${item.type}-${item.id}`} onMouseEnter={() => setActiveIndex(i)}>
                <button
                  onClick={() => runItem(item)}
                  className={`w-full mx-2 px-3 py-2.5 rounded-xl flex items-center gap-3 text-left ${active ? 'bg-blue-600/30' : ''}`}
                  style={{ width: 'calc(100% - 1rem)' }}
                >
                  {item.type === 'project' ? (
                    <Book size={16} className="text-blue-400 flex-shrink-0" />
                  ) : (
                    <CheckSquare size={16} className={`flex-shrink-0 ${item.completed ? 'text-emerald-500' : 'text-gray-400'}`} />
                  )}
                  <span className={`flex-grow min-w-0 truncate text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {item.label}
                  </span>
                  <span className="flex-shrink-0 text-xs text-gray-500 truncate max-w-[35%]">{item.sublabel}</span>
                  {active && <CornerDownLeft size={14} className="text-gray-500 flex-shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
