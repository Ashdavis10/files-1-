import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Clock, BookOpen, Medal, Crown } from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/LeaderboardPage.css';

const TYPES = [
  { key: 'weekly', label: '📅 This Week', icon: Clock },
  { key: 'all', label: '⏱ All Time', icon: Clock },
  { key: 'streak', label: '🔥 Streaks', icon: Flame },
  { key: 'sessions', label: '📚 Sessions', icon: BookOpen },
];

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#7a5400', icon: '🥇' },
  { bg: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', color: '#3a3a3a', icon: '🥈' },
  { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', color: '#5a2a0a', icon: '🥉' },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [type, setType] = useState('weekly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeaderboard(); }, [type]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/leaderboard?type=${type}&limit=20`);
      setData(res);
    } catch (err) {
      console.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getValue = (u) => {
    if (type === 'streak') return `${u.currentStreak} days`;
    if (type === 'sessions') return `${u.totalSessions} sessions`;
    return `${(u.totalStudyTime / 60).toFixed(1)}h`;
  };

  const getValueLabel = () => {
    if (type === 'streak') return 'Streak';
    if (type === 'sessions') return 'Sessions';
    return 'Study Time';
  };

  const top3 = data?.leaderboard?.slice(0, 3) || [];
  const rest = data?.leaderboard?.slice(3) || [];

  return (
    <AppLayout>
      <div className="leaderboard-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏆 Leaderboard</h1>
            <p className="page-subtitle">
              {data ? `Your rank: #${data.userRank} of ${data.totalUsers} students` : 'Loading your rank...'}
            </p>
          </div>
        </div>

        {/* Type tabs */}
        <div className="lb-tabs">
          {TYPES.map(t => (
            <button key={t.key} className={`lb-tab ${type === t.key ? 'active' : ''}`}
              onClick={() => setType(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: 300 }}>
            <div className="loading-spinner" />
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length >= 3 && (
              <div className="podium">
                {/* 2nd */}
                <div className="podium-spot spot-2">
                  <div className="podium-avatar" style={{ '--rank-bg': RANK_STYLES[1].bg }}>
                    {top3[1]?.user.username?.slice(0, 2).toUpperCase()}
                    <div className="podium-rank-badge">🥈</div>
                  </div>
                  <div className="podium-name">{top3[1]?.user.username}</div>
                  <div className="podium-value">{getValue(top3[1]?.user)}</div>
                  <div className="podium-plinth" style={{ height: 80, background: RANK_STYLES[1].bg }}>
                    <span>2</span>
                  </div>
                </div>
                {/* 1st */}
                <div className="podium-spot spot-1">
                  <div className="crown-icon">👑</div>
                  <div className="podium-avatar" style={{ '--rank-bg': RANK_STYLES[0].bg }}>
                    {top3[0]?.user.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="podium-name">{top3[0]?.user.username}</div>
                  <div className="podium-value">{getValue(top3[0]?.user)}</div>
                  <div className="podium-plinth" style={{ height: 110, background: RANK_STYLES[0].bg }}>
                    <span>1</span>
                  </div>
                </div>
                {/* 3rd */}
                <div className="podium-spot spot-3">
                  <div className="podium-avatar" style={{ '--rank-bg': RANK_STYLES[2].bg }}>
                    {top3[2]?.user.username?.slice(0, 2).toUpperCase()}
                    <div className="podium-rank-badge">🥉</div>
                  </div>
                  <div className="podium-name">{top3[2]?.user.username}</div>
                  <div className="podium-value">{getValue(top3[2]?.user)}</div>
                  <div className="podium-plinth" style={{ height: 60, background: RANK_STYLES[2].bg }}>
                    <span>3</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full leaderboard table */}
            <div className="card" style={{ marginTop: 24 }}>
              <div className="lb-table-header">
                <span>#</span>
                <span>Student</span>
                <span>{getValueLabel()}</span>
                <span>Sessions</span>
                <span>Streak</span>
                <span>Badges</span>
              </div>

              {/* Top 3 in table */}
              {data?.leaderboard?.map((entry) => {
                const isMe = entry.user.id === user._id || entry.user._id === user._id;
                const rankStyle = RANK_STYLES[entry.rank - 1];

                return (
                  <div key={entry.rank} className={`lb-row ${isMe ? 'my-row' : ''}`}>
                    <div className="lb-rank">
                      {rankStyle ? (
                        <span className="rank-medal">{rankStyle.icon}</span>
                      ) : (
                        <span className="rank-num">{entry.rank}</span>
                      )}
                    </div>
                    <div className="lb-user">
                      <div className="user-avatar" style={{
                        width: 34, height: 34, fontSize: 12,
                        background: isMe ? 'linear-gradient(135deg, var(--accent), #ff6b9d)' : undefined
                      }}>
                        {entry.user.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="lb-username">
                          {entry.user.username}
                          {isMe && <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 6 }}>You</span>}
                        </div>
                        <div className="text-xs text-muted">{entry.user.badgeCount} badge{entry.user.badgeCount !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="lb-value">{getValue(entry.user)}</div>
                    <div className="lb-cell">{entry.user.totalSessions}</div>
                    <div className="lb-cell">
                      <span style={{ color: 'var(--warning)' }}>🔥</span> {entry.user.currentStreak}d
                    </div>
                    <div className="lb-cell">
                      <div className="badge-dots">
                        {Array.from({ length: Math.min(entry.user.badgeCount, 5) }).map((_, i) => (
                          <div key={i} className="badge-dot" />
                        ))}
                        {entry.user.badgeCount > 5 && <span className="text-xs text-muted">+{entry.user.badgeCount - 5}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Your rank card if not in top 20 */}
            {data?.userRank > 20 && (
              <div className="card my-rank-card">
                <div className="flex items-center gap-4">
                  <div className="rank-num large">#{data.userRank}</div>
                  <div>
                    <div className="font-bold">{user?.username} (You)</div>
                    <div className="text-muted text-sm">Keep studying to climb the leaderboard!</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
