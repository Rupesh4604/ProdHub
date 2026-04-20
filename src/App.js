import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from './contexts/AuthContext';
import { appId, GOOGLE_CLIENT_ID, isFirebaseConfigured } from './config/env';
import { db } from './config/firebase';
import { createCalendarTokenClient, loadGoogleIdentityScript } from './services/googleCalendar';
import LoginScreen from './components/auth/LoginScreen';
import ConfigurationNeeded from './components/layout/ConfigurationNeeded';
import Sidebar from './features/sidebar/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import ProjectDetail from './features/project/ProjectDetail';
import AllTasksView from './features/tasks/AllTasksView';
import ScheduleView from './features/schedule/ScheduleView';
import HabitTrackerView from './features/habits/HabitTrackerView';
import WeeklyReviewView from './features/review/WeeklyReviewView';
import { Menu, Book } from 'lucide-react';

function HubApp({ user, handleSignOut }) {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [habits, setHabits] = useState([]);
    const [goals, setGoals] = useState([]);
    const [habitEntries, setHabitEntries] = useState([]);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [syncedEvents, setSyncedEvents] = useState([]);
    const [tokenClient, setTokenClient] = useState(null);
    const [isGsiScriptLoaded, setIsGsiScriptLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        loadGoogleIdentityScript()
            .then(() => {
                if (!cancelled) setIsGsiScriptLoaded(true);
            })
            .catch((err) => console.error('Google Identity script failed to load', err));
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (isGsiScriptLoaded && window.google && GOOGLE_CLIENT_ID) {
            const client = createCalendarTokenClient({
                clientId: GOOGLE_CLIENT_ID,
                onToken: () => {},
                onError: (err) => console.error(err),
            });
            setTokenClient(client);
        }
    }, [isGsiScriptLoaded]);

    useEffect(() => {
        if (!user || !db) return undefined;
        const basePath = `artifacts/${appId}/users/${user.uid}`;

        const projectsQuery = query(collection(db, `${basePath}/projects`));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const projectsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setProjects(projectsData);
            if (selectedProjectId && !snapshot.docs.some((docSnap) => docSnap.id === selectedProjectId)) {
                setActiveView('dashboard');
                setSelectedProjectId(null);
            }
        });

        const tasksQuery = query(collection(db, `${basePath}/tasks`));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) =>
            setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        const habitsQuery = query(collection(db, `${basePath}/habits`));
        const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) =>
            setHabits(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        const goalsQuery = query(collection(db, `${basePath}/goals`));
        const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) =>
            setGoals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        const habitEntriesQuery = query(collection(db, `${basePath}/habit_entries`));
        const unsubscribeHabitEntries = onSnapshot(habitEntriesQuery, (snapshot) =>
            setHabitEntries(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        return () => {
            unsubscribeProjects();
            unsubscribeTasks();
            unsubscribeHabits();
            unsubscribeGoals();
            unsubscribeHabitEntries();
        };
    }, [user, selectedProjectId]);

    const selectedProject = useMemo(
        () => projects.find((p) => p.id === selectedProjectId),
        [selectedProjectId, projects]
    );

    const handleSetView = (view, projectId = null) => {
        setActiveView(view);
        setSelectedProjectId(projectId);
        setIsSidebarOpen(false); // Auto-close sidebar on mobile
    };

    return (
        <div className="bg-gray-900 text-gray-100 min-h-screen font-sans flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900">
                <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                    <Book size={20} /> ProdHub
                </h1>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="text-gray-300 hover:text-white p-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block md:w-64 flex-shrink-0 h-[calc(100vh-73px)] md:h-screen w-full`}>
                <Sidebar
                    onViewChange={handleSetView}
                    projects={projects}
                    goals={goals}
                    userId={user.uid}
                    handleSignOut={handleSignOut}
                />
            </div>
            
            <main className={`${isSidebarOpen ? 'hidden md:block' : 'block'} flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-screen flex flex-col`}>
                <div className="flex-1">
                    {activeView === 'dashboard' && (
                        <Dashboard
                            projects={projects}
                            tasks={tasks}
                            goals={goals}
                            onViewChange={handleSetView}
                            syncedEvents={syncedEvents}
                        />
                    )}
                    {activeView === 'project' && selectedProject && (
                        <ProjectDetail project={selectedProject} allTasks={tasks} syncedEvents={syncedEvents} />
                    )}
                    {activeView === 'all_tasks' && <AllTasksView tasks={tasks} projects={projects} />}
                    {activeView === 'schedule' && (
                        <ScheduleView
                            projects={projects}
                            tasks={tasks}
                            syncedEvents={syncedEvents}
                            setSyncedEvents={setSyncedEvents}
                            tokenClient={tokenClient}
                        />
                    )}
                    {activeView === 'habit_tracker' && <HabitTrackerView habits={habits} entries={habitEntries} />}
                    {activeView === 'weekly_review' && (
                        <WeeklyReviewView tasks={tasks} projects={projects} habits={habits} entries={habitEntries} />
                    )}
                </div>
                <footer className="mt-8 pt-4 border-t border-gray-800 text-center text-xs text-gray-600 space-x-4">
                    <a href="/privacy.html" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
                    <span>·</span>
                    <a href="/terms.html" className="hover:text-gray-400 transition-colors">Terms of Service</a>
                </footer>
            </main>
        </div>
    );
}

export default function App() {
    const { user, isAuthReady, signInWithGoogle, emailSignIn, emailSignUp, signOutUser } = useAuth();

    if (!isFirebaseConfigured || !GOOGLE_CLIENT_ID) {
        return <ConfigurationNeeded missingFirebase={!isFirebaseConfigured} missingGoogle={!GOOGLE_CLIENT_ID} />;
    }

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return user ? (
        <HubApp user={user} handleSignOut={signOutUser} />
    ) : (
        <LoginScreen
            onGoogleSignIn={signInWithGoogle}
            onEmailSignIn={emailSignIn}
            onEmailSignUp={emailSignUp}
        />
    );
}
