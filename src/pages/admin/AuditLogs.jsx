import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { History, ShieldCheck, Clock } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time audit trailing for checkpoint updates & staff scans</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">User ID</th>
                <th className="py-3.5 px-6">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500">No audit logs recorded yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-white">{log.user_id || 'Staff_Desk'}</td>
                    <td className="py-4 px-6 text-slate-300">{log.description || log.metadata?.description || 'Checkpoint state changed'}</td>
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
