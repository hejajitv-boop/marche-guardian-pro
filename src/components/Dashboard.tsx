import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, ShoppingCart, Bell, TrendingUp, Clock, AlertTriangle, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDeadlineAlerts } from '@/components/DeadlineMonitor';

const STATUS_COLORS = ['hsl(215, 70%, 35%)', 'hsl(45, 90%, 55%)', 'hsl(142, 72%, 29%)', 'hsl(0, 72%, 51%)', 'hsl(199, 89%, 48%)'];

export default function Dashboard() {
  const { marches, bonsCommande, notifications } = useData();
  const { user } = useAuth();
  const deadlineAlerts = useDeadlineAlerts();

  const totalMontant = marches.reduce((sum, m) => sum + m.montantTotal, 0);
  const marchesEnCours = marches.filter(m => m.status === 'en_cours').length;
  const marchesApprouves = marches.filter(m => ['approuve', 'execute'].includes(m.status)).length;

  const criticalCount = deadlineAlerts.filter(a => a.level === 'critical' || a.level === 'expired').length;
  const warningCount = deadlineAlerts.filter(a => a.level === 'warning').length;

  const statusData = [
    { name: 'En cours', value: marches.filter(m => m.status === 'en_cours').length },
    { name: 'Approuvé', value: marches.filter(m => m.status === 'approuve').length },
    { name: 'Exécuté', value: marches.filter(m => m.status === 'execute').length },
    { name: 'Liquidé', value: marches.filter(m => m.status === 'liquide').length },
    { name: 'Clôturé', value: marches.filter(m => m.status === 'cloture').length },
  ].filter(d => d.value > 0);

  const montantByType = marches.reduce((acc, m) => {
    const key = m.type;
    acc[key] = (acc[key] || 0) + m.montantTotal;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(montantByType).map(([name, value]) => ({ name, value: value / 1000 }));

  const unreadNotifs = user ? notifications.filter(n => n.toUserId === user.id && !n.isRead).length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total marchés</p>
              <p className="text-2xl font-bold">{marches.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
              <TrendingUp className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-2xl font-bold">{(totalMontant / 1000000).toFixed(2)} M DH</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
              <Clock className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold">{marchesEnCours}</p>
            </div>
          </CardContent>
        </Card>

        {/* Deadline Alert Card */}
        <Card className={`card-shadow ${criticalCount > 0 ? 'border-destructive/50 animate-pulse' : warningCount > 0 ? 'border-warning/50' : ''}`}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${criticalCount > 0 ? 'bg-destructive/10' : warningCount > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
              {criticalCount > 0 ? <AlertTriangle className="h-6 w-6 text-destructive" /> : warningCount > 0 ? <Timer className="h-6 w-6 text-warning" /> : <CheckCircle2 className="h-6 w-6 text-success" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertes délais</p>
              <p className="text-2xl font-bold">{criticalCount + warningCount}</p>
              {criticalCount > 0 && <p className="text-[10px] text-destructive font-medium">{criticalCount} critique(s)</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deadline Alerts Banner */}
      {(criticalCount > 0 || warningCount > 0) && (
        <Card className={`border-2 ${criticalCount > 0 ? 'border-destructive/40 bg-destructive/5' : 'border-warning/40 bg-warning/5'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${criticalCount > 0 ? 'text-destructive' : 'text-warning'}`} />
              Alertes d'échéances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {deadlineAlerts.filter(a => a.level === 'expired' || a.level === 'critical' || a.level === 'warning').slice(0, 5).map((alert, i) => {
              const isExpired = alert.level === 'expired';
              const isCritical = alert.level === 'critical';
              return (
                <div key={`${alert.marcheId}-${alert.type}-${i}`} className={`flex items-center gap-3 rounded-lg border p-3 ${isExpired || isCritical ? 'bg-destructive/5 border-destructive/20' : 'bg-warning/5 border-warning/20'}`}>
                  {isExpired ? <XCircle className="h-4 w-4 text-destructive shrink-0" /> : isCritical ? <AlertTriangle className="h-4 w-4 text-destructive shrink-0" /> : <Timer className="h-4 w-4 text-warning shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{alert.marcheNumero}</span>
                      <Badge variant="outline" className="text-[10px]">{alert.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{alert.marcheObjet}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Progress value={alert.progress} className="h-1.5 w-16" />
                    <span className={`text-sm font-bold ${isExpired || isCritical ? 'text-destructive' : 'text-warning'}`}>
                      {alert.joursRestants < 0 ? `${Math.abs(alert.joursRestants)}j retard` : `${alert.joursRestants}j`}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-base">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-base">Montants par type (K DH)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(215, 70%, 35%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent markets */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-base">Marchés récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {marches.slice(-5).reverse().map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{m.numero}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">{m.objet}</p>
                </div>
                <Badge className="status-badge status-active text-xs">{m.status.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
