export type DocStatus = 'draft' | 'pending' | 'signed' | 'archived';
export type DocType = 'contract' | 'lease' | 'closing' | 'listing' | 'form' | 'imported';
export type AnnotationType = 'highlight' | 'draw' | 'text' | 'signature';
export type Tool = 'select' | 'highlight' | 'draw' | 'text' | 'signature' | 'erase';

export interface Pt {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  page: number; // 0-based
  x: number; // pdf points (612 x 792 space)
  y: number;
  w: number;
  h: number;
  color: string;
  text?: string; // text notes
  points?: Pt[]; // draw / signature
  author: string;
  createdAt: number;
  locked?: boolean; // signature locked after signing
}

export type Block =
  | { type: 'title'; text: string }
  | { type: 'subtitle'; text: string }
  | { type: 'meta'; rows: [string, string][] }
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'sigline'; label: string; signed?: boolean }
  | { type: 'gap'; h: number }
  | { type: 'divider' };

export interface DocPage {
  blocks: Block[];
  annotations: Annotation[];
}

export interface PdfDocument {
  id: string;
  title: string;
  type: DocType;
  status: DocStatus;
  pages: DocPage[];
  parties: string[];
  author: string;
  createdAt: number;
  updatedAt: number;
  fileSize: string;
  source: 'sample' | 'imported' | 'created';
  signedAt?: number;
  signedBy?: string;
  certificateHash?: string;
  viewedBy?: string[];
}

export interface VersionSnapshot {
  id: string;
  documentId: string;
  version: number;
  timestamp: number;
  note: string;
  pages: DocPage[];
  annotationCount: number;
}

export interface SignatureData {
  id: string;
  name: string;
  points: Pt[]; // normalized 0..1 within a 300x120 box
  color: string;
  createdAt: number;
}

export interface BrokerProfile {
  name: string;
  brokerage: string;
  license: string;
  phone: string;
  email: string;
  agent: string;
}

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  pro: boolean;
  icon: string;
  pages: Block[][];
}

export interface TemplatePack {
  id: string;
  name: string;
  description: string;
  pro: boolean;
  templates: TemplateItem[];
}

export interface SignRequest {
  id: string;
  documentId: string;
  documentTitle: string;
  recipientEmail: string;
  recipientName: string;
  status: 'sent' | 'viewed' | 'signed';
  sentAt: number;
  signedAt?: number;
}

export type ActivityType =
  | 'created'
  | 'edited'
  | 'signed'
  | 'viewed'
  | 'commented'
  | 'shared'
  | 'version'
  | 'imported'
  | 'exported'
  | 'status'
  | 'requested';

export interface ActivityEvent {
  id: string;
  documentId: string;
  documentTitle: string;
  type: ActivityType;
  actor: string;
  message: string;
  timestamp: number;
  remote?: boolean;
}

export interface Settings {
  userName: string;
  userEmail: string;
  autosave: boolean;
  liveActivity: boolean;
  theme: 'system' | 'light' | 'dark';
}

export interface RemoteUpdate {
  docId: string;
  actor: string;
  message: string;
  at: number;
}

export interface BillingState {
  plan: 'free' | 'pro';
  exportsUsed: number;
  signaturesUsed: number;
  periodStart: number;
}

export interface AppState {
  documents: PdfDocument[];
  versions: Record<string, VersionSnapshot[]>;
  activity: ActivityEvent[];
  signatures: SignatureData[];
  settings: Settings;
  remoteUpdate: RemoteUpdate | null;
  billing: BillingState;
  broker: BrokerProfile;
  signRequests: SignRequest[];
}
