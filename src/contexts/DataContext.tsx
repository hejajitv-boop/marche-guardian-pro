import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Marche, BonCommande, Notification, TemoinEntry, DocArchive, Document } from '@/types';

interface DataContextType {
  // Marchés
  marches: Marche[];
  addMarche: (marche: Marche) => void;
  updateMarche: (id: string, data: Partial<Marche>) => void;
  deleteMarche: (id: string) => void;
  getMarche: (id: string) => Marche | undefined;

  // Bons de commande
  bonsCommande: BonCommande[];
  addBonCommande: (bc: BonCommande) => void;
  updateBonCommande: (id: string, data: Partial<BonCommande>) => void;
  deleteBonCommande: (id: string) => void;

  // Documents
  documents: Document[];
  addDocument: (doc: Document) => void;
  deleteDocument: (id: string, userId: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  getUnreadCount: (userId: string) => number;

  // Temoin (audit log)
  temoinEntries: TemoinEntry[];
  addTemoin: (entry: Omit<TemoinEntry, 'id'>) => void;

  // DocArchive
  docArchives: DocArchive[];
}

const DataContext = createContext<DataContextType | null>(null);

const DEMO_MARCHES: Marche[] = [
  {
    id: 'marche-001',
    exercice: '2024',
    numero: 'M-2024-001',
    objet: "Travaux de réaménagement du tribunal de première instance de Meknès",
    type: 'unique',
    status: 'en_cours',
    imputationBudgetaire: 'BG',
    titulaire: 'Entreprise ABC Construction SARL',
    montantInitial: 2500000,
    montantAvenant: 0,
    montantTotal: 2500000,
    dateCreation: '2024-01-15',
    createdBy: 'user-001',
    correspondances: [
      { id: 'c1', intitule: 'Lettre de soumission', date: '2024-01-10', referenceArrive: 'ARR-001', referenceDepart: 'DEP-001', objet: 'Soumission au marché', expediteur: 'ABC Construction', destinataire: 'Service des marchés' },
    ],
    engagement: {
      formeEngagement: 'Marché',
      dateSaisie: '2024-01-20',
      dateEnvoi: '2024-01-25',
      montantMarcheInitial: 2500000,
      savIM: 2500000,
      dateVisa: '2024-02-01',
      savRP: 2500000,
      numeroVisa: 'V-2024-001',
      montantTotalEngage: 2500000,
    },
    garanties: {
      cautionnement: 'Cautionnement définitif',
      cautionnementMontant: 75000,
      cautionnementDate: '2024-01-18',
      cautionBancaireCautionnement: 'Banque Populaire',
      retenueGarantie: '7%',
      retenueGarantieMontant: 175000,
      retenueGarantieDate: '2024-01-18',
      cautionBancaireRetenue: '',
    },
    assurances: {
      responsabiliteCivile: 'Police RC N° 12345',
      trc: 'Police TRC N° 67890',
      dommagesOuvrage: '',
      accidentTravail: 'Police AT N° 11111',
    },
    delais: {
      delaiExecution: '12 mois',
      delaiGarantie: '12 mois',
      dateDebutExecution: '2024-02-15',
      dateFinExecution: '2025-02-15',
    },
    ordresServiceInitial: [
      { id: 'os1', nature: "Notification d'approbation", numero: 'OS-001', dateEtablissement: '2024-02-10', dateNotification: '2024-02-12' },
      { id: 'os2', nature: 'Commencement', numero: 'OS-002', dateEtablissement: '2024-02-15', dateNotification: '2024-02-15' },
    ],
    operations: [
      { id: 'op1', type: 'Décompte provisoire N° 1', numeroOP: 'OP-001', numeroBE: 'BE-001', date: '2024-06-01', montant: 500000, cumul: 500000 },
    ],
    ordresServiceAvenant: [],
    receptions: [],
    notes: '',
  },
  {
    id: 'marche-002',
    exercice: '2024',
    numero: 'M-2024-002',
    objet: "Fourniture de mobilier de bureau pour la Cour d'appel de Meknès",
    type: 'alloti',
    status: 'approuve',
    imputationBudgetaire: 'BG',
    titulaire: 'Mobilier Pro SA',
    montantInitial: 850000,
    montantAvenant: 0,
    montantTotal: 850000,
    dateCreation: '2024-03-10',
    createdBy: 'user-001',
    correspondances: [],
    engagement: {
      formeEngagement: 'Marché',
      dateSaisie: '2024-03-15',
      dateEnvoi: '2024-03-20',
      montantMarcheInitial: 850000,
      savIM: 850000,
      dateVisa: '2024-04-01',
      savRP: 850000,
      numeroVisa: 'V-2024-002',
      montantTotalEngage: 850000,
    },
    garanties: {
      cautionnement: 'Cautionnement définitif',
      cautionnementMontant: 25500,
      cautionnementDate: '2024-03-12',
      cautionBancaireCautionnement: 'BMCE',
      retenueGarantie: '7%',
      retenueGarantieMontant: 59500,
      retenueGarantieDate: '2024-03-12',
      cautionBancaireRetenue: '',
    },
    assurances: { responsabiliteCivile: '', trc: '', dommagesOuvrage: '', accidentTravail: '' },
    delais: { delaiExecution: '3 mois', delaiGarantie: '12 mois' },
    ordresServiceInitial: [],
    operations: [],
    ordresServiceAvenant: [],
    receptions: [],
    notes: '',
  },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [marches, setMarches] = useState<Marche[]>(() => {
    const saved = localStorage.getItem('gm_marches');
    return saved ? JSON.parse(saved) : DEMO_MARCHES;
  });

  const [bonsCommande, setBonsCommande] = useState<BonCommande[]>(() => {
    const saved = localStorage.getItem('gm_bons');
    return saved ? JSON.parse(saved) : [];
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('gm_documents');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('gm_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [temoinEntries, setTemoinEntries] = useState<TemoinEntry[]>(() => {
    const saved = localStorage.getItem('gm_temoin');
    return saved ? JSON.parse(saved) : [];
  });

  const [docArchives, setDocArchives] = useState<DocArchive[]>(() => {
    const saved = localStorage.getItem('gm_docarchive');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('gm_marches', JSON.stringify(marches)); }, [marches]);
  useEffect(() => { localStorage.setItem('gm_bons', JSON.stringify(bonsCommande)); }, [bonsCommande]);
  useEffect(() => { localStorage.setItem('gm_documents', JSON.stringify(documents)); }, [documents]);
  useEffect(() => { localStorage.setItem('gm_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('gm_temoin', JSON.stringify(temoinEntries)); }, [temoinEntries]);
  useEffect(() => { localStorage.setItem('gm_docarchive', JSON.stringify(docArchives)); }, [docArchives]);

  const addMarche = useCallback((m: Marche) => setMarches(prev => [...prev, m]), []);
  const updateMarche = useCallback((id: string, data: Partial<Marche>) => {
    setMarches(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);
  const deleteMarche = useCallback((id: string) => setMarches(prev => prev.filter(m => m.id !== id)), []);
  const getMarche = useCallback((id: string) => marches.find(m => m.id === id), [marches]);

  const addBonCommande = useCallback((bc: BonCommande) => setBonsCommande(prev => [...prev, bc]), []);
  const updateBonCommande = useCallback((id: string, data: Partial<BonCommande>) => {
    setBonsCommande(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }, []);
  const deleteBonCommande = useCallback((id: string) => setBonsCommande(prev => prev.filter(b => b.id !== id)), []);

  const addDocument = useCallback((doc: Document) => setDocuments(prev => [...prev, doc]), []);
  const deleteDocument = useCallback((id: string, userId: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setDocArchives(prev => [...prev, {
        id: crypto.randomUUID(),
        documentOriginalId: doc.id,
        nomDocument: doc.nom,
        marcheId: doc.marcheId,
        dateSuppression: new Date().toISOString(),
        supprimePar: userId,
        ipAddress: '192.168.1.1',
        contenu: doc.url,
      }]);
    }
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, [documents]);

  const addNotification = useCallback((n: Notification) => setNotifications(prev => [...prev, n]), []);
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);
  const getUnreadCount = useCallback((userId: string) => {
    return notifications.filter(n => n.toUserId === userId && !n.isRead).length;
  }, [notifications]);

  const addTemoin = useCallback((entry: Omit<TemoinEntry, 'id'>) => {
    setTemoinEntries(prev => [...prev, { ...entry, id: crypto.randomUUID() }]);
  }, []);

  return (
    <DataContext.Provider value={{
      marches, addMarche, updateMarche, deleteMarche, getMarche,
      bonsCommande, addBonCommande, updateBonCommande, deleteBonCommande,
      documents, addDocument, deleteDocument,
      notifications, addNotification, markAsRead, getUnreadCount,
      temoinEntries, addTemoin,
      docArchives,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
