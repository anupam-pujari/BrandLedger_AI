// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Organization } from '../types';
import { apiClient } from '../api/client';

export interface DemoAccount {
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
  id: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Sarah Lin',
    email: 'sarah.lin@apexcloud.io',
    role: 'brand_manager',
    title: 'Brand Governance Director',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Marcus Vance',
    email: 'marcus.vance@apexcloud.io',
    role: 'creator',
    title: 'Lead Content Strategist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Elena Rostova',
    email: 'elena.rostova@apexcloud.io',
    role: 'reviewer',
    title: 'Compliance & Legal Counsel',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256'
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'David Zhang',
    email: 'david.zhang@apexcloud.io',
    role: 'admin',
    title: 'System Administrator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256'
  }
];

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  org: Organization | null;
  isAuthenticated: boolean;
  loginAsDemo: (account: DemoAccount) => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
}

const DEFAULT_ORG: Organization = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'ApexCloud Technologies',
  slug: 'apexcloud',
  rulesOnlyMode: false,
  aiProvider: 'gemini',
  maskingEnabled: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('brandproof_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    // Default to Marcus Vance (Creator) so user lands on content creation immediately
    return {
      id: DEMO_ACCOUNTS[1].id,
      email: DEMO_ACCOUNTS[1].email,
      fullName: DEMO_ACCOUNTS[1].name,
      role: DEMO_ACCOUNTS[1].role,
      orgId: DEFAULT_ORG.id,
      avatarUrl: DEMO_ACCOUNTS[1].avatar,
    };
  });

  const [org] = useState<Organization>(DEFAULT_ORG);

  useEffect(() => {
    if (user) {
      localStorage.setItem('brandproof_active_user', JSON.stringify(user));
      // Generate a mock JWT for demo if not already present
      if (!apiClient.getToken()) {
        apiClient.setToken(`demo-token-${user.id}`);
      }
    } else {
      localStorage.removeItem('brandproof_active_user');
    }
  }, [user]);

  const loginAsDemo = (account: DemoAccount) => {
    const newUser: UserProfile = {
      id: account.id,
      email: account.email,
      fullName: account.name,
      role: account.role,
      orgId: DEFAULT_ORG.id,
      avatarUrl: account.avatar,
    };
    setUser(newUser);
    apiClient.setToken(`demo-token-${account.id}`);
  };

  const switchRole = (newRole: UserRole) => {
    const match = DEMO_ACCOUNTS.find(a => a.role === newRole) || DEMO_ACCOUNTS[0];
    loginAsDemo(match);
  };

  const logout = () => {
    setUser(null);
    apiClient.setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'creator',
        org,
        isAuthenticated: !!user,
        loginAsDemo,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
