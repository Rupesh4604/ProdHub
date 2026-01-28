import React from 'react';

export default function DailyPlannerModal({ isOpen, onClose, plan, isLoading, error, retry }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Your Daily Plan</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <span aria-hidden>X</span>
          </button>
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
            <div
              className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: plan.replace(/\n/g, '<br />') }}
            ></div>
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
