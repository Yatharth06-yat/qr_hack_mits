import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

export default function AdminCertificates() {
  const [activeTab, setActiveTab] = useState('template'); // 'template' | 'present_teams'
  const [config, setConfig] = useState(DEFAULT_CERTIFICATE_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkDownloading, setBulkDownloading] = useState(false);

  useEffect(() => {
    const loadedConfig = getSavedCertificateConfig();
    setConfig(loadedConfig);
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoadingTeams(true);
    try {
      const data = await getAllTeams();
      setTeams(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTeams(false);
    }
  }

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
    const fileName = `${member.name.replace(/\s+/g, '_')}_Certificate.pdf`;
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
              Upload/Configure sample certificate templates & generate certificates for present teams
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreviewSample}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-sm rounded-xl border border-amber-500/30 transition-all shadow-md"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Preview Sample PDF</span>
          </button>

          {activeTab === 'present_teams' && (
            <button
              onClick={handleBulkDownloadAllPresent}
              disabled={bulkDownloading || presentTeams.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>{bulkDownloading ? 'Generating...' : `Export All Present (${presentTeams.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit text-sm font-semibold">
        <button
          onClick={() => setActiveTab('template')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'template' 
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Certificate Template & Sample</span>
        </button>

        <button
          onClick={() => setActiveTab('present_teams')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'present_teams' 
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Present Teams Certificates ({presentTeams.length})</span>
        </button>
      </div>

      {/* TAB 1: Template & Sample Settings */}
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
                  <label className="block text-[11px] text-slate-500 mb-1">Paragraph 2 (Dedication & appreciation):</label>
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

            <button
              onClick={handlePreviewSample}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res Sample PDF Preview</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Present Teams Certificate List */}
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
    </div>
  );
}
