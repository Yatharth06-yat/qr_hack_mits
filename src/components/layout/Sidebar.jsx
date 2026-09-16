import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  FileSpreadsheet, 
  FileCheck, 
  History, 
  LogOut, 
  Search,
  ShieldCheck,
  Ticket,
  FileText,
  Menu,
  X,
  Award
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teams',     icon: Users,           label: 'Teams' },
  { to: '/scan',      icon: QrCode,          label: 'Scanner' },
  { to: '/search',    icon: Search,          label: 'Search' },
];

const ADMIN_NAV_ITEMS = [
  { to: '/certificates-admin', icon: Award, label: 'Certificates & Excel IDs' },
  { to: '/team-certificates',  icon: Award, label: '🏆 Top 5 Certificates' },
  { to: '/present-teams', icon: FileText,    label: 'Present Teams PDF' },
  { to: '/import',    icon: FileSpreadsheet, label: 'Import Excel' },
  { to: '/documents', icon: FileCheck,       label: 'Documents' },
  { to: '/audit',     icon: History,         label: 'Audit Logs' },
  { to: '/ticket',    icon: Ticket,          label: 'Team Ticket' },
];


const navLinkClass = ({ isActive }) =>
  `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

export default function Sidebar() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allNavItems = [
    ...NAV_ITEMS,
    ...(role === 'admin' ? ADMIN_NAV_ITEMS : []),
  ];

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 min-h-screen flex-col border-r border-slate-800 flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl font-bold">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold tracking-wide text-lg text-white">HACKATHON</h1>
            <p className="text-xs text-slate-400 font-medium">Verification System</p>
          </div>
        </div>

        {/* User badge */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {role ? role.substring(0, 2).toUpperCase() : 'ST'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user ? user.email : 'Staff Desk'}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 uppercase">
                <ShieldCheck className="w-3 h-3 mr-1" /> {role || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}

          {role === 'admin' && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Tools</p>
              </div>
              {ADMIN_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Credit Footer */}
          <a
            href="https://www.linkedin.com/in/yatharth-gupta-525b40306/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2.5 bg-slate-800/50 rounded-xl text-center border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800 transition-all group"
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Designed &amp; Developed by</p>
            <p className="text-xs font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all">
              Yatharth Gupta
            </p>
            <p className="text-[9px] text-slate-600 mt-0.5 group-hover:text-emerald-500 transition-colors">LinkedIn ↗</p>
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-lg">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">HACKATHON</span>
        </div>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed top-14 left-0 bottom-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* User badge */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {role ? role.substring(0, 2).toUpperCase() : 'ST'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user ? user.email : 'Staff Desk'}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 uppercase">
                <ShieldCheck className="w-3 h-3 mr-1" /> {role || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allNavItems.map(({ to, icon: Icon, label }, i) => {
            const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Credit Footer */}
          <a
            href="https://www.linkedin.com/in/yatharth-gupta-525b40306/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2.5 bg-slate-800/50 rounded-xl text-center border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800 transition-all group"
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Designed &amp; Developed by</p>
            <p className="text-xs font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all">
              Yatharth Gupta
            </p>
            <p className="text-[9px] text-slate-600 mt-0.5 group-hover:text-emerald-500 transition-colors">LinkedIn ↗</p>
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── Mobile Bottom Nav Bar ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 h-16 safe-area-bottom">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-semibold">{label}</span>
              {isActive && <div className="absolute -top-0.5 w-6 h-0.5 bg-emerald-400 rounded-full" />}
            </NavLink>
          );
        })}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-2 rounded-xl transition-all ${mobileOpen ? 'text-emerald-400' : 'text-slate-500'}`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>
    </>
  );
}
