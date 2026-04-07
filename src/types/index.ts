// ==================== USERS & AUTH ====================
export interface User {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  service: string;
  email: string;
  password?: string;
  isFirstLogin: boolean;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type PermissionLevel = 'none' | 'read' | 'write' | 'delete' | 'full';

export interface UserPermission {
  userId: string;
  procedure: ProcedureType;
  level: PermissionLevel;
}

export type ProcedureType =
  | 'correspondances'
  | 'engagement'
  | 'avenant'
  | 'garanties'
  | 'assurances'
  | 'delais'
  | 'execution'
  | 'liquidation'
  | 'ordres_service_avenant'
  | 'reception'
  | 'bons_commande';

export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  correspondances: 'Correspondances',
  engagement: "Phase d'Engagement",
  avenant: 'Avenant / Augmentation',
  garanties: 'Garanties',
  assurances: 'Assurances',
  delais: 'Délais',
  execution: "Phase d'Exécution",
  liquidation: 'Liquidation et Mandatement',
  ordres_service_avenant: 'Ordres de Service Avenant',
  reception: 'Réception',
  bons_commande: 'Bons de Commande',
};

// ==================== MARCHÉ ====================
export type MarcheType = 'unique' | 'alloti' | 'reconductible' | 'cadre' | 'negocie' | 'etudes';
export type MarcheStatus = 'en_cours' | 'approuve' | 'execute' | 'liquide' | 'reception_provisoire' | 'reception_definitive' | 'cloture' | 'resilie';
export type ImputationBudgetaire = 'CST' | 'BG' | 'BI';

export interface Marche {
  id: string;
  exercice: string;
  numero: string;
  objet: string;
  type: MarcheType;
  status: MarcheStatus;
  imputationBudgetaire: ImputationBudgetaire;
  titulaire: string;
  montantInitial: number;
  montantAvenant: number;
  montantTotal: number;
  dateCreation: string;
  createdBy: string;

  // Correspondances
  correspondances: Correspondance[];
  
  // Engagement
  engagement?: PhaseEngagement;
  
  // Avenant
  avenant?: PhaseAvenant;
  
  // Garanties
  garanties?: Garanties;
  
  // Assurances
  assurances?: Assurances;
  
  // Délais
  delais?: Delais;
  
  // Exécution
  ordresServiceInitial: OrdreService[];
  
  // Liquidation
  operations: OperationLiquidation[];
  
  // Ordres Service Avenant
  ordresServiceAvenant: OrdreServiceAvenant[];
  
  // Réception
  receptions: Reception[];
  
  // Notes
  notes: string;
}

export interface Correspondance {
  id: string;
  intitule: string;
  date: string;
  referenceArrive: string;
  referenceDepart: string;
  objet: string;
  expediteur: string;
  destinataire: string;
}

export interface PhaseEngagement {
  formeEngagement: string;
  dateSaisie: string;
  dateEnvoi: string;
  montantMarcheInitial: number;
  savIM: number;
  dateVisa: string;
  savRP: number;
  numeroVisa: string;
  montantTotalEngage: number;
}

export interface PhaseAvenant {
  dateSaisie: string;
  montantAvenant: number;
  dateEnvoi: string;
  savIM: number;
  dateVisa: string;
  savRP: number;
  numeroVisa: string;
  montantTotalEngage: number;
  dateAugmentation: string;
  montantAugmentation: number;
}

export interface Garanties {
  cautionnement: string;
  cautionnementMontant: number;
  cautionnementDate: string;
  cautionBancaireCautionnement: string;
  retenueGarantie: string;
  retenueGarantieMontant: number;
  retenueGarantieDate: string;
  cautionBancaireRetenue: string;
}

export interface Assurances {
  responsabiliteCivile: string;
  trc: string;
  dommagesOuvrage: string;
  accidentTravail: string;
}

export interface Delais {
  delaiExecution: string;
  delaiGarantie: string;
  dateDebutExecution?: string;
  dateFinExecution?: string;
  dateFinGarantie?: string;
}

export interface OrdreService {
  id: string;
  nature: string;
  numero: string;
  dateEtablissement: string;
  dateNotification: string;
  observations?: string;
}

export interface OperationLiquidation {
  id: string;
  type: string;
  numeroOP: string;
  numeroBE: string;
  date: string;
  montant: number;
  cumul: number;
}

export interface OrdreServiceAvenant {
  id: string;
  nature: string;
  numero: string;
  dateEtablissement: string;
  dateNotification: string;
  observations: string;
}

export interface Reception {
  id: string;
  type: 'provisoire' | 'definitive';
  date: string;
  pvNumero: string;
  observations: string;
}

// ==================== DOCUMENTS ====================
export interface Document {
  id: string;
  marcheId: string;
  procedure: ProcedureType;
  nom: string;
  type: string;
  taille: number;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string;
  fromUserId: string;
  toUserId: string;
  marcheId?: string;
  titre: string;
  message: string;
  documentId?: string;
  isRead: boolean;
  createdAt: string;
}

// ==================== AUDIT LOG (temoin) ====================
export interface TemoinEntry {
  id: string;
  userId: string;
  dateOperation: string;
  heureOperation: string;
  description: string;
  ipAddress: string;
  action: 'connexion' | 'deconnexion' | 'creation' | 'modification' | 'suppression' | 'consultation' | 'telechargement' | 'envoi';
}

// ==================== ARCHIVE (docarchive) ====================
export interface DocArchive {
  id: string;
  documentOriginalId: string;
  nomDocument: string;
  marcheId: string;
  dateSuppression: string;
  supprimePar: string;
  ipAddress: string;
  contenu: string;
}

// ==================== BONS DE COMMANDE ====================
export interface BonCommande {
  id: string;
  numero: string;
  exercice: string;
  objet: string;
  fournisseur: string;
  montant: number;
  dateCreation: string;
  dateApprobation?: string;
  status: 'brouillon' | 'envoye' | 'approuve' | 'execute' | 'liquide';
  createdBy: string;
}
