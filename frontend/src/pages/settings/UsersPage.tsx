// src/pages/settings/UsersPage.tsx
import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { useUI } from '../../context/UIContext';
import { Users, Plus, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types';

export const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const [usersList, setUsersList] = useState(DEMO_ACCOUNTS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'creator' as UserRole,
  });

  const handleInvite = () => {
    if (!inviteForm.name || !inviteForm.email) {
      showToast('Please provide both name and email.', 'error');
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      title: inviteForm.role.replace('_', ' ').toUpperCase(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256'
    };

    setUsersList(prev => [...prev, newUser]);
    setShowInviteModal(false);
    showToast(`Invitation sent to ${inviteForm.email}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Team Members &amp; Role-Based Access Control</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Assign Creator, Reviewer, Brand Manager, or Administrator permissions to manage governance access.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
          Active Workspace Accounts ({usersList.length})
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {usersList.map(member => (
            <div key={member.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
              <div className="flex items-center gap-3">
                <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    {member.name}
                    {member.id === user?.id && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                        You
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {member.role.replace('_', ' ')}
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        description="Invited members will receive workspace onboarding with assigned permissions."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={inviteForm.name}
              onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
              placeholder="e.g. Alex Morgan"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
            <input
              type="email"
              value={inviteForm.email}
              onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="e.g. alex.morgan@apexcloud.io"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Role</label>
            <select
              value={inviteForm.role}
              onChange={e => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="creator">Creator (Drafts &amp; Pre-Checks)</option>
              <option value="reviewer">Reviewer (Audits &amp; Sign-Offs)</option>
              <option value="brand_manager">Brand Manager (Rulebook Compiler &amp; Insights)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowInviteModal(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              Send Invitation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
