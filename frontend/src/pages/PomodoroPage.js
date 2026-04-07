import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Zap, CheckCircle } from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import '../styles/PomodoroPage.css';

const MODES = {
  work: { label: 'Focus', color: '#7c6aff', emoji: '🎯' },
  short: { label: 'Short Break', color: '#22c55e', emoji: '☕' },
  long: { label: 'Long Break', color: '#38bdf8', emoji: '🌊' }
};

export default function PomodoroPage() {
  const { user } = useAuth();
  const prefs = user?.preferences || {};

  const [settings, setSettings] = useState({
    work: prefs.pomodoroWork || 25,
    short: prefs.pomodoroBreak || 5,
    long: prefs.pomodoroLongBreak || 15,
    cycles: 4
  });

  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(settings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [totalWork, setTotalWork] = useState(0);
  const [totalBreak, setTotalBreak] = useState(0);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Build audio context bell
  const playBell = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
    } catch (e) {}
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  const handleTimerEnd = () => {
    playBell();
    setIsRunning(false);

    if (mode === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      setTotalWork(prev => prev + settings.work);

      if (newCount % settings.cycles === 0) {
        toast.success(`🎉 ${settings.cycles} pomodoros done! Take a long break.`);
        switchMode('long');
      } else {
        toast.success('✅ Pomodoro complete! Time for a short break.');
        switchMode('short');
      }
    } else {
      setTotalBreak(prev => prev + (mode === 'short' ? settings.short : settings.long));
      toast.success('Break over — back to work!');
      switchMode('work');
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(settings[newMode] * 60);
    setIsRunning(false);
  };

  const handleStart = async () => {
    if (!isRunning && !sessionId && mode === 'work') {
      try {
        const { data } = await api.post('/sessions/start', { type: 'pomodoro', subject: 'Focus Session' });
        setSessionId(data.session._id);
      } catch {}
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(settings[mode] * 60);
  };

  const handleComplete = async () => {
    if (sessionId) {
      try {
        await api.put(`/sessions/${sessionId}/end`, {
          productivity: 5,
          pomodoroStats: { completedPomodoros, totalWork, totalBreak }
        });
        toast.success(`Session saved! ${completedPomodoros} pomodoros completed 🏆`);
        setSessionId(null);
        setCompletedPomodoros(0);
        setTotalWork(0);
        setTotalBreak(0);
        setMode('work');
        setTimeLeft(settings.work * 60);
      } catch { toast.error('Failed to save session'); }
    }
  };

  const total = settings[mode] * 60;
  const progress = timeLeft / total;
  const radius = 130;
  const circ = 2 * Math.PI * radius;
  const offset = circ * progress;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const modeData = MODES[mode];

  return (
    <AppLayout>
      <div className="pomodoro-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pomodoro Timer</h1>
            <p className="page-subtitle">Focus, then rest. Repeat.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowSettings(p => !p)}>
            <Settings size={16} /> Settings
          </button>
        </div>

        {showSettings && (
          <div className="card mb-4">
            <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Timer Settings</h3>
            <div className="grid-4">
              {[
                { key: 'work', label: 'Focus (min)' },
                { key: 'short', label: 'Short Break (min)' },
                { key: 'long', label: 'Long Break (min)' },
                { key: 'cycles', label: 'Cycles before long break' }
              ].map(({ key, label }) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1" max="120"
                    value={settings[key]}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setSettings(p => ({ ...p, [key]: val }));
                      if (key === mode) setTimeLeft(val * 60);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pomodoro-layout">
          {/* Timer */}
          <div className="card pomodoro-card">
            {/* Mode tabs */}
            <div className="mode-tabs">
              {Object.entries(MODES).map(([key, m]) => (
                <button
                  key={key}
                  className={`mode-tab ${mode === key ? 'active' : ''}`}
                  onClick={() => !isRunning && switchMode(key)}
                  style={{ '--tab-color': m.color }}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>

            {/* SVG ring timer */}
            <div className="timer-ring-container">
              <svg className="timer-svg" viewBox="0 0 300 300">
                {/* Background ring */}
                <circle cx="150" cy="150" r={radius} fill="none"
                  stroke="var(--border)" strokeWidth="12" />
                {/* Progress ring */}
                <circle cx="150" cy="150" r={radius} fill="none"
                  stroke={modeData.color} strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ - offset}
                  transform="rotate(-90 150 150)"
                  className="pomodoro-ring"
                  style={{ filter: `drop-shadow(0 0 8px ${modeData.color}88)` }}
                />
                {/* Time display */}
                <text x="150" y="138" textAnchor="middle"
                  fill="var(--text-primary)" fontSize="44" fontWeight="800"
                  fontFamily="Space Mono, monospace">
                  {mins}:{secs}
                </text>
                <text x="150" y="168" textAnchor="middle"
                  fill="var(--text-muted)" fontSize="14">
                  {modeData.emoji} {modeData.label}
                </text>
              </svg>
            </div>

            {/* Controls */}
            <div className="timer-controls">
              <button className="btn btn-secondary btn-icon" onClick={handleReset} title="Reset">
                <RotateCcw size={18} />
              </button>
              {isRunning ? (
                <button className="btn-play btn-play-pause" onClick={handlePause}
                  style={{ '--play-color': modeData.color }}>
                  <Pause size={28} />
                </button>
              ) : (
                <button className="btn-play btn-play-start" onClick={handleStart}
                  style={{ '--play-color': modeData.color }}>
                  <Play size={28} />
                </button>
              )}
              <button className="btn btn-secondary btn-icon" onClick={() => switchMode(mode === 'work' ? 'short' : 'work')} title="Skip">
                <Coffee size={18} />
              </button>
            </div>
          </div>

          {/* Stats panel */}
          <div className="pomodoro-stats">
            {/* Cycle progress */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Session Progress</h3>
              <div className="pomodoro-dots">
                {Array.from({ length: settings.cycles }).map((_, i) => (
                  <div key={i} className={`pomo-dot ${i < (completedPomodoros % settings.cycles) ? 'done' : ''} ${i === (completedPomodoros % settings.cycles) && isRunning && mode === 'work' ? 'active' : ''}`} />
                ))}
              </div>
              <div className="pomo-cycle-info">
                Cycle {Math.floor(completedPomodoros / settings.cycles) + 1} ·{' '}
                {completedPomodoros % settings.cycles}/{settings.cycles} pomodoros
              </div>
            </div>

            {/* Pomodoro count */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Today's Stats</h3>
              <div className="today-stats">
                <div className="today-stat">
                  <div className="today-stat-val" style={{ color: 'var(--accent)' }}>{completedPomodoros}</div>
                  <div className="today-stat-key">Pomodoros</div>
                </div>
                <div className="today-stat">
                  <div className="today-stat-val" style={{ color: 'var(--success)' }}>{totalWork}m</div>
                  <div className="today-stat-key">Focus Time</div>
                </div>
                <div className="today-stat">
                  <div className="today-stat-val" style={{ color: 'var(--info)' }}>{totalBreak}m</div>
                  <div className="today-stat-key">Break Time</div>
                </div>
              </div>
            </div>

            {/* Task list */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Technique Tips</h3>
              <div className="tips-list">
                {[
                  { icon: <Zap size={14} />, text: 'Work for 25 minutes without distractions' },
                  { icon: <Coffee size={14} />, text: 'Take a 5-minute break after each session' },
                  { icon: <CheckCircle size={14} />, text: 'After 4 pomodoros, take a longer 15-30 min break' },
                ].map((tip, i) => (
                  <div key={i} className="tip-item">
                    <span className="tip-icon">{tip.icon}</span>
                    <span className="tip-text">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save session */}
            {completedPomodoros > 0 && (
              <button className="btn btn-primary w-full" onClick={handleComplete}>
                <CheckCircle size={16} />
                Save Session ({completedPomodoros} pomodoros)
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
