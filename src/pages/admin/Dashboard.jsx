import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  CheckCircle2, 
  Car, 
  Utensils, 
  Package, 
  FileText, 
  QrCode, 
  FileSpreadsheet, 
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

const CP_KEYS = ['registration_verified', 'goibibo_registered', 'food_token_issued', 'kit_issued', 'undertaking_completed'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTeams: 0,
    regVerified: 0,
    goibibo: 0,
    foodToken: 0,
    kitIssued: 0,
    undertaking: 0
  });
  const [recentTeams, setRecentTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const ADMIN_PASSWORD = 'yatharth29';

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Fetch all teams
      const { data: teams, error: teamsErr } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsErr) throw teamsErr;

      // Fetch all members (checkpoints stored here)
      const { data: members, error: membersErr } = await supabase
        .from('team_members')
        .select('*');

      if (membersErr) throw membersErr;

      const allTeams = (teams || []).map(t => ({
        ...t,
        members: (members || []).filter(m => m.team_id === t.id)
      }));

      // ── Stats from teams table (synced by updateCheckpoint) ──
      const statsObj = {
        totalTeams: allTeams.length,
        regVerified:  (teams || []).filter(t => t.registration_verified  === true).length,
        goibibo:      (teams || []).filter(t => t.goibibo_registered     === true).length,
        foodToken:    (teams || []).filter(t => t.food_token_issued      === true).length,
        kitIssued:    (teams || []).filter(t => t.kit_issued             === true).length,
        undertaking:  (teams || []).filter(t => t.undertaking_completed  === true).length,
      };

      setStats(statsObj);
      setRecentTeams(allTeams.slice(0, 15));
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Dashboard load error:', e);
      setError('Could not load data from Supabase. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load on mount + auto-refresh every 30 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal) {
      setTimeout(() => passwordRef.current?.focus(), 100);
    } else {
      setPasswordInput('');
      setPasswordError('');
    }
  }, [showPasswordModal]);

  function handleRefreshClick() {
    setShowPasswordModal(true);
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setShowPasswordModal(false);
      loadData(true);
    } else {
      setPasswordError('Incorrect password. Access denied.');
      setPasswordInput('');
      passwordRef.current?.focus();
    }
  }

  const STAT_CARDS = [
    { label: 'Total Teams', value: stats.totalTeams, icon: <Users className="w-5 h-5 text-indigo-400" />, color: 'text-white', sub: 'Registered in DB' },
    { label: 'Reg. Verified', value: stats.regVerified, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, color: 'text-emerald-400', sub: 'Desk checked' },
    { label: 'Goibibo', value: stats.goibibo, icon: <Car className="w-5 h-5 text-blue-400" />, color: 'text-blue-400', sub: 'Travel confirmed' },
    { label: 'Food Token', value: stats.foodToken, icon: <Utensils className="w-5 h-5 text-amber-400" />, color: 'text-amber-400', sub: 'Meals issued' },
    { label: 'Kits Issued', value: stats.kitIssued, icon: <Package className="w-5 h-5 text-purple-400" />, color: 'text-purple-400', sub: 'Swag & badges' },
    { label: 'Undertaking', value: stats.undertaking, icon: <FileText className="w-5 h-5 text-rose-400" />, color: 'text-rose-400', sub: 'Form signed' },
  ];

  return (
    <div className="space-y-8">

      {/* ── Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/60">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Admin Verification</h2>
                <p className="text-slate-400 text-xs">Enter admin password to refresh data</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 pr-11 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordError && (
                <p className="text-red-400 text-xs font-semibold flex items-center space-x-1">
                  <span>⚠</span><span>{passwordError}</span>
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Refresh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Check-In Verification Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center space-x-2">
            <span>Live statistics & team verification controls</span>
            {lastUpdated && (
              <span className="text-slate-600">
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Team QR</span>
          </button>
          <button
            onClick={() => navigate('/import')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-700 transition-colors"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
          ⚠ {error}
        </div>
      )}

      {/* 6 Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">{card.label}</span>
              {card.icon}
            </div>
            <p className={`text-3xl font-extrabold mt-3 ${loading ? 'text-slate-600' : card.color}`}>
              {loading ? '—' : card.value}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Teams Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Teams & Checkpoint Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Green dots = completed checkpoints. Click team to edit.
            </p>
          </div>
          <button
            onClick={() => navigate('/teams')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>View All Teams</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Team ID</th>
                <th className="py-3.5 px-6">Team Name</th>
                <th className="py-3.5 px-6">College</th>
                <th className="py-3.5 px-6">Leader</th>
                <th className="py-3.5 px-6">Members</th>
                <th className="py-3.5 px-6">Checkpoints</th>
                <th className="py-3.5 px-6 text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading teams from Supabase…</span>
                    </div>
                  </td>
                </tr>
              ) : recentTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">No teams found in database.</td>
                </tr>
              ) : recentTeams.map((team) => {
                // Count completed checkpoints across all team members
                const cpDone = CP_KEYS.map(key =>
                  (team.members || []).some(m => m[key] === true || m[key] === 1)
                );
                const doneCount = cpDone.filter(Boolean).length;
                const allDone = doneCount === 5;

                return (
                  <tr
                    key={team.id}
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-semibold text-emerald-400 font-mono text-xs">
                      {team.team_id || team.team_code || '—'}
                    </td>
                    <td className="py-4 px-6 font-medium text-white">{team.team_name}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">{team.college_name}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{team.leader_name}</div>
                      <div className="text-xs text-slate-500">{team.leader_email}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {team.members ? team.members.length : 0} member{team.members?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1.5">
                        {['Reg', 'Go', 'Food', 'Kit', 'Sign'].map((label, i) => (
                          <span
                            key={i}
                            title={['Registration', 'Goibibo', 'Food Token', 'Kit Issued', 'Undertaking'][i]}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                              cpDone[i]
                                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50'
                                : 'bg-slate-800 text-slate-600 border border-slate-700'
                            }`}
                          >
                            {cpDone[i] ? '✓' : label[0]}
                          </span>
                        ))}
                        {allDone && (
                          <span className="ml-1 text-[10px] font-bold text-emerald-400">All Done!</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/teams/${team.id}`); }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
