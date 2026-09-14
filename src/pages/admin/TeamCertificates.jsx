import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { CERTIFICATE_TEMPLATE_BASE64 } from '../../assets/certificateTemplateBase64.js';
import { Download, Award, CheckCircle2 } from 'lucide-react';

// ─── Team Data for requested 4 teams ──────────────────────────────────────────
const TOP4_TEAMS = [
  { id: 'nexisedge',    teamName: 'NexisEdge'    },
  { id: 'rideguardian', teamName: 'RideGuardian' },
  { id: 'takyspace',    teamName: 'Taky-Space'   },
  { id: 'asce',         teamName: 'ASCE'          },
];

// ─── Certificate PDF Generator using the actual Certificate Template Image ──────
function generateTop5Certificate(teamName, memberName) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210, cx = W / 2;

  // Render the exact background image template provided at ultra-high 300 DPI quality
  try {
    doc.addImage(CERTIFICATE_TEMPLATE_BASE64, 'PNG', 0, 0, W, H, undefined, 'NONE');
  } catch {
    doc.setFillColor(252, 252, 255);
    doc.rect(0, 0, W, H, 'F');
  }

  // Draw Participant Name in center (above the dotted line)
  if (memberName) {
    const cleanMember = memberName.trim().replace(/\s+/g, ' ').toUpperCase();
    doc.setTextColor(30, 16, 53);
    doc.setFontSize(24);
    doc.setFont('times', 'bold');
    doc.text(cleanMember, cx, 102, { align: 'center' });
  }

  // Overlay Team Name adjacent to "from Team" on the template image
  const cleanTeam = (teamName || '').trim().replace(/\s+/g, ' ');
  doc.setTextColor(30, 16, 53);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTeam, cx + 10, 114, { align: 'left' });

  // Verification metadata footer
  const certId = `CERT-${teamName.replace(/\s+/g, '-').toUpperCase()}-2026`;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont('courier', 'bold');
  doc.text(`VERIFIED CERTIFICATE ID: ${certId}  |  ISSUE DATE: 2026-09-12`, cx, H - 6, { align: 'center' });

  return doc;
}

// ─── Certificate Preview Card using the actual Image Background ───────────────
function CertPreviewCard({ team, onDownload }) {
  const [memberName, setMemberName] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 200));
    const doc = generateTop5Certificate(team.teamName, memberName || null);
    const safeName = team.teamName.replace(/\s+/g, '_');
    const suffix = memberName ? `_${memberName.replace(/\s+/g, '_')}` : '_Team';
    doc.save(`${safeName}${suffix}_Certificate_HackSynapse2026.pdf`);
    setDownloading(false);
    onDownload && onDownload(team.teamName, memberName);
  };

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: 20,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {/* ── Real Certificate Template Image Preview ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: '#fff',
        overflow: 'hidden',
      }}>
        <img
          src={CERTIFICATE_TEMPLATE_BASE64}
          alt="Official Certificate Background"
          style={{ width: '100%', display: 'block', height: 'auto' }}
        />
        
        {/* Dynamic Participant Name Overlay */}
        <div style={{
          position: 'absolute',
          top: '48.5%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'serif',
          fontSize: 'clamp(14px, 2.2vw, 24px)',
          fontWeight: 'bold',
          color: '#1e1035',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          letterSpacing: '0.5px'
        }}>
          {memberName ? memberName.toUpperCase() : 'PARTICIPANT NAME'}
        </div>

        {/* Dynamic Team Name Overlay */}
        <div style={{
          position: 'absolute',
          top: '54.3%',
          left: '55.5%',
          transform: 'translateY(-50%)',
          fontFamily: 'sans-serif',
          fontSize: 'clamp(11px, 1.6vw, 18px)',
          fontWeight: 'bold',
          color: '#1e1035',
          whiteSpace: 'nowrap'
        }}>
          {team.teamName}
        </div>
      </div>

      {/* ── Controls & Actions ── */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={18} color="#a855f7" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              Team {team.teamName}
            </h3>
            <span style={{ fontSize: 12, color: '#a855f7', fontWeight: 600 }}>Top Winning Team</span>
          </div>
        </div>

        {/* Participant Name Input */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
            Participant Name (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            style={{
              width: '100%',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            width: '100%',
            background: downloading
              ? '#334155'
              : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 16px',
            fontWeight: 700,
            fontSize: 13,
            cursor: downloading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
            transition: 'all 0.2s',
          }}
        >
          <Download size={16} />
          {downloading ? 'Generating PDF...' : 'Download PDF Certificate'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function TeamCertificates() {
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [lastDownloaded, setLastDownloaded] = useState('');

  const handleDownloadLog = (teamName, memberName) => {
    setDownloadedCount((c) => c + 1);
    setLastDownloaded(`${teamName}${memberName ? ` (${memberName})` : ''}`);
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < TOP4_TEAMS.length; i++) {
      const team = TOP4_TEAMS[i];
      const doc = generateTop5Certificate(team.teamName, null);
      doc.save(`${team.teamName}_Certificate_HackSynapse2026.pdf`);
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1d',
      color: '#f8fafc',
      padding: '32px 24px',
      fontFamily: 'sans-serif'
    }}>
      {/* Header section */}
      <div style={{ maxWidth: 1200, margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>🏆</span>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>
                IEEE HackSynapse 2026 Certificates
              </h1>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
              Official Certificates generated directly on the uploaded IEEE HackSynapse Template Image for the top 4 teams.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={handleDownloadAll}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
              }}
            >
              <Download size={16} /> Download All 4 Certificates
            </button>
          </div>
        </div>

        {downloadedCount > 0 && (
          <div style={{
            marginTop: 16,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#34d399',
            fontSize: 13,
          }}>
            <CheckCircle2 size={16} />
            <span>Downloaded {downloadedCount} certificate(s). Last: <strong>{lastDownloaded}</strong></span>
          </div>
        )}
      </div>

      {/* Grid of 4 requested teams */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))',
        gap: 24,
      }}>
        {TOP4_TEAMS.map((team) => (
          <CertPreviewCard
            key={team.id}
            team={team}
            onDownload={handleDownloadLog}
          />
        ))}
      </div>
    </div>
  );
}
