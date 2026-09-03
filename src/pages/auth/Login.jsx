import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (roleType) => {
    if (roleType === 'admin') {
      setEmail('guptayatharth353@gmail.com');
      setPassword('admin123456');
    } else {
      setEmail('staff@hackathon.com');
      setPassword('staff123456');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-emerald-500 text-slate-950 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
            <QrCode className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white">
          Hackathon Check-In System
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Sign in to access desk verification & staff portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  placeholder="admin@hackathon.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Quick Demo Logins</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 text-center"
              >
                Fill Admin Email
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('staff')}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 text-center"
              >
                Fill Staff Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
