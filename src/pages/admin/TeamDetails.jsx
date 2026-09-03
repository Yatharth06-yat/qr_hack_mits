import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamById, updateCheckpoint } from '../../services/teamService';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building2, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export default function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  async function loadTeamData() {
    try {
      setLoading(true);
      const data = await getTeamById(teamId);
      setTeam(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleCheckpoint(memberId, field, currentValue) {
    const newValue = !currentValue;
    setSavingId(`${memberId}-${field}`);

    // Optimistic UI state update (Instant tick / untick)
    setTeam(prev => {
      if (!prev) return prev;
      const updatedMembers = (prev.members || []).map(m => {
        if (m.id === memberId) {
          return { ...m, [field]: newValue };
        }
        return m;
      });

      // Check if all members completed field
      const allCompleted = updatedMembers.every(m => m[field] === true || m[field] === 1);
      return {
        ...prev,
        [field]: allCompleted,
        members: updatedMembers
      };
    });

    try {
      await updateCheckpoint(memberId, team.id, field, newValue);
      setToast({ type: 'success', message: newValue ? 'Checkpoint marked as completed (✓)' : 'Checkpoint tick removed (Pending)' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update checkpoint in Supabase' });
      await loadTeamData(); // Rollback on error
    } finally {
      setSavingId(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400">Loading team verification details...</div>
    );
  }

  if (!team) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p>Team not found.</p>
        <button onClick={() => navigate('/teams')} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm">
          Back to Teams Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center space-x-2 ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xs font-mono text-slate-500">ID: {team.id}</span>
      </div>

      {/* Team Header & Ticket Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                {team.team_id || team.team_code}
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-2">{team.team_name}</h1>
              <p className="text-slate-400 text-sm mt-1 flex items-center">
                <Building2 className="w-4 h-4 mr-1 text-slate-500" />
                {team.college_name}
              </p>
            </div>
          </div>

          {/* Checkpoint Status Visual Progress Bar */}
          {(() => {
            const checkpoints = [
              { key: 'registration_verified', label: 'Registration' },
              { key: 'goibibo_registered', label: 'Goibibo' },
              { key: 'food_token_issued', label: 'Food Token' },
              { key: 'kit_issued', label: 'Kit Issue' },
              { key: 'undertaking_completed', label: 'Undertaking' },
            ];
            const completedCount = checkpoints.filter(cp => team[cp.key] === true || team[cp.key] === 1).length;
            const allDone = completedCount === 5;
            return (
              <div className={`rounded-xl p-4 border ${allDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Verification Progress</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${allDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {completedCount} / 5 Done
                  </span>
                </div>
                <div className="flex gap-2">
                  {checkpoints.map((cp) => {
                    const done = team[cp.key] === true || team[cp.key] === 1;
                    return (
                      <div key={cp.key} className="flex-1 text-center">
                        <div className={`h-2 rounded-full mb-1.5 transition-all duration-500 ${done ? 'bg-emerald-400 shadow-lg shadow-emerald-500/40' : 'bg-slate-700'}`} />
                        <span className={`text-[10px] font-semibold ${done ? 'text-emerald-400' : 'text-slate-600'}`}>{cp.label}</span>
                      </div>
                    );
                  })}
                </div>
                {allDone && (
                  <div className="mt-3 text-center text-xs font-bold text-emerald-400 flex items-center justify-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All Checkpoints Completed! Team Fully Checked In.</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Team Leader</span>
              <p className="text-white font-medium mt-1 flex items-center">
                <User className="w-4 h-4 mr-1 text-emerald-400" /> {team.leader_name}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Leader Email</span>
              <p className="text-slate-300 text-sm mt-1 flex items-center truncate">
                <Mail className="w-4 h-4 mr-1 text-indigo-400" /> {team.leader_email}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Leader Phone</span>
              <p className="text-slate-300 text-sm mt-1 flex items-center">
                <Phone className="w-4 h-4 mr-1 text-purple-400" /> {team.leader_phone || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* QR Token Ticket Display */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            <QRCodeSVG value={team.qr_token} size={160} level="H" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 block">QR TOKEN</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono tracking-wider">{team.qr_token}</span>
          </div>
          <p className="text-xs text-slate-500">Opaque security token mapped to team</p>
        </div>
      </div>

      {/* 5 Member Checkpoints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" />
              Member Attendance & 5 Checkpoints
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any checkpoint toggle to update Supabase</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {(team.members || []).map((m, idx) => {
            const CHECKPOINT_KEYS = ['registration_verified', 'goibibo_registered', 'food_token_issued', 'kit_issued', 'undertaking_completed'];
            const memberDoneCount = CHECKPOINT_KEYS.filter(k => m[k] === true || m[k] === 1).length;
            const memberAllDone = memberDoneCount === 5;
            return (
            <div key={m.id} className={`border rounded-xl p-5 space-y-4 transition-all duration-500 ${memberAllDone ? 'bg-emerald-500/5 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-slate-950 border-slate-800'}`}>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${memberAllDone ? 'border-emerald-500/20' : 'border-slate-800'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${memberAllDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {memberAllDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h3 className={`font-bold text-base ${memberAllDone ? 'text-emerald-400' : 'text-white'}`}>
                      {m.name} {idx === 0 && <span className="text-xs text-emerald-400 font-semibold">(Leader)</span>}
                    </h3>
                    <p className="text-xs text-slate-400">{m.email || 'No email provided'} • {m.phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {memberAllDone && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500 text-slate-950 rounded-full animate-pulse">✓ Checked In</span>
                  )}
                  <span className="text-xs font-mono text-slate-500">M-{idx+1}</span>
                </div>
              </div>

              {/* 5 Checkpoints Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { key: 'registration_verified', label: '1. Registration' },
                  { key: 'goibibo_registered', label: '2. Goibibo' },
                  { key: 'food_token_issued', label: '3. Food Token' },
                  { key: 'kit_issued', label: '4. Kit Issue' },
                  { key: 'undertaking_completed', label: '5. Undertaking' },
                ].map((cp) => {
                  const isChecked = m[cp.key] === true || m[cp.key] === 1;
                  const isSaving = savingId === `${m.id}-${cp.key}`;
                  return (
                    <button
                      key={cp.key}
                      disabled={isSaving}
                      onClick={() => handleToggleCheckpoint(m.id, cp.key, isChecked)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-300 ${
                        isSaving
                          ? 'opacity-50 cursor-wait bg-slate-900 border-slate-700'
                          : isChecked
                            ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300 shadow-md shadow-emerald-500/20 scale-[1.02]'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-700" />
                      )}
                      <span className={isChecked ? 'text-emerald-300' : 'text-slate-500'}>{cp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>

        {/* Submit Completed Checkpoints Footer Action */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            { (team.members || []).every(m => m.registration_verified && m.goibibo_registered && m.food_token_issued && m.kit_issued && m.undertaking_completed) ? (
              <span className="text-emerald-400 font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" /> All 5 Checkpoints Completed for Team Roster!
              </span>
            ) : (
              <span>Mark all 5 member checkpoints above to finalize check-in submission.</span>
            )}
          </div>

          <button
            onClick={() => {
              setToast({ type: 'success', message: 'Team verification submitted! Opening Scanner...' });
              setTimeout(() => navigate('/scan'), 800);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Submit Team Check-In & Scan Next</span>
          </button>
        </div>
      </div>
    </div>
  );
}
