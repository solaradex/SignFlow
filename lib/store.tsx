import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityEvent,
  ActivityType,
  Annotation,
  AppState,
  BillingState,
  BrokerProfile,
  DocPage,
  PdfDocument,
  RemoteUpdate,
  Settings,
  SignatureData,
  SignRequest,
  TemplateItem,
  TemplatePack,
  VersionSnapshot,
} from './types';
import { buildActivitySeed, buildSampleDocuments, buildSignatureSeed, buildTemplatePacks } from './templates';
import { fingerprint, uid } from './utils';

const STORAGE_KEY = 'signflow_state_v1';

// Freemium limits
export const FREE_EXPORT_LIMIT = 2;
export const FREE_SIGN_LIMIT = 3;
export const PERIOD_MS = 7 * 24 * 3600 * 1000; // 7-day rolling window

function freshBilling(): BillingState {
  return { plan: 'free', exportsUsed: 0, signaturesUsed: 0, periodStart: Date.now() };
}

function seedState(): AppState {
  const documents = buildSampleDocuments();
  const signatures: SignatureData[] = [
    {
      id: uid(),
      name: 'My signature',
      points: buildSignatureSeed(),
      color: '#1E3A8A',
      createdAt: Date.now() - 5 * 86400000,
    },
  ];
  return {
    documents,
    versions: {},
    activity: buildActivitySeed(documents),
    signatures,
    settings: {
      userName: 'Alex Morgan',
      userEmail: 'alex@northwindlabs.com',
      autosave: true,
      liveActivity: true,
      theme: 'system',
    },
    remoteUpdate: null,
    billing: freshBilling(),
    broker: {
      name: 'SunCoast Realty Group',
      brokerage: 'SunCoast Realty Group LLC',
      license: 'FL Lic. #CQ1048821',
      phone: '(305) 555-0142',
      email: 'agent@suncoastrealty.com',
      agent: 'Alex Morgan',
    },
    signRequests: [],
  };
}

type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'ADD_DOC'; doc: PdfDocument }
  | { type: 'UPDATE_DOC'; doc: PdfDocument; versionNote?: string }
  | { type: 'DELETE_DOC'; docId: string }
  | { type: 'SIGN_DOC'; docId: string; signer: string; hash: string }
  | { type: 'RESTORE_VERSION'; docId: string; version: VersionSnapshot }
  | { type: 'ADD_ACTIVITY'; event: ActivityEvent }
  | { type: 'SAVE_SIGNATURE'; sig: SignatureData }
  | { type: 'DELETE_SIGNATURE'; id: string }
  | { type: 'SET_SETTINGS'; patch: Partial<Settings> }
  | { type: 'SET_REMOTE'; update: RemoteUpdate | null }
  | { type: 'UPGRADE_PRO' }
  | { type: 'CONSUME_EXPORT' }
  | { type: 'CONSUME_SIGNATURE' }
  | { type: 'ADD_SIGN_REQUEST'; req: SignRequest }
  | { type: 'UPDATE_SIGN_REQUEST'; id: string; patch: Partial<SignRequest> }
  | { type: 'CLEAR_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'ADD_DOC':
      return { ...state, documents: [action.doc, ...state.documents] };
    case 'UPDATE_DOC': {
      const docs = state.documents.map((d) => (d.id === action.doc.id ? action.doc : d));
      let versions = state.versions;
      if (action.versionNote) {
        const existing = versions[action.doc.id] ?? [];
        const annotationCount = action.doc.pages.reduce((n, p) => n + p.annotations.length, 0);
        const snap: VersionSnapshot = {
          id: uid(),
          documentId: action.doc.id,
          version: existing.length + 1,
          timestamp: Date.now(),
          note: action.versionNote,
          pages: action.doc.pages,
          annotationCount,
        };
        versions = { ...versions, [action.doc.id]: [snap, ...existing].slice(0, 40) };
      }
      return { ...state, documents: docs, versions };
    }
    case 'DELETE_DOC': {
      const versions = { ...state.versions };
      delete versions[action.docId];
      return {
        ...state,
        documents: state.documents.filter((d) => d.id !== action.docId),
        versions,
        activity: state.activity.filter((a) => a.documentId !== action.docId),
      };
    }
    case 'SIGN_DOC': {
      const docs = state.documents.map((d) =>
        d.id === action.docId
          ? {
              ...d,
              status: 'signed' as const,
              signedAt: Date.now(),
              signedBy: action.signer,
              certificateHash: action.hash,
              updatedAt: Date.now(),
            }
          : d
      );
      return { ...state, documents: docs };
    }
    case 'RESTORE_VERSION': {
      const docs = state.documents.map((d) =>
        d.id === action.docId ? { ...d, pages: action.version.pages, updatedAt: Date.now() } : d
      );
      return { ...state, documents: docs };
    }
    case 'ADD_ACTIVITY':
      return { ...state, activity: [action.event, ...state.activity].slice(0, 200) };
    case 'SAVE_SIGNATURE': {
      const exists = state.signatures.find((s) => s.id === action.sig.id);
      const signatures = exists
        ? state.signatures.map((s) => (s.id === action.sig.id ? action.sig : s))
        : [action.sig, ...state.signatures];
      return { ...state, signatures };
    }
    case 'DELETE_SIGNATURE':
      return { ...state, signatures: state.signatures.filter((s) => s.id !== action.id) };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'SET_REMOTE':
      return { ...state, remoteUpdate: action.update };
    case 'UPGRADE_PRO':
      return { ...state, billing: { ...state.billing, plan: 'pro' } };
    case 'CONSUME_EXPORT': {
      const b = state.billing;
      const rolled = Date.now() - b.periodStart > PERIOD_MS;
      const base = rolled ? freshBilling() : b;
      return { ...state, billing: { ...base, exportsUsed: base.exportsUsed + 1 } };
    }
    case 'CONSUME_SIGNATURE': {
      const b = state.billing;
      const rolled = Date.now() - b.periodStart > PERIOD_MS;
      const base = rolled ? freshBilling() : b;
      return { ...state, billing: { ...base, signaturesUsed: base.signaturesUsed + 1 } };
    }
    case 'ADD_SIGN_REQUEST':
      return { ...state, signRequests: [action.req, ...state.signRequests] };
    case 'UPDATE_SIGN_REQUEST':
      return {
        ...state,
        signRequests: state.signRequests.map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)),
      };
    case 'CLEAR_ALL':
      return seedState();
    default:
      return state;
  }
}

