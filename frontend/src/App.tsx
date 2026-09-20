import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { MarksEntryPage } from './pages/MarksEntryPage';
import { ResultsPage } from './pages/ResultsPage';
import { AllResultsPage } from './pages/AllResultsPage';
import { ReportCardsPage } from './pages/ReportCardsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [tabParams, setTabParams] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
          Loading New Sunshine Portal...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const handleNavigate = (tab: string, extra?: any) => {
    setCurrentTab(tab);
    setTabParams(extra || null);
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'School Dashboard';
      case 'students':
        return 'Student Directory & Records';
      case 'marks-entry':
        return 'Marks Entry & Evaluation';
      case 'results':
        return user.role === 'CLASS_TEACHER' ? 'My Class Examination Results' : 'Results Management';
      case 'all-results':
        return 'All Classes Examination Overview';
      case 'report-cards':
        return 'Annual Examination Report Cards';
      case 'users':
        return 'Staff & Teacher Accounts';
      case 'settings':
        return 'School Configuration & Rules';
      case 'audit-logs':
        return 'Audit Logs & Change History';
      default:
        return 'New Sunshine Public School Portal';
    }
  };

  return (
    <DashboardLayout
      currentTab={currentTab}
      onSelectTab={handleNavigate}
      pageTitle={getPageTitle()}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentTab === 'students' && <StudentsPage />}
      {currentTab === 'marks-entry' && <MarksEntryPage />}
      {currentTab === 'results' && <ResultsPage />}
      {currentTab === 'all-results' && <AllResultsPage />}
      {currentTab === 'report-cards' && <ReportCardsPage />}
      {currentTab === 'users' && <UsersPage />}
      {currentTab === 'settings' && <SettingsPage />}
      {currentTab === 'audit-logs' && <AuditLogsPage />}
    </DashboardLayout>
  );
};
