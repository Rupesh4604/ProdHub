import React, { useEffect } from 'react';

/**
 * Confirms sign-out. Account deletion lives here as a secondary action so it is
 * available but never one click away from the sidebar.
 */
export default function SignOutModal({ isOpen, onClose, onConfirm, onDeleteAccount, isDemo = false }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-out-title"
      onClick={onClose}
    >
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 id="sign-out-title" className="text-xl font-bold text-white mb-2">
          {isDemo ? 'Exit the demo?' : 'Sign out?'}
        </h2>
        <p className="text-gray-300 text-sm mb-6">
          {isDemo
            ? 'Demo changes are not saved once you exit. Use Save with Google first if you want to keep them.'
            : 'You can sign back in at any time. Your data stays in your account.'}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            autoFocus
            className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors"
          >
            {isDemo ? 'Exit demo' : 'Sign out'}
          </button>
        </div>
        {!isDemo && onDeleteAccount && (
          <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">Want to remove your account and all of its data?</span>
            <button
              onClick={onDeleteAccount}
              className="text-xs font-semibold text-red-400 hover:text-red-300 whitespace-nowrap"
            >
              Delete account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
