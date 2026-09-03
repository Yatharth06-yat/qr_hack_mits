import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getTeams } from '../../services/teamService';
import { FileCheck, Upload, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function DocumentManagement() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [docType, setDocType] = useState('health');
  const [fileName, setFileName] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const t = await getTeams();
    setTeams(t);
    if (t.length > 0) {
      setSelectedTeamId(t[0].id);
      fetchDocs(t[0].id);
    }
  }

  async function fetchDocs(teamId) {
    const { data } = await supabase.from('documents').select('*').eq('team_id', teamId);
    setDocuments(data || []);
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !fileName) return;
    setLoading(true);

    try {
      await supabase.from('documents').insert([{
        team_id: selectedTeamId,
        document_type: docType,
        file_name: fileName,
        status: 'submitted',
        storage_path: `/documents/${selectedTeamId}/${docType}.pdf`
      }]);
      setFileName('');
      fetchDocs(selectedTeamId);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Document Management</h1>
        <p className="text-slate-400 text-sm mt-1">Manage Health Forms, Discipline Forms, and Event Tickets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Upload className="w-5 h-5 mr-2 text-emerald-400" /> Upload Document
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Team</label>
              <select
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  fetchDocs(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.team_code} - {t.team_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="health">Health Form</option>
                <option value="discipline">Discipline Undertaking</option>
                <option value="ticket">Ticket PDF Pass</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Document Name / File</label>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Signed_Health_Form_CodeWarriors.pdf"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Document'}
            </button>
          </form>
        </div>

        {/* Documents Status List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <FileCheck className="w-5 h-5 mr-2 text-indigo-400" /> Team Document Statuses
          </h2>

          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No documents submitted yet for this team.</p>
            ) : (
              documents.map(d => (
                <div key={d.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{d.document_type}</span>
                    <h4 className="text-white font-semibold text-sm">{d.file_name}</h4>
                    <span className="text-xs text-slate-500 font-mono">Uploaded: {new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase">
                    {d.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
