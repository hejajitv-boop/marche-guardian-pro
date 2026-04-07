import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CalendarClock, CheckCircle2, XCircle, Timer } from 'lucide-react';
import type { Marche } from '@/types';

export type DeadlineLevel = 'critical' | 'warning' | 'info' | 'ok' | 'expired';

export interface DeadlineAlert {
  marcheId: string;
  marcheNumero: string;
  marcheObjet: string;
  type: 'execution' | 'garantie' | 'cautionnement' | 'assurance';
  label: string;
  dateEcheance: string;
  joursRestants: number;
  level: DeadlineLevel;
  progress: number; // 0-100
}

function getLevel(days: number): DeadlineLevel {
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  if (days <= 60) return 'info';
  return 'ok';
}

function getLevelConfig(level: DeadlineLevel) {
  switch (level) {
    case 'expired': return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: XCircle, label: 'Expiré' };
    case 'critical': return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: AlertTriangle, label: 'Critique' };
    case 'warning': return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', icon: Timer, label: 'Attention' };
    case 'info': return { color: 'text-info', bg: 'bg-info/10', border: 'border-info/30', icon: CalendarClock, label: 'À surveiller' };
    case 'ok': return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', icon: CheckCircle2, label: 'OK' };
  }
}

function calcProgress(startDate: string | undefined, endDate: string): number {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const start = startDate ? new Date(startDate).getTime() : end - 365 * 24 * 60 * 60 * 1000;
  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function useDeadlineAlerts(): DeadlineAlert[] {
  const { marches } = useData();

  return useMemo(() => {
    const alerts: DeadlineAlert[] = [];
    const now = Date.now();

    marches.forEach((m: Marche) => {
      if (['cloture', 'resilie'].includes(m.status)) return;

      // Délai d'exécution
      if (m.delais?.dateFinExecution) {
        const days = Math.ceil((new Date(m.delais.dateFinExecution).getTime() - now) / 86400000);
        alerts.push({
          marcheId: m.id, marcheNumero: m.numero, marcheObjet: m.objet,
          type: 'execution', label: "Fin d'exécution",
          dateEcheance: m.delais.dateFinExecution,
          joursRestants: days, level: getLevel(days),
          progress: calcProgress(m.delais.dateDebutExecution, m.delais.dateFinExecution),
        });
      }

      // Délai de garantie
      if (m.delais?.dateFinGarantie) {
        const days = Math.ceil((new Date(m.delais.dateFinGarantie).getTime() - now) / 86400000);
        alerts.push({
          marcheId: m.id, marcheNumero: m.numero, marcheObjet: m.objet,
          type: 'garantie', label: 'Fin de garantie',
          dateEcheance: m.delais.dateFinGarantie,
          joursRestants: days, level: getLevel(days),
          progress: calcProgress(m.delais.dateFinExecution, m.delais.dateFinGarantie),
        });
      }

      // Cautionnement
      if (m.garanties?.cautionnementDate) {
        // Assume 1 year validity for cautionnement
        const cautDate = new Date(m.garanties.cautionnementDate);
        const endDate = new Date(cautDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        const days = Math.ceil((endDate.getTime() - now) / 86400000);
        if (days < 90) {
          alerts.push({
            marcheId: m.id, marcheNumero: m.numero, marcheObjet: m.objet,
            type: 'cautionnement', label: 'Cautionnement',
            dateEcheance: endDate.toISOString().split('T')[0],
            joursRestants: days, level: getLevel(days),
            progress: calcProgress(m.garanties.cautionnementDate, endDate.toISOString().split('T')[0]),
          });
        }
      }
    });

    return alerts.sort((a, b) => a.joursRestants - b.joursRestants);
  }, [marches]);
}

export default function DeadlineMonitor() {
  const alerts = useDeadlineAlerts();
  const critical = alerts.filter(a => a.level === 'critical' || a.level === 'expired');
  const warnings = alerts.filter(a => a.level === 'warning');
  const infos = alerts.filter(a => a.level === 'info');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard icon={XCircle} label="Critiques / Expirés" count={critical.length} level="critical" />
        <SummaryCard icon={Timer} label="Attention (< 30j)" count={warnings.length} level="warning" />
        <SummaryCard icon={CalendarClock} label="À surveiller (< 60j)" count={infos.length} level="info" />
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span>Aucune échéance à signaler</span>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Suivi des échéances ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => {
              const cfg = getLevelConfig(alert.level);
              const Icon = cfg.icon;
              return (
                <div key={`${alert.marcheId}-${alert.type}-${i}`} className={`flex items-center gap-3 rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
                  <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{alert.marcheNumero}</span>
                      <Badge variant="outline" className="text-[10px]">{alert.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{alert.marcheObjet}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={alert.progress} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{Math.round(alert.progress)}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${cfg.color}`}>
                      {alert.joursRestants < 0 ? `${Math.abs(alert.joursRestants)}j en retard` : `${alert.joursRestants}j`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(alert.dateEcheance).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, count, level }: { icon: any; label: string; count: number; level: string }) {
  const colors = level === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/20'
    : level === 'warning' ? 'bg-warning/10 text-warning border-warning/20'
    : 'bg-info/10 text-info border-info/20';
  return (
    <Card className={`border ${colors.split(' ').pop()}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.split(' ').slice(0, 1).join(' ')}`}>
          <Icon className={`h-5 w-5 ${colors.split(' ')[1]}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
