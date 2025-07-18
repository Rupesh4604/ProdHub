import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Book, Calendar, CheckSquare, Clock, Edit2, Info, LogOut, Plus, Repeat, Save, Sparkles, Tag, Trash2, X } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual key
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const appId = 'my-prod-hub';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// --- Firebase Initialization ---
let app;
let auth;
let db;
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

// --- Helper Functions ---
const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : date.toDate();
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

const getLocalDateKey = (date) => {
    const d = new Date(date);
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
        {missingFirebase && <div className="text-left bg-gray-800 p-4 rounded-md mb-4"><p className="text-gray-300 mb-2"><strong>Firebase Config Missing...</strong></p></div>}
        {missingGoogle && <div className="text-left bg-gray-800 p-4 rounded-md"><p className="text-gray-300 mb-2"><strong>Google Client ID Missing...</strong></p></div>}
      </div>
    </div>
  );
}

// --- NEW Login Screen Component ---
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
    const [habitEntries, setHabitEntries] = useState([]);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    
    const [syncedEvents, setSyncedEvents] = useState([]);
    const [tokenClient, setTokenClient] = useState(null);
    const [isGsiScriptLoaded, setIsGsiScriptLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setIsGsiScriptLoaded(true);
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    useEffect(() => {
        if (isGsiScriptLoaded && window.google) {
            const client = window.google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/calendar.readonly', callback: '' });
            setTokenClient(client);
        }
    }, [isGsiScriptLoaded]);

    useEffect(() => {
        if (!user) return;
        const projectsPath = `artifacts/${appId}/users/${user.uid}/projects`;
        const projectsQuery = query(collection(db, projectsPath));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsData);
            if (selectedProjectId && !snapshot.docs.some(doc => doc.id === selectedProjectId)) {
                setActiveView('dashboard');
                setSelectedProjectId(null);
            }
        });
        const tasksPath = `artifacts/${appId}/users/${user.uid}/tasks`;
        const tasksQuery = query(collection(db, tasksPath));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const habitsPath = `artifacts/${appId}/users/${user.uid}/habits`;
        const habitsQuery = query(collection(db, habitsPath));
        const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const habitEntriesPath = `artifacts/${appId}/users/${user.uid}/habit_entries`;
        const habitEntriesQuery = query(collection(db, habitEntriesPath));
        const unsubscribeHabitEntries = onSnapshot(habitEntriesQuery, (snapshot) => setHabitEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => {
            unsubscribeProjects();
            unsubscribeTasks();
            unsubscribeHabits();
            unsubscribeHabitEntries();
        };
    }, [user, selectedProjectId]);

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [selectedProjectId, projects]);
    const handleSetView = (view, projectId = null) => {
        setActiveView(view);
        setSelectedProjectId(projectId);
    };

    return (
        <div className="bg-gray-900 text-gray-100 min-h-screen font-sans flex">
            <Sidebar onViewChange={handleSetView} projects={projects} userId={user.uid} handleSignOut={handleSignOut} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {activeView === 'dashboard' && <Dashboard projects={projects} tasks={tasks} onViewChange={handleSetView} />}
                {activeView === 'project' && selectedProject && <ProjectDetail project={selectedProject} allTasks={tasks} syncedEvents={syncedEvents} />}
                {activeView === 'all_tasks' && <AllTasksView tasks={tasks} projects={projects} />}
                {activeView === 'schedule' && <ScheduleView projects={projects} tasks={tasks} syncedEvents={syncedEvents} setSyncedEvents={setSyncedEvents} tokenClient={tokenClient} />}
                {activeView === 'habit_tracker' && <HabitTrackerView habits={habits} entries={habitEntries} />}
            </main>
        </div>
    );
}

