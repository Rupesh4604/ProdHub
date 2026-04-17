import React, { useMemo, useState } from 'react';
import { Plus, TrendingUp, Edit2, Trash2, Flame } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';
import { getLocalDateKey } from '../../utils/datetime';
import ConfirmModal from '../../components/modals/ConfirmModal';

export default function HabitTrackerView({ habits, entries }) {
  const [newHabitName, setNewHabitName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const userId = auth?.currentUser?.uid;

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim() || !userId || !db) return;
    await addDoc(collection(db, `artifacts/${appId}/users/${userId}/habits`), { name: newHabitName, createdAt: new Date() });
    setNewHabitName('');
    setIsAdding(false);
  };

  const habitStreaks = useMemo(() => {
    const streaks = {};
    habits.forEach((habit) => {
      const habitEntries = entries
        .filter((e) => e.habitId === habit.id && e.completed)
        .map((e) => e.date)
        .sort((a, b) => new Date(b) - new Date(a));

      let currentStreak = 0;
      if (habitEntries.length > 0) {
        const today = new Date();
        const todayKey = getLocalDateKey(today);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = getLocalDateKey(yesterday);

        if (habitEntries[0] === todayKey || habitEntries[0] === yesterdayKey) {
          currentStreak = 1;
          for (let i = 0; i < habitEntries.length - 1; i++) {
            const current = new Date(habitEntries[i]);
            const next = new Date(habitEntries[i + 1]);
            const diffDays = Math.round((current - next) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }
      streaks[habit.id] = currentStreak;
    });
    return streaks;
  }, [habits, entries]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Mobile/panel: compact header */}
        <h1 className="text-2xl font-bold text-white tracking-tight md:text-4xl">Habit Tracker</h1>
        <div className="flex gap-1.5 md:gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200
              md:px-4 md:py-2 md:rounded-md md:text-sm
              ${showAnalytics
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:border-gray-600 md:bg-indigo-600 md:hover:bg-indigo-700 md:border-0 md:text-white'
              }`}
          >
            <TrendingUp size={14} />
            <span className="hidden sm:inline">{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
            <span className="sm:hidden">Analytics</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200
              md:px-4 md:py-2 md:rounded-md md:text-sm
              ${isAdding
                ? 'bg-gray-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/30 md:bg-none md:bg-blue-600 md:hover:bg-blue-700'
              }`}
          >
            <Plus size={14} />
            {isAdding ? 'Cancel' : 'New Habit'}
          </button>
        </div>
      </div>

      {/* ── Add habit form ── */}
      {isAdding && (
        <form onSubmit={handleAddHabit} className="flex gap-2 p-3 bg-gray-800/40 border border-gray-700/40 rounded-2xl backdrop-blur-sm md:p-4 md:bg-gray-800 md:rounded-lg md:border-0">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="e.g., Read for 30 minutes"
            className="flex-grow bg-gray-700/80 border border-gray-600/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 md:rounded-md md:bg-gray-700 md:border-gray-600"
            required
            autoFocus
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl text-sm font-semibold transition-colors md:rounded-md md:px-4">
            Save
          </button>
        </form>
      )}

      {/* ── Analytics panel ── */}
      {showAnalytics && (
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 backdrop-blur-sm md:bg-gray-800/60 md:rounded-lg md:border-0 md:p-6">
          <h2 className="text-base font-semibold mb-3 md:text-2xl md:mb-4">Habit Analytics</h2>
          {/* Mobile: single column; Desktop: multi-column */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {habits.map((habit) => (
              <HabitCalendar key={habit.id} habit={habit} entries={entries.filter((e) => e.habitId === habit.id)} />
            ))}
            {habits.length === 0 && <p className="text-gray-500 text-sm text-center py-4 md:col-span-3">No habits to analyze yet.</p>}
          </div>
        </div>
      )}

      {/* ── Habit list ──
          Mobile / extension panel → compact single-column rows (new design)
          Desktop (md+) → old tall multi-column cards
      ── */}

      {/* MOBILE layout: compact rows */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {habits.length === 0 && !isAdding && (
          <p className="text-gray-500 text-sm text-center py-10">No habits defined yet. Add your first one!</p>
        )}
        {habits.map((habit) => (
          <HabitRowCard
            key={habit.id}
            habit={habit}
            entries={entries.filter((e) => e.habitId === habit.id)}
            streak={habitStreaks[habit.id] || 0}
          />
        ))}
      </div>

      {/* DESKTOP layout: original tall cards */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.length === 0 && !isAdding && (
          <p className="text-gray-400 md:col-span-3 text-center py-8">No habits defined yet. Add your first one!</p>
        )}
        {habits.map((habit) => (
          <HabitDayCard
            key={habit.id}
            habit={habit}
            entries={entries.filter((e) => e.habitId === habit.id)}
            streak={habitStreaks[habit.id] || 0}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Compact row card: mobile / extension panel ── */
function HabitRowCard({ habit, entries, streak }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(habit.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const userId = auth?.currentUser?.uid;
  const todayKey = getLocalDateKey(new Date());
  const entry = entries.find((e) => e.date === todayKey);
  const isCompleted = entry ? entry.completed : false;

  const handleHabitToggle = async () => {
    if (!userId || !db) return;
    if (entry) {
      await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/habit_entries`, entry.id), { completed: !isCompleted });
    } else {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/habit_entries`), {
        habitId: habit.id,
        date: todayKey,
        completed: true,
      });
    }
  };

  const handleUpdateHabit = async (e) => {
    e.preventDefault();
    if (!editedName.trim() || !userId || !db) return;
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/habits`, habit.id), { name: editedName });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteHabit = async () => {
    if (!userId || !db) return;
    setShowDeleteModal(false);
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/habit_entries`), where('habitId', '==', habit.id));
    try {
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/habits`, habit.id));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteHabit}
        title="Delete Habit"
        message={`Are you sure you want to delete the habit "${habit.name}"? All its tracked history will also be removed.`}
      />
      <div className={`rounded-2xl border p-3.5 transition-all duration-200 backdrop-blur-sm ${isCompleted ? 'bg-emerald-950/40 border-emerald-800/40' : 'bg-gray-800/40 border-gray-700/40'}`}>
        {isEditing ? (
          <form onSubmit={handleUpdateHabit} className="flex gap-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="flex-grow bg-gray-700/80 border border-gray-600 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
            <button type="submit" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold">Save</button>
            <button type="button" onClick={() => setIsEditing(false)} className="px-2 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-xl text-xs font-semibold">✕</button>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleHabitToggle}
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200 ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40' : 'bg-gray-700/80 text-gray-500 hover:bg-gray-600/80 hover:text-white'}`}
            >
              {isCompleted ? '✓' : '○'}
            </button>
            <div className="flex-grow min-w-0">
              <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>{habit.name}</p>
              <div className={`flex items-center gap-1 text-xs mt-0.5 ${streak > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
                <Flame size={11} />
                <span>{streak} day streak</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"><Edit2 size={13} /></button>
              <button onClick={() => setShowDeleteModal(true)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Original tall card: desktop only ── */
function HabitDayCard({ habit, entries, streak }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(habit.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const userId = auth?.currentUser?.uid;
  const todayKey = getLocalDateKey(new Date());
  const entry = entries.find((e) => e.date === todayKey);
  const isCompleted = entry ? entry.completed : false;

  const handleHabitToggle = async () => {
    if (!userId || !db) return;
    if (entry) {
      await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/habit_entries`, entry.id), { completed: !isCompleted });
    } else {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/habit_entries`), {
        habitId: habit.id,
        date: todayKey,
        completed: true,
      });
    }
  };

  const handleUpdateHabit = async (e) => {
    e.preventDefault();
    if (!editedName.trim() || !userId || !db) return;
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/habits`, habit.id), { name: editedName });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteHabit = async () => {
    if (!userId || !db) return;
    setShowDeleteModal(false);
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/habit_entries`), where('habitId', '==', habit.id));
    try {
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/habits`, habit.id));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteHabit}
        title="Delete Habit"
        message={`Are you sure you want to delete the habit "${habit.name}"? All its tracked history will also be removed.`}
      />
      <div className="bg-gray-800/60 rounded-lg p-4 flex flex-col justify-between min-h-[160px]">
        {isEditing ? (
          <form onSubmit={handleUpdateHabit} className="flex-grow flex flex-col space-y-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 mt-auto">
              <button type="submit" className="flex-1 p-1.5 text-sm bg-green-600 hover:bg-green-700 rounded-md font-semibold">Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 p-1.5 text-sm bg-gray-600 hover:bg-gray-700 rounded-md font-semibold">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="flex-grow flex flex-col">
            <div className="flex justify-between items-start">
              <span className="font-semibold text-white pr-2">{habit.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"><Edit2 size={16} /></button>
                <button onClick={() => setShowDeleteModal(true)} className="p-1 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-sm mt-2 ${streak > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
              <TrendingUp size={16} />
              <span>{streak} day streak</span>
            </div>
          </div>
        )}
        <button
          onClick={handleHabitToggle}
          disabled={isEditing}
          className={`w-full mt-4 py-2 rounded-md font-semibold transition-colors ${isCompleted ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'} disabled:bg-gray-800 disabled:cursor-not-allowed`}
        >
          {isCompleted ? 'Completed Today!' : 'Mark as Done'}
        </button>
      </div>
    </>
  );
}

/* ── Calendar (used in analytics — shared by both layouts) ── */
function HabitCalendar({ habit, entries }) {
  const today = new Date();
  const [date, setDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const goToPreviousMonth = () => setDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const completedDates = useMemo(() => new Set(entries.filter((e) => e.completed).map((e) => e.date)), [entries]);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-gray-900/50 p-3 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <button onClick={goToPreviousMonth} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors text-sm">‹</button>
        <h3 className="text-xs font-semibold text-center text-gray-300 truncate px-1">
          {habit.name} — {date.toLocaleString('default', { month: 'short' })} {date.getFullYear()}
        </h3>
        <button onClick={goToNextMonth} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-600 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => <div key={`b-${i}`} />)}
        {days.map((d) => {
          const dateKey = getLocalDateKey(new Date(date.getFullYear(), date.getMonth(), d));
          const isCompleted = completedDates.has(dateKey);
          const isToday = dateKey === getLocalDateKey(new Date());
          return (
            <div
              key={d}
              className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs transition-colors ${isCompleted ? 'bg-emerald-500 text-white font-semibold' : 'bg-gray-800 text-gray-600'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
