import React, { useState } from 'react';
import { auth } from '../../config/firebase';
import { deleteAccount, getSignInProvider } from '../../services/accountService';

const CONFIRM_WORD = 'DELETE';

export default function DeleteAccountModal({ isOpen, onClose }) {
  const [typed, setTyped] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;
  const user = auth?.currentUser;
  const provider = getSignInProvider(user);
  const canSubmit = typed === CONFIRM_WORD && (provider !== 'password' || password) && !busy;

  const close = () => {
    if (busy) return;
    setTyped('');
    setPassword('');
    setError('');
    onClose();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setBusy(true);
    try {
      await deleteAccount(user, { password });
      // onAuthStateChanged fires with null and the app returns to the landing page.
    } catch (err) {
      setError(err.message || 'Could not delete your account. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
      <form onSubmit={handleDelete} className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
        <h2 id="delete-account-title" className="text-2xl font-bold text-white">Delete your account?</h2>
        <p className="text-gray-300 text-sm">
          This permanently deletes your ProdHub account and all of its data: tasks, projects and notes, goals,
          habits and habit history, and any Google Calendar events cached by ProdHub. This cannot be undone.
        </p>
        <p className="text-gray-400 text-xs">
          To also remove ProdHub's access to your Google account, visit{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            Google Account permissions
          </a>.
        </p>
        {provider === 'password' && (
          <label className="block text-sm text-gray-300">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
        )}
        {provider === 'google.com' && (
          <p className="text-gray-400 text-xs">You'll be asked to confirm with Google before anything is deleted.</p>
        )}
        <label className="block text-sm text-gray-300">
          Type <strong className="text-white">{CONFIRM_WORD}</strong> to confirm
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </label>
        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={close} disabled={busy} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 font-semibold disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </form>
    </div>
  );
}