// --- Top-Level App Component (Handles Conditional Logic) ---
export default function App() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await signOut(auth);
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
function Sidebar({ onViewChange, projects, userId, handleSignOut }) {
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectType, setNewProjectType] = useState('Course');

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim() || !userId) return;
        const project = { name: newProjectName, type: newProjectType, createdAt: new Date(), status: 'In Progress', progress: 0 };
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/projects`), project);
        setNewProjectName('');
        setIsAddingProject(false);
    };

    return (
        <aside className="w-64 bg-gray-900/50 border-r border-gray-700/50 p-4 flex flex-col">
            <div className="space-y-6 flex-1">
                <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2"><Book size={24} /> ProdHub</h1>
                <nav className="space-y-2">
                    <button onClick={() => onViewChange('dashboard')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><CheckSquare size={20} /> Dashboard</button>
                    <button onClick={() => onViewChange('habit_tracker')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><Repeat size={20} /> Habit Tracker</button>
                    <button onClick={() => onViewChange('all_tasks')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><CheckSquare size={20} /> All Tasks</button>
                    <button onClick={() => onViewChange('schedule')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700/50 transition-colors"><Calendar size={20} /> Schedule</button>
                    <div className="pt-4">
                        <h2 className="text-sm font-semibold text-gray-500 px-3 mb-2">Projects</h2>
                        {projects.map(p => (
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
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:bg-red-900/50 hover:text-red-300 transition-colors mt-4">
                <LogOut size={20} /> Sign Out
            </button>
        </aside>
    );
}

function Dashboard({ projects, tasks, onViewChange }) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcomingTasks = tasks.filter(t => !t.completed && t.dueDate).map(t => ({...t, dueDateObj: new Date(t.dueDate)})).filter(t => t.dueDateObj >= today).sort((a, b) => a.dueDateObj - b.dueDateObj).slice(0, 5);
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today);

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
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
                        {projects.length > 0 ? projects.map(p => (
                            <div key={p.id} className="cursor-pointer" onClick={() => onViewChange('project', p.id)}>
                                <div className="flex justify-between items-center mb-1"><span className="font-medium text-gray-300">{p.name}</span><span className="text-sm text-gray-400">{Math.round(p.progress || 0)}%</span></div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${p.progress || 0}%` }}></div></div>
                            </div>
                        )) : <p className="text-gray-400">No projects yet. Add one from the sidebar!</p>}
                    </div>
                </div>
            </div>
            <DailyReminder />
        </div>
    );
}

// --- UPDATED ProjectDetail Component ---
function ProjectDetail({ project, allTasks, syncedEvents }) {
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'Medium' });
    const [editingProject, setEditingProject] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [geminiError, setGeminiError] = useState('');

    const userId = auth.currentUser?.uid;
    const tasks = useMemo(() => allTasks.filter(t => t.projectId === project.id), [allTasks, project.id]);

    useEffect(() => {
        if (!userId || !project) return;
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
        if (!newTask.title.trim() || !userId) return;
        const task = { ...newTask, projectId: project.id, completed: false, createdAt: new Date() };
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), task);
        setNewTask({ title: '', dueDate: '', priority: 'Medium' });
        setIsAddingTask(false);
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        if (!editingProject.name.trim() || !userId) return;
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id), { name: editingProject.name, type: editingProject.type });
        setEditingProject(null);
    };
    
    const handleDeleteProject = async () => {
        if (!userId) return;
        setShowDeleteModal(null);
        for (const task of tasks) {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id));
        }
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id));
    };

    const handleGenerateTasks = async () => {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            setGeminiError("Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your .env.local file.");
            return;
        }
        if (!userId) return;
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
            calendarContext = `To help you, here are some of my upcoming, related events from my Google Calendar:\n${eventList}\n\n`;
        }

        const prompt = `I'm planning a project called "${project.name}", which is a ${project.type}. ${calendarContext}Based on the project goal (and the calendar events, if provided), break this project down into a list of 5 to 7 actionable to-do items. For each item, provide a title and estimate its difficulty as 'High', 'Medium', or 'Low'. The tasks should be concise and help me prepare. Do not create tasks that are identical to the calendar events, but rather tasks that lead up to them.`;
        
        const payload = { 
            contents: [{ role: "user", parts: [{ text: prompt }] }], 
            generationConfig: { 
                responseMimeType: "application/json", 
                responseSchema: { 
                    type: "OBJECT", 
                    properties: { 
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
                    required: ["tasks"] 
                } 
            } 
        };
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const result = await response.json();
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
                            dueDate: '' 
                        });
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
                        <button onClick={handleGenerateTasks} disabled={isGenerating} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-semibold transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed">
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
        const projectEvents = projects.map(p => ({ id: `proj-${p.id}`, title: p.name, date: p.deadline ? new Date(p.deadline) : null, type: 'Project Deadline', color: 'bg-purple-500' }));
        const taskEvents = tasks.map(t => ({ id: `task-${t.id}`, title: t.title, date: t.dueDate ? new Date(t.dueDate) : null, type: 'Task Deadline', color: 'bg-green-500' }));
        return [...projectEvents, ...taskEvents, ...syncedEvents].filter(e => e.date && !isNaN(e.date)).sort((a, b) => a.date - b.date);
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
                            <div><p className="font-semibold text-gray-200">{event.title}</p><p className="text-sm text-gray-400">{event.type}</p></div>
                        </div>
                    )) : <p className="text-gray-400">No scheduled events with deadlines.</p>}
                </div>
            </div>
        </div>
    );
}

