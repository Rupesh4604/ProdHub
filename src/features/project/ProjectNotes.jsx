import React, { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Check, Edit2, ExternalLink, Link2, Loader2, Plus, Trash2, X } from 'lucide-react';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';

/** Normalize a user-entered URL so bare domains still open correctly. */
const normalizeUrl = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/** Per-project Notes & Resources: a free-form notes field plus a list of links. */
export default function ProjectNotes({ project }) {
  const userId = auth?.currentUser?.uid;
  const projectRef = userId && db ? doc(db, `artifacts/${appId}/users/${userId}/projects`, project.id) : null;

  const [notes, setNotes] = useState(project.notes || '');
  const [savedNotes, setSavedNotes] = useState(project.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const resources = Array.isArray(project.resources) ? project.resources : [];
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [linkError, setLinkError] = useState('');

  const [editingIndex, setEditingIndex] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editError, setEditError] = useState('');

  // Keep the editor in sync if the project doc changes from elsewhere and the
  // user has no unsaved edits.
  useEffect(() => {
    if (notes === savedNotes) {
      setNotes(project.notes || '');
      setSavedNotes(project.notes || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.notes]);

  const notesDirty = notes !== savedNotes;

  const handleSaveNotes = async () => {
    if (!projectRef || !notesDirty) return;
    setSavingNotes(true);
    try {
      await updateDoc(projectRef, { notes });
      setSavedNotes(notes);
    } catch (e) {
      console.error('Error saving notes:', e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    setLinkError('');
    const url = normalizeUrl(newUrl);
    if (!url) {
      setLinkError('Enter a URL.');
      return;
    }
    try {
      // Validate the URL shape before saving.
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      setLinkError('That doesn’t look like a valid URL.');
      return;
    }
    if (!projectRef) return;
    const label = newLabel.trim() || url.replace(/^https?:\/\//i, '');
    try {
      await updateDoc(projectRef, { resources: [...resources, { label, url }] });
      setNewLabel('');
      setNewUrl('');
    } catch (err) {
      console.error('Error adding resource:', err);
      setLinkError('Could not save the link. Try again.');
    }
  };

  const handleRemoveResource = async (index) => {
    if (!projectRef) return;
    const next = resources.filter((_, i) => i !== index);
    try {
      await updateDoc(projectRef, { resources: next });
    } catch (err) {
      console.error('Error removing resource:', err);
    }
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditLabel(resources[index].label || '');
    setEditUrl(resources[index].url || '');
    setEditError('');
  };

  const handleUpdateResource = async (e) => {
    e.preventDefault();
    setEditError('');
    const url = normalizeUrl(editUrl);
    if (!url) {
      setEditError('Enter a URL.');
      return;
    }
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      setEditError('That doesn’t look like a valid URL.');
      return;
    }
    if (!projectRef) return;
    const label = editLabel.trim() || url.replace(/^https?:\/\//i, '');
    const next = resources.map((r, i) => (i === editingIndex ? { label, url } : r));
    try {
      await updateDoc(projectRef, { resources: next });
      setEditingIndex(null);
    } catch (err) {
      console.error('Error updating resource:', err);
      setEditError('Could not save. Try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Notes ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-200">Notes</h3>
          <button
            onClick={handleSaveNotes}
            disabled={!notesDirty || savingNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
          >
            {savingNotes ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {savingNotes ? 'Saving…' : notesDirty ? 'Save' : 'Saved'}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="Jot down ideas, code snippets, or anything you want to remember for this project…"
          className="w-full h-48 bg-gray-900/50 border border-gray-700/50 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y [color-scheme:dark]"
        />
      </div>

      {/* ── Resources / Links ── */}
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
          <Link2 size={18} className="text-gray-400" /> Resources
        </h3>

        <form onSubmit={handleAddResource} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 mb-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (optional)"
            className="bg-gray-900/50 border border-gray-700/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            className="bg-gray-900/50 border border-gray-700/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={15} /> Add
          </button>
        </form>
        {linkError && <p className="text-red-400 text-xs mb-2">{linkError}</p>}

        {resources.length > 0 ? (
          <ul className="space-y-2">
            {resources.map((res, index) =>
              editingIndex === index ? (
                <li key={`edit-${index}`} className="p-2.5 bg-gray-900/40 border border-gray-700/40 rounded-xl">
                  <form onSubmit={handleUpdateResource} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Label (optional)"
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <input
                      type="text"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://…"
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button type="submit" aria-label="Save link" className="flex-1 sm:flex-none px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold">
                        <Check size={14} />
                      </button>
                      <button type="button" onClick={() => setEditingIndex(null)} aria-label="Cancel" className="flex-1 sm:flex-none px-2.5 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-lg text-xs font-semibold">
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                  {editError && <p className="text-red-400 text-xs mt-1.5">{editError}</p>}
                </li>
              ) : (
                <li
                  key={`${res.url}-${index}`}
                  className="flex items-center gap-3 p-2.5 bg-gray-900/40 border border-gray-700/30 rounded-xl hover:border-gray-600/50 transition-colors"
                >
                  <ExternalLink size={14} className="text-gray-500 flex-shrink-0" />
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-grow min-w-0 truncate text-sm text-blue-300 hover:text-blue-200 hover:underline"
                    title={res.url}
                  >
                    {res.label || res.url}
                  </a>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => startEdit(index)}
                      aria-label={`Edit ${res.label || res.url}`}
                      className="p-1 text-gray-500 hover:text-white rounded-md transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveResource(index)}
                      aria-label={`Remove ${res.label || res.url}`}
                      className="p-1 text-gray-500 hover:text-red-400 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">No resources yet. Add links to docs, articles, or tutorials.</p>
        )}
      </div>
    </div>
  );
}
