import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Book, Calendar, CheckSquare, ChevronDown, ChevronRight, Clock, Edit2, Flame, Info, LogOut, Plus, Repeat, Save, Sparkles, Tag, Trash2, TrendingUp, X } from 'lucide-react';

// --- Firebase Configuration ---
// It's recommended to store these in environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const appId = 'my-prod-hub';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// --- Firebase Initialization ---
let app;
let auth;
let db;
// A simple check to see if the config is placeholder or not
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
}

// --- Helper Functions ---
const formatDate = (date) => {
    if (!date) return 'N/A';
    // Handles both Firestore Timestamps and JS Date objects
    const d = date instanceof Date ? date : date.toDate();
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    // Check if it's an all-day event (time is midnight UTC)
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
        return 'All-day';
    }
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
};

const getLocalDateKey = (date) => {
    const d = new Date(date);
    // Adjust for timezone offset to get the correct local date
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

// --- Configuration Error Component ---
function ConfigurationNeeded({ missingFirebase, missingGoogle }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-8 max-w-2xl text-center">
        <Info size={48} className="text-yellow-300 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-yellow-200 mb-4">Configuration Required</h1>
        {missingFirebase && <div className="text-left bg-gray-800 p-4 rounded-md mb-4"><p className="text-gray-300 mb-2"><strong>Firebase Config Missing:</strong> Please ensure your Firebase environment variables (REACT_APP_FIREBASE_*) are set correctly in your <code>.env.local</code> file.</p></div>}
        {missingGoogle && <div className="text-left bg-gray-800 p-4 rounded-md"><p className="text-gray-300 mb-2"><strong>Google Client ID Missing:</strong> Please ensure REACT_APP_GOOGLE_CLIENT_ID is set in your <code>.env.local</code> file to enable Google Calendar sync.</p></div>}
      </div>
    </div>
  );
}

// --- Login Screen Component ---
function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            setError(error.message);
            console.error("Google Sign-In Error:", error);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isSigningUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-400">Welcome to ProdHub</h1>
                    <p className="text-gray-400">Sign in to continue</p>
                </div>
                <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors">
                    <svg className="w-6 h-6" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                    Sign in with Google
                </button>
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-800 text-gray-500">Or continue with</span></div></div>
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors">{isSigningUp ? 'Sign Up' : 'Sign In'}</button>
                </form>
                <p className="text-center text-sm text-gray-400">
                    {isSigningUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => setIsSigningUp(!isSigningUp)} className="font-medium text-blue-400 hover:underline ml-1">
                        {isSigningUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
}

// This is the main content of your application
function HubApp({ user, handleSignOut }) {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [habits, setHabits] = useState([]);
    const [goals, setGoals] = useState([]);
    const [habitEntries, setHabitEntries] = useState([]);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    
    const [syncedEvents, setSyncedEvents] = useState([]);
    const [tokenClient, setTokenClient] = useState(null);
    const [isGsiScriptLoaded, setIsGsiScriptLoaded] = useState(false);

    // Effect to load the Google Sign-In script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setIsGsiScriptLoaded(true);
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    // Effect to initialize the Google token client once the script is loaded
    useEffect(() => {
        if (isGsiScriptLoaded && window.google && GOOGLE_CLIENT_ID) {
            const client = window.google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/calendar.readonly', callback: '' });
            setTokenClient(client);
        }
    }, [isGsiScriptLoaded]);

    // Effect to subscribe to Firestore data
    useEffect(() => {
        if (!user || !db) return;
        const basePath = `artifacts/${appId}/users/${user.uid}`;

        const projectsQuery = query(collection(db, `${basePath}/projects`));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsData);
            if (selectedProjectId && !snapshot.docs.some(doc => doc.id === selectedProjectId)) {
                setActiveView('dashboard');
                setSelectedProjectId(null);
            }
        });

        const tasksQuery = query(collection(db, `${basePath}/tasks`));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        
        const habitsQuery = query(collection(db, `${basePath}/habits`));
        const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        const goalsQuery = query(collection(db, `${basePath}/goals`));
        const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        const habitEntriesQuery = query(collection(db, `${basePath}/habit_entries`));
        const unsubscribeHabitEntries = onSnapshot(habitEntriesQuery, (snapshot) => setHabitEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        // Cleanup subscriptions on component unmount
        return () => {
            unsubscribeProjects();
            unsubscribeTasks();
            unsubscribeHabits();
            unsubscribeGoals();
            unsubscribeHabitEntries();
        };
    }, [user, selectedProjectId]); // Re-run if user changes

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [selectedProjectId, projects]);
    
    const handleSetView = (view, projectId = null) => {
        setActiveView(view);
        setSelectedProjectId(projectId);
    };

    return (
        <div className="bg-gray-900 text-gray-100 min-h-screen font-sans flex">
            <Sidebar onViewChange={handleSetView} projects={projects} goals={goals} userId={user.uid} handleSignOut={handleSignOut} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {activeView === 'dashboard' && <Dashboard projects={projects} tasks={tasks} goals={goals} onViewChange={handleSetView} syncedEvents={syncedEvents} />}
                {activeView === 'project' && selectedProject && <ProjectDetail project={selectedProject} allTasks={tasks} syncedEvents={syncedEvents} />}
                {activeView === 'all_tasks' && <AllTasksView tasks={tasks} projects={projects} />}
                {activeView === 'schedule' && <ScheduleView projects={projects} tasks={tasks} syncedEvents={syncedEvents} setSyncedEvents={setSyncedEvents} tokenClient={tokenClient} />}
                {activeView === 'habit_tracker' && <HabitTrackerView habits={habits} entries={habitEntries} />}
                {activeView === 'weekly_review' && <WeeklyReviewView tasks={tasks} projects={projects} habits={habits} entries={habitEntries} />}
            </main>
        </div>
    );
}