// --- UPDATED TaskItem Component ---
function TaskItem({ task, projects = [], isCompact = false }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editPriority, setEditPriority] = useState(task.priority);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const userId = auth.currentUser?.uid;

    const handleToggleComplete = async () => {
        if (!userId) return;
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id), { completed: !task.completed });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!userId || !editTitle.trim()) return;
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id), { 
            title: editTitle,
            priority: editPriority
        });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!userId) return;
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
    const userId = auth.currentUser?.uid;

    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim() || !userId) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/habits`), { name: newHabitName, createdAt: new Date() });
        setNewHabitName('');
        setIsAdding(false);
    };
    
    const groupedEntries = useMemo(() => {
        return entries.reduce((acc, entry) => {
            if (!acc[entry.date]) acc[entry.date] = [];
            acc[entry.date].push(entry);
            return acc;
        }, {});
    }, [entries]);

    const todayKey = getLocalDateKey(new Date());
    if (!groupedEntries[todayKey] && habits.length > 0) {
        groupedEntries[todayKey] = [];
    }
    
    const sortedDateKeys = Object.keys(groupedEntries).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">Habit Tracker</h1>
                <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold transition-colors"><Plus size={18} /> {isAdding ? 'Cancel' : 'New Habit'}</button>
            </div>
            {isAdding && (
                <form onSubmit={handleAddHabit} className="flex gap-2 p-4 bg-gray-800 rounded-lg">
                    <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="e.g., Read for 30 minutes" className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold">Save</button>
                </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habits.length === 0 && !isAdding && (<p className="text-gray-400 md:col-span-3 text-center py-8">No habits defined yet. Add your first one!</p>)}
                {sortedDateKeys.map(dateKey => (<HabitDayCard key={dateKey} dateKey={dateKey} habits={habits} entries={groupedEntries[dateKey] || []} />))}
            </div>
        </div>
    );
}

function HabitDayCard({ dateKey, habits, entries }) {
    const userId = auth.currentUser?.uid;

    const handleHabitToggle = async (habitId, isCompleted) => {
        if (!userId) return;
        const entryQuery = query(collection(db, `artifacts/${appId}/users/${userId}/habit_entries`), where("habitId", "==", habitId), where("date", "==", dateKey));
        const existingEntries = await getDocs(entryQuery);
        if (existingEntries.empty) {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/habit_entries`), { habitId, date: dateKey, completed: isCompleted });
        } else {
            await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/habit_entries`, existingEntries.docs[0].id), { completed: isCompleted });
        }
    };

    const displayDate = useMemo(() => {
        const today = getLocalDateKey(new Date());
        const yesterday = getLocalDateKey(new Date(Date.now() - 86400000));
        if (dateKey === today) return "Today";
        if (dateKey === yesterday) return "Yesterday";
        return formatDate(new Date(dateKey));
    }, [dateKey]);

    return (
        <div className="bg-gray-800/60 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-white">{displayDate}</h3>
            <div className="space-y-2">
                {habits.map(habit => {
                    const entry = entries.find(e => e.habitId === habit.id);
                    const isCompleted = entry ? entry.completed : false;
                    return (
                        <div key={habit.id} className="flex items-center gap-3">
                            <button onClick={() => handleHabitToggle(habit.id, !isCompleted)}>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-gray-400'}`}>
                                    {isCompleted && <CheckSquare size={16} className="text-white" />}
                                </div>
                            </button>
                            <span className={`text-gray-300 ${isCompleted ? 'line-through text-gray-500' : ''}`}>{habit.name}</span>
                        </div>
                    );
                })}
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
