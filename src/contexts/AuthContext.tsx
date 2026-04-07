import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserPermission, ProcedureType, PermissionLevel, TemoinEntry } from '@/types';
import { useData } from './DataContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (matricule: string, password: string) => boolean;
  logout: () => void;
  createPassword: (password: string) => void;
  hasPermission: (procedure: ProcedureType, level: PermissionLevel) => boolean;
  getUserPermissions: (userId: string) => UserPermission[];
  setUserPermission: (userId: string, procedure: ProcedureType, level: PermissionLevel) => void;
  allUsers: User[];
  createUser: (user: Omit<User, 'id' | 'isFirstLogin' | 'isActive' | 'createdAt'>) => void;
  toggleUserActive: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  matricule: 'ADMIN',
  nom: 'Administrateur',
  prenom: 'Système',
  fonction: 'Administrateur',
  service: 'IT',
  email: 'admin@justice.gov.ma',
  password: 'admin123',
  isFirstLogin: false,
  isAdmin: true,
  isActive: true,
  createdAt: new Date().toISOString(),
};

const DEMO_USERS: User[] = [
  DEFAULT_ADMIN,
  {
    id: 'user-001',
    matricule: '10001',
    nom: 'Benali',
    prenom: 'Ahmed',
    fonction: 'Gestionnaire des marchés',
    service: 'Service des marchés',
    email: 'a.benali@justice.gov.ma',
    password: 'pass123',
    isFirstLogin: false,
    isAdmin: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-002',
    matricule: '10002',
    nom: 'El Fassi',
    prenom: 'Fatima',
    fonction: 'Chef de service',
    service: 'Service financier',
    email: 'f.elfassi@justice.gov.ma',
    password: 'pass123',
    isFirstLogin: false,
    isAdmin: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('gm_users');
    return saved ? JSON.parse(saved) : DEMO_USERS;
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gm_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [permissions, setPermissions] = useState<UserPermission[]>(() => {
    const saved = localStorage.getItem('gm_permissions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('gm_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('gm_current_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('gm_permissions', JSON.stringify(permissions));
  }, [permissions]);

  const addTemoin = useCallback((entry: Omit<TemoinEntry, 'id'>) => {
    const saved = localStorage.getItem('gm_temoin') || '[]';
    const entries: TemoinEntry[] = JSON.parse(saved);
    entries.push({ ...entry, id: crypto.randomUUID() });
    localStorage.setItem('gm_temoin', JSON.stringify(entries));
  }, []);

  const login = useCallback((matricule: string, password: string): boolean => {
    const found = users.find(u => u.matricule === matricule && u.isActive);
    if (!found) return false;
    if (found.isFirstLogin) {
      setUser(found);
      return true;
    }
    if (found.password !== password) return false;
    const updated = { ...found, lastLogin: new Date().toISOString() };
    setUser(updated);
    setUsers(prev => prev.map(u => u.id === found.id ? updated : u));
    addTemoin({
      userId: found.id,
      dateOperation: new Date().toLocaleDateString('fr-FR'),
      heureOperation: new Date().toLocaleTimeString('fr-FR'),
      description: `Connexion de l'utilisateur ${found.prenom} ${found.nom} (${found.matricule})`,
      ipAddress: '192.168.1.1',
      action: 'connexion',
    });
    return true;
  }, [users, addTemoin]);

  const logout = useCallback(() => {
    if (user) {
      addTemoin({
        userId: user.id,
        dateOperation: new Date().toLocaleDateString('fr-FR'),
        heureOperation: new Date().toLocaleTimeString('fr-FR'),
        description: `Déconnexion de l'utilisateur ${user.prenom} ${user.nom} (${user.matricule})`,
        ipAddress: '192.168.1.1',
        action: 'deconnexion',
      });
    }
    setUser(null);
  }, [user, addTemoin]);

  const createPassword = useCallback((password: string) => {
    if (!user) return;
    const updated = { ...user, password, isFirstLogin: false, lastLogin: new Date().toISOString() };
    setUser(updated);
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
  }, [user]);

  const hasPermission = useCallback((procedure: ProcedureType, level: PermissionLevel): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true;
    const perm = permissions.find(p => p.userId === user.id && p.procedure === procedure);
    if (!perm) return false;
    const levels: PermissionLevel[] = ['none', 'read', 'write', 'delete', 'full'];
    return levels.indexOf(perm.level) >= levels.indexOf(level);
  }, [user, permissions]);

  const getUserPermissions = useCallback((userId: string) => {
    return permissions.filter(p => p.userId === userId);
  }, [permissions]);

  const setUserPermission = useCallback((userId: string, procedure: ProcedureType, level: PermissionLevel) => {
    setPermissions(prev => {
      const filtered = prev.filter(p => !(p.userId === userId && p.procedure === procedure));
      return [...filtered, { userId, procedure, level }];
    });
  }, []);

  const createUser = useCallback((userData: Omit<User, 'id' | 'isFirstLogin' | 'isActive' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      isFirstLogin: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const toggleUserActive = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user && !user.isFirstLogin,
      login,
      logout,
      createPassword,
      hasPermission,
      getUserPermissions,
      setUserPermission,
      allUsers: users,
      createUser,
      toggleUserActive,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
