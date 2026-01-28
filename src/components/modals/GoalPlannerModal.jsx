import React, { useState } from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { callGeminiWithRetry } from '../../services/geminiService';
import { GEMINI_API_KEY, appId } from '../../config/env';
import { db } from '../../config/firebase';

export default function GoalPlannerModal({ isOpen, onClose, userId }) {
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePlan = async () => {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      setError('Gemini API key is not configured.');
      return;
    }
    if (!goal.trim()) {
      setError('Please enter a goal.');
      return;
    }
    setIsGenerating(true);
    setError('');

    const prompt = `You are an expert project planner. A user has a high-level goal: "${goal}".

Your task is to decompose this goal into a series of 2 to 4 smaller, actionable projects. For each project, you must also generate a list of 3 to 5 specific tasks to complete it.

The output must be a JSON object. For each project, provide a 'name' and a 'type' (e.g., "Course", "Personal", "Bootcamp"). For each task, provide a 'title' and a 'priority' ('High', 'Medium', or 'Low').`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            projects: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  type: { type: 'STRING', enum: ['Course', 'Conference', 'Seminar', 'Bootcamp', 'Personal'] },
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
                required: ['name', 'type', 'tasks'],
              },
            },
          },
          required: ['projects'],
        },
      },
    };

    try {
      const result = await callGeminiWithRetry(payload, apiKey);

      if (result.candidates && result.candidates[0].content.parts[0].text) {
        const plan = JSON.parse(result.candidates[0].content.parts[0].text);
        if (plan.projects && plan.projects.length > 0) {
          const batch = writeBatch(db);

          const goalRef = doc(collection(db, `artifacts/${appId}/users/${userId}/goals`));
          batch.set(goalRef, { name: goal, createdAt: new Date() });

          plan.projects.forEach((proj) => {
            const projectRef = doc(collection(db, `artifacts/${appId}/users/${userId}/projects`));
            batch.set(projectRef, {
              name: proj.name,
              type: proj.type,
              goalId: goalRef.id,
              createdAt: new Date(),
              status: 'In Progress',
              progress: 0,
            });

            proj.tasks.forEach((task) => {
              const taskRef = doc(collection(db, `artifacts/${appId}/users/${userId}/tasks`));
              batch.set(taskRef, {
                ...task,
                projectId: projectRef.id,
                completed: false,
                createdAt: new Date(),
                dueDate: '',
              });
            });
          });

          await batch.commit();
          setGoal('');
          onClose();
        } else {
          throw new Error('The AI did not generate any projects for this goal.');
        }
      } else {
        throw new Error('Received an invalid response from the AI.');
      }
    } catch (e) {
      console.error('AI Goal Planner Error:', e);
      setError(e.message || 'An unexpected error occurred.');
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
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <span aria-hidden>X</span>
          </button>
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
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold text-white transition-colors flex items-center gap-2 disabled:bg-purple-800 disabled:cursor-not-allowed"
          >
            {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <span aria-hidden>✨</span>}
            {isGenerating ? 'Generating Plan...' : 'Generate Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
