import React, { useState, useEffect, useMemo } from 'react';
import { getAllTeams } from '../../services/teamService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Users, 
  Building2, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const CP_KEYS = ['registration_verified', 'goibibo_registered', 'food_token_issued', 'kit_issued', 'undertaking_completed'];

export default function PresentTeamsReport() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState('present'); // 'present' | 'verified' | 'all'
  const [expandedTeams, setExpandedTeams] = useState({});

  useEffect(() => {
    loadTeamsData();
  }, []);

  async function loadTeamsData() {
    try {
      setLoading(true);
      const data = await getAllTeams();
      setTeams(data || []);
    } catch (e) {
      console.error('Failed to load teams data', e);
    } finally {
      setLoading(false);
    }
  }

  // Check if a team is present (at least 1 checkpoint ticked or registration verified)
  const isTeamPresent = (t) => {
    if (t.registration_verified === true || t.registration_verified === 1) return true;
    if (CP_KEYS.some(k => t[k] === true || t[k] === 1)) return true;
    if ((t.members || []).some(m => CP_KEYS.some(k => m[k] === true || m[k] === 1))) return true;
    return false;
  };

  // Check if all 5 checkpoints completed for a team
  const isTeamFullyVerified = (t) => {
    return CP_KEYS.every(k => t[k] === true || t[k] === 1);
  };

  // Filtered teams list based on filterMode & search query
  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      // 1. Filter by attendance mode
      if (filterMode === 'present' && !isTeamPresent(t)) return false;
      if (filterMode === 'verified' && !isTeamFullyVerified(t)) return false;

      // 2. Filter by search query
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const code = (t.team_id || t.team_code || '').toLowerCase();
      const name = (t.team_name || '').toLowerCase();
      const college = (t.college_name || '').toLowerCase();
      const leader = (t.leader_name || '').toLowerCase();
      const leaderEmail = (t.leader_email || '').toLowerCase();
      const memberNames = (t.members || []).map(m => (m.name || '').toLowerCase()).join(' ');

      return (
        code.includes(q) ||
        name.includes(q) ||
        college.includes(q) ||
        leader.includes(q) ||
        leaderEmail.includes(q) ||
        memberNames.includes(q)
      );
    });
  }, [teams, filterMode, query]);

  // Overall Statistics
  const stats = useMemo(() => {
    const presentList = teams.filter(isTeamPresent);
    const verifiedList = teams.filter(isTeamFullyVerified);
    const totalPresentMembers = presentList.reduce((acc, t) => acc + (t.members?.length || 1), 0);
    const colleges = new Set(presentList.map(t => t.college_name).filter(Boolean)).size;

    return {
      totalTeams: teams.length,
      presentTeams: presentList.length,
      verifiedTeams: verifiedList.length,
      presentMembers: totalPresentMembers,
      collegesCount: colleges
    };
  }, [teams]);

  const toggleExpand = (teamId) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const expandAll = () => {
    const allExpanded = {};
    filteredTeams.forEach(t => { allExpanded[t.id] = true; });
    setExpandedTeams(allExpanded);
  };

  const collapseAll = () => {
    setExpandedTeams({});
  };

  // ── PDF Export Functionality ──
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date().toLocaleString();

    // Header Title
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(16, 185, 129); // emerald-500
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MITS HACKATHON 2026', 14, 14);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('PRESENT TEAMS & MEMBERS OFFICIAL ROSTER REPORT', 14, 22);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(8);
    doc.text(`Generated on: ${now}  |  Filter: ${filterMode.toUpperCase()}  |  Total Teams: ${filteredTeams.length}`, 14, 28);

    let startY = 38;

    // Table Columns & Rows setup
    // We generate a row for each team member, grouping by team
    const tableBody = [];

    filteredTeams.forEach((t, index) => {
      const teamCode = t.team_id || t.team_code || `TEAM-${index + 1}`;
      const members = t.members && t.members.length > 0 ? t.members : [
        { name: t.leader_name, email: t.leader_email, phone: t.leader_phone, isLeader: true }
      ];

      members.forEach((m, mIdx) => {
        const isLeader = mIdx === 0 || m.name === t.leader_name;
        const regStatus = (m.registration_verified || t.registration_verified) ? 'PRESENT' : 'REGISTERED';
        
        tableBody.push([
          mIdx === 0 ? `${teamCode}\n(${t.team_name})` : '',
          mIdx === 0 ? t.college_name || 'N/A' : '',
          `${m.name}${isLeader ? ' (Leader)' : ''}`,
          m.email || 'N/A',
          m.phone || 'N/A',
          regStatus
        ]);
      });
    });

    autoTable(doc, {
      startY: startY,
      head: [['Team ID & Name', 'College', 'Member Name', 'Email', 'Phone', 'Status']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // emerald-500
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42 },
        1: { cellWidth: 38 },
        2: { fontStyle: 'bold', cellWidth: 35 },
        3: { cellWidth: 42 },
        4: { cellWidth: 26 },
        5: { cellWidth: 17, halign: 'center', fontStyle: 'bold' }
      },
      margin: { top: 38, bottom: 20 },
      didDrawPage: (data) => {
        // Footer Page Number
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}  •  MITS Hackathon Verification Desk System`,
          14,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`Present_Teams_Roster_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ── Browser Native Print Layout ──
  const handlePrint = () => {
    window.print();
  };

  // ── Excel Export ──
  const handleExportExcel = () => {
    const rows = [];
    filteredTeams.forEach(t => {
      const members = t.members && t.members.length > 0 ? t.members : [
        { name: t.leader_name, email: t.leader_email, phone: t.leader_phone }
      ];
      members.forEach((m, idx) => {
        rows.push({
          'Team Code': t.team_id || t.team_code,
          'Team Name': t.team_name,
          'College Name': t.college_name,
          'Member Role': idx === 0 ? 'Leader' : 'Member',
          'Member Name': m.name,
          'Member Email': m.email || '',
          'Member Phone': m.phone || '',
          'Registration Verified': (m.registration_verified || t.registration_verified) ? 'YES' : 'NO',
          'Goibibo Reg.': (m.goibibo_registered || t.goibibo_registered) ? 'YES' : 'NO',
          'Food Token': (m.food_token_issued || t.food_token_issued) ? 'YES' : 'NO',
          'Kit Issued': (m.kit_issued || t.kit_issued) ? 'YES' : 'NO',
          'Undertaking': (m.undertaking_completed || t.undertaking_completed) ? 'YES' : 'NO'
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Present Teams Data');
    XLSX.writeFile(workbook, `Present_Teams_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ── Header Controls (Hidden on Print) ── */}
      <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Present Teams PDF & Member Export</h1>
              <p className="text-slate-400 text-sm mt-0.5">Export present teams list and member rosters to PDF, Excel or Print</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadTeamsData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stats Cards (Print: hidden or stylized) ── */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Present Teams</span>
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.presentTeams}</p>
          <span className="text-xs text-slate-500 mt-1 block">Out of {stats.totalTeams} registered</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Present Members</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{stats.presentMembers}</p>
          <span className="text-xs text-slate-500 mt-1 block">Active event participants</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Fully Verified</span>
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-purple-400 mt-2">{stats.verifiedTeams}</p>
          <span className="text-xs text-slate-500 mt-1 block">All 5 checkpoints done</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Colleges</span>
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">{stats.collegesCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Represented institutions</span>
        </div>
      </div>

      {/* ── Search & Filter Controls (Hidden on Print) ── */}
      <div className="print:hidden bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilterMode('present')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'present' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Present Teams ({stats.presentTeams})
            </button>
            <button
              onClick={() => setFilterMode('verified')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'verified' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fully Verified ({stats.verifiedTeams})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Teams ({stats.totalTeams})
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Team, Member, Email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={expandAll}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors whitespace-nowrap"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors whitespace-nowrap"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* ── Print Header (Visible ONLY during print) ── */}
      <div className="hidden print:block text-slate-900 border-b border-slate-300 pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">MITS HACKATHON 2026</h1>
        <p className="text-base font-bold text-emerald-700 uppercase">Present Teams & Member Roster Report</p>
        <div className="flex justify-between text-xs text-slate-600 mt-2 font-mono">
          <span>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
          <span>Filter: {filterMode.toUpperCase()}</span>
          <span>Total Teams: {filteredTeams.length}</span>
        </div>
      </div>

      {/* ── Main Teams & Members Table ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden print:border-none print:bg-transparent">
        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
            <p>Loading teams and member attendance records...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p>No teams matching the filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-4 p-4 md:p-6 print:p-0">
            {filteredTeams.map((team, idx) => {
              const isExpanded = expandedTeams[team.id] !== false; // Default expanded
              const isPresent = isTeamPresent(team);
              const isFullyVerified = isTeamFullyVerified(team);
              const members = team.members && team.members.length > 0 ? team.members : [
                { id: 'leader-1', name: team.leader_name, email: team.leader_email, phone: team.leader_phone, registration_verified: team.registration_verified }
              ];

              return (
                <div
                  key={team.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition-all print:border-b print:border-slate-300 print:rounded-none print:bg-transparent print:mb-4 print:break-inside-avoid"
                >
                  {/* Team Card Header */}
                  <div
                    onClick={() => toggleExpand(team.id)}
                    className="p-4 bg-slate-900/80 hover:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer border-b border-slate-800 print:bg-slate-100 print:text-black print:border-slate-300"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold rounded-lg print:text-emerald-800 print:border-emerald-700">
                        {team.team_id || team.team_code || `TEAM-${idx+1}`}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-white text-base print:text-slate-900">{team.team_name}</h3>
                        <p className="text-xs text-slate-400 flex items-center print:text-slate-700">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500 print:text-slate-700" />
                          {team.college_name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1.5">
                        {isFullyVerified ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase rounded-full print:border print:border-emerald-700">
                            ✓ Fully Verified
                          </span>
                        ) : isPresent ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase rounded-full print:text-slate-900">
                            ● Present
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-800 text-slate-500 text-[10px] font-bold uppercase rounded-full">
                            Pending Check-in
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium print:text-slate-800">
                          ({members.length} Members)
                        </span>
                      </div>

                      <div className="text-slate-400 print:hidden">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Members Table */}
                  {isExpanded && (
                    <div className="overflow-x-auto p-4 print:p-2">
                      <table className="w-full text-left text-xs text-slate-300 print:text-black">
                        <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-slate-800 print:border-slate-300 print:text-slate-700">
                          <tr>
                            <th className="pb-2 px-3">Role</th>
                            <th className="pb-2 px-3">Member Name</th>
                            <th className="pb-2 px-3">Email Address</th>
                            <th className="pb-2 px-3">Phone</th>
                            <th className="pb-2 px-3 text-center">Checkpoints Done</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                          {members.map((m, mIdx) => {
                            const isLeader = mIdx === 0 || m.name === team.leader_name;
                            const doneCps = CP_KEYS.filter(k => m[k] === true || m[k] === 1 || team[k] === true).length;

                            return (
                              <tr key={m.id || mIdx} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                                <td className="py-2.5 px-3">
                                  {isLeader ? (
                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold rounded print:text-indigo-800">
                                      Leader
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 print:text-slate-700">Member {mIdx + 1}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-white print:text-slate-900">
                                  {m.name}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] print:text-slate-800">
                                  {m.email || 'N/A'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] print:text-slate-800">
                                  {m.phone || 'N/A'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    doneCps === 5 ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800' : 'bg-slate-800 text-slate-400 print:text-slate-700'
                                  }`}>
                                    {doneCps} / 5 Checkpoints
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