// --- Top-Level App Component (Handles Conditional Logic) ---
export default function App() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        if (!auth) {
            setIsAuthReady(true); // If firebase isn't configured, we can't check auth
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        if(auth) {
            await signOut(auth);
        }
    };

    if (!isFirebaseConfigured || !GOOGLE_CLIENT_ID) {
        return <ConfigurationNeeded missingFirebase={!isFirebaseConfigured} missingGoogle={!GOOGLE_CLIENT_ID} />;
    }

    if (!isAuthReady) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return user ? <HubApp user={user} handleSignOut={handleSignOut} /> : <LoginScreen />;
}

// --- Components ---
function Sidebar({ onViewChange, projects, goals, userId, handleSignOut }) {
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectType, setNewProjectType] = useState('Course');
    const [showGoalModal, setShowGoalModal] = useState(false);

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim() || !userId || !db) return;
        const project = { name: newProjectName, type: newProjectType, createdAt: new Date(), status: 'In Progress', progress: 0, goalId: null };
        try {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/projects`), project);
            setNewProjectName('');
            setIsAddingProject(false);
        } catch (error) {
            console.error("Error adding project:", error);
        }
    };

    const { standaloneProjects, goalProjects } = useMemo(() => {
        const standalone = projects.filter(p => !p.goalId);
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
            <aside className="w-64 bg-gray-900/50 border-r border-gray-700/50 p-4 flex flex-col">
                <div className="space-y-6 flex-1 overflow-y-auto">
                    <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2"><Book size={24} /> ProdHub</h1>
                    <nav className="space-y-2">
                        <button onClick={() => onViewChange('dashboard')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><CheckSquare size={20} /> Dashboard</button>
                        <button onClick={() => onViewChange('weekly_review')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><TrendingUp size={20} /> Weekly Review</button>
                        <button onClick={() => onViewChange('habit_tracker')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><Repeat size={20} /> Habit Tracker</button>
                        <button onClick={() => onViewChange('all_tasks')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><CheckSquare size={20} /> All Tasks</button>
                        <button onClick={() => onViewChange('schedule')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><Calendar size={20} /> Schedule</button>
                        
                        <div className="pt-4">
                            <h2 className="text-sm font-semibold text-gray-500 px-3 mb-2">Goals</h2>
                             <button onClick={() => setShowGoalModal(true)} className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-md text-purple-400 hover:bg-purple-900/50 transition-colors"><Sparkles size={20} /> AI Goal Planner</button>
                            {goals.map(goal => (
                                <GoalDropdown key={goal.id} goal={goal} projects={goalProjects[goal.id] || []} onViewChange={onViewChange} userId={userId} />
                            ))}
                        </div>

                        <div className="pt-4">
                            <h2 className="text-sm font-semibold text-gray-500 px-3 mb-2">Projects</h2>
                            {standaloneProjects.map(p => (
                                <button key={p.id} onClick={() => onViewChange('project', p.id)} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors truncate">
                                   <div className={`w-2 h-2 rounded-full ${p.type === 'Course' ? 'bg-green-400' : p.type === 'Seminar' ? 'bg-purple-400' : 'bg-yellow-400'}`}></div>
                                   {p.name}
                                </button>
                            ))}
                            <button onClick={() => setIsAddingProject(!isAddingProject)} className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-md text-blue-400 hover:bg-blue-900/50 transition-colors"><Plus size={20} /> Add Project</button>
                            {isAddingProject && (
                                <form onSubmit={handleAddProject} className="p-3 bg-gray-800 rounded-md mt-2 space-y-2">
                                    <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project Name" className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <select value={newProjectType} onChange={e => setNewProjectType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option>Course</option><option>Conference</option><option>Seminar</option><option>Bootcamp</option><option>Personal</option>
                                    </select>
                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-md py-1 text-sm font-semibold">Save</button>
                                </form>
                            )}
                        </div>
                    </nav>
                </div>
                <button onClick={handleSignOut} className="w-full flex-shrink-0 flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:bg-red-900/50 hover:text-red-300 transition-colors mt-4">
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

        // Delete the goal
        batch.delete(doc(db, `artifacts/${appId}/users/${userId}/goals`, goal.id));

        // Delete all projects and tasks associated with the goal
        for (const project of projects) {
            batch.delete(doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id));
            const tasksQuery = query(collection(db, `artifacts/${appId}/users/${userId}/tasks`), where("projectId", "==", project.id));
            const tasksSnapshot = await getDocs(tasksQuery);
            tasksSnapshot.forEach(taskDoc => batch.delete(taskDoc.ref));
        }
        await batch.commit();
    };

    return (
        <div className="text-sm">
            <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Delete Goal" message={`Are you sure you want to delete the goal "${goal.name}" and all its projects and tasks?`} />
            <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-700/50 group">
                {isEditing ? (
                    <form onSubmit={handleUpdate} className="flex-grow flex items-center gap-2">
                        <input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus />
                        <button type="submit" className="p-1 text-green-400 hover:text-white"><Save size={16} /></button>
                    </form>
                ) : (
                    <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 flex-grow text-left">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span className="font-semibold text-gray-200 truncate">{goal.name}</span>
                    </button>
                )}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white"><Edit2 size={16} /></button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
            </div>
            {isOpen && (
                <div className="pl-6 border-l-2 border-gray-700 ml-5 my-1">
                    {projects.map(p => (
                        <button key={p.id} onClick={() => onViewChange('project', p.id)} className="w-full text-left flex items-center gap-3 px-3 py-1.5 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors truncate">
                            <div className={`w-2 h-2 rounded-full ${p.type === 'Course' ? 'bg-green-400' : p.type === 'Seminar' ? 'bg-purple-400' : 'bg-yellow-400'}`}></div>
                            {p.name}
                        </button>
                    ))}
                     {projects.length === 0 && <p className="px-3 py-1.5 text-xs text-gray-500">No projects yet.</p>}
                </div>
            )}
        </div>
    );
}

function Dashboard({ projects, tasks, goals, onViewChange, syncedEvents }) {
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [dailyPlan, setDailyPlan] = useState('');
    const [isPlanning, setIsPlanning] = useState(false);
    const [planningError, setPlanningError] = useState('');

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayKey = getLocalDateKey(new Date());

    const upcomingTasks = tasks.filter(t => !t.completed && t.dueDate).map(t => ({...t, dueDateObj: new Date(t.dueDate)})).filter(t => t.dueDateObj >= today).sort((a, b) => a.dueDateObj - b.dueDateObj).slice(0, 5);
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today);

    const { standaloneProjects, goalProjects } = useMemo(() => {
        const standalone = projects.filter(p => !p.goalId);
        const grouped = projects.reduce((acc, project) => {
            if (project.goalId) {
                (acc[project.goalId] = acc[project.goalId] || []).push(project);
            }
            return acc;
        }, {});
        return { standaloneProjects: standalone, goalProjects: grouped };
    }, [projects]);

    const handlePlanMyDay = async () => {
        setShowPlanModal(true);
        setIsPlanning(true);
        setDailyPlan('');
        setPlanningError('');

        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            setPlanningError("Gemini API key is not configured.");
            setIsPlanning(false);
            return;
        }

        const todaysTasks = tasks.filter(t => !t.completed && t.dueDate === todayKey);
        const todaysEvents = syncedEvents.filter(e => getLocalDateKey(e.date) === todayKey);

        let context = `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.\n\n`;
        
        if(overdueTasks.length > 0) {
            context += "Here are the overdue tasks that need urgent attention:\n" + overdueTasks.map(t => `- ${t.title} (Priority: ${t.priority})`).join('\n') + '\n\n';
        }

        if(todaysTasks.length > 0) {
            context += "Here are the tasks scheduled for today:\n" + todaysTasks.map(t => `- ${t.title} (Priority: ${t.priority})`).join('\n') + '\n\n';
        }

        if(todaysEvents.length > 0) {
            context += "Here are the fixed appointments from the calendar:\n" + todaysEvents.map(e => `- ${e.title} at ${formatTime(e.date)}`).join('\n') + '\n\n';
        } else {
            context += "There are no events synced from the calendar for today. You can add them from the Schedule page for a better plan.\n\n"
        }

        if (overdueTasks.length === 0 && todaysTasks.length === 0 && todaysEvents.length === 0) {
            setDailyPlan("You have a clear schedule today! No overdue tasks, today's tasks, or calendar events. It's a great day to get ahead on a project or start planning your next steps.");
            setIsPlanning(false);
            return;
        }

        const prompt = `You are a productivity coach. Based on the following information, create a prioritized, motivational, and realistic schedule for the day. Group tasks logically, suggest breaks, and slot tasks around fixed appointments. Start with the most critical items.

        ${context}
        
        Generate a step-by-step plan.`;

        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                setDailyPlan(result.candidates[0].content.parts[0].text);
            } else {
                throw new Error("Received an invalid response from the AI.");
            }
        } catch (e) {
            console.error("AI Daily Planner Error:", e);
            setPlanningError(e.message || "An unexpected error occurred.");
        } finally {
            setIsPlanning(false);
        }
    };

    return (
        <>
            <DailyPlannerModal 
                isOpen={showPlanModal}
                onClose={() => setShowPlanModal(false)}
                plan={dailyPlan}
                isLoading={isPlanning}
                error={planningError}
                retry={handlePlanMyDay}
            />
            <div className="space-y-8">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                    <button onClick={handlePlanMyDay} disabled={isPlanning} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
                        {isPlanning ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Sparkles size={18} />}
                        Plan My Day
                    </button>
                </div>
                {overdueTasks.length > 0 && (
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                        <h2 className="text-xl font-semibold text-red-300 mb-3">Overdue Tasks ({overdueTasks.length})</h2>
                        <div className="space-y-2">{overdueTasks.map(task => <TaskItem key={task.id} task={task} projects={projects} isCompact={true} />)}</div>
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800/60 rounded-lg p-6 space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-200">Upcoming Deadlines</h2>
                        {upcomingTasks.length > 0 ? <div className="space-y-3">{upcomingTasks.map(task => <TaskItem key={task.id} task={task} projects={projects} isCompact={true} />)}</div> : <p className="text-gray-400">No upcoming deadlines. Great job!</p>}
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-6 space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-200">Projects Overview</h2>
                        <div className="space-y-4">
                            {goals.map(goal => (
                                <GoalProgress key={goal.id} goal={goal} projects={goalProjects[goal.id] || []} onViewChange={onViewChange} />
                            ))}
                            {standaloneProjects.map(p => (
                                <div key={p.id} className="cursor-pointer" onClick={() => onViewChange('project', p.id)}>
                                    <div className="flex justify-between items-center mb-1"><span className="font-medium text-gray-300">{p.name}</span><span className="text-sm text-gray-400">{Math.round(p.progress || 0)}%</span></div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${p.progress || 0}%` }}></div></div>
                                </div>
                            ))}
                            {projects.length === 0 && <p className="text-gray-400">No projects yet. Add one from the sidebar!</p>}
                        </div>
                    </div>
                </div>
                <DailyReminder />
            </div>
        </>
    );
}

