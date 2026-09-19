export type ReportThemeId = 'navy' | 'emerald' | 'purple' | 'crimson' | 'slate' | 'amber';

export interface ReportTheme {
  id: ReportThemeId;
  name: string;
  description: string;
  primaryDark: string;
  secondaryAccent: string;
  tertiaryAccent: string;
  accentLight: string;
  badgeBg: string;
  previewColors: string[];
}

export const REPORT_THEMES: Record<ReportThemeId, ReportTheme> = {
  navy: {
    id: 'navy',
    name: 'Navy & Cyan (Klasik IST)',
    description: 'Warna standar resmi psikotes IST dengan perpaduan biru navy dan cyan yang profesional.',
    primaryDark: '#0b2546',
    secondaryAccent: '#0088a9',
    tertiaryAccent: '#0284c7',
    accentLight: '#e0f2fe',
    badgeBg: '#0088a9',
    previewColors: ['#0b2546', '#0088a9', '#0284c7'],
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald & Mint (Hijau Akademik)',
    description: 'Nuansa hijau zamrud dan mint yang sejuk, cocok untuk institusi pendidikan dan asesmen bakat.',
    primaryDark: '#064e3b',
    secondaryAccent: '#059669',
    tertiaryAccent: '#10b981',
    accentLight: '#ecfdf5',
    badgeBg: '#059669',
    previewColors: ['#064e3b', '#059669', '#10b981'],
  },
  purple: {
    id: 'purple',
    name: 'Amethyst & Violet (Ungu Elegan)',
    description: 'Perpaduan ungu kerajaan dan violet yang elegan, berwibawa, dan modern.',
    primaryDark: '#3b0764',
    secondaryAccent: '#7c3aed',
    tertiaryAccent: '#8b5cf6',
    accentLight: '#f5f3ff',
    badgeBg: '#7c3aed',
    previewColors: ['#3b0764', '#7c3aed', '#8b5cf6'],
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson & Ruby (Merah Marun)',
    description: 'Warna marun dan ruby yang prestisius, tegas, dan bersemangat.',
    primaryDark: '#4c0519',
    secondaryAccent: '#be123c',
    tertiaryAccent: '#e11d48',
    accentLight: '#fff1f2',
    badgeBg: '#be123c',
    previewColors: ['#4c0519', '#be123c', '#e11d48'],
  },
  slate: {
    id: 'slate',
    name: 'Slate & Graphite (Monokrom Korporat)',
    description: 'Nuansa slate abu-abu arang dan baja yang netral, minimalis, dan sangat formal.',
    primaryDark: '#0f172a',
    secondaryAccent: '#334155',
    tertiaryAccent: '#475569',
    accentLight: '#f1f5f9',
    badgeBg: '#334155',
    previewColors: ['#0f172a', '#334155', '#475569'],
  },
  amber: {
    id: 'amber',
    name: 'Amber & Bronze (Emas Klasik)',
    description: 'Sentuhan warna tembaga emas hangat dan cokelat klasik yang berkelas dan eksklusif.',
    primaryDark: '#451a03',
    secondaryAccent: '#b45309',
    tertiaryAccent: '#d97706',
    accentLight: '#fffbeb',
    badgeBg: '#b45309',
    previewColors: ['#451a03', '#b45309', '#d97706'],
  },
};

export interface AppSettings {
  institutionName: string;
  institutionTagline: string;
  institutionCity: string;
  psychologistName: string;
  psychologistTitle: string;
  psychologistSipp: string;
  reportSubtitle: string;
  enableSignatureStamp: boolean;
  reportTheme?: ReportThemeId;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  institutionName: 'Lembaga Psikologi Terapan & Asesmen Potensi Akademik',
  institutionTagline: 'Standar Baku Norma IST-70 • Terakreditasi HIMPSI',
  institutionCity: 'Jakarta',
  psychologistName: 'Dra. R. Wahyuningrum, M.Psi., Psikolog',
  psychologistTitle: 'Psikolog Penanggung Jawab / Asesor Utama',
  psychologistSipp: 'SIPP: 19840315-200902-2-004',
  reportSubtitle: 'Intelligenz Struktur Test (IST-70) • Profil Bakat & Kognitif',
  enableSignatureStamp: true,
  reportTheme: 'navy',
};

const SETTINGS_STORAGE_KEY = 'psychist_pro_app_settings';

export function getStoredSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Failed to load settings from localStorage, using default:', err);
  }
  return DEFAULT_APP_SETTINGS;
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}
