export type Gender = 'L' | 'P';

export type SubtestCode = 'SE' | 'WA' | 'AN' | 'GE' | 'RA' | 'ZR' | 'FA' | 'WU' | 'ME';

export interface RawScores {
  SE: number; // 0 - 20
  WA: number; // 0 - 20
  AN: number; // 0 - 20
  GE: number; // 0 - 20 (max 32 or 20)
  RA: number; // 0 - 20
  ZR: number; // 0 - 20
  FA: number; // 0 - 20
  WU: number; // 0 - 20
  ME: number; // 0 - 20
}

export interface SubtestScoreDetail {
  code: SubtestCode;
  name: string;
  measuredAspect: string;
  rw: number; // Raw Score
  ss: number; // Standard Score / Standard Weighted (SW)
  iq: number; // Converted Subtest IQ
  percentile: number; // 1 - 99
  category: 'Sangat Rendah' | 'Rendah' | 'Rata-rata Bawah' | 'Rata-rata' | 'Rata-rata Atas' | 'Tinggi' | 'Sangat Tinggi';
}

export interface DomainSummary {
  verbal: {
    averageIq: number;
    category: string;
    subtests: SubtestCode[];
    description: string;
  };
  numerik: {
    averageIq: number;
    category: string;
    subtests: SubtestCode[];
    description: string;
  };
  spasial: {
    averageIq: number;
    category: string;
    subtests: SubtestCode[];
    description: string;
  };
  memori: {
    averageIq: number;
    category: string;
    subtests: SubtestCode[];
    description: string;
  };
}

export interface StudyRecommendation {
  faculty: string;
  requiredSubtests: SubtestCode[];
  isMatch: boolean;
  matchScore: number; // percentage or score matching
  suitability: 'Sangat Sesuai' | 'Sesuai' | 'Cukup' | 'Kurang';
}

export interface StreamAnalysis {
  preference: 'IPA' | 'IPS' | 'Seimbang';
  description: string;
  ipaScore: number;
  ipsScore: number;
  highlightAspects: string[];
}

export interface Participant {
  id: string;
  nomorTes: string;
  nama: string;
  jenisKelamin: Gender;
  tanggalLahir: string;
  tanggalTes: string;
  usia: string | number;
  pendidikan: string;
  asalSekolahInstitusi?: string;
  rawScores: RawScores;
  // Processed values
  subtestDetails: SubtestScoreDetail[];
  totalRaw: number;
  totalSS: number;
  totalIQ: number;
  iqCategory: string;
  domainSummary: DomainSummary;
  streamAnalysis: StreamAnalysis;
  studyRecommendations: StudyRecommendation[];
  strengths: SubtestScoreDetail[];
  developmentAreas: SubtestScoreDetail[];
  generalDescription: string;
  recommendations: string[];
  learningStrategies: string[];
  normApplied?: string;
}