function GoalProgress({ goal, projects, onViewChange }) {
    const [isOpen, setIsOpen] = useState(true);

    const goalProgress = useMemo(() => {
        if (!projects || projects.length === 0) return 0;
        const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
        return totalProgress / projects.length;
    }, [projects]);

    return (
        <div className="space-y-2">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-purple-300 flex items-center gap-2">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {goal.name}
                    </span>
                    <span className="text-sm text-gray-400">{Math.round(goalProgress)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${goalProgress}%` }}></div>
                </div>
            </button>
            {isOpen && (
                <div className="pl-6 space-y-3 pt-2">
                    {projects.map(p => (
                        <div key={p.id} className="cursor-pointer" onClick={() => onViewChange('project', p.id)}>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-gray-300">{p.name}</span>
                                <span className="text-xs text-gray-400">{Math.round(p.progress || 0)}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${p.progress || 0}%` }}></div></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


function ProjectDetail({ project, allTasks, syncedEvents }) {
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'Medium' });
    const [editingProject, setEditingProject] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [geminiError, setGeminiError] = useState('');
    const [showAiContextModal, setShowAiContextModal] = useState(false);

    const userId = auth.currentUser?.uid;
    const tasks = useMemo(() => allTasks.filter(t => t.projectId === project.id), [allTasks, project.id]);

    // Effect to update project progress when tasks change
    useEffect(() => {
        if (!userId || !project || !db) return;
        const completedTasks = tasks.filter(t => t.completed).length;
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
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id), { name: editingProject.name, type: editingProject.type });
        setEditingProject(null);
    };
    
    const handleDeleteProject = async () => {
        if (!userId || !db) return;
        setShowDeleteModal(null);
        // Batch delete tasks for efficiency (optional but good practice)
        for (const task of tasks) {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id));
        }
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id));
    };

    const handleGenerateTasks = async (customContext) => {
        setShowAiContextModal(false);
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            setGeminiError("Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your .env.local file.");
            return;
        }
        if (!userId || !db) return;
        setIsGenerating(true);
        setGeminiError('');

        const projectKeywords = project.name.toLowerCase().split(' ').filter(k => k.length > 2);
        const relevantEvents = syncedEvents.filter(event => {
            const eventTitle = event.title.toLowerCase();
            return projectKeywords.some(keyword => eventTitle.includes(keyword));
        });

        let calendarContext = "";
        if (relevantEvents.length > 0) {
            const eventList = relevantEvents.map(e => `- "${e.title}" on ${formatDate(e.date)}`).join('\n');
            calendarContext = `For background context, here are some of my upcoming, related events from my Google Calendar:\n${eventList}\n\n`;
        }
        
        const userContext = customContext ? `Your main instruction is: "${customContext}"\n\n` : "";

        const prompt = `You are a project planning assistant. Your primary goal is to generate a list of actionable to-do items based on the user's main instruction. Use the other information as background context.
        
        **Main Instruction from User:**
        ${userContext || "Break down the project into actionable steps."}

        **Background Context:**
        - Project Name: "${project.name}"
        - Project Type: "${project.type}"
        ${calendarContext}
        
        Based on the user's main instruction and the background context, generate a list of 5 to 7 to-do items. For each item, provide a title and estimate its difficulty as 'High', 'Medium', or 'Low'. Do not create tasks that are identical to the calendar events, but rather tasks that lead up to them.`;
        
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { tasks: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, priority: { type: "STRING", enum: ["High", "Medium", "Low"] } }, required: ["title", "priority"] } } }, required: ["tasks"] } } };
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const result = await response.json();
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const generated = JSON.parse(result.candidates[0].content.parts[0].text);
                if (generated.tasks && generated.tasks.length > 0) {
                    for (const task of generated.tasks) {
                        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), { title: task.title, priority: task.priority, projectId: project.id, completed: false, createdAt: new Date(), dueDate: '' });
                    }
                }
            } else { throw new Error("No tasks were generated."); }
        } catch (error) {
            console.error("Gemini API error:", error);
            setGeminiError(error.message || "An error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <AiContextModal isOpen={showAiContextModal} onClose={() => setShowAiContextModal(false)} onConfirm={handleGenerateTasks} />
            <ConfirmModal isOpen={showDeleteModal === 'project'} onClose={() => setShowDeleteModal(null)} onConfirm={handleDeleteProject} title="Delete Project" message={`Are you sure you want to delete "${project.name}" and all its tasks?`} />
            {editingProject ? (
                <form onSubmit={handleUpdateProject} className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg">
                    <input type="text" value={editingProject.name} onChange={e => setEditingProject({...editingProject, name: e.target.value})} className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <select value={editingProject.type} onChange={e => setEditingProject({...editingProject, type: e.target.value})} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"><option>Course</option><option>Conference</option><option>Seminar</option><option>Bootcamp</option><option>Personal</option></select>
                    <button type="submit" className="p-2 bg-green-600 hover:bg-green-700 rounded-md"><Save size={20} /></button>
                    <button onClick={() => setEditingProject(null)} className="p-2 bg-gray-600 hover:bg-gray-700 rounded-md"><X size={20} /></button>
                </form>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4"><h1 className="text-4xl font-bold text-white">{project.name}</h1><span className="text-sm font-medium bg-blue-900/70 text-blue-300 px-3 py-1 rounded-full">{project.type}</span></div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setEditingProject({...project})} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md"><Edit2 size={20} /></button>
                        <button onClick={() => setShowDeleteModal('project')} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-md"><Trash2 size={20} /></button>
                    </div>
                </div>
            )}
            <div>
                <div className="flex justify-between items-center mb-1"><span className="text-sm font-medium text-gray-400">Progress</span><span className="text-sm font-medium text-white">{Math.round(project.progress || 0)}%</span></div>
                <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }}></div></div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-6">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">To-Do List</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAiContextModal(true)} disabled={isGenerating} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-semibold transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed">
                            {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Sparkles size={18} />}
                            {isGenerating ? 'Generating...' : '✨ Generate Tasks'}
                        </button>
                        <button onClick={() => setIsAddingTask(!isAddingTask)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold transition-colors"><Plus size={18} /> {isAddingTask ? 'Cancel' : 'Add Task'}</button>
                    </div>
                </div>
                {geminiError && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4 text-sm">{geminiError}</div>}
                {isAddingTask && (
                    <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-900/50 rounded-md">
                        <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Task title..." className="md:col-span-2 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <div className="grid grid-cols-2 gap-2">
                           <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                           <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"><option>High</option><option>Medium</option><option>Low</option></select>
                        </div>
                        <button type="submit" className="md:col-span-3 w-full bg-green-600 hover:bg-green-700 rounded-md py-2 font-semibold">Save Task</button>
                    </form>
                )}
                <div className="space-y-3">
                    {tasks.length > 0 ? tasks.sort((a,b) => a.completed - b.completed).map(task => <TaskItem key={task.id} task={task} />) : <p className="text-gray-400 text-center py-4">No tasks for this project yet. Try generating some with AI!</p>}
                </div>
            </div>
        </div>
    );
}

