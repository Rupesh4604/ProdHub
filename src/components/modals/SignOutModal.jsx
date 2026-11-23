import React, { useEffect } from 'react';

/** Sign-out confirmation, with account deletion as a secondary link. */
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
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-xs mx-4 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 id="sign-out-title" className="text-xl font-bold text-white mb-6">
          {isDemo ? 'Exit demo?' : 'Sign out?'}
        </h2>
        <div className="flex justify-center gap-3">
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
          <button
            onClick={onDeleteAccount}
            className="mt-5 text-xs font-semibold text-red-400 hover:text-red-300"
          >
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}
