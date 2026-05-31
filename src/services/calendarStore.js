import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { appId } from '../config/env';

/** Single doc holding the user's last-synced Google Calendar events. */
const calendarDocRef = (uid) => doc(db, `artifacts/${appId}/users/${uid}/meta/calendar`);

/** Persist the fetched events so they survive refreshes (no re-consent needed). */
export const saveCalendarEvents = async (uid, events) => {
  if (!uid || !db) return;
  await setDoc(calendarDocRef(uid), {
    events: (events || []).map((e) => ({
      id: e.id,
      title: e.title || '',
      date: e.date instanceof Date ? e.date : new Date(e.date),
      type: e.type || 'Google Calendar',
      color: e.color || 'bg-red-500',
    })),
    syncedAt: new Date(),
  });
};

/**
 * Subscribe to the stored events. Invokes cb({ events, syncedAt }) with Firestore
 * Timestamps converted back to Date objects (the rest of the app expects Dates).
 */
export const subscribeCalendarEvents = (uid, cb) => {
  if (!uid || !db) return () => {};
  return onSnapshot(calendarDocRef(uid), (snap) => {
    const data = snap.data();
    if (!data || !Array.isArray(data.events)) {
      cb({ events: [], syncedAt: null });
      return;
    }
    cb({
      events: data.events.map((e) => ({
        ...e,
        date: e.date?.toDate ? e.date.toDate() : new Date(e.date),
      })),
      syncedAt: data.syncedAt?.toDate ? data.syncedAt.toDate() : null,
    });
  });
};
