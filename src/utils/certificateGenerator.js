import jsPDF from 'jspdf';
import { CERTIFICATE_TEMPLATE_BASE64 } from '../assets/certificateTemplateBase64';

// Default configuration using the exact uploaded sample certificate image
export const DEFAULT_CERTIFICATE_CONFIG = {
  eventTitle: 'IEEE HACKSYNAPSE',
  certificateTitle: 'CERTIFICATE',
  certificateSubtitle: 'OF PARTICIPATION',
  subtitle: 'This certificate is proudly presented to',
  descriptionLine1: 'for actively participating in IEEE HackSynapse 2026, showcasing creativity, technical expertise, innovation, teamwork and problem-solving skills.',
  descriptionLine2: 'Your dedication and enthusiasm contributed to making HackSynapse 2026 a memorable celebration of technology, innovation, and collaboration.',
  description: 'for actively participating in IEEE HackSynapse 2026, showcasing creativity, technical expertise, innovation, teamwork and problem-solving skills.',
  primaryColor: '#230A39',
  themeColor: '#1E1035',
  accentColor: '#4A1B70',
  issueDate: new Date().toISOString().slice(0, 10),
  sampleLogoUrl: '',
  
  // 2 Official Signatories from the Sample Certificate
  signatories: [
    {
      name: 'DR. MURLI MANOHAR',
      title: 'Faculty Advisor',
      dept: 'IEEE RAS SBC MITS',
      subtext: '',
      signatureType: 'murli'
    },
    {
      name: 'DR. SOUMYAJIT GHOSH',
      title: 'Faculty Advisor',
      dept: 'IEEE IAS SBC MITS',
      subtext: '',
      signatureType: 'soumyajit'
    }
  ],

  signatoryName: 'DR. MURLI MANOHAR',
  signatoryTitle: 'Faculty Advisor, IEEE RAS SBC MITS'
};

// Load Saved Config from localStorage
export function getSavedCertificateConfig() {
  try {
    const saved = localStorage.getItem('mits_certificate_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_CERTIFICATE_CONFIG, 
        ...parsed,
        signatories: parsed.signatories && parsed.signatories.length > 0 
          ? parsed.signatories 
          : DEFAULT_CERTIFICATE_CONFIG.signatories 
      };
    }
  } catch (e) {}
  return DEFAULT_CERTIFICATE_CONFIG;
}

// Save Config to localStorage
export function saveCertificateConfig(config) {
  try {
    localStorage.setItem('mits_certificate_config', JSON.stringify(config));
  } catch (e) {}
}

/**
 * Render exact sample image template as PDF background with dynamic recipient name overlay
 */
export function renderCertificateContent(doc, member, team, config) {
  const width = 297; // A4 Landscape width mm
  const height = 210; // A4 Landscape height mm

  // 1. Draw full-bleed exact sample certificate background image
  try {
    doc.addImage(CERTIFICATE_TEMPLATE_BASE64, 'PNG', 0, 0, width, height);
  } catch (e) {
    // Fallback base background if image fails
    doc.setFillColor(252, 252, 255);
    doc.rect(0, 0, width, height, 'F');
  }

  // 2. Overlay Participant Name dynamically in exact center position
  const rawName = member ? member.name : 'PARTICIPANT NAME';
  const recipientName = (rawName || 'PARTICIPANT NAME').trim().replace(/\s+/g, ' ').toUpperCase();
  const centerX = width / 2;
  const nameY = 109.5; // Shifted lower to center perfectly above the line

  // Recipient Name Font Styling (Matching exact serif dark purple typography)
  doc.setTextColor(30, 16, 53); // #1E1035 Deep Purple
  doc.setFontSize(26);
  doc.setFont('times', 'bold');
  doc.text(recipientName, centerX, nameY, { align: 'center' });

  // 3. Subtle Verification Metadata printed at bottom center edge
  const certId = member && member.id 
    ? `CERT-${member.id.substring(0, 8).toUpperCase()}`
    : `CERT-2026-SAMPLE`;

  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFontSize(6.5);
  doc.setFont('courier', 'bold');
  doc.text(`VERIFIED CERTIFICATE ID: ${certId}  |  ISSUE DATE: ${config.issueDate || '2026-09-12'}`, centerX, height - 6, { align: 'center' });
}

/**
 * Generate PDF Certificate for a Team Member
 */
export function generateMemberCertificate(member, team, configOverride = null) {
  const config = configOverride || getSavedCertificateConfig();
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  renderCertificateContent(doc, member, team, config);
  return doc;
}

/**
 * Generate Sample Certificate PDF (For Admin Preview)
 */
export function generateSampleCertificate(configOverride = null) {
  const sampleMember = {
    id: 'sample-001-preview',
    name: 'Yatharth Gupta',
    email: 'yatharth@example.com'
  };
  const sampleTeam = {
    team_name: 'Team Alpha Hackers',
    college_name: 'Madhav Institute of Technology & Science (MITS)'
  };
  return generateMemberCertificate(sampleMember, sampleTeam, configOverride);
}

/**
 * Generate Combined PDF for All Members of a Team
 */
export function generateTeamCertificates(team, configOverride = null) {
  if (!team) return null;
  const members = team.members && team.members.length > 0 ? team.members : [
    { id: 'leader-1', name: team.leader_name, email: team.leader_email }
  ];

  const config = configOverride || getSavedCertificateConfig();
  let masterDoc = null;

  members.forEach((member, index) => {
    if (index === 0) {
      masterDoc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      renderCertificateContent(masterDoc, member, team, config);
    } else {
      masterDoc.addPage('a4', 'landscape');
      renderCertificateContent(masterDoc, member, team, config);
    }
  });

  return masterDoc;
}
