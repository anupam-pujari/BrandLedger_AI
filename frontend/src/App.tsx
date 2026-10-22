// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ContentNew } from './pages/content/ContentNew';
import { ContentMine } from './pages/content/ContentMine';
import { ContentDetail } from './pages/content/ContentDetail';
import { VersionDiffPage } from './pages/content/VersionDiffPage';
import { ReviewQueue } from './pages/review/ReviewQueue';
import { ReviewWorkspace } from './pages/review/ReviewWorkspace';
import { RulesPage } from './pages/sourceOfTruth/RulesPage';
import { FactsPage } from './pages/sourceOfTruth/FactsPage';
import { TermsPage } from './pages/sourceOfTruth/TermsPage';
import { AssetsPage } from './pages/sourceOfTruth/AssetsPage';
import { RuleHealthPage } from './pages/insights/RuleHealthPage';
import { RecurringMistakesPage } from './pages/insights/RecurringMistakesPage';
import { UsersPage } from './pages/settings/UsersPage';
import { PrivacyPage } from './pages/settings/PrivacyPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Workspace Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Content Pre-Check & Authoring */}
        <Route path="content/new" element={<ContentNew />} />
        <Route path="content/mine" element={<ContentMine />} />
        <Route path="content/:id" element={<ContentDetail />} />
        <Route path="content/:id/diff" element={<VersionDiffPage />} />

        {/* Compliance Review & Adjudication */}
        <Route path="review/queue" element={<ReviewQueue />} />
        <Route path="review/:id" element={<ReviewWorkspace />} />

        {/* Source of Truth Repository */}
        <Route path="source-of-truth/rules" element={<RulesPage />} />
        <Route path="source-of-truth/facts" element={<FactsPage />} />
        <Route path="source-of-truth/terms" element={<TermsPage />} />
        <Route path="source-of-truth/assets" element={<AssetsPage />} />

        {/* Analytics & Governance Insights */}
        <Route path="insights/rule-health" element={<RuleHealthPage />} />
        <Route path="insights/recurring" element={<RecurringMistakesPage />} />

        {/* Administration & Security */}
        <Route path="settings/users" element={<UsersPage />} />
        <Route path="settings/privacy" element={<PrivacyPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