function AllTasksView({ tasks, projects }) {
    const [filter, setFilter] = useState('All');
    const [sortBy, setSortBy] = useState('dueDate');
    const filteredAndSortedTasks = useMemo(() => {
        let filtered = tasks;
        if (filter === 'Active') filtered = tasks.filter(t => !t.completed);
        if (filter === 'Completed') filtered = tasks.filter(t => t.completed);
        return [...filtered].sort((a, b) => {
            if (sortBy === 'dueDate') return (a.dueDate ? new Date(a.dueDate) : new Date('2999-12-31')) - (b.dueDate ? new Date(b.dueDate) : new Date('2999-12-31'));
            if (sortBy === 'priority') { const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 }; return priorityOrder[a.priority] - priorityOrder[b.priority]; }
            if (sortBy === 'project') { const projectA = projects.find(p => p.id === a.projectId)?.name || ''; const projectB = projects.find(p => p.id === b.projectId)?.name || ''; return projectA.localeCompare(projectB); }
            return 0;
        });
    }, [tasks, projects, filter, sortBy]);
    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white">All Tasks</h1>
            <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-800/60 rounded-lg">
                <div><span className="text-sm font-medium text-gray-400 mr-2">Filter by:</span><select onChange={(e) => setFilter(e.target.value)} value={filter} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"><option>All</option><option>Active</option><option>Completed</option></select></div>
                <div><span className="text-sm font-medium text-gray-400 mr-2">Sort by:</span><select onChange={(e) => setSortBy(e.target.value)} value={sortBy} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="dueDate">Due Date</option><option value="priority">Priority</option><option value="project">Project</option></select></div>
            </div>
            <div className="space-y-3">{filteredAndSortedTasks.length > 0 ? filteredAndSortedTasks.map(task => <TaskItem key={task.id} task={task} projects={projects} />) : <p className="text-gray-400 text-center py-8">No tasks found.</p>}</div>
        </div>
    );
}