interface StoreApi {
  state: AppState;
  hydrated: boolean;
  getDocument: (id: string) => PdfDocument | undefined;
  addDocument: (doc: PdfDocument, activityMessage?: string) => void;
  updateDocument: (doc: PdfDocument, versionNote?: string) => void;
  deleteDocument: (docId: string) => void;
  signDocument: (docId: string, signer: string) => void;
  restoreVersion: (docId: string, version: VersionSnapshot) => void;
  logActivity: (ev: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  saveSignature: (sig: SignatureData) => void;
  deleteSignature: (id: string) => void;
  updateSettings: (patch: Partial<AppState['settings']>) => void;
  dismissRemoteUpdate: () => void;
  resetAll: () => void;
  upgradeToPro: () => void;
  canExport: () => boolean;
  canSign: () => boolean;
  consumeExport: () => void;
  consumeSignature: () => void;
  requestSignature: (docId: string, recipientName: string, recipientEmail: string) => void;
  createFromTemplate: (tpl: TemplateItem) => PdfDocument;
  templatePacks: TemplatePack[];
}

const StoreContext = createContext<StoreApi | null>(null);

const SIM_ACTORS = ['Sarah Kim', 'Marcus Chen', 'Priya Patel', 'David Osei', 'Legal Team'];
const SIM_TEMPLATES: { type: ActivityEvent['type']; message: (title: string) => string }[] = [
  { type: 'viewed', message: () => 'viewed the document' },
  { type: 'viewed', message: () => 'opened the document on their phone' },
  { type: 'commented', message: () => 'commented: "Looks good, one small tweak on page 1"' },
  { type: 'commented', message: () => 'commented: "Can we revise the payment terms?"' },
  { type: 'shared', message: () => 'shared the document with a new reviewer' },
  { type: 'edited', message: () => 'updated the document metadata' },
  { type: 'status', message: () => 'moved the document to review' },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seedState);
  const [hydrated, setHydrated] = React.useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppState;
          if (parsed && Array.isArray(parsed.documents)) {
            dispatch({ type: 'HYDRATE', state: parsed });
          }
        }
      } catch {
        // corrupted storage -> keep seed
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist (debounced)
  useEffect(() => {
    if (!hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current)).catch(() => {});
    }, 600);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [state, hydrated]);

  // Live activity simulation — auto-updating feed
  useEffect(() => {
    if (!hydrated || !state.settings.liveActivity) return;
    const interval = setInterval(() => {
      const s = stateRef.current;
      const candidates = s.documents.filter((d) => d.status !== 'archived');
      if (!candidates.length) return;
      const doc = candidates[Math.floor(Math.random() * candidates.length)];
      const actor = SIM_ACTORS[Math.floor(Math.random() * SIM_ACTORS.length)];
      const tpl = SIM_TEMPLATES[Math.floor(Math.random() * SIM_TEMPLATES.length)];
      dispatch({
        type: 'ADD_ACTIVITY',
        event: {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          documentId: doc.id,
          documentTitle: doc.title,
          type: tpl.type,
          actor,
          message: tpl.message(doc.title),
          timestamp: Date.now(),
          remote: true,
        },
      });
      // Occasionally flag a remote update banner for the touched doc
      if (Math.random() < 0.35) {
        dispatch({
          type: 'SET_REMOTE',
          update: {
            docId: doc.id,
            actor,
            message: `${actor} ${tpl.type === 'viewed' ? 'viewed' : 'updated'} this document`,
            at: Date.now(),
          },
        });
      }
    }, 34000);
    return () => clearInterval(interval);
  }, [hydrated, state.settings.liveActivity]);

  const getDocument = useCallback((id: string) => stateRef.current.documents.find((d) => d.id === id), []);

  const api = useMemo<StoreApi>(() => ({
    state,
    hydrated,
    getDocument,
    addDocument: (doc, activityMessage) => {
      dispatch({ type: 'ADD_DOC', doc });
      dispatch({
        type: 'ADD_ACTIVITY',
        event: {
          id: `${Date.now()}-a`,
          documentId: doc.id,
          documentTitle: doc.title,
          type: doc.source === 'imported' ? 'imported' : 'created',
          actor: 'You',
          message: activityMessage ?? (doc.source === 'imported' ? 'imported the document' : 'created the document'),
          timestamp: Date.now(),
        },
      });
    },
    updateDocument: (doc, versionNote) => dispatch({ type: 'UPDATE_DOC', doc, versionNote }),
    deleteDocument: (docId) => {
      dispatch({ type: 'DELETE_DOC', docId });
    },
    signDocument: (docId, signer) => {
      const doc = stateRef.current.documents.find((d) => d.id === docId);
      const hash = fingerprint(`${docId}:${signer}:${Date.now()}:${doc ? doc.pages.length : 0}`);
      dispatch({ type: 'SIGN_DOC', docId, signer, hash });
      dispatch({
        type: 'ADD_ACTIVITY',
        event: {
          id: `${Date.now()}-s`,
          documentId: docId,
          documentTitle: doc?.title ?? 'Document',
          type: 'signed',
          actor: signer,
          message: 'signed the document electronically',
          timestamp: Date.now(),
        },
      });
    },
    restoreVersion: (docId, version) => {
      const doc = stateRef.current.documents.find((d) => d.id === docId);
      dispatch({ type: 'RESTORE_VERSION', docId, version });
      dispatch({
        type: 'ADD_ACTIVITY',
        event: {
          id: `${Date.now()}-r`,
          documentId: docId,
          documentTitle: doc?.title ?? 'Document',
          type: 'version',
          actor: 'You',
          message: `restored version ${version.version}`,
          timestamp: Date.now(),
        },
      });
    },
    logActivity: (ev) =>
      dispatch({
        type: 'ADD_ACTIVITY',
        event: { ...ev, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() },
      }),
    saveSignature: (sig) => dispatch({ type: 'SAVE_SIGNATURE', sig }),
    deleteSignature: (id) => dispatch({ type: 'DELETE_SIGNATURE', id }),
    updateSettings: (patch) => dispatch({ type: 'SET_SETTINGS', patch }),
    dismissRemoteUpdate: () => dispatch({ type: 'SET_REMOTE', update: null }),
    resetAll: () => dispatch({ type: 'CLEAR_ALL' }),
    upgradeToPro: () => dispatch({ type: 'UPGRADE_PRO' }),
    canExport: () => {
      const b = stateRef.current.billing;
      if (b.plan === 'pro') return true;
      const rolled = Date.now() - b.periodStart > PERIOD_MS;
      return rolled || b.exportsUsed < FREE_EXPORT_LIMIT;
    },
    canSign: () => {
      const b = stateRef.current.billing;
      if (b.plan === 'pro') return true;
      const rolled = Date.now() - b.periodStart > PERIOD_MS;
      return rolled || b.signaturesUsed < FREE_SIGN_LIMIT;
    },
    consumeExport: () => dispatch({ type: 'CONSUME_EXPORT' }),
    consumeSignature: () => dispatch({ type: 'CONSUME_SIGNATURE' }),
    requestSignature: (docId, recipientName, recipientEmail) => {
      const doc = stateRef.current.documents.find((d) => d.id === docId);
      const req: SignRequest = {
        id: uid(),
        documentId: docId,
        documentTitle: doc?.title ?? 'Document',
        recipientEmail,
        recipientName,
        status: 'sent',
        sentAt: Date.now(),
      };
      dispatch({ type: 'ADD_SIGN_REQUEST', req });
      dispatch({
        type: 'ADD_ACTIVITY',
        event: {
          id: `${Date.now()}-rq`,
          documentId: docId,
          documentTitle: doc?.title ?? 'Document',
          type: 'requested',
          actor: 'You',
          message: `sent a signature request to ${recipientName} (${recipientEmail})`,
          timestamp: Date.now(),
        },
      });
    },
    createFromTemplate: (tpl) => {
      const pages: DocPage[] = tpl.pages.map((blocks) => ({ blocks, annotations: [] }));
      const doc: PdfDocument = {
        id: uid(),
        title: tpl.title,
        type: 'form',
        status: 'draft',
        pages,
        parties: [stateRef.current.broker.brokerage],
        author: stateRef.current.broker.agent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        fileSize: '—',
        source: 'created',
      };
      dispatch({ type: 'ADD_DOC', doc });
      dispatch({
        type: 'ADD_ACTIVITY',
        event: {
          id: `${Date.now()}-tpl`,
          documentId: doc.id,
          documentTitle: doc.title,
          type: 'created',
          actor: 'You',
          message: `created "${doc.title}" from a template`,
          timestamp: Date.now(),
        },
      });
      return doc;
    },
    templatePacks: buildTemplatePacks(),
  }), [state, hydrated, getDocument]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
