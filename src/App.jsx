import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import TeamsList from './pages/admin/TeamsList';
import TeamDetails from './pages/admin/TeamDetails';
import QrScanner from './pages/admin/QrScanner';
import ExcelImport from './pages/admin/ExcelImport';
import TeamTicketPortal from './pages/admin/TeamTicketPortal';
import AuditLogs from './pages/admin/AuditLogs';
import DocumentManagement from './pages/admin/DocumentManagement';
import PresentTeamsReport from './pages/admin/PresentTeamsReport';
import AdminCertificates from './pages/admin/AdminCertificates';
import CertificateDownload from './pages/public/CertificateDownload';
import TeamCertificates from './pages/admin/TeamCertificates';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium">
        Initializing Verification System...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      <Sidebar />
      {/* pt-14 on mobile = space for fixed top bar; pb-16 on mobile = space for bottom nav */}
      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teams" element={<TeamsList />} />
            <Route path="/teams/:teamId" element={<TeamDetails />} />
            <Route path="/scan" element={<QrScanner />} />
            <Route path="/search" element={<TeamsList />} />
            <Route path="/import" element={<ExcelImport />} />
            <Route path="/ticket" element={<TeamTicketPortal />} />
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/present-teams" element={<PresentTeamsReport />} />
            <Route path="/certificates-admin" element={<AdminCertificates />} />
            <Route path="/team-certificates" element={<TeamCertificates />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/certificates" element={<CertificateDownload />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
