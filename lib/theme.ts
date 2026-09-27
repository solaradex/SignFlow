import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  bg: string;
  bgSoft: string;
  card: string;
  cardAlt: string;
  text: string;
  subtext: string;
  faint: string;
  border: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  coral: string;
  coralSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  purple: string;
  purpleSoft: string;
  paper: string;
  paperLine: string;
  paperText: string;
  shadow: string;
  tabBar: string;
  headerBg: string;
}

export const lightTheme: Theme = {
  dark: false,
  bg: '#F6F4EE',
  bgSoft: '#EDE9DF',
  card: '#FFFFFF',
  cardAlt: '#FBFAF6',
  text: '#1A2E35',
  subtext: '#5A6B70',
  faint: '#93A1A5',
  border: '#E4DFD3',
  primary: '#0E5F6B',
  primarySoft: '#E2EFF1',
  primaryText: '#FFFFFF',
  coral: '#E8623D',
  coralSoft: '#FBE7DF',
  success: '#1E7F4F',
  successSoft: '#DCF0E4',
  warning: '#C77E1F',
  warningSoft: '#F8ECD4',
  danger: '#C0392B',
  dangerSoft: '#F7E0DD',
  purple: '#6D4C9F',
  purpleSoft: '#ECE6F5',
  paper: '#FFFFFF',
  paperLine: '#E8E4D9',
  paperText: '#1A2E35',
  shadow: '#1A2E35',
  tabBar: '#FFFFFF',
  headerBg: '#FFFFFF',
};

export const darkTheme: Theme = {
  dark: true,
  bg: '#0E1518',
  bgSoft: '#152024',
  card: '#1A262B',
  cardAlt: '#1F2D33',
  text: '#EAF1F2',
  subtext: '#8FA3A8',
  faint: '#5F7276',
  border: '#2A3A40',
  primary: '#3FA5B5',
  primarySoft: '#16323A',
  primaryText: '#0E1518',
  coral: '#F0825F',
  coralSoft: '#3A231C',
  success: '#4CAF7D',
  successSoft: '#14301F',
  warning: '#E0A34A',
  warningSoft: '#33270F',
  danger: '#E06A5E',
  dangerSoft: '#381B18',
  purple: '#A98BD4',
  purpleSoft: '#241D38',
  paper: '#FFFFFF',
  paperLine: '#E8E4D9',
  paperText: '#1A2E35',
  shadow: '#000000',
  tabBar: '#152024',
  headerBg: '#121C20',
};

export function useSystemTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export const DOC_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  contract: { label: 'Agreement', color: '#0E5F6B', icon: 'document-text-outline' },
  lease: { label: 'Lease', color: '#6D4C9F', icon: 'business-outline' },
  closing: { label: 'Closing', color: '#C77E1F', icon: 'calculator-outline' },
  listing: { label: 'Listing', color: '#E8623D', icon: 'home-outline' },
  form: { label: 'Disclosure', color: '#1E7F4F', icon: 'shield-checkmark-outline' },
  imported: { label: 'Imported', color: '#5A6B70', icon: 'cloud-download-outline' },
};

export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#5A6B70', bg: '#EDE9DF' },
  pending: { label: 'Pending', color: '#C77E1F', bg: '#F8ECD4' },
  signed: { label: 'Signed', color: '#1E7F4F', bg: '#DCF0E4' },
  archived: { label: 'Archived', color: '#5A6B70', bg: '#EDE9DF' },
};

export const ANNOTATION_COLORS = ['#FACC15', '#E8623D', '#C0392B', '#1E7F4F', '#0E5F6B', '#6D4C9F'];
export const SIGNATURE_COLORS = ['#0E3A45', '#1A2E35', '#0E5F6B', '#7C2D12'];
