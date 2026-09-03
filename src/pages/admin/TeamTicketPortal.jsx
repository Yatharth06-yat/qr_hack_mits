import React, { useState, useEffect } from 'react';
import { getTeams } from '../../services/teamService';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Printer, Building2, User, Mail, ShieldCheck } from 'lucide-react';

export default function TeamTicketPortal() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      setLoading(true);
      const data = await getTeams();
      setTeams(data);
      if (data.length > 0) setSelectedTeam(data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Ticket Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Official Event Team Pass & QR Badge Render</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-700 transition-colors inline-flex items-center space-x-2"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Print Pass</span>
        </button>
      </div>

      {/* Select Team Dropdown */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Registered Team</label>
        <select
          value={selectedTeam ? selectedTeam.id : ''}
          onChange={(e) => {
            const t = teams.find(x => x.id === e.target.value);
            if (t) setSelectedTeam(t);
          }}
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.team_code} - {t.team_name} ({t.college_name})</option>
          ))}
        </select>
      </div>

      {/* Printable Ticket Badge */}
      {selectedTeam && (
        <div className="max-w-xl mx-auto bg-slate-900 border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-emerald-500 p-6 text-slate-950 text-center">
            <div className="flex justify-center mb-1">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">HACKATHON 2026 PASS</h2>
            <p className="text-xs font-bold uppercase tracking-wider mt-0.5 text-slate-900">Official Team Verification Ticket</p>
          </div>

          <div className="p-8 space-y-6 text-center">
            <div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm font-extrabold rounded-full">
                {selectedTeam.team_code}
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-3">{selectedTeam.team_name}</h3>
              <p className="text-slate-400 text-sm mt-1 flex items-center justify-center">
                <Building2 className="w-4 h-4 mr-1 text-slate-500" /> {selectedTeam.college_name}
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Team Leader & Roster</span>
              <p className="text-white font-medium text-sm">{selectedTeam.leader_name} ({selectedTeam.leader_email})</p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside pt-1">
                {(selectedTeam.members || []).map((m, i) => (
                  <li key={i}>{m.name}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl">
                <QRCodeSVG value={selectedTeam.qr_token} size={180} level="H" />
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold mt-3 block">QR TOKEN: {selectedTeam.qr_token}</span>
              <p className="text-xs text-slate-500 mt-1">Opaque Security Token. Validated by desk scanner.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