function ScheduleView({ projects, tasks, syncedEvents, setSyncedEvents, tokenClient }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSync = () => {
        if (tokenClient) {
            tokenClient.callback = async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    setIsLoading(true);
                    setError(null);
                    try {
                        const startTime = new Date().toISOString();
                        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startTime}&singleEvents=true&orderBy=startTime`, {
                            headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` },
                        });
                        if (!response.ok) throw new Error('Failed to fetch calendar events.');
                        const data = await response.json();
                        const formattedEvents = data.items
                            .filter(item => !(item.summary && item.summary.toLowerCase().includes('birthday')))
                            .map(item => ({
                                id: `gcal-${item.id}`,
                                title: item.summary,
                                date: item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date),
                                type: 'Google Calendar',
                                color: 'bg-red-500'
                            }));
                        setSyncedEvents(formattedEvents);
                    } catch (e) {
                        setError('Could not fetch events. Please try again.');
                        console.error(e);
                    } finally {
                        setIsLoading(false);
                    }
                }
            };
            tokenClient.requestAccessToken();
        } else {
            setError("Google Auth is not ready. Please wait a moment and try again.");
        }
    };
    
    const allEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today for accurate overdue comparison

        const projectEvents = projects.map(p => ({
            id: `proj-${p.id}`,
            title: p.name,
            date: p.deadline ? new Date(p.deadline) : null,
            type: 'Project Deadline',
            color: 'bg-purple-500'
        }));

        const taskEvents = tasks
            .filter(t => !t.completed) // 1. Filter out completed tasks
            .map(t => {
                const dueDate = t.dueDate ? new Date(t.dueDate) : null;
                const isOverdue = dueDate && dueDate < today; // 2. Check if task is overdue
                return {
                    id: `task-${t.id}`,
                    title: t.title,
                    date: dueDate,
                    type: 'Task Deadline',
                    color: isOverdue ? 'bg-red-700' : 'bg-green-500', // 3. Assign color based on overdue status
                    isOverdue: isOverdue
                };
            });

        return [...projectEvents, ...taskEvents, ...syncedEvents]
            .filter(e => e.date && !isNaN(e.date))
            .sort((a, b) => a.date - b.date);
    }, [projects, tasks, syncedEvents]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">Schedule</h1>
                <button onClick={handleSync} disabled={isLoading || !tokenClient} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-semibold transition-colors disabled:bg-red-800 disabled:cursor-not-allowed">
                    {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>}
                    {isLoading ? 'Syncing...' : (syncedEvents.length > 0 ? 'Refresh Calendar' : 'Sync with Google Calendar')}
                </button>
            </div>
            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm">{error}</div>}
            <div className="bg-gray-800/60 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Upcoming Deadlines & Events</h2>
                <div className="space-y-4">
                    {allEvents.length > 0 ? allEvents.map(event => (
                        <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-md">
                            <div className="flex flex-col items-center justify-center w-20 text-center">
                                <span className="text-sm text-gray-400">{event.date.toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-2xl font-bold">{event.date.getDate()}</span>
                            </div>
                            <div className={`w-1.5 h-12 rounded-full ${event.color}`}></div>
                            <div>
                                <p className="font-semibold text-gray-200">{event.title}</p>
                                <p className="text-sm text-gray-400">
                                    {event.type}
                                    {event.isOverdue && <span className="font-semibold text-red-400"> (Overdue)</span>}
                                    {event.type === 'Google Calendar' && ` at ${formatTime(event.date)}`}
                                </p>
                            </div>
                        </div>
                    )) : <p className="text-gray-400">No scheduled events with deadlines.</p>}
                </div>
            </div>
        </div>
    );
}

