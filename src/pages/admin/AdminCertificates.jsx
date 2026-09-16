import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getAllTeams } from '../../services/teamService';
import { 
  getSavedCertificateConfig, 
  saveCertificateConfig, 
  generateMemberCertificate, 
  generateTeamCertificates, 
  generateSampleCertificate,
  DEFAULT_CERTIFICATE_CONFIG
} from '../../utils/certificateGenerator';
import { 
  Award, 
  Download, 
  Eye, 
  Save, 
  RefreshCw, 
  Search, 
  Upload, 
  CheckCircle2, 
  Users, 
  Building2,
  FileCheck,
  Sparkles,
  FileSpreadsheet,
  Copy,
  Check,
  ShieldCheck,
  Filter
} from 'lucide-react';

export default function AdminCertificates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all_participants';
  const [activeTab, setActiveTab] = useState(initialTab); // 'all_participants' | 'present_teams' | 'template'
  const [config, setConfig] = useState(DEFAULT_CERTIFICATE_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  
  // Search & Filter state for All Participants
  const [participantSearch, setParticipantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending'
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingCertId, setDownloadingCertId] = useState(null);

  // State for Present Teams Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkDownloading, setBulkDownloading] = useState(false);

  useEffect(() => {
    const loadedConfig = getSavedCertificateConfig();
    setConfig(loadedConfig);
    loadTeams();
  }, []);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  async function loadTeams() {
    setLoadingTeams(true);
    try {
      const data = await getAllTeams();
      setTeams(data || []);
    } catch (e) {
      console.error('Failed to load teams:', e);
    } finally {
      setLoadingTeams(false);
    }
  }

  // Flatten all participants across teams
  const allParticipants = useMemo(() => {
    const list = [];
    let counter = 1;
    (teams || []).forEach(team => {
      const members = team.members && team.members.length > 0 ? team.members : [
        { 
          id: team.id ? `lead-${team.id.substring(0, 8)}` : `mem-${counter}`, 
          name: team.leader_name || 'Team Leader', 
          email: team.leader_email || '', 
          phone: team.leader_phone || '',
          registration_verified: team.registration_verified,
          is_present: team.is_present
        }
      ];

      members.forEach((m, idx) => {
        const certId = m.id ? `CERT-${m.id.substring(0, 8).toUpperCase()}` : `CERT-${String(counter).padStart(6, '0')}`;
        const isVerified = Boolean(
          m.registration_verified === true || m.registration_verified === 1 ||
          m.is_present === true || m.is_present === 1 ||
          team.registration_verified === true || team.registration_verified === 1 ||
          team.is_present === true || team.is_present === 1
        );

        list.push({
          sNo: counter++,
          memberId: m.id,
          certId,
          name: m.name || 'Participant',
          email: m.email && m.email !== 'Not Provided' ? m.email : (team.leader_email || 'Not Provided'),
          phone: m.phone && m.phone !== 'Not Provided' ? m.phone : (team.leader_phone || 'Not Provided'),
          isLeader: idx === 0,
          teamName: team.team_name || 'N/A',
          teamCode: team.team_code || team.team_id || 'N/A',
          college: team.college_name || 'Madhav Institute of Technology & Science',
          isVerified,
          rawMember: m,
          rawTeam: team
        });
      });
    });
    return list;
  }, [teams]);

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    return allParticipants.filter(p => {
      // Status filter
      if (statusFilter === 'verified' && !p.isVerified) return false;
      if (statusFilter === 'pending' && p.isVerified) return false;

      // Text search
      if (!participantSearch.trim()) return true;
      const q = participantSearch.toLowerCase().trim();
      return (
        p.certId.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.teamCode.toLowerCase().includes(q) ||
        p.college.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });
  }, [allParticipants, participantSearch, statusFilter]);

  // Excel Export Handler
  const handleExportExcel = () => {
    if (allParticipants.length === 0) return;

    const rows = allParticipants.map(p => ({
      'S.No.': p.sNo,
      'Certificate ID': p.certId,
      'Participant Name': p.name,
      'Role': p.isLeader ? 'Leader' : 'Member',
      'Team Name': p.teamName,
      'Team Code': p.teamCode,
      'College': p.college,
      'Email': p.email,
      'Phone': p.phone,
      'Verification Status': p.isVerified ? 'Verified' : 'Pending',
      'Issue Date': config.issueDate || '2026-09-12',
      'Member UUID': p.memberId || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    ws['!cols'] = [
      { wch: 6 },   // S.No.
      { wch: 18 },  // Certificate ID
      { wch: 28 },  // Participant Name
      { wch: 12 },  // Role
      { wch: 26 },  // Team Name
      { wch: 14 },  // Team Code
      { wch: 36 },  // College
      { wch: 28 },  // Email
      { wch: 16 },  // Phone
      { wch: 20 },  // Verification Status
      { wch: 14 },  // Issue Date
      { wch: 38 },  // Member UUID
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Participant Certificates');
    XLSX.writeFile(wb, 'hackathon_participants_certificate_ids.xlsx');
  };

  const handleCopyId = (certId) => {
    navigator.clipboard.writeText(certId);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper check for present status
  const CP_KEYS = ['registration_verified', 'goibibo_registered', 'food_token_issued', 'kit_issued', 'undertaking_completed'];
  const isTeamPresent = (t) => {
    if (!t) return false;
    if (t.is_present === true || t.is_present === 1 || t.is_present === 'true') return true;
    if (t.registration_verified === true || t.registration_verified === 1 || t.registration_verified === 'true') return true;
    if (CP_KEYS.some(k => t[k] === true || t[k] === 1 || t[k] === 'true')) return true;
    if ((t.members || []).some(m => m.is_present === true || m.registration_verified === true)) return true;
    return false;
  };

  const presentTeams = teams.filter(isTeamPresent);
  const filteredPresentTeams = presentTeams.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.team_name || '').toLowerCase().includes(q) ||
      (t.team_code || t.team_id || '').toLowerCase().includes(q) ||
      (t.college_name || '').toLowerCase().includes(q) ||
      (t.leader_name || '').toLowerCase().includes(q)
    );
  });

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveCertificateConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setConfig(prev => ({ ...prev, sampleLogoUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handlePreviewSample = () => {
    const doc = generateSampleCertificate(config);
    doc.save(`Sample_Certificate_${config.eventTitle.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownloadMemberCert = (member, team) => {
    const doc = generateMemberCertificate(member, team, config);
    const fileName = `${(member.name || 'Participant').replace(/\s+/g, '_')}_Certificate.pdf`;
    doc.save(fileName);
  };

  const handleDownloadTeamCert = (team) => {
    const doc = generateTeamCertificates(team, config);
    if (doc) {
      doc.save(`Team_${team.team_name.replace(/\s+/g, '_')}_Certificates.pdf`);
    }
  };

  const handleBulkDownloadAllPresent = async () => {
    if (presentTeams.length === 0) return;
    setBulkDownloading(true);
    try {
      presentTeams.forEach((team) => {
        const doc = generateTeamCertificates(team, config);
        if (doc) {
          doc.save(`${team.team_code || 'TEAM'}_${team.team_name.replace(/\s+/g, '_')}_Certificates.pdf`);
        }
      });
    } catch (e) {
      console.error('Bulk download error:', e);
    } finally {
      setBulkDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Certificate Management Desk</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              View &amp; Export All Participant Certificate IDs to Excel, Configure Templates &amp; Generate PDFs
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Direct Excel Export Button */}
          <button
            onClick={handleExportExcel}
            disabled={allParticipants.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            title="Download Excel Sheet with all Participant Certificate IDs and Details"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel ({allParticipants.length})</span>
          </button>

          <button
            onClick={handlePreviewSample}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-sm rounded-xl border border-amber-500/30 transition-all shadow-md"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Sample PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1 text-sm font-semibold">
        <button
          onClick={() => handleTabChange('all_participants')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'all_participants' 
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Certificate IDs Directory ({allParticipants.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('present_teams')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'present_teams' 
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Present Teams ({presentTeams.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('template')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'template' 
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Template Settings</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: ALL PARTICIPANT CERTIFICATE IDS & EXCEL DIRECTORY     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'all_participants' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Certificates</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{allParticipants.length}</h3>
              <span className="text-[11px] text-slate-500">Across {teams.length} Teams</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Participants</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">
                {allParticipants.filter(p => p.isVerified).length}
              </h3>
              <span className="text-[11px] text-slate-500">Attendance marked present</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Participants</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">
                {allParticipants.filter(p => !p.isVerified).length}
              </h3>
              <span className="text-[11px] text-slate-500">Awaiting desk check-in</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Excel Export Status</p>
              <button
                onClick={handleExportExcel}
                className="mt-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .XLSX</span>
              </button>
            </div>
          </div>

          {/* Search, Filters & Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full md:w-96 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search Certificate ID (e.g. CERT-7C039BF5), Name, Team..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              {/* Filter Pills */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  All ({allParticipants.length})
                </button>
                <button
                  onClick={() => setStatusFilter('verified')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'verified' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  Verified ({allParticipants.filter(p => p.isVerified).length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'pending' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  Pending ({allParticipants.filter(p => !p.isVerified).length})
                </button>
              </div>

              <button
                onClick={loadTeams}
                disabled={loadingTeams}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                title="Refresh Participant List"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTeams ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Participants Table */}
          {loadingTeams ? (
            <div className="py-20 text-center text-slate-500 space-y-3 bg-slate-900 rounded-2xl border border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p>Loading certificate database...</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              <p>No participant certificates found matching your search query or filter.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Certificate ID</th>
                      <th className="py-3.5 px-4">Participant Name</th>
                      <th className="py-3.5 px-4">Team</th>
                      <th className="py-3.5 px-4">College</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
                    {filteredParticipants.map((p) => {
                      const isCopied = copiedId === p.certId;
                      return (
                        <tr key={p.certId + p.sNo} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-500 font-mono">{p.sNo}</td>
                          
                          {/* Certificate ID Badge with Copy */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center space-x-1.5 bg-purple-950/40 border border-purple-800/60 text-purple-300 font-mono font-bold px-2.5 py-1 rounded-lg">
                              <span>{p.certId}</span>
                              <button
                                onClick={() => handleCopyId(p.certId)}
                                className="text-purple-400 hover:text-white p-0.5 rounded transition-colors"
                                title="Copy Certificate ID"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          {/* Participant Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center space-x-2">
                              <span>{p.name}</span>
                              {p.isLeader && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-semibold">
                                  Leader
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{p.email}</span>
                          </td>

                          {/* Team Name & Code */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-100">{p.teamName}</div>
                            <span className="text-[10px] text-amber-400/90 font-mono">{p.teamCode}</span>
                          </td>

                          {/* College */}
                          <td className="py-3 px-4 max-w-[200px] truncate text-slate-400" title={p.college}>
                            {p.college}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {p.isVerified ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Action - Download PDF */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setDownloadingCertId(p.certId);
                                handleDownloadMemberCert(p.rawMember, p.rawTeam);
                                setTimeout(() => setDownloadingCertId(null), 500);
                              }}
                              disabled={downloadingCertId === p.certId}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-bold text-xs rounded-xl transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{downloadingCertId === p.certId ? 'PDF...' : 'PDF'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <span>
                  Showing <strong>{filteredParticipants.length}</strong> of <strong>{allParticipants.length}</strong> participant certificates
                </span>
                <button
                  onClick={handleExportExcel}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Full Excel Spreadsheet (.xlsx)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: PRESENT TEAMS CERTIFICATES                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'present_teams' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 w-full md:w-80 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Present Team or Member..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-400">
              <span>Present Teams: <strong className="text-emerald-400">{presentTeams.length}</strong></span>
              <button
                onClick={handleBulkDownloadAllPresent}
                disabled={bulkDownloading || presentTeams.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{bulkDownloading ? 'Exporting...' : `Export All (${presentTeams.length})`}</span>
              </button>
              <button
                onClick={loadTeams}
                disabled={loadingTeams}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTeams ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Present Teams Cards & Certificate Generator */}
          {loadingTeams ? (
            <div className="py-16 text-center text-slate-500 space-y-3 bg-slate-900 rounded-2xl border border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p>Loading present teams...</p>
            </div>
          ) : filteredPresentTeams.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              <p>No present teams found matching your query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPresentTeams.map((team, idx) => {
                const members = team.members && team.members.length > 0 ? team.members : [
                  { id: `mem-leader-${idx}`, name: team.leader_name, email: team.leader_email, phone: team.leader_phone }
                ];

                return (
                  <div key={team.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded">
                            {team.team_code || team.team_id || `TEAM-${idx + 1}`}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-extrabold rounded-full uppercase">
                            ✓ PRESENT
                          </span>
                        </div>
                        <h3 className="font-extrabold text-white text-base mt-1">{team.team_name}</h3>
                        <p className="text-xs text-slate-400 flex items-center mt-0.5">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          {team.college_name || 'N/A'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDownloadTeamCert(team)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
                        title="Download certificates for all team members in one PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Team PDF ({members.length})</span>
                      </button>
                    </div>

                    {/* Member Certificate List */}
                    <div className="border-t border-slate-800 pt-3 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Present Team Members:</p>
                      <div className="space-y-1.5">
                        {members.map((m, mIdx) => (
                          <div key={m.id || mIdx} className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                            <div>
                              <p className="text-xs font-bold text-white flex items-center">
                                {m.name}
                                {mIdx === 0 && (
                                  <span className="ml-1.5 text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded">Leader</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">{m.email || 'N/A'}</p>
                            </div>

                            <button
                              onClick={() => handleDownloadMemberCert(m, team)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold rounded-lg border border-slate-700 transition-colors flex items-center space-x-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Certificate</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: TEMPLATE & SAMPLE SETTINGS                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-400" /> Certificate Template Settings
              </h2>
              {savedSuccess && (
                <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Template Saved Successfully!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Title</label>
                  <input
                    type="text"
                    value={config.eventTitle}
                    onChange={(e) => setConfig({ ...config, eventTitle: e.target.value })}
                    placeholder="IEEE HACK SYNAPSE"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Certificate Title</label>
                  <input
                    type="text"
                    value={config.certificateTitle}
                    onChange={(e) => setConfig({ ...config, certificateTitle: e.target.value })}
                    placeholder="CERTIFICATE"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subtitle</label>
                  <input
                    type="text"
                    value={config.certificateSubtitle || 'OF PARTICIPATION'}
                    onChange={(e) => setConfig({ ...config, certificateSubtitle: e.target.value })}
                    placeholder="OF PARTICIPATION"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Presentation Header Line</label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  placeholder="This certificate is proudly presented to"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Citation Paragraphs</label>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Paragraph 1 (Participation details):</label>
                  <textarea
                    rows="2"
                    value={config.descriptionLine1 || config.description}
                    onChange={(e) => setConfig({ ...config, descriptionLine1: e.target.value, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Paragraph 2 (Dedication &amp; appreciation):</label>
                  <textarea
                    rows="2"
                    value={config.descriptionLine2 || ''}
                    onChange={(e) => setConfig({ ...config, descriptionLine2: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* 2 Signatories Configuration Grid */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Official Signatories (2 Columns)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(config.signatories || DEFAULT_CERTIFICATE_CONFIG.signatories).map((sig, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-400">
                        <span>Signatory #{idx + 1} ({idx === 0 ? 'Left' : 'Right'})</span>
                        <span className="text-[10px] text-amber-400">✓ Signature Included</span>
                      </div>
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => {
                          const updated = [...(config.signatories || DEFAULT_CERTIFICATE_CONFIG.signatories)];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setConfig({ ...config, signatories: updated });
                        }}
                        placeholder="Signatory Name"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
                      />
                      <input
                        type="text"
                        value={sig.title}
                        onChange={(e) => {
                          const updated = [...(config.signatories || DEFAULT_CERTIFICATE_CONFIG.signatories)];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setConfig({ ...config, signatories: updated });
                        }}
                        placeholder="Title / Role"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300"
                      />
                      <input
                        type="text"
                        value={sig.dept}
                        onChange={(e) => {
                          const updated = [...(config.signatories || DEFAULT_CERTIFICATE_CONFIG.signatories)];
                          updated[idx] = { ...updated[idx], dept: e.target.value };
                          setConfig({ ...config, signatories: updated });
                        }}
                        placeholder="Department / Branch"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Logo / Sample Image upload */}
              <div className="border-t border-slate-800 pt-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Custom Logo Override (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-300 hover:file:bg-slate-700 cursor-pointer"
                  />
                  {config.sampleLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, sampleLogoUrl: '' })}
                      className="text-xs text-rose-400 hover:underline whitespace-nowrap"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Template Settings</span>
                </button>

                <button
                  type="button"
                  onClick={handlePreviewSample}
                  className="flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-colors border border-slate-700"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Download Sample PDF Preview</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sample Card Preview matching IEEE HackSynapse layout */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-amber-400" /> Live Certificate Preview
            </h2>

            {/* Simulated IEEE HackSynapse Certificate Frame */}
            <div className="p-4 bg-purple-950/40 border border-purple-900/60 rounded-2xl relative overflow-hidden shadow-2xl">
              <div className="bg-white text-slate-900 rounded-xl p-5 border border-purple-900 space-y-4 relative">
                {/* Header Logos */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="text-[9px] font-bold text-rose-800 leading-tight">
                    <p className="font-extrabold">IEEE RAS</p>
                    <p className="text-[7px] text-slate-500">MITS GWALIOR</p>
                  </div>
                  <div className="text-center font-black text-blue-700 tracking-tighter text-lg font-sans">
                    IEEE
                  </div>
                  <div className="text-right text-[9px] font-bold text-emerald-700 leading-tight">
                    <p className="font-extrabold">IEEE IAS</p>
                    <p className="text-[7px] text-slate-500">MITS GWALIOR</p>
                  </div>
                </div>

                {/* Headings */}
                <div className="text-center space-y-0.5">
                  <h3 className="text-lg font-serif font-black text-purple-950 tracking-wider">
                    {config.certificateTitle || 'CERTIFICATE'}
                  </h3>
                  <p className="text-[10px] font-sans font-bold text-purple-900 tracking-widest uppercase">
                    {config.certificateSubtitle || 'OF PARTICIPATION'}
                  </p>
                  <h2 className="text-xl font-serif font-black text-purple-950 pt-2 tracking-wide">
                    {config.eventTitle || 'IEEE HACKSYNAPSE'}
                  </h2>
                  <p className="text-[10px] text-slate-600 font-sans italic pt-0.5">
                    {config.subtitle || 'This certificate is proudly presented to'}
                  </p>
                </div>
                
                {/* Recipient Name */}
                <div className="text-center pt-3 pb-1">
                  <h4 className="text-xl font-serif font-black text-slate-900 tracking-wider border-b border-slate-300 pb-1 inline-block px-8">
                    YATHARTH GUPTA
                  </h4>
                </div>

                {/* Citation */}
                <div className="text-center text-[9px] text-slate-600 space-y-1 max-w-sm mx-auto leading-relaxed">
                  <p>{config.descriptionLine1 || config.description}</p>
                  <p>{config.descriptionLine2}</p>
                </div>

                {/* 2 Signatories with Signatures */}
                <div className="flex items-end justify-between text-[8px] text-center pt-6 px-4">
                  {(config.signatories || DEFAULT_CERTIFICATE_CONFIG.signatories).slice(0, 2).map((sig, sIdx) => (
                    <div key={sIdx} className="space-y-0.5 relative min-w-[120px]">
                      {/* Signature graphic rendering */}
                      <div className="h-6 flex items-end justify-center pb-1">
                        {sIdx === 0 ? (
                          <svg className="w-16 h-6 text-slate-900" viewBox="0 0 200 80">
                            <path d="M 30 65 L 42 12 L 52 58 L 62 25 L 72 58 Q 85 48 115 52 M 128 50 L 129 50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="135" cy="50" r="3" fill="currentColor"/>
                          </svg>
                        ) : (
                          <span className="font-serif italic font-bold text-sm text-slate-900 tracking-wide">
                            Soumyajit Ghosh.
                          </span>
                        )}
                      </div>
                      <div className="border-t border-slate-400 pt-1">
                        <p className="font-bold text-slate-900 leading-tight">{sig.name}</p>
                        <p className="text-slate-600 leading-none">{sig.title}</p>
                        <p className="text-slate-500 text-[7px] leading-none">{sig.dept}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

