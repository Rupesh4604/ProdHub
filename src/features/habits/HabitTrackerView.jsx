import React, { useMemo, useState } from 'react';
import { Plus, TrendingUp, Edit2, Trash2 } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">Habit Tracker</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md font-semibold transition-colors"
          >
            <TrendingUp size={18} /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold transition-colors"
          >
            <Plus size={18} /> {isAdding ? 'Cancel' : 'New Habit'}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddHabit} className="flex gap-2 p-4 bg-gray-800 rounded-lg">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="e.g., Read for 30 minutes"
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold">
            Save
          </button>
        </form>
      )}

      {showAnalytics && (
        <div className="bg-gray-800/60 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Habit Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <HabitCalendar key={habit.id} habit={habit} entries={entries.filter((e) => e.habitId === habit.id)} />
            ))}
            {habits.length === 0 && <p className="text-gray-400 md:col-span-3 text-center">No habits to analyze yet.</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    const habitRef = doc(db, `artifacts/${appId}/users/${userId}/habits`, habit.id);
    try {
      await updateDoc(habitRef, { name: editedName });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteHabit = async () => {
    if (!userId || !db) return;
    setShowDeleteModal(false);

    const entriesPath = `artifacts/${appId}/users/${userId}/habit_entries`;
    const q = query(collection(db, entriesPath), where('habitId', '==', habit.id));

    try {
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();

      const habitRef = doc(db, `artifacts/${appId}/users/${userId}/habits`, habit.id);
      await deleteDoc(habitRef);
    } catch (error) {
      console.error('Error deleting habit and its entries:', error);
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
              <button type="submit" className="flex-1 p-1.5 text-sm bg-green-600 hover:bg-green-700 rounded-md font-semibold">
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 p-1.5 text-sm bg-gray-600 hover:bg-gray-700 rounded-md font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-grow flex flex-col">
            <div className="flex justify-between items-start">
              <span className="font-semibold text-white pr-2">{habit.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setShowDeleteModal(true)} className="p-1 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700">
                  <Trash2 size={16} />
                </button>
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
          className={`w-full mt-4 py-2 rounded-md font-semibold transition-colors ${
            isCompleted ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          } disabled:bg-gray-800 disabled:cursor-not-allowed`}
        >
          {isCompleted ? 'Completed Today!' : 'Mark as Done'}
        </button>
      </div>
    </>
  );
}

function HabitCalendar({ habit, entries }) {
  const today = new Date();
  const [date, setDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const goToPreviousMonth = () => {
    setDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const completedDates = useMemo(() => new Set(entries.filter((e) => e.completed).map((e) => e.date)), [entries]);

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <button onClick={goToPreviousMonth} className="p-1 rounded-md hover:bg-gray-700">
          &lt;
        </button>
        <h3 className="font-semibold text-center text-sm">
          {habit.name} - {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
        </h3>
        <button onClick={goToNextMonth} className="p-1 rounded-md hover:bg-gray-700">
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {blanks.map((b, i) => (
          <div key={`b-${i}`}></div>
        ))}
        {days.map((d) => {
          const dateKey = getLocalDateKey(new Date(date.getFullYear(), date.getMonth(), d));
          const isCompleted = completedDates.has(dateKey);
          const isToday = dateKey === getLocalDateKey(new Date());
          return (
            <div
              key={d}
              className={`w-full aspect-square flex items-center justify-center rounded-full text-xs ${
                isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
