import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { searchTeams } from '../../services/teamService';
import { 
  getSavedCertificateConfig, 
  generateMemberCertificate, 
  generateTeamCertificates 
} from '../../utils/certificateGenerator';
import { 
  QrCode, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight, 
  Award, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Users, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function Login() {
  const [activeTab, setActiveTab] = useState('certificate'); // 'certificate' | 'login'
  
  // Login Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Certificate Search state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (roleType) => {
    if (roleType === 'admin') {
      setEmail('guptayatharth353@gmail.com');
      setPassword('admin123456');
    } else {
      setEmail('staff@hackathon.com');
      setPassword('staff123456');
    }
  };

  // Certificate Search logic
  const CP_KEYS = ['registration_verified', 'goibibo_registered', 'food_token_issued', 'kit_issued', 'undertaking_completed'];
  const isTeamPresent = (t) => {
    if (!t) return false;
    if (t.is_present === true || t.is_present === 1 || t.is_present === 'true') return true;
    if (t.registration_verified === true || t.registration_verified === 1 || t.registration_verified === 'true') return true;
    if (CP_KEYS.some(k => t[k] === true || t[k] === 1 || t[k] === 'true')) return true;
    if ((t.members || []).some(m => m.is_present === true || m.registration_verified === true)) return true;
    return false;
  };

  const handleCertificateSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await searchTeams(query.trim());
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleDownloadMemberCert = (member, team) => {
    setDownloadingId(member.id || member.name);
    try {
      const config = getSavedCertificateConfig();
      const doc = generateMemberCertificate(member, team, config);
      doc.save(`${member.name.replace(/\s+/g, '_')}_MITS_Hackathon_Certificate.pdf`);
    } catch (err) {
      console.error('Certificate generation error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadTeamCert = (team) => {
    setDownloadingId(team.id);
    try {
      const config = getSavedCertificateConfig();
      const doc = generateTeamCertificates(team, config);
      if (doc) {
        doc.save(`${team.team_name.replace(/\s+/g, '_')}_Certificates.pdf`);
      }
    } catch (err) {
      console.error('Team certificates generation error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-xl shadow-amber-500/20">
              <Award className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            MITS HACKATHON 2026
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Verification System & Participant Certificate Portal
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center">
          <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex text-sm font-semibold w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('certificate')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all ${
                activeTab === 'certificate'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4.5 h-4.5" />
              <span>Download Certificate</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4.5 h-4.5" />
              <span>Staff / Admin Sign In</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: CERTIFICATE SEARCH & DOWNLOAD ── */}
        {activeTab === 'certificate' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4">
              <div className="text-center space-y-1">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Public Certificate Desk
                </span>
                <h2 className="text-xl font-bold text-white">Search Your Team Certificate</h2>
                <p className="text-xs text-slate-400">
                  Enter your <strong>Team Name</strong> or <strong>Team Code</strong> (e.g. HACK-001) to download official participation certificates.
                </p>
              </div>

              <form onSubmit={handleCertificateSearch} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter Team Name or Team Code..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full sm:w-auto px-7 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{searching ? 'Searching...' : 'Search Certificate'}</span>
                </button>
              </form>
            </div>

            {/* Results Display */}
            {searchResults !== null && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Search Results ({searchResults.length} Teams)
                </h3>

                {searchResults.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                    <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                    <h4 className="text-base font-bold text-white">No Team Found</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      No team found matching "<strong>{query}</strong>". Please check your team name spelling or code.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchResults.map((team, idx) => {
                      const present = isTeamPresent(team);
                      const members = team.members && team.members.length > 0 ? team.members : [
                        { id: `leader-${idx}`, name: team.leader_name, email: team.leader_email }
                      ];

                      return (
                        <div
                          key={team.id || idx}
                          className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all ${
                            present ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded">
                                  {team.team_code || team.team_id || `TEAM-${idx + 1}`}
                                </span>
                                {present ? (
                                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold rounded-full flex items-center">
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" /> PRESENT & VERIFIED
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold rounded-full flex items-center">
                                    <XCircle className="w-3 h-3 mr-1 text-rose-400" /> ABSENT
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xl font-extrabold text-white mt-1">{team.team_name}</h4>
                              <p className="text-xs text-slate-400 flex items-center">
                                <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                {team.college_name || 'N/A'}
                              </p>
                            </div>

                            {present && (
                              <button
                                onClick={() => handleDownloadTeamCert(team)}
                                disabled={downloadingId === team.id}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Team PDF ({members.length})</span>
                              </button>
                            )}
                          </div>

                          {!present ? (
                            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs leading-relaxed">
                              <p className="font-bold flex items-center">
                                <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" /> Notice:
                              </p>
                              Certificates are issued exclusively for teams marked as <strong>PRESENT</strong> at the check-in desk during the hackathon.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Team Member Certificates:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {members.map((m, mIdx) => (
                                  <div
                                    key={m.id || mIdx}
                                    className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="text-xs font-bold text-white">
                                        {m.name}
                                        {mIdx === 0 && <span className="ml-1 text-[9px] text-indigo-400 font-semibold">(Leader)</span>}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono">{m.email || 'Participant'}</p>
                                    </div>

                                    <button
                                      onClick={() => handleDownloadMemberCert(m, team)}
                                      disabled={downloadingId === (m.id || m.name)}
                                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-bold text-xs rounded-lg transition-all flex items-center space-x-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>PDF</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: STAFF & ADMIN LOGIN ── */}
        {activeTab === 'login' && (
          <div className="max-w-md mx-auto w-full">
            <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white">Staff Desk Sign In</h3>
                <p className="text-xs text-slate-400 mt-1">Access verification controls, scanner & reports</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="admin@hackathon.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Quick Demo Logins</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin')}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl border border-slate-700 text-center"
                  >
                    Fill Admin Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('staff')}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 text-center"
                  >
                    Fill Staff Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-slate-600 pt-8">
        <p>© 2026 MITS Hackathon Verification & Certificate System</p>
      </footer>
    </div>
  );
}
