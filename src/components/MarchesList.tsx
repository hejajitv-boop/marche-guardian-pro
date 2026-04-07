import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Trash2, Filter } from 'lucide-react';
import type { Marche, MarcheType, MarcheStatus, ImputationBudgetaire } from '@/types';
import { toast } from 'sonner';

const TYPE_LABELS: Record<MarcheType, string> = {
  unique: 'Marché Unique',
  alloti: 'Marché Alloti',
  reconductible: 'Marché Reconductible',
  cadre: 'Marché Cadre',
  negocie: 'Marché Négocié',
  etudes: "Marché d'Études",
};

const STATUS_LABELS: Record<MarcheStatus, string> = {
  en_cours: 'En cours',
  approuve: 'Approuvé',
  execute: 'Exécuté',
  liquide: 'Liquidé',
  reception_provisoire: 'Réception provisoire',
  reception_definitive: 'Réception définitive',
  cloture: 'Clôturé',
  resilie: 'Résilié',
};

interface MarchesListProps {
  onSelectMarche: (id: string) => void;
}

export default function MarchesList({ onSelectMarche }: MarchesListProps) {
  const { marches, addMarche, deleteMarche, addTemoin } = useData();
  const { user, hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newMarche, setNewMarche] = useState({
    exercice: new Date().getFullYear().toString(),
    numero: '',
    objet: '',
    type: 'unique' as MarcheType,
    imputationBudgetaire: 'BG' as ImputationBudgetaire,
    titulaire: '',
    montantInitial: 0,
  });

  const filtered = marches.filter(m => {
    const matchSearch = m.numero.toLowerCase().includes(search.toLowerCase()) ||
      m.objet.toLowerCase().includes(search.toLowerCase()) ||
      m.titulaire.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || m.type === filterType;
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const handleCreate = () => {
    if (!newMarche.numero || !newMarche.objet) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    const marche: Marche = {
      id: crypto.randomUUID(),
      ...newMarche,
      status: 'en_cours',
      montantAvenant: 0,
      montantTotal: newMarche.montantInitial,
      dateCreation: new Date().toISOString().split('T')[0],
      createdBy: user?.id || '',
      correspondances: [],
      ordresServiceInitial: [],
      operations: [],
      ordresServiceAvenant: [],
      receptions: [],
      notes: '',
    };
    addMarche(marche);
    addTemoin({
      userId: user?.id || '',
      dateOperation: new Date().toLocaleDateString('fr-FR'),
      heureOperation: new Date().toLocaleTimeString('fr-FR'),
      description: `Création du marché ${newMarche.numero} - ${newMarche.objet}`,
      ipAddress: '192.168.1.1',
      action: 'creation',
    });
    setShowCreate(false);
    toast.success('Marché créé avec succès');
  };

  const handleDelete = (m: Marche) => {
    if (!confirm(`Supprimer le marché ${m.numero} ?`)) return;
    deleteMarche(m.id);
    addTemoin({
      userId: user?.id || '',
      dateOperation: new Date().toLocaleDateString('fr-FR'),
      heureOperation: new Date().toLocaleTimeString('fr-FR'),
      description: `Suppression du marché ${m.numero}`,
      ipAddress: '192.168.1.1',
      action: 'suppression',
    });
    toast.success('Marché supprimé');
  };

  const formatMontant = (m: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(m);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher par N°, objet ou titulaire..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="h-4 w-4" /> Nouveau marché</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Créer un nouveau marché</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Exercice</Label>
                  <Input value={newMarche.exercice} onChange={e => setNewMarche(p => ({ ...p, exercice: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>N° du marché *</Label>
                  <Input value={newMarche.numero} onChange={e => setNewMarche(p => ({ ...p, numero: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Objet *</Label>
                <Textarea value={newMarche.objet} onChange={e => setNewMarche(p => ({ ...p, objet: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={newMarche.type} onValueChange={(v: MarcheType) => setNewMarche(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Imputation</Label>
                  <Select value={newMarche.imputationBudgetaire} onValueChange={(v: ImputationBudgetaire) => setNewMarche(p => ({ ...p, imputationBudgetaire: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CST">C.S.T.</SelectItem>
                      <SelectItem value="BG">B.G. Fonctionnement</SelectItem>
                      <SelectItem value="BI">B.I.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Titulaire</Label>
                <Input value={newMarche.titulaire} onChange={e => setNewMarche(p => ({ ...p, titulaire: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Montant initial (DH)</Label>
                <Input type="number" value={newMarche.montantInitial} onChange={e => setNewMarche(p => ({ ...p, montantInitial: Number(e.target.value) }))} />
              </div>
              <Button onClick={handleCreate}>Créer le marché</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="card-shadow">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Titulaire</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun marché trouvé</TableCell></TableRow>
              ) : (
                filtered.map(m => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{m.numero}</TableCell>
                    <TableCell className="max-w-[250px] truncate">{m.objet}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{TYPE_LABELS[m.type]}</Badge></TableCell>
                    <TableCell className="max-w-[150px] truncate">{m.titulaire}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatMontant(m.montantTotal)}</TableCell>
                    <TableCell><Badge className="status-badge status-active text-xs">{STATUS_LABELS[m.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelectMarche(m.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
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
