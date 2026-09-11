import React, { useState } from 'react';
import { searchTeams } from '../../services/teamService';
import { 
  getSavedCertificateConfig, 
  generateMemberCertificate, 
  generateTeamCertificates 
} from '../../utils/certificateGenerator';
import { 
  Award, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Users, 
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CertificateDownload() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null); // null when not searched yet
  const [downloadingId, setDownloadingId] = useState(null);

  const CP_KEYS = ['registration_verified', 'goibibo_registered', 'food_token_issued', 'kit_issued', 'undertaking_completed'];
  const isTeamPresent = (t) => {
    if (!t) return false;
    if (t.is_present === true || t.is_present === 1 || t.is_present === 'true') return true;
    if (t.registration_verified === true || t.registration_verified === 1 || t.registration_verified === 'true') return true;
    if (CP_KEYS.some(k => t[k] === true || t[k] === 1 || t[k] === 'true')) return true;
    if ((t.members || []).some(m => m.is_present === true || m.registration_verified === true)) return true;
    return false;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await searchTeams(query.trim());
      setResults(data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Public Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide">MITS HACKATHON 2026</h1>
              <p className="text-xs text-amber-400 font-semibold">Official Certificate Download Portal</p>
            </div>
          </div>

          <Link
            to="/login"
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            <span>Staff Login</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Instant Certificate Verification & Download
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Download Your Hackathon Certificate
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Enter your <strong>Team Name</strong> or <strong>Team Code</strong> (e.g. HACK-001) to search for your team and download official participation certificates.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-3xl shadow-2xl shadow-amber-500/5">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Team Name or Team Code (e.g. Code Warriors or HACK-001)..."
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm md:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full md:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{searching ? 'Searching...' : 'Search Certificate'}</span>
            </button>
          </form>
        </div>

        {/* Search Results Display */}
        {results !== null && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                Search Results ({results.length} Teams Found)
              </h3>
              {results.length > 0 && (
                <span className="text-xs text-slate-400 font-mono">Query: "{query}"</span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
                <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h4 className="text-lg font-bold text-white">No Team Found</h4>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  We couldn't find any registered team matching "<strong>{query}</strong>". Please check your team name spelling or team code and try again.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((team, idx) => {
                  const present = isTeamPresent(team);
                  const members = team.members && team.members.length > 0 ? team.members : [
                    { id: `leader-${idx}`, name: team.leader_name, email: team.leader_email, phone: team.leader_phone }
                  ];

                  return (
                    <div
                      key={team.id || idx}
                      className={`bg-slate-900 border rounded-3xl p-6 space-y-6 transition-all ${
                        present ? 'border-amber-500/40 shadow-xl shadow-amber-500/5' : 'border-slate-800'
                      }`}
                    >
                      {/* Team Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded-md">
                              {team.team_code || team.team_id || `TEAM-${idx + 1}`}
                            </span>
                            {present ? (
                              <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold rounded-full flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> PRESENT & VERIFIED
                              </span>
                            ) : (
                              <span className="px-3 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-extrabold rounded-full flex items-center">
                                <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" /> ABSENT / UNVERIFIED
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-extrabold text-white mt-1">{team.team_name}</h3>
                          <p className="text-xs text-slate-400 flex items-center">
                            <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            {team.college_name || 'MITS Gwalior'}
                          </p>
                        </div>

                        {present && (
                          <button
                            onClick={() => handleDownloadTeamCert(team)}
                            disabled={downloadingId === team.id}
                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download All Team Certificates PDF ({members.length})</span>
                          </button>
                        )}
                      </div>

                      {/* Presence Check Condition */}
                      {!present ? (
                        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-rose-300 text-xs leading-relaxed space-y-1">
                          <p className="font-bold flex items-center text-rose-200">
                            <XCircle className="w-4 h-4 mr-1.5 text-rose-400" /> Attendance Notice:
                          </p>
                          <p>
                            Certificates are issued exclusively to teams marked as <strong>PRESENT</strong> at the physical check-in desk during MITS Hackathon 2026. If you attended but your team status is absent, please visit the organizer verification desk.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                            <Users className="w-4 h-4 mr-1.5 text-amber-400" /> Team Members & Certificates:
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {members.map((m, mIdx) => (
                              <div
                                key={m.id || mIdx}
                                className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-amber-500/30 transition-all"
                              >
                                <div className="space-y-0.5">
                                  <p className="text-sm font-bold text-white flex items-center">
                                    {m.name}
                                    {mIdx === 0 && (
                                      <span className="ml-2 text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded">Leader</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-400 font-mono">{m.email || 'Participant'}</p>
                                  <span className="inline-block text-[10px] font-semibold text-emerald-400">● Certificate Ready</span>
                                </div>

                                <button
                                  onClick={() => handleDownloadMemberCert(m, team)}
                                  disabled={downloadingId === (m.id || m.name)}
                                  className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
                                >
                                  <Download className="w-3.5 h-3.5" />
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 MITS Hackathon Verification & Certificate Desk. All rights reserved.</p>
      </footer>
    </div>
  );
}
