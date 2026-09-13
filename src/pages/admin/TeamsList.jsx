
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTeams, searchTeams } from '../../services/teamService';
import { Search, ExternalLink } from 'lucide-react';

export default function TeamsList() {
  const [teams, setTeams] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      setLoading(true);
      const data = await getAllTeams();
      setTeams(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    const val = e.target.value;
    setQuery(val);
    if (val.trim() === '') {
      loadTeams();
    } else {
      const results = await searchTeams(val);
      setTeams(results);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Teams Directory ({teams.length} Teams)</h1>
          <p className="text-slate-400 text-sm mt-1">Search and view HackSynapse registered teams</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search TEAM-2026-XXXX, Name, Leader, College..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Team ID</th>
                <th className="py-3.5 px-6">Team Name</th>
                <th className="py-3.5 px-6">College</th>
                <th className="py-3.5 px-6">Leader Name</th>
                <th className="py-3.5 px-6">Leader Email</th>
                <th className="py-3.5 px-6">Members</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">Loading teams from Supabase...</td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">No teams found matching search.</td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-emerald-400 font-mono">
                      {t.team_id || t.team_code}
                    </td>
                    <td className="py-4 px-6 font-medium text-white">{t.team_name}</td>
                    <td className="py-4 px-6 text-slate-400">{t.college_name}</td>
                    <td className="py-4 px-6 font-medium text-white">{t.leader_name}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">{t.leader_email}</td>
                    <td className="py-4 px-6">{t.members ? t.members.length : 1} Members</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/teams/${t.id}`)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors inline-flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
