import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';
import { getLocalDateKey } from '../../utils/datetime';

/**
 * Shared habit-card logic (toggle / rename / delete) used by both the compact
 * mobile row and the tall desktop card. Keeps the two presentational components
 * free of duplicated Firestore handlers.
 */
export default function useHabit(habit, entries) {
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

  return {
    isEditing,
    setIsEditing,
    editedName,
    setEditedName,
    showDeleteModal,
    setShowDeleteModal,
    isCompleted,
    handleHabitToggle,
    handleUpdateHabit,
    handleDeleteHabit,
  };
}
