// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { useUI } from '../context/UIContext';
import { Shield, ArrowRight, UserCheck, Lock, Mail, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();
  const { showToast } = useUI();

  const [email, setEmail] = useState('marcus.vance@apexcloud.io');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.login(email, password);
      showToast('Logged in successfully', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      // If mock backend or local fallback, log in as matching demo account
      const matched = DEMO_ACCOUNTS.find(a => a.email === email) || DEMO_ACCOUNTS[1];
      loginAsDemo(matched);
      showToast(`Welcome, ${matched.name}!`, 'success');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (account: typeof DEMO_ACCOUNTS[0]) => {
    loginAsDemo(account);
    showToast(`Signed in as ${account.name} (${account.role.replace('_', ' ')})`, 'success');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center py-12 px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 items-center justify-center text-white shadow-lg shadow-indigo-600/30 mb-2">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-['Outfit']">
          BrandProof AI
        </h1>
        <p className="text-xs text-slate-400">
          Source of Truth Governance · Proof-Centric Review Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Sign-In Selector */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Evaluation Personas
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => handleDemoSelect(acc)}
                  className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
                >
                  <img src={acc.avatar} alt={acc.name} className="w-7 h-7 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{acc.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize truncate">{acc.role.replace('_', ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
