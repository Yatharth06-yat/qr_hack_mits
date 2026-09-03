import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { importTeams } from '../../services/teamService';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function ExcelImport() {
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        // Process rows into Team format
        const teams = rawData.map(row => {
          const members = [];
          for (let i = 1; i <= 4; i++) {
            if (row[`member_${i}_name`]) {
              members.push({
                name: row[`member_${i}_name`],
                email: row[`member_${i}_email`] || '',
                phone: row[`member_${i}_phone`] || ''
              });
            }
          }

          return {
            team_name: row.team_name || row['Team Name'] || 'Imported Team',
            college_name: row.college_name || row['College'] || 'University',
            leader_name: row.leader_name || row['Leader Name'] || 'Leader',
            leader_email: row.leader_email || row['Leader Email'] || 'leader@example.com',
            leader_phone: row.leader_phone || row['Leader Phone'] || '',
            members
          };
        });

        setParsedRows(teams);
      } catch (err) {
        alert('Failed to parse Excel file. Please ensure correct format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    try {
      const res = await importTeams(parsedRows);
      setResult(res);
      setParsedRows([]);
    } catch (e) {
      alert('Failed to import teams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Import Excel Teams</h1>
        <p className="text-slate-400 text-sm mt-1">Upload .xlsx or .xls file to generate Team IDs & QR tokens automatically</p>
      </div>

      {result && (
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 text-emerald-400">
          <h3 className="font-bold text-lg flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> Import Complete!
          </h3>
          <p className="text-sm text-slate-300">Total Rows: {result.total} • Successfully Created: {result.success} • Failed: {result.failed}</p>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
        <Upload className="w-10 h-10 text-emerald-400 mb-3" />
        <h3 className="text-lg font-bold text-white">Select Excel File</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md">Columns expected: team_name, college_name, leader_name, leader_email, leader_phone, member_1_name, member_1_email...</p>
        
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="mt-4 text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400"
        />
      </div>

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Preview Upload ({parsedRows.length} Teams)</h2>
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-colors inline-flex items-center"
            >
              <span>{loading ? 'Importing...' : 'Confirm & Save to Supabase'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Leader Name</th>
                  <th className="py-3 px-4">Leader Email</th>
                  <th className="py-3 px-4">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {parsedRows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4 font-medium text-white">{r.team_name}</td>
                    <td className="py-3 px-4 text-slate-400">{r.college_name}</td>
                    <td className="py-3 px-4">{r.leader_name}</td>
                    <td className="py-3 px-4 text-slate-400">{r.leader_email}</td>
                    <td className="py-3 px-4">{r.members.length} Members</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