function TaskItem({ task, projects = [], isCompact = false }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editPriority, setEditPriority] = useState(task.priority || 'Medium');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const userId = auth.currentUser?.uid;

    const handleToggleComplete = async () => {
        if (!userId || !db) return;
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id), { completed: !task.completed, completedAt: !task.completed ? new Date() : null });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!userId || !editTitle.trim() || !db) return;
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id), { 
            title: editTitle,
            priority: editPriority
        });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!userId || !db) return;
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id));
        setShowDeleteModal(false);
    };

    const projectName = projects.find(p => p.id === task.projectId)?.name;
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
            <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Delete Task" message={`Are you sure you want to delete this task: "${task.title}"?`} />
            <div className={`p-3 rounded-md transition-colors flex items-start gap-3 ${task.completed ? 'bg-gray-800/50' : 'bg-gray-900/50'}`}>
                <button onClick={handleToggleComplete} className="mt-1">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                        {task.completed && <CheckSquare size={16} className="text-white" />}
                    </div>
                </button>
                <div className="flex-grow">
                    {isEditing ? (
                        <form onSubmit={handleUpdate} className="flex gap-2 items-center">
                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus />
                            <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option>High</option><option>Medium</option><option>Low</option>
                            </select>
                            <button type="submit" className="p-1.5 bg-green-600 hover:bg-green-700 rounded-md"><Save size={16} /></button>
                        </form>
                    ) : (
                        <p className={`text-gray-200 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        {task.dueDate && <div className="flex items-center gap-1"><Calendar size={12} /> {formatDate(new Date(task.dueDate))}</div>}
                        {task.priority && <div className={`flex items-center gap-1 font-semibold ${priorityColor[task.priority]}`}><Tag size={12} /> {task.priority}</div>}
                        {projectName && <div className="flex items-center gap-1"><Book size={12} /> {projectName}</div>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md"><Edit2 size={16} /></button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-md"><Trash2 size={16} /></button>
                </div>
            </div>
        </>
    );
}

function HabitTrackerView({ habits, entries }) {
    const [newHabitName, setNewHabitName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const userId = auth.currentUser?.uid;

    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim() || !userId || !db) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/habits`), { name: newHabitName, createdAt: new Date() });
        setNewHabitName('');
        setIsAdding(false);
    };
    
    const habitStreaks = useMemo(() => {
        const streaks = {};
        habits.forEach(habit => {
            const habitEntries = entries
                .filter(e => e.habitId === habit.id && e.completed)
                .map(e => e.date)
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
                        const next = new Date(habitEntries[i+1]);
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
                    <button onClick={() => setShowAnalytics(!showAnalytics)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md font-semibold transition-colors">
                        <TrendingUp size={18} /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                    </button>
                    <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold transition-colors">
                        <Plus size={18} /> {isAdding ? 'Cancel' : 'New Habit'}
                    </button>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleAddHabit} className="flex gap-2 p-4 bg-gray-800 rounded-lg">
                    <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="e.g., Read for 30 minutes" className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold">Save</button>
                </form>
            )}

            {showAnalytics && (
                <div className="bg-gray-800/60 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Habit Analytics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {habits.map(habit => <HabitCalendar key={habit.id} habit={habit} entries={entries.filter(e => e.habitId === habit.id)} />)}
                       {habits.length === 0 && <p className="text-gray-400 md:col-span-3 text-center">No habits to analyze yet.</p>}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habits.length === 0 && !isAdding && (<p className="text-gray-400 md:col-span-3 text-center py-8">No habits defined yet. Add your first one!</p>)}
                {habits.map(habit => (<HabitDayCard key={habit.id} habit={habit} entries={entries.filter(e => e.habitId === habit.id)} streak={habitStreaks[habit.id] || 0} />))}
            </div>
        </div>
    );
}

function HabitDayCard({ habit, entries, streak }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(habit.name);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const userId = auth.currentUser?.uid;
    const todayKey = getLocalDateKey(new Date());
    const entry = entries.find(e => e.date === todayKey);
    const isCompleted = entry ? entry.completed : false;

    const handleHabitToggle = async () => {
        if (!userId || !db) return;
        if (entry) {
            await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/habit_entries`, entry.id), { completed: !isCompleted });
        } else {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/habit_entries`), { habitId: habit.id, date: todayKey, completed: true });
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
            console.error("Error updating habit:", error);
        }
    };

    const handleDeleteHabit = async () => {
        if (!userId || !db) return;
        setShowDeleteModal(false);
        
        const entriesPath = `artifacts/${appId}/users/${userId}/habit_entries`;
        const q = query(collection(db, entriesPath), where("habitId", "==", habit.id));
        
        try {
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            const habitRef = doc(db, `artifacts/${appId}/users/${userId}/habits`, habit.id);
            await deleteDoc(habitRef);
        } catch (error) {
            console.error("Error deleting habit and its entries:", error);
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
                            onChange={e => setEditedName(e.target.value)}
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
                            <Flame size={16} />
                            <span>{streak} day streak</span>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={handleHabitToggle} 
                    disabled={isEditing}
                    className={`w-full mt-4 py-2 rounded-md font-semibold transition-colors ${isCompleted ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'} disabled:bg-gray-800 disabled:cursor-not-allowed`}
                >
                    {isCompleted ? "Completed Today!" : "Mark as Done"}
                </button>
            </div>
        </>
    );
}

