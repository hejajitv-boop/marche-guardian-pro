import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, FileText } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markAsRead } = useData();
  const { user, allUsers } = useAuth();

  const myNotifs = notifications
    .filter(n => n.toUserId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getUserName = (id: string) => {
    const u = allUsers.find(u => u.id === id);
    return u ? `${u.prenom} ${u.nom}` : 'Inconnu';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {myNotifs.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Bell className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucune notification</p>
          </CardContent>
        </Card>
      ) : (
        myNotifs.map(n => (
          <Card key={n.id} className={`card-shadow transition-colors ${!n.isRead ? 'border-primary/30 bg-primary/5' : ''}`}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{n.titre}</p>
                  {!n.isRead && <Badge variant="destructive" className="text-xs">Nouveau</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  De: {getUserName(n.fromUserId)} — {new Date(n.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              {!n.isRead && (
                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => markAsRead(n.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
