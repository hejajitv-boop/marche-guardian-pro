import { useState } from 'react';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/components/Dashboard';
import MarchesList from '@/components/MarchesList';
import MarcheDetail from '@/components/MarcheDetail';
import NotificationsPage from '@/components/NotificationsPage';
import StatistiquesPage from '@/components/StatistiquesPage';
import DeadlineMonitor from '@/components/DeadlineMonitor';
import { AdminUsers, AdminPermissions, TemoinTable, AdminArchives } from '@/components/AdminPages';
import AdminDashboard from '@/components/AdminDashboard';
import { useAutoDeadlineNotifications } from '@/hooks/useAutoDeadlineNotifications';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  useAutoDeadlineNotifications();
  const [selectedMarcheId, setSelectedMarcheId] = useState<string | null>(null);

  if (!isAuthenticated) return <LoginPage />;

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedMarcheId(null);
  };

  const handleSelectMarche = (id: string) => {
    setSelectedMarcheId(id);
    setCurrentPage('marche_detail_' + id);
  };

  const renderPage = () => {
    if (selectedMarcheId) {
      return <MarcheDetail marcheId={selectedMarcheId} onBack={() => { setSelectedMarcheId(null); setCurrentPage('marches_list'); }} />;
    }

    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'marches_list': return <MarchesList onSelectMarche={handleSelectMarche} />;
      case 'bons_commande': return <MarchesList onSelectMarche={handleSelectMarche} />;
      case 'notifications': return <NotificationsPage />;
      case 'deadlines': return <DeadlineMonitor />;
      case 'statistiques': return <StatistiquesPage />;
      case 'admin_users': return <AdminUsers />;
      case 'admin_permissions': return <AdminPermissions />;
      case 'admin_temoin': return <TemoinTable />;
      case 'admin_archives': return <AdminArchives />;
      default:
        if (currentPage.startsWith('procedure_')) {
          return <MarchesList onSelectMarche={handleSelectMarche} />;
        }
        return <Dashboard />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </AppLayout>
  );
}

const Index = () => (
  <DataProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </DataProvider>
);

export default Index;