function HabitCalendar({ habit, entries }) {
    const today = new Date();
    const [date, setDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const goToPreviousMonth = () => {
        setDate(currentDate => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setDate(currentDate => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const completedDates = useMemo(() => new Set(entries.filter(e => e.completed).map(e => e.date)), [entries]);

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                 <button onClick={goToPreviousMonth} className="p-1 rounded-md hover:bg-gray-700">&lt;</button>
                 <h3 className="font-semibold text-center text-sm">
                    {habit.name} - {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
                 </h3>
                 <button onClick={goToNextMonth} className="p-1 rounded-md hover:bg-gray-700">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {blanks.map((b, i) => <div key={`b-${i}`}></div>)}
                {days.map(d => {
                    const dateKey = getLocalDateKey(new Date(date.getFullYear(), date.getMonth(), d));
                    const isCompleted = completedDates.has(dateKey);
                    const isToday = dateKey === getLocalDateKey(new Date());
                    return (
                        <div key={d} className={`w-full aspect-square flex items-center justify-center rounded-full text-xs ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                            {d}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function WeeklyReviewView({ tasks, projects, habits, entries }) {
    const lastWeek = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { start, end };
    }, []);

    const completedTasks = tasks.filter(t => t.completed && t.completedAt && t.completedAt.toDate() >= lastWeek.start);
    
    const habitConsistency = useMemo(() => {
        if (habits.length === 0) return 0;
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return getLocalDateKey(d);
        });
        
        let totalPossible = habits.length * 7;
        let totalCompleted = 0;
        
        last7Days.forEach(dateKey => {
            habits.forEach(habit => {
                if (entries.some(e => e.habitId === habit.id && e.date === dateKey && e.completed)) {
                    totalCompleted++;
                }
            });
        });
        return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    }, [habits, entries]);

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-white">Weekly Review</h1>
            <p className="text-gray-400">Summary of your activity from {formatDate(lastWeek.start)} to {formatDate(lastWeek.end)}.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/60 p-6 rounded-lg text-center">
                    <p className="text-gray-400 text-sm">Tasks Completed</p>
                    <p className="text-5xl font-bold text-green-400">{completedTasks.length}</p>
                </div>
                 <div className="bg-gray-800/60 p-6 rounded-lg text-center">
                    <p className="text-gray-400 text-sm">Habit Consistency</p>
                    <p className="text-5xl font-bold text-orange-400">{habitConsistency}%</p>
                </div>
            </div>

            <div className="bg-gray-800/60 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">Completed Tasks This Week</h2>
                {completedTasks.length > 0 ? (
                    <div className="space-y-2">
                        {completedTasks.map(task => <TaskItem key={task.id} task={task} projects={projects} isCompact />)}
                    </div>
                ) : <p className="text-gray-400">No tasks completed this week. Let's get to it!</p>}
            </div>
        </div>
    );
}

function DailyReminder() {
    const [showReminder, setShowReminder] = useState(true);
    if (!showReminder) return null;
    return (
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 flex items-start gap-4">
            <Clock size={24} className="text-blue-300 mt-1 flex-shrink-0" />
            <div className="flex-grow">
                <h3 className="font-semibold text-blue-200">Daily Reminder</h3>
                <p className="text-sm text-blue-300">Don't forget to review your goals for the day and plan your tasks. A little planning goes a long way!</p>
            </div>
            <button onClick={() => setShowReminder(false)} className="p-1 text-blue-300 hover:text-white"><X size={20} /></button>
        </div>
    );
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 font-semibold transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 font-semibold text-white transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
}

function AiContextModal({ isOpen, onClose, onConfirm }) {
    const [context, setContext] = useState('');

    const handleConfirm = () => {
        onConfirm(context);
        setContext('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-white mb-4">Add Extra Context</h2>
                <p className="text-gray-300 mb-4">Provide any additional details or instructions for the AI to generate more relevant tasks.</p>
                <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., Focus on the marketing aspects..."
                    className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 font-semibold transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold text-white transition-colors">
                        Generate Tasks
                    </button>
                </div>
            </div>
        </div>
    );
}

function GoalPlannerModal({ isOpen, onClose, userId }) {
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleGeneratePlan = async () => {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            setError("Gemini API key is not configured.");
            return;
        }
        if (!goal.trim()) {
            setError("Please enter a goal.");
            return;
        }
        setIsGenerating(true);
        setError('');

        const prompt = `You are an expert project planner. A user has a high-level goal: "${goal}". 
        
        Your task is to decompose this goal into a series of 2 to 4 smaller, actionable projects. For each project, you must also generate a list of 3 to 5 specific tasks to complete it.
        
        The output must be a JSON object. For each project, provide a 'name' and a 'type' (e.g., "Course", "Personal", "Bootcamp"). For each task, provide a 'title' and a 'priority' ('High', 'Medium', or 'Low').`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        projects: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    name: { type: "STRING" },
                                    type: { type: "STRING", enum: ["Course", "Conference", "Seminar", "Bootcamp", "Personal"] },
                                    tasks: {
                                        type: "ARRAY",
                                        items: {
                                            type: "OBJECT",
                                            properties: {
                                                title: { type: "STRING" },
                                                priority: { type: "STRING", enum: ["High", "Medium", "Low"] }
                                            },
                                            required: ["title", "priority"]
                                        }
                                    }
                                },
                                required: ["name", "type", "tasks"]
                            }
                        }
                    },
                    required: ["projects"]
                }
            }
        };

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const plan = JSON.parse(result.candidates[0].content.parts[0].text);
                if (plan.projects && plan.projects.length > 0) {
                    const batch = writeBatch(db);
                    
                    // 1. Create the Goal
                    const goalRef = doc(collection(db, `artifacts/${appId}/users/${userId}/goals`));
                    batch.set(goalRef, { name: goal, createdAt: new Date() });

                    // 2. Create Projects and Tasks
                    plan.projects.forEach(proj => {
                        const projectRef = doc(collection(db, `artifacts/${appId}/users/${userId}/projects`));
                        batch.set(projectRef, {
                            name: proj.name,
                            type: proj.type,
                            goalId: goalRef.id,
                            createdAt: new Date(),
                            status: 'In Progress',
                            progress: 0
                        });

                        proj.tasks.forEach(task => {
                            const taskRef = doc(collection(db, `artifacts/${appId}/users/${userId}/tasks`));
                            batch.set(taskRef, {
                                ...task,
                                projectId: projectRef.id,
                                completed: false,
                                createdAt: new Date(),
                                dueDate: ''
                            });
                        });
                    });

                    await batch.commit();
                    setGoal('');
                    onClose();
                } else {
                    throw new Error("The AI did not generate any projects for this goal.");
                }
            } else {
                throw new Error("Received an invalid response from the AI.");
            }
        } catch (e) {
            console.error("AI Goal Planner Error:", e);
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">AI Goal Planner</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                <p className="text-gray-300 mb-4">Describe a high-level goal, and the AI will break it down into actionable projects and tasks for you.</p>
                <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Learn web development in 6 months"
                    className="w-full h-28 bg-gray-700 border border-gray-600 rounded-md p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 font-semibold transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleGeneratePlan} disabled={isGenerating} className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold text-white transition-colors flex items-center gap-2 disabled:bg-purple-800 disabled:cursor-not-allowed">
                        {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Sparkles size={18} />}
                        {isGenerating ? 'Generating Plan...' : 'Generate Plan'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DailyPlannerModal({ isOpen, onClose, plan, isLoading, error, retry }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Your Daily Plan</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto flex-grow pr-2">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-lg text-gray-300">Your AI assistant is planning your day...</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center h-64 flex flex-col justify-center items-center">
                            <p className="text-red-400 mb-4">Error: {error}</p>
                            <button onClick={retry} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 font-semibold transition-colors">
                                Try Again
                            </button>
                        </div>
                    )}
                    {plan && (
                        <div className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: plan.replace(/\n/g, '<br />') }}>
                        </div>
                    )}
                </div>
                <div className="flex justify-end mt-6">
                     <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 font-semibold transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
