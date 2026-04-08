import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Users, Shield, Activity, FileText, Bell, Clock,
  UserCheck, UserX, TrendingUp, Database
} from 'lucide-react';
import { PROCEDURE_LABELS } from '@/types';
import type { ProcedureType, PermissionLevel } from '@/types';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminDashboard() {
  const { allUsers, getUserPermissions } = useAuth();
  const { marches, notifications, temoinEntries, docArchives, documents, bonsCommande } = useData();

  // User stats
  const activeUsers = allUsers.filter(u => u.isActive).length;
  const inactiveUsers = allUsers.filter(u => !u.isActive).length;
  const adminUsers = allUsers.filter(u => u.isAdmin).length;
  const normalUsers = allUsers.length - adminUsers;

  // Permission stats
  const nonAdminUsers = allUsers.filter(u => !u.isAdmin && u.isActive);
  const permissionData = nonAdminUsers.map(u => {
    const perms = getUserPermissions(u.id);
    const levels: Record<PermissionLevel, number> = { none: 0, read: 0, write: 0, delete: 0, full: 0 };
    const totalProcs = Object.keys(PROCEDURE_LABELS).length;
    (Object.keys(PROCEDURE_LABELS) as ProcedureType[]).forEach(proc => {
      const p = perms.find(x => x.procedure === proc);
      levels[p?.level || 'none']++;
    });
    const configured = totalProcs - levels.none;
    return { ...u, levels, configured, totalProcs };
  });

  const avgConfigured = nonAdminUsers.length > 0
    ? Math.round(permissionData.reduce((s, u) => s + u.configured, 0) / nonAdminUsers.length)
    : 0;

  // Permission distribution across all users
  const permDistribution = [
    { name: 'Aucun accès', value: permissionData.reduce((s, u) => s + u.levels.none, 0), fill: 'hsl(var(--muted-foreground))' },
    { name: 'Consultation', value: permissionData.reduce((s, u) => s + u.levels.read, 0), fill: 'hsl(var(--chart-1))' },
    { name: 'Modification', value: permissionData.reduce((s, u) => s + u.levels.write, 0), fill: 'hsl(var(--chart-2))' },
    { name: 'Suppression', value: permissionData.reduce((s, u) => s + u.levels.delete, 0), fill: 'hsl(var(--chart-3))' },
    { name: 'Accès complet', value: permissionData.reduce((s, u) => s + u.levels.full, 0), fill: 'hsl(var(--chart-4))' },
  ].filter(d => d.value > 0);

  // Activity stats
  const recentActivity = [...temoinEntries].reverse().slice(0, 10);
  const activityByAction = temoinEntries.reduce<Record<string, number>>((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1;
    return acc;
  }, {});
  const activityChartData = Object.entries(activityByAction).map(([name, value]) => ({ name, value }));

  // Activity by user
  const activityByUser = temoinEntries.reduce<Record<string, number>>((acc, e) => {
    const u = allUsers.find(x => x.id === e.userId);
    const name = u ? `${u.prenom} ${u.nom}` : e.userId;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const userActivityData = Object.entries(activityByUser)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Notifications stats
  const totalNotifs = notifications.length;
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const getUserName = (id: string) => {
    const u = allUsers.find(x => x.id === id);
    return u ? `${u.prenom} ${u.nom}` : id;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allUsers.length}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeUsers}</p>
              <p className="text-xs text-muted-foreground">Actifs / {inactiveUsers} inactifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{temoinEntries.length}</p>
              <p className="text-xs text-muted-foreground">Actions enregistrées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{marches.length}</p>
              <p className="text-xs text-muted-foreground">Marchés / {documents.length} docs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminUsers}</p>
              <p className="text-xs text-muted-foreground">Admins / {normalUsers} utilisateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
              <Bell className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadNotifs}</p>
              <p className="text-xs text-muted-foreground">Non lues / {totalNotifs} total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{docArchives.length}</p>
              <p className="text-xs text-muted-foreground">Documents archivés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgConfigured}</p>
              <p className="text-xs text-muted-foreground">Moy. procédures/utilisateur</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> Distribution des permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {permDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={permDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {permDistribution.map((_, i) => <Cell key={i} fill={permDistribution[i].fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">Aucune permission configurée</p>
            )}
          </CardContent>
        </Card>

        {/* Activity by type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" /> Activité par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">Aucune activité enregistrée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Activity + Permissions per user */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity per user */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Activité par utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={userActivityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">Aucune activité</p>
            )}
          </CardContent>
        </Card>

        {/* Permissions per user table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> Couverture des permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Utilisateur</TableHead>
                  <TableHead className="text-xs">Configurées</TableHead>
                  <TableHead className="text-xs">Couverture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">Aucun utilisateur</TableCell>
                  </TableRow>
                ) : (
                  permissionData.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-xs">{u.prenom} {u.nom}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={u.configured > 0 ? 'default' : 'secondary'} className="text-xs">
                          {u.configured}/{u.totalProcs}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={(u.configured / u.totalProcs) * 100} className="h-2 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" /> Dernières activités du système
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Heure</TableHead>
                <TableHead className="text-xs">Utilisateur</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">Aucune activité</TableCell>
                </TableRow>
              ) : (
                recentActivity.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{e.dateOperation}</TableCell>
                    <TableCell className="text-xs">{e.heureOperation}</TableCell>
                    <TableCell className="text-xs">{getUserName(e.userId)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.action}</Badge></TableCell>
                    <TableCell className="text-xs max-w-[250px] truncate">{e.description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
