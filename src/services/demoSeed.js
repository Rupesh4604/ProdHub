import { collection, doc, writeBatch } from 'firebase/firestore';
import { appId } from '../config/env';
import { db } from '../config/firebase';
import { getLocalDateKey } from '../utils/datetime';

// Dates are relative to "today" so the demo always looks current: some tasks
// overdue, some due this week, and habit streaks that end yesterday/today.
const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};
const dueKey = (n) => getLocalDateKey(daysFromNow(n));

const GOAL = { key: 'ml', name: 'Land an ML engineering role' };

const PROJECTS = [
    { key: 'dl', name: 'Deep Learning Specialization', type: 'Course', goalKey: 'ml', deadline: 30 },
    { key: 'portfolio', name: 'Portfolio Website', type: 'Personal', goalKey: 'ml', deadline: 14 },
    { key: 'conf', name: 'GeoAI Conference Talk', type: 'Conference', goalKey: null, deadline: 21 },
    { key: 'home', name: 'Home & Errands', type: 'Personal', goalKey: null, deadline: null },
];

// [projectKey, title, dueInDays | null, priority, completedDaysAgo | null, recurrence]
const TASKS = [
    ['dl', 'Finish week 3: CNN architectures', -1, 'High', null, 'none'],
    ['dl', 'Implement ResNet block from scratch', 2, 'High', null, 'none'],
    ['dl', 'Watch lecture on batch normalization', null, 'Medium', 2, 'none'],
    ['dl', 'Quiz: optimization algorithms', null, 'Medium', 4, 'none'],
    ['dl', 'Read "Attention Is All You Need"', 6, 'Low', null, 'none'],
    ['portfolio', 'Write project case studies', 3, 'High', null, 'none'],
    ['portfolio', 'Set up custom domain + HTTPS', 1, 'Medium', null, 'none'],
    ['portfolio', 'Pick a color palette and fonts', null, 'Low', 1, 'none'],
    ['portfolio', 'Add contact form', 9, 'Low', null, 'none'],
    ['conf', 'Draft abstract', null, 'High', 5, 'none'],
    ['conf', 'Build slide deck', 5, 'High', null, 'none'],
    ['conf', 'Dry run with lab group', 12, 'Medium', null, 'none'],
    ['home', 'Pay electricity bill', 0, 'High', null, 'none'],
    ['home', 'Weekly grocery run', 2, 'Medium', null, 'weekly'],
    ['home', 'Call the bank about card renewal', null, 'Low', 3, 'none'],
];

// [name, how many of the last 21 days were completed (pattern), doneToday]
const HABITS = [
    ['Read 20 pages', (i) => i % 7 !== 3, true],
    ['Exercise 30 min', (i) => i % 3 !== 0, false],
    ['LeetCode problem', (i) => i < 9, true],
];

/**
 * Write a small, realistic workspace for a brand-new demo (anonymous) user.
 * One batch, so the dashboard never renders half-seeded.
 */
export async function seedDemoData(uid) {
    if (!db || !uid) return;
    const base = `artifacts/${appId}/users/${uid}`;
    const batch = writeBatch(db);
    const now = new Date();

    const goalRef = doc(collection(db, `${base}/goals`));
    batch.set(goalRef, { name: GOAL.name, createdAt: daysFromNow(-20) });

    const projectIds = {};
    PROJECTS.forEach((p) => {
        const ref = doc(collection(db, `${base}/projects`));
        projectIds[p.key] = ref.id;
        const tasks = TASKS.filter((t) => t[0] === p.key);
        const done = tasks.filter((t) => t[4] !== null).length;
        batch.set(ref, {
            name: p.name,
            type: p.type,
            deadline: p.deadline === null ? null : dueKey(p.deadline),
            createdAt: daysFromNow(-20),
            status: 'In Progress',
            progress: tasks.length ? (done / tasks.length) * 100 : 0,
            goalId: p.goalKey ? goalRef.id : null,
        });
    });

    TASKS.forEach(([projectKey, title, due, priority, completedAgo, recurrence]) => {
        const ref = doc(collection(db, `${base}/tasks`));
        const completed = completedAgo !== null;
        batch.set(ref, {
            title,
            projectId: projectIds[projectKey],
            dueDate: due === null ? (completed ? dueKey(-completedAgo) : '') : dueKey(due),
            priority,
            recurrence,
            completed,
            completedAt: completed ? daysFromNow(-completedAgo) : null,
            createdAt: daysFromNow(-15),
        });
    });

    HABITS.forEach(([name, pattern, doneToday]) => {
        const habitRef = doc(collection(db, `${base}/habits`));
        batch.set(habitRef, { name, createdAt: daysFromNow(-21) });
        for (let i = 1; i <= 21; i++) {
            if (!pattern(i)) continue;
            batch.set(doc(collection(db, `${base}/habit_entries`)), {
                habitId: habitRef.id,
                date: dueKey(-i),
                completed: true,
            });
        }
        if (doneToday) {
            batch.set(doc(collection(db, `${base}/habit_entries`)), {
                habitId: habitRef.id,
                date: getLocalDateKey(now),
                completed: true,
            });
        }
    });

    await batch.commit();
}
