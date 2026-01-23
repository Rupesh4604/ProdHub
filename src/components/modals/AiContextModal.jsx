import React, { useState } from 'react';

export default function AiContextModal({ isOpen, onClose, onConfirm }) {
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
