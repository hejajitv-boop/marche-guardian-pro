import { useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDeadlineAlerts, type DeadlineAlert } from '@/components/DeadlineMonitor';

const NOTIF_KEY = 'gm_deadline_notifs_sent';

function getSentKeys(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'));
  } catch { return new Set(); }
}

function persistSentKeys(keys: Set<string>) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify([...keys]));
}

function buildNotifKey(alert: DeadlineAlert): string {
  // Unique per marché + type + level so each escalation triggers a new notif
  return `${alert.marcheId}-${alert.type}-${alert.level}`;
}

function getLabelFr(alert: DeadlineAlert): { titre: string; message: string } {
  const typeLabels: Record<string, string> = {
    execution: "délai d'exécution",
    garantie: 'délai de garantie',
    cautionnement: 'cautionnement',
    assurance: 'assurance',
  };
  const typeName = typeLabels[alert.type] || alert.type;

  if (alert.level === 'expired') {
    return {
      titre: `⚠️ ${typeName} expiré — ${alert.marcheNumero}`,
      message: `Le ${typeName} du marché ${alert.marcheNumero} («${alert.marcheObjet}») est expiré depuis ${Math.abs(alert.joursRestants)} jour(s). Échéance : ${new Date(alert.dateEcheance).toLocaleDateString('fr-FR')}.`,
    };
  }
  if (alert.level === 'critical') {
    return {
      titre: `🔴 Échéance critique — ${alert.marcheNumero}`,
      message: `Le ${typeName} du marché ${alert.marcheNumero} expire dans ${alert.joursRestants} jour(s) (${new Date(alert.dateEcheance).toLocaleDateString('fr-FR')}). Action urgente requise.`,
    };
  }
  if (alert.level === 'warning') {
    return {
      titre: `🟡 Échéance proche — ${alert.marcheNumero}`,
      message: `Le ${typeName} du marché ${alert.marcheNumero} expire dans ${alert.joursRestants} jour(s) (${new Date(alert.dateEcheance).toLocaleDateString('fr-FR')}). Veuillez anticiper.`,
    };
  }
  return {
    titre: `ℹ️ Échéance à surveiller — ${alert.marcheNumero}`,
    message: `Le ${typeName} du marché ${alert.marcheNumero} expire dans ${alert.joursRestants} jour(s) (${new Date(alert.dateEcheance).toLocaleDateString('fr-FR')}).`,
  };
}

export function useAutoDeadlineNotifications() {
  const alerts = useDeadlineAlerts();
  const { addNotification, marches } = useData();
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || hasRun.current) return;
    hasRun.current = true;

    const actionable = alerts.filter(a => a.level !== 'ok');
    if (actionable.length === 0) return;

    const sent = getSentKeys();
    let changed = false;

    actionable.forEach(alert => {
      const key = buildNotifKey(alert);
      if (sent.has(key)) return;

      // Find the market creator to notify
      const marche = marches.find(m => m.id === alert.marcheId);
      const targetUserId = marche?.createdBy || user.id;

      const { titre, message } = getLabelFr(alert);

      addNotification({
        id: crypto.randomUUID(),
        fromUserId: 'system',
        toUserId: targetUserId,
        marcheId: alert.marcheId,
        titre,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      sent.add(key);
      changed = true;
    });

    if (changed) persistSentKeys(sent);
  }, [alerts, user, addNotification, marches]);
}
