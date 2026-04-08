import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, FileText, ShoppingCart, Users, Bell, BarChart3, 
  Shield, LogOut, Menu, X, ChevronDown, ChevronRight,
  FileCheck, Banknote, ClipboardCheck, Clock, BookOpen, History
} from 'lucide-react';
import type { ProcedureType } from '@/types';
import { PROCEDURE_LABELS } from '@/types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const PROCEDURE_ICONS: Record<ProcedureType, React.ReactNode> = {
  correspondances: <FileText className="h-4 w-4" />,
  engagement: <Banknote className="h-4 w-4" />,
  avenant: <FileCheck className="h-4 w-4" />,
  garanties: <Shield className="h-4 w-4" />,
  assurances: <ClipboardCheck className="h-4 w-4" />,
  delais: <Clock className="h-4 w-4" />,
  execution: <BookOpen className="h-4 w-4" />,
  liquidation: <Banknote className="h-4 w-4" />,
  ordres_service_avenant: <FileText className="h-4 w-4" />,
  reception: <ClipboardCheck className="h-4 w-4" />,
  bons_commande: <ShoppingCart className="h-4 w-4" />,
};

export default function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { getUnreadCount } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [marchesOpen, setMarchesOpen] = useState(true);

  const unreadCount = user ? getUnreadCount(user.id) : 0;

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'marches', label: 'Marchés', icon: <FileText className="h-4 w-4" />, expandable: true },
    { id: 'bons_commande', label: 'Bons de commande', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'deadlines', label: 'Suivi des délais', icon: <Clock className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, badge: unreadCount },
    { id: 'statistiques', label: 'Statistiques', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  const adminItems = user?.isAdmin ? [
    { id: 'admin_dashboard', label: 'Tableau de bord admin', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'admin_users', label: 'Gestion des utilisateurs', icon: <Users className="h-4 w-4" /> },
    { id: 'admin_permissions', label: 'Permissions', icon: <Shield className="h-4 w-4" /> },
    { id: 'admin_temoin', label: 'Journal des activités', icon: <History className="h-4 w-4" /> },
    { id: 'admin_archives', label: 'Archives documents', icon: <FileText className="h-4 w-4" /> },
  ] : [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 -ml-64'} sidebar-gradient text-sidebar-foreground transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">Gestion Marché</h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">DP Justice Meknès</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map(item => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.expandable) {
                    setMarchesOpen(!marchesOpen);
                    onNavigate('marches_list');
                  } else {
                    onNavigate(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  currentPage === item.id || (item.expandable && currentPage.startsWith('marche'))
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-xs">{item.badge}</Badge>
                ) : null}
                {item.expandable && (marchesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
              </button>

              {item.expandable && marchesOpen && (
                <div className="ml-4 mt-1 space-y-0.5">
                  <button
                    onClick={() => onNavigate('marches_list')}
                    className={`w-full flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
                      currentPage === 'marches_list' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/30'
                    }`}
                  >
                    Liste des marchés
                  </button>
                  {(Object.keys(PROCEDURE_LABELS) as ProcedureType[]).map(proc => (
                    <button
                      key={proc}
                      onClick={() => onNavigate(`procedure_${proc}`)}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
                        currentPage === `procedure_${proc}` ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/30'
                      }`}
                    >
                      {PROCEDURE_ICONS[proc]}
                      <span className="truncate">{PROCEDURE_LABELS[proc]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {adminItems.length > 0 && (
            <>
              <div className="px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">Administration</p>
              </div>
              {adminItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    currentPage === item.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-sidebar-foreground/50">{user?.fonction}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {currentPage === 'dashboard' && 'Tableau de bord'}
            {currentPage === 'marches_list' && 'Liste des marchés'}
            {currentPage === 'bons_commande' && 'Bons de commande'}
            {currentPage === 'notifications' && 'Notifications'}
            {currentPage === 'statistiques' && 'Statistiques et rapports'}
            {currentPage === 'deadlines' && 'Suivi des délais'}
            {currentPage === 'admin_users' && 'Gestion des utilisateurs'}
            {currentPage === 'admin_permissions' && 'Gestion des permissions'}
            {currentPage === 'admin_temoin' && 'Journal des activités (Témoin)'}
            {currentPage === 'admin_dashboard' && 'Tableau de bord administrateur'}
            {currentPage === 'admin_archives' && 'Archives des documents supprimés'}
            {currentPage.startsWith('procedure_') && PROCEDURE_LABELS[currentPage.replace('procedure_', '') as ProcedureType]}
            {currentPage.startsWith('marche_detail_') && 'Détail du marché'}
          </h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
