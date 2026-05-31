import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react';

const todayKey = () => new Date().toISOString().slice(0, 10);

const readFocusCount = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('prodhub_pomodoro_focus') || '{}');
    return saved.date === todayKey() ? Number(saved.count) || 0 : 0;
  } catch {
    return 0;
  }
};

const writeFocusCount = (count) => {
  localStorage.setItem('prodhub_pomodoro_focus', JSON.stringify({ date: todayKey(), count }));
};

const MODES = {
  focus: { label: 'Focus', minutes: 25, accent: 'text-blue-400', ring: 'stroke-blue-500', bg: 'from-blue-600 to-violet-600' },
  short: { label: 'Short Break', minutes: 5, accent: 'text-emerald-400', ring: 'stroke-emerald-500', bg: 'from-emerald-600 to-teal-600' },
  long: { label: 'Long Break', minutes: 15, accent: 'text-amber-400', ring: 'stroke-amber-500', bg: 'from-amber-600 to-orange-600' },
};

const pad = (n) => String(n).padStart(2, '0');

/** A short two-tone chime via Web Audio (no asset needed). */
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.18].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = i === 0 ? 660 : 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.start(t);
      osc.stop(t + 0.18);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* ignore audio errors */
  }
}

export default function PomodoroTimer() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('focus');
  const [remaining, setRemaining] = useState(MODES.focus.minutes * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [focusCount, setFocusCount] = useState(readFocusCount);

  const endRef = useRef(null); // absolute end timestamp while running
  const intervalRef = useRef(null);

  const totalSeconds = MODES[mode].minutes * 60;

  const switchMode = useCallback((next) => {
    setIsRunning(false);
    setMode(next);
    setRemaining(MODES[next].minutes * 60);
    endRef.current = null;
  }, []);

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    endRef.current = null;
    playChime();
    if (mode === 'focus') {
      setFocusCount((c) => {
        const next = c + 1;
        writeFocusCount(next);
        return next;
      });
      // after every 4th focus block, suggest a long break
      const nextMode = (focusCount + 1) % 4 === 0 ? 'long' : 'short';
      setMode(nextMode);
      setRemaining(MODES[nextMode].minutes * 60);
    } else {
      setMode('focus');
      setRemaining(MODES.focus.minutes * 60);
    }
  }, [mode, focusCount]);

  // Tick using an absolute end time so it stays accurate across tab throttling.
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return undefined;
    }
    if (endRef.current == null) endRef.current = Date.now() + remaining * 1000;

    intervalRef.current = setInterval(() => {
      const secsLeft = Math.round((endRef.current - Date.now()) / 1000);
      if (secsLeft <= 0) {
        setRemaining(0);
        handleComplete();
      } else {
        setRemaining(secsLeft);
      }
    }, 250);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, handleComplete]);

  const toggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      endRef.current = null;
    } else {
      if (remaining <= 0) setRemaining(totalSeconds);
      endRef.current = Date.now() + (remaining > 0 ? remaining : totalSeconds) * 1000;
      setIsRunning(true);
    }
  };

  const reset = () => {
    setIsRunning(false);
    endRef.current = null;
    setRemaining(totalSeconds);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
  const R = 52;
  const circumference = 2 * Math.PI * R;

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Pomodoro timer"
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full shadow-lg px-4 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r ${MODES[mode].bg} hover:scale-105`}
      >
        <Timer size={18} />
        {isRunning && (
          <span className="tabular-nums text-sm">
            {pad(minutes)}:{pad(seconds)}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-72 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Timer size={16} className={MODES[mode].accent} /> Pomodoro
            </h3>
            <button onClick={() => setOpen(false)} aria-label="Close timer" className="p-1 text-gray-400 hover:text-white rounded-md">
              <X size={16} />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 mb-4 bg-gray-900/60 rounded-xl p-1">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  mode === key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Dial */}
          <div className="relative w-40 h-40 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={R} className="stroke-gray-700" strokeWidth="8" fill="none" />
              <circle
                cx="60"
                cy="60"
                r={R}
                className={MODES[mode].ring}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.3s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white tabular-nums">
                {pad(minutes)}:{pad(seconds)}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">{MODES[mode].label}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleRun}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all bg-gradient-to-r ${MODES[mode].bg} hover:opacity-90`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={reset}
              aria-label="Reset timer"
              className="p-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            {focusCount} focus {focusCount === 1 ? 'session' : 'sessions'} completed today
          </p>
        </div>
      )}
    </>
  );
}
