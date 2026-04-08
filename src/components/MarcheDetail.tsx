import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Save, Upload, Send } from 'lucide-react';
import DocumentUploader from '@/components/DocumentUploader';
import type { Marche, Correspondance, OrdreService, OperationLiquidation, OrdreServiceAvenant, Reception, MarcheStatus } from '@/types';
import { toast } from 'sonner';

const STATUS_LABELS: Record<MarcheStatus, string> = {
  en_cours: 'En cours', approuve: 'Approuvé', execute: 'Exécuté', liquide: 'Liquidé',
  reception_provisoire: 'Réception provisoire', reception_definitive: 'Réception définitive',
  cloture: 'Clôturé', resilie: 'Résilié',
};

interface MarcheDetailProps {
  marcheId: string;
  onBack: () => void;
}

export default function MarcheDetail({ marcheId, onBack }: MarcheDetailProps) {
  const { getMarche, updateMarche, addTemoin, addNotification } = useData();
  const { user, allUsers, hasPermission } = useAuth();
  const marche = getMarche(marcheId);
  const [activeTab, setActiveTab] = useState('correspondances');
  const [showSendDoc, setShowSendDoc] = useState(false);

  // Permission helpers
  const canRead = (proc: import('@/types').ProcedureType) => hasPermission(proc, 'read');
  const canWrite = (proc: import('@/types').ProcedureType) => hasPermission(proc, 'write');
  const canDelete = (proc: import('@/types').ProcedureType) => hasPermission(proc, 'delete');
  const [sendTo, setSendTo] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  if (!marche) return <div className="p-8 text-center text-muted-foreground">Marché introuvable</div>;

  const log = (desc: string, action: 'creation' | 'modification' | 'suppression') => {
    addTemoin({
      userId: user?.id || '',
      dateOperation: new Date().toLocaleDateString('fr-FR'),
      heureOperation: new Date().toLocaleTimeString('fr-FR'),
      description: desc,
      ipAddress: '192.168.1.1',
      action,
    });
  };

  const save = (data: Partial<Marche>) => {
    updateMarche(marcheId, data);
    log(`Modification du marché ${marche.numero}`, 'modification');
    toast.success('Enregistré');
  };

  const formatMontant = (m: number) => new Intl.NumberFormat('fr-FR').format(m) + ' DH';

  // ===== ADD ITEM HELPERS =====
  const addCorrespondance = () => {
    const c: Correspondance = { id: crypto.randomUUID(), intitule: '', date: new Date().toISOString().split('T')[0], referenceArrive: '', referenceDepart: '', objet: '', expediteur: '', destinataire: '' };
    save({ correspondances: [...marche.correspondances, c] });
  };

  const addOS = () => {
    const os: OrdreService = { id: crypto.randomUUID(), nature: '', numero: '', dateEtablissement: new Date().toISOString().split('T')[0], dateNotification: '' };
    save({ ordresServiceInitial: [...marche.ordresServiceInitial, os] });
  };

  const addOperation = () => {
    const op: OperationLiquidation = { id: crypto.randomUUID(), type: '', numeroOP: '', numeroBE: '', date: new Date().toISOString().split('T')[0], montant: 0, cumul: 0 };
    save({ operations: [...marche.operations, op] });
  };

  const addOSAvenant = () => {
    const osa: OrdreServiceAvenant = { id: crypto.randomUUID(), nature: '', numero: '', dateEtablissement: new Date().toISOString().split('T')[0], dateNotification: '', observations: '' };
    save({ ordresServiceAvenant: [...marche.ordresServiceAvenant, osa] });
  };

  const addReception = () => {
    const r: Reception = { id: crypto.randomUUID(), type: 'provisoire', date: new Date().toISOString().split('T')[0], pvNumero: '', observations: '' };
    save({ receptions: [...marche.receptions, r] });
  };

  const handleSendNotification = () => {
    if (!sendTo || !sendMessage) { toast.error('Veuillez remplir tous les champs'); return; }
    addNotification({
      id: crypto.randomUUID(),
      fromUserId: user?.id || '',
      toUserId: sendTo,
      marcheId: marche.id,
      titre: `Document - ${marche.numero}`,
      message: sendMessage,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    log(`Envoi notification concernant ${marche.numero}`, 'creation');
    setShowSendDoc(false);
    setSendMessage('');
    toast.success('Notification envoyée');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{marche.numero} — {marche.objet}</h2>
          <p className="text-sm text-muted-foreground">Titulaire: {marche.titulaire} | Exercice: {marche.exercice}</p>
        </div>
        <Select value={marche.status} onValueChange={(v: MarcheStatus) => save({ status: v })}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={showSendDoc} onOpenChange={setShowSendDoc}>
          <DialogTrigger asChild><Button variant="outline" className="gap-1"><Send className="h-3 w-3" /> Envoyer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Envoyer une notification</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Destinataire</Label>
                <Select value={sendTo} onValueChange={setSendTo}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {allUsers.filter(u => u.id !== user?.id && u.isActive).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.prenom} {u.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)} />
              </div>
              <Button onClick={handleSendNotification} className="w-full">Envoyer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {canRead('correspondances') && <TabsTrigger value="correspondances">Correspondances</TabsTrigger>}
          {canRead('engagement') && <TabsTrigger value="engagement">Engagement</TabsTrigger>}
          {canRead('avenant') && <TabsTrigger value="avenant">Avenant</TabsTrigger>}
          {canRead('garanties') && <TabsTrigger value="garanties">Garanties</TabsTrigger>}
          {canRead('assurances') && <TabsTrigger value="assurances">Assurances</TabsTrigger>}
          {canRead('delais') && <TabsTrigger value="delais">Délais</TabsTrigger>}
          {canRead('execution') && <TabsTrigger value="execution">Exécution / OS</TabsTrigger>}
          {canRead('liquidation') && <TabsTrigger value="liquidation">Liquidation</TabsTrigger>}
          {canRead('ordres_service_avenant') && <TabsTrigger value="os_avenant">OS Avenant</TabsTrigger>}
          {canRead('reception') && <TabsTrigger value="reception">Réception</TabsTrigger>}
        </TabsList>

        {/* CORRESPONDANCES */}
        <TabsContent value="correspondances">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Correspondances</CardTitle>
              {canWrite('correspondances') && <Button size="sm" className="gap-1" onClick={addCorrespondance}><Plus className="h-3 w-3" /> Ajouter</Button>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intitulé</TableHead><TableHead>Date</TableHead><TableHead>Réf. Arrivé</TableHead><TableHead>Réf. Départ</TableHead><TableHead>Objet</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marche.correspondances.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell><Input className="h-8 text-xs" value={c.intitule} onChange={e => { const arr = [...marche.correspondances]; arr[i] = { ...c, intitule: e.target.value }; save({ correspondances: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" type="date" value={c.date} onChange={e => { const arr = [...marche.correspondances]; arr[i] = { ...c, date: e.target.value }; save({ correspondances: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={c.referenceArrive} onChange={e => { const arr = [...marche.correspondances]; arr[i] = { ...c, referenceArrive: e.target.value }; save({ correspondances: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={c.referenceDepart} onChange={e => { const arr = [...marche.correspondances]; arr[i] = { ...c, referenceDepart: e.target.value }; save({ correspondances: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={c.objet} onChange={e => { const arr = [...marche.correspondances]; arr[i] = { ...c, objet: e.target.value }; save({ correspondances: arr }); }} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => save({ correspondances: marche.correspondances.filter(x => x.id !== c.id) })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DocumentUploader marcheId={marcheId} procedure="correspondances" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="engagement">
          <Card className="card-shadow">
            <CardHeader><CardTitle className="text-base">Phase d'Engagement — Marché Initial</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Forme de l'engagement", key: 'formeEngagement' },
                  { label: 'Date de saisie', key: 'dateSaisie', type: 'date' },
                  { label: "Date d'envoi", key: 'dateEnvoi', type: 'date' },
                  { label: 'Montant du marché initial (DH)', key: 'montantMarcheInitial', type: 'number' },
                  { label: 'S.a.v pour I.M. (DH)', key: 'savIM', type: 'number' },
                  { label: 'Date de visa', key: 'dateVisa', type: 'date' },
                  { label: 'S.a.v pour R.P. (DH)', key: 'savRP', type: 'number' },
                  { label: 'N° de visa', key: 'numeroVisa' },
                  { label: 'Montant total engagé (DH)', key: 'montantTotalEngage', type: 'number' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      type={field.type || 'text'}
                      className="h-8 text-sm"
                      value={(marche.engagement as any)?.[field.key] ?? ''}
                      onChange={e => {
                        const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
                        save({ engagement: { ...(marche.engagement || {} as any), [field.key]: val } });
                      }}
                    />
                  </div>
                ))}
              </div>
              <DocumentUploader marcheId={marcheId} procedure="engagement" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="avenant">
          <Card className="card-shadow">
            <CardHeader><CardTitle className="text-base">Avenant / Augmentation d'Engagement</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Date de saisie', key: 'dateSaisie', type: 'date' },
                  { label: "Montant de l'avenant (DH)", key: 'montantAvenant', type: 'number' },
                  { label: "Date d'envoi", key: 'dateEnvoi', type: 'date' },
                  { label: 'S.a.v pour I.M. (DH)', key: 'savIM', type: 'number' },
                  { label: 'Date de visa', key: 'dateVisa', type: 'date' },
                  { label: 'S.a.v pour R.P. (DH)', key: 'savRP', type: 'number' },
                  { label: 'N° de visa', key: 'numeroVisa' },
                  { label: 'Montant total engagé (DH)', key: 'montantTotalEngage', type: 'number' },
                  { label: "Date d'augmentation", key: 'dateAugmentation', type: 'date' },
                  { label: "Montant d'augmentation (DH)", key: 'montantAugmentation', type: 'number' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      type={field.type || 'text'}
                      className="h-8 text-sm"
                      value={(marche.avenant as any)?.[field.key] ?? ''}
                      onChange={e => {
                        const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
                        save({ avenant: { ...(marche.avenant || {} as any), [field.key]: val } });
                      }}
                    />
                  </div>
                ))}
              </div>
              <DocumentUploader marcheId={marcheId} procedure="avenant" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="garanties">
          <Card className="card-shadow">
            <CardHeader><CardTitle className="text-base">Garanties</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Cautionnement', key: 'cautionnement' },
                  { label: 'Montant (DH)', key: 'cautionnementMontant', type: 'number' },
                  { label: 'Date', key: 'cautionnementDate', type: 'date' },
                  { label: 'Caution bancaire (cautionnement)', key: 'cautionBancaireCautionnement' },
                  { label: 'Retenue de garantie', key: 'retenueGarantie' },
                  { label: 'Montant (DH)', key: 'retenueGarantieMontant', type: 'number' },
                  { label: 'Date', key: 'retenueGarantieDate', type: 'date' },
                  { label: 'Caution bancaire (retenue)', key: 'cautionBancaireRetenue' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      type={field.type || 'text'}
                      className="h-8 text-sm"
                      value={(marche.garanties as any)?.[field.key] ?? ''}
                      onChange={e => {
                        const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
                        save({ garanties: { ...(marche.garanties || {} as any), [field.key]: val } });
                      }}
                    />
                  </div>
                ))}
              </div>
              <DocumentUploader marcheId={marcheId} procedure="garanties" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assurances">
          <Card className="card-shadow">
            <CardHeader><CardTitle className="text-base">Assurances</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Responsabilité civile', key: 'responsabiliteCivile' },
                  { label: 'T.R.C.', key: 'trc' },
                  { label: "Dommages à l'ouvrage", key: 'dommagesOuvrage' },
                  { label: 'Accident de travail', key: 'accidentTravail' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      className="h-8 text-sm"
                      value={(marche.assurances as any)?.[field.key] ?? ''}
                      onChange={e => save({ assurances: { ...(marche.assurances || {} as any), [field.key]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
              <DocumentUploader marcheId={marcheId} procedure="assurances" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="delais">
          <Card className="card-shadow">
            <CardHeader><CardTitle className="text-base">Délais</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Délai d'exécution", key: 'delaiExecution' },
                  { label: 'Délai de garantie', key: 'delaiGarantie' },
                  { label: "Date début d'exécution", key: 'dateDebutExecution', type: 'date' },
                  { label: "Date fin d'exécution", key: 'dateFinExecution', type: 'date' },
                  { label: 'Date fin de garantie', key: 'dateFinGarantie', type: 'date' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      type={field.type || 'text'}
                      className="h-8 text-sm"
                      value={(marche.delais as any)?.[field.key] ?? ''}
                      onChange={e => save({ delais: { ...(marche.delais || {} as any), [field.key]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
              <DocumentUploader marcheId={marcheId} procedure="delais" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="execution">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Phase d'Exécution — Ordres de Service</CardTitle>
              <Button size="sm" className="gap-1" onClick={addOS}><Plus className="h-3 w-3" /> Ajouter OS</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nature</TableHead><TableHead>N°</TableHead><TableHead>Date établ.</TableHead><TableHead>Date notif.</TableHead><TableHead>Observations</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marche.ordresServiceInitial.map((os, i) => (
                    <TableRow key={os.id}>
                      <TableCell><Input className="h-8 text-xs" value={os.nature} onChange={e => { const arr = [...marche.ordresServiceInitial]; arr[i] = { ...os, nature: e.target.value }; save({ ordresServiceInitial: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs w-20" value={os.numero} onChange={e => { const arr = [...marche.ordresServiceInitial]; arr[i] = { ...os, numero: e.target.value }; save({ ordresServiceInitial: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" type="date" value={os.dateEtablissement} onChange={e => { const arr = [...marche.ordresServiceInitial]; arr[i] = { ...os, dateEtablissement: e.target.value }; save({ ordresServiceInitial: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" type="date" value={os.dateNotification} onChange={e => { const arr = [...marche.ordresServiceInitial]; arr[i] = { ...os, dateNotification: e.target.value }; save({ ordresServiceInitial: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={os.observations || ''} onChange={e => { const arr = [...marche.ordresServiceInitial]; arr[i] = { ...os, observations: e.target.value }; save({ ordresServiceInitial: arr }); }} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => save({ ordresServiceInitial: marche.ordresServiceInitial.filter(x => x.id !== os.id) })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DocumentUploader marcheId={marcheId} procedure="execution" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="liquidation">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Phase de Liquidation et Mandatement</CardTitle>
              <Button size="sm" className="gap-1" onClick={addOperation}><Plus className="h-3 w-3" /> Ajouter</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead><TableHead>N° OP</TableHead><TableHead>N° BE</TableHead><TableHead>Date</TableHead><TableHead>Montant (DH)</TableHead><TableHead>Cumul (DH)</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marche.operations.map((op, i) => (
                    <TableRow key={op.id}>
                      <TableCell><Input className="h-8 text-xs" value={op.type} onChange={e => { const arr = [...marche.operations]; arr[i] = { ...op, type: e.target.value }; save({ operations: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs w-20" value={op.numeroOP} onChange={e => { const arr = [...marche.operations]; arr[i] = { ...op, numeroOP: e.target.value }; save({ operations: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs w-20" value={op.numeroBE} onChange={e => { const arr = [...marche.operations]; arr[i] = { ...op, numeroBE: e.target.value }; save({ operations: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" type="date" value={op.date} onChange={e => { const arr = [...marche.operations]; arr[i] = { ...op, date: e.target.value }; save({ operations: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs w-28" type="number" value={op.montant} onChange={e => { const arr = [...marche.operations]; arr[i] = { ...op, montant: Number(e.target.value) }; save({ operations: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs w-28" type="number" value={op.cumul} onChange={e => { const arr = [...marche.operations]; arr[i] = { ...op, cumul: Number(e.target.value) }; save({ operations: arr }); }} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => save({ operations: marche.operations.filter(x => x.id !== op.id) })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DocumentUploader marcheId={marcheId} procedure="liquidation" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="os_avenant">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Ordres de Service — Avenant</CardTitle>
              <Button size="sm" className="gap-1" onClick={addOSAvenant}><Plus className="h-3 w-3" /> Ajouter</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nature</TableHead><TableHead>N°</TableHead><TableHead>Date établ.</TableHead><TableHead>Date notif.</TableHead><TableHead>Observations</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marche.ordresServiceAvenant.map((osa, i) => (
                    <TableRow key={osa.id}>
                      <TableCell><Input className="h-8 text-xs" value={osa.nature} onChange={e => { const arr = [...marche.ordresServiceAvenant]; arr[i] = { ...osa, nature: e.target.value }; save({ ordresServiceAvenant: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs w-20" value={osa.numero} onChange={e => { const arr = [...marche.ordresServiceAvenant]; arr[i] = { ...osa, numero: e.target.value }; save({ ordresServiceAvenant: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" type="date" value={osa.dateEtablissement} onChange={e => { const arr = [...marche.ordresServiceAvenant]; arr[i] = { ...osa, dateEtablissement: e.target.value }; save({ ordresServiceAvenant: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" type="date" value={osa.dateNotification} onChange={e => { const arr = [...marche.ordresServiceAvenant]; arr[i] = { ...osa, dateNotification: e.target.value }; save({ ordresServiceAvenant: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={osa.observations} onChange={e => { const arr = [...marche.ordresServiceAvenant]; arr[i] = { ...osa, observations: e.target.value }; save({ ordresServiceAvenant: arr }); }} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => save({ ordresServiceAvenant: marche.ordresServiceAvenant.filter(x => x.id !== osa.id) })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DocumentUploader marcheId={marcheId} procedure="ordres_service_avenant" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reception">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Réception</CardTitle>
              <Button size="sm" className="gap-1" onClick={addReception}><Plus className="h-3 w-3" /> Ajouter</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead><TableHead>N° PV</TableHead><TableHead>Date</TableHead><TableHead>Observations</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marche.receptions.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Select value={r.type} onValueChange={(v: 'provisoire' | 'definitive') => { const arr = [...marche.receptions]; arr[i] = { ...r, type: v }; save({ receptions: arr }); }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="provisoire">Provisoire</SelectItem>
                            <SelectItem value="definitive">Définitive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8 text-xs" value={r.pvNumero} onChange={e => { const arr = [...marche.receptions]; arr[i] = { ...r, pvNumero: e.target.value }; save({ receptions: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" type="date" value={r.date} onChange={e => { const arr = [...marche.receptions]; arr[i] = { ...r, date: e.target.value }; save({ receptions: arr }); }} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={r.observations} onChange={e => { const arr = [...marche.receptions]; arr[i] = { ...r, observations: e.target.value }; save({ receptions: arr }); }} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => save({ receptions: marche.receptions.filter(x => x.id !== r.id) })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DocumentUploader marcheId={marcheId} procedure="reception" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
