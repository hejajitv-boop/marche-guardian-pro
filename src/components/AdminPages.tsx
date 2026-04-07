import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { PROCEDURE_LABELS } from '@/types';
import type { ProcedureType, PermissionLevel } from '@/types';
import { toast } from 'sonner';

export function AdminUsers() {
  const { allUsers, createUser, toggleUserActive } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ matricule: '', nom: '', prenom: '', fonction: '', service: '', email: '', isAdmin: false, password: '' });

  const handleCreate = () => {
    if (!form.matricule || !form.nom) { toast.error('Champs obligatoires manquants'); return; }
    createUser(form);
    setShowCreate(false);
    setForm({ matricule: '', nom: '', prenom: '', fonction: '', service: '', email: '', isAdmin: false, password: '' });
    toast.success('Utilisateur créé');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Nouvel utilisateur</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer un utilisateur</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Matricule *</Label><Input value={form.matricule} onChange={e => setForm(p => ({ ...p, matricule: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Prénom</Label><Input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Fonction</Label><Input value={form.fonction} onChange={e => setForm(p => ({ ...p, fonction: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Service</Label><Input value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreate}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-shadow">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead><TableHead>Nom complet</TableHead><TableHead>Fonction</TableHead><TableHead>Service</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.matricule}</TableCell>
                  <TableCell>{u.prenom} {u.nom} {u.isAdmin && <Badge variant="secondary" className="ml-1 text-xs">Admin</Badge>}</TableCell>
                  <TableCell>{u.fonction}</TableCell>
                  <TableCell>{u.service}</TableCell>
                  <TableCell><Badge className={u.isActive ? 'status-badge status-active' : 'status-badge status-cancelled'}>{u.isActive ? 'Actif' : 'Inactif'}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleUserActive(u.id)}>
                      {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminPermissions() {
  const { allUsers, getUserPermissions, setUserPermission } = useAuth();
  const [selectedUser, setSelectedUser] = useState('');
  const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
  const perms = selectedUser ? getUserPermissions(selectedUser) : [];

  const getLevel = (proc: ProcedureType): PermissionLevel => {
    const p = perms.find(x => x.procedure === proc);
    return p?.level || 'none';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="card-shadow">
        <CardHeader><CardTitle className="text-base">Gestion des permissions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-1.5">
            <Label>Sélectionner un utilisateur</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {nonAdminUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.matricule})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procédure</TableHead><TableHead>Niveau d'accès</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Object.keys(PROCEDURE_LABELS) as ProcedureType[]).map(proc => (
                  <TableRow key={proc}>
                    <TableCell className="font-medium">{PROCEDURE_LABELS[proc]}</TableCell>
                    <TableCell>
                      <Select value={getLevel(proc)} onValueChange={(v: PermissionLevel) => { setUserPermission(selectedUser, proc, v); toast.success('Permission mise à jour'); }}>
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun accès</SelectItem>
                          <SelectItem value="read">Consultation uniquement</SelectItem>
                          <SelectItem value="write">Ajout et modification</SelectItem>
                          <SelectItem value="delete">Ajout, modification et suppression</SelectItem>
                          <SelectItem value="full">Accès complet</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminTemoin() {
  const { temoinEntries } = useAuth() as any;
  const { temoinEntries: entries } = require('@/contexts/DataContext').useData ? useDataProxy() : { temoinEntries: [] };
  
  return <TemoinTable />;
}

function useDataProxy() {
  // eslint-disable-next-line
  const { useData } = require('@/contexts/DataContext');
  return useData();
}

export function TemoinTable() {
  const [search, setSearch] = useState('');
  const entries: any[] = JSON.parse(localStorage.getItem('gm_temoin') || '[]');
  const users: any[] = JSON.parse(localStorage.getItem('gm_users') || '[]');

  const getUserName = (id: string) => {
    const u = users.find((u: any) => u.id === id);
    return u ? `${u.prenom} ${u.nom}` : id;
  };

  const filtered = entries.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    getUserName(e.userId).toLowerCase().includes(search.toLowerCase())
  ).reverse();

  return (
    <div className="space-y-4 animate-fade-in">
      <Input placeholder="Rechercher dans le journal..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      <Card className="card-shadow">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Heure</TableHead><TableHead>Utilisateur</TableHead><TableHead>Action</TableHead><TableHead>Description</TableHead><TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune entrée</TableCell></TableRow>
              ) : (
                filtered.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{e.dateOperation}</TableCell>
                    <TableCell className="text-xs">{e.heureOperation}</TableCell>
                    <TableCell className="text-xs">{getUserName(e.userId)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.action}</Badge></TableCell>
                    <TableCell className="text-xs max-w-[300px] truncate">{e.description}</TableCell>
                    <TableCell className="text-xs font-mono">{e.ipAddress}</TableCell>
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

export function AdminArchives() {
  const archives: any[] = JSON.parse(localStorage.getItem('gm_docarchive') || '[]');
  const users: any[] = JSON.parse(localStorage.getItem('gm_users') || '[]');
  const getUserName = (id: string) => { const u = users.find((u: any) => u.id === id); return u ? `${u.prenom} ${u.nom}` : id; };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="card-shadow">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead><TableHead>Marché</TableHead><TableHead>Date suppression</TableHead><TableHead>Supprimé par</TableHead><TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archives.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun document archivé</TableCell></TableRow>
              ) : (
                archives.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.nomDocument}</TableCell>
                    <TableCell>{a.marcheId}</TableCell>
                    <TableCell className="text-xs">{new Date(a.dateSuppression).toLocaleString('fr-FR')}</TableCell>
                    <TableCell>{getUserName(a.supprimePar)}</TableCell>
                    <TableCell className="font-mono text-xs">{a.ipAddress}</TableCell>
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
