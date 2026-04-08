import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, X, FileText, FolderOpen, RotateCcw } from 'lucide-react';
import type { MarcheType, MarcheStatus, ImputationBudgetaire } from '@/types';

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

const STATUS_COLORS: Record<MarcheStatus, string> = {
  en_cours: 'bg-blue-100 text-blue-800',
  approuve: 'bg-green-100 text-green-800',
  execute: 'bg-purple-100 text-purple-800',
  liquide: 'bg-orange-100 text-orange-800',
  reception_provisoire: 'bg-yellow-100 text-yellow-800',
  reception_definitive: 'bg-teal-100 text-teal-800',
  cloture: 'bg-gray-100 text-gray-800',
  resilie: 'bg-red-100 text-red-800',
};

interface RechercheAvanceeProps {
  onSelectMarche?: (id: string) => void;
}

export default function RechercheAvancee({ onSelectMarche }: RechercheAvanceeProps) {
  const { marches, documents } = useData();

  // Search state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterImputation, setFilterImputation] = useState<string>('all');
  const [filterExercice, setFilterExercice] = useState<string>('all');
  const [montantMin, setMontantMin] = useState('');
  const [montantMax, setMontantMax] = useState('');
  const [filterTitulaire, setFilterTitulaire] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [docType, setDocType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(true);

  const exercices = useMemo(() => {
    const set = new Set(marches.map(m => m.exercice));
    return Array.from(set).sort().reverse();
  }, [marches]);

  const titulaires = useMemo(() => {
    const set = new Set(marches.map(m => m.titulaire).filter(Boolean));
    return Array.from(set).sort();
  }, [marches]);

  const formatMontant = (m: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(m);

  // Filtered marchés
  const filteredMarches = useMemo(() => {
    return marches.filter(m => {
      const q = globalSearch.toLowerCase();
      const matchSearch = !q || 
        m.numero.toLowerCase().includes(q) ||
        m.objet.toLowerCase().includes(q) ||
        m.titulaire.toLowerCase().includes(q) ||
        (m.engagement?.numeroVisa || '').toLowerCase().includes(q) ||
        m.correspondances?.some(c => c.objet.toLowerCase().includes(q) || c.intitule.toLowerCase().includes(q)) ||
        m.notes?.toLowerCase().includes(q);
      const matchType = filterType === 'all' || m.type === filterType;
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;
      const matchImputation = filterImputation === 'all' || m.imputationBudgetaire === filterImputation;
      const matchExercice = filterExercice === 'all' || m.exercice === filterExercice;
      const matchMontantMin = !montantMin || m.montantTotal >= Number(montantMin);
      const matchMontantMax = !montantMax || m.montantTotal <= Number(montantMax);
      const matchTitulaire = !filterTitulaire || m.titulaire.toLowerCase().includes(filterTitulaire.toLowerCase());
      const matchDateDebut = !dateDebut || m.dateCreation >= dateDebut;
      const matchDateFin = !dateFin || m.dateCreation <= dateFin;
      return matchSearch && matchType && matchStatus && matchImputation && matchExercice &&
        matchMontantMin && matchMontantMax && matchTitulaire && matchDateDebut && matchDateFin;
    });
  }, [marches, globalSearch, filterType, filterStatus, filterImputation, filterExercice, montantMin, montantMax, filterTitulaire, dateDebut, dateFin]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const q = docSearch.toLowerCase();
      const matchSearch = !q || d.nom.toLowerCase().includes(q);
      const matchType = docType === 'all' || d.type === docType;
      return matchSearch && matchType;
    });
  }, [documents, docSearch, docType]);

  const resetFilters = () => {
    setGlobalSearch('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterImputation('all');
    setFilterExercice('all');
    setMontantMin('');
    setMontantMax('');
    setFilterTitulaire('');
    setDateDebut('');
    setDateFin('');
    setDocSearch('');
    setDocType('all');
  };

  const activeFiltersCount = [filterType, filterStatus, filterImputation, filterExercice]
    .filter(f => f !== 'all').length +
    [montantMin, montantMax, filterTitulaire, dateDebut, dateFin].filter(Boolean).length;

  // Get marché info for a document
  const getMarcheForDoc = (marcheId: string) => marches.find(m => m.id === marcheId);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Global search bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10 h-11 text-base"
                placeholder="Recherche globale : N° marché, objet, titulaire, visa, correspondances, notes..."
                value={globalSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGlobalSearch(e.target.value)}
              />
              {globalSearch && (
                <button onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
                <RotateCcw className="h-3 w-3" /> Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtres avancés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Type de marché</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Statut</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Imputation budgétaire</Label>
                <Select value={filterImputation} onValueChange={setFilterImputation}>
                  <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="CST">C.S.T.</SelectItem>
                    <SelectItem value="BG">B.G. Fonctionnement</SelectItem>
                    <SelectItem value="BI">B.I.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exercice</Label>
                <Select value={filterExercice} onValueChange={setFilterExercice}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {exercices.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Montant min (DH)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={montantMin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMontantMin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Montant max (DH)</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={montantMax}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMontantMax(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date création (début)</Label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateDebut(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date création (fin)</Label>
                <Input
                  type="date"
                  value={dateFin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFin(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">Titulaire</Label>
              <Input
                placeholder="Filtrer par titulaire..."
                value={filterTitulaire}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterTitulaire(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results tabs */}
      <Tabs defaultValue="marches">
        <TabsList>
          <TabsTrigger value="marches" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Marchés ({filteredMarches.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents ({filteredDocs.length})
          </TabsTrigger>
        </TabsList>

        {/* Marchés results */}
        <TabsContent value="marches">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Exercice</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Titulaire</TableHead>
                    <TableHead>Imputation</TableHead>
                    <TableHead className="text-right">Montant total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMarches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Aucun marché ne correspond aux critères de recherche
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMarches.map(m => (
                      <TableRow
                        key={m.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onSelectMarche?.(m.id)}
                      >
                        <TableCell className="font-medium">{m.numero}</TableCell>
                        <TableCell>{m.exercice}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{m.objet}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs whitespace-nowrap">{TYPE_LABELS[m.type]}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate">{m.titulaire}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{m.imputationBudgetaire}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatMontant(m.montantTotal)}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{m.dateCreation}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {filteredMarches.length > 0 && (
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-sm text-muted-foreground">
                {filteredMarches.length} marché(s) trouvé(s) sur {marches.length}
              </p>
              <p className="text-sm font-medium">
                Total : {formatMontant(filteredMarches.reduce((s, m) => s + m.montantTotal, 0))}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Documents results */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Rechercher un document..."
                    value={docSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocSearch(e.target.value)}
                  />
                </div>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="application/pdf">PDF</SelectItem>
                    <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</SelectItem>
                    <SelectItem value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du document</TableHead>
                    <TableHead>Marché associé</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Aucun document trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocs.map(d => {
                      const marche = getMarcheForDoc(d.marcheId);
                      const ext = d.nom.split('.').pop()?.toUpperCase() || '';
                      const sizeKb = d.taille ? (d.taille / 1024).toFixed(0) : '—';
                      return (
                        <TableRow
                          key={d.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => marche && onSelectMarche?.(marche.id)}
                        >
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[200px]">{d.nom}</span>
                          </TableCell>
                          <TableCell className="text-sm">{marche?.numero || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{d.phase || '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{ext}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{sizeKb} Ko</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{d.dateUpload?.split('T')[0] || '—'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {filteredDocs.length > 0 && (
            <p className="text-sm text-muted-foreground mt-3 px-1">
              {filteredDocs.length} document(s) trouvé(s) sur {documents.length}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
