import { SubtestCode } from '../types/ist';
import {
  TABEL_12_USIA_17,
  TABEL_13_USIA_18,
  TABEL_14_USIA_19_20,
  TABEL_15_USIA_21_25,
  TABEL_16_USIA_26_30,
} from './istAgeNorms12to16';
import {
  TABEL_17_USIA_31_35,
  TABEL_18_USIA_36_40,
  TABEL_19_USIA_41_45,
  TABEL_20_USIA_46_50,
  TABEL_21_USIA_51_60,
} from './istAgeNorms17to21';

export {
  TABEL_12_USIA_17,
  TABEL_13_USIA_18,
  TABEL_14_USIA_19_20,
  TABEL_15_USIA_21_25,
  TABEL_16_USIA_26_30,
  TABEL_17_USIA_31_35,
  TABEL_18_USIA_36_40,
  TABEL_19_USIA_41_45,
  TABEL_20_USIA_46_50,
  TABEL_21_USIA_51_60,
};

export * from './istWechslerNorms';

export interface AgeNormStats {
  mean: number;
  sd: number;
}

export interface AgeNormTable {
  tableNumber: number;
  tableName: string;
  age: number;
  sampleSize: string;
  subtestOrder: SubtestCode[];
  stats: Record<SubtestCode, AgeNormStats> & { GESAMT: AgeNormStats };
  subtestNorms: Record<SubtestCode, Record<number, number>>; // RS (0-20) -> SS
  gesamtRanges: Array<{
    minRs: number;
    maxRs: number;
    ss: number;
    label: string;
  }>;
}

/**
 * TABEL 7: Usia 12 Tahun (N => 500)
 */
export const TABEL_7_USIA_12: AgeNormTable = {
  tableNumber: 7,
  tableName: 'Tabel 7. Norma IST untuk Usia 12 Tahun',
  age: 12,
  sampleSize: 'N = > 500',
  subtestOrder: ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'],
  stats: {
    SE: { mean: 6.5, sd: 2.5 },
    WA: { mean: 7.1, sd: 2.4 },
    AN: { mean: 5.8, sd: 2.6 },
    GE: { mean: 7.5, sd: 3.2 },
    RA: { mean: 6.1, sd: 2.9 },
    ZR: { mean: 6.0, sd: 3.4 },
    FA: { mean: 7.5, sd: 3.2 },
    WU: { mean: 7.5, sd: 3.2 },
    ME: { mean: 6.7, sd: 3.4 },
    GESAMT: { mean: 59, sd: 18 },
  },
  subtestNorms: {
    SE: { 20: 134, 19: 134, 18: 134, 17: 134, 16: 134, 15: 134, 14: 130, 13: 126, 12: 122, 11: 118, 10: 114, 9: 110, 8: 106, 7: 102, 6: 98, 5: 94, 4: 90, 3: 86, 2: 82, 1: 78, 0: 74 },
    WA: { 20: 133, 19: 133, 18: 133, 17: 133, 16: 133, 15: 133, 14: 129, 13: 125, 12: 120, 11: 116, 10: 112, 9: 108, 8: 104, 7: 100, 6: 95, 5: 91, 4: 87, 3: 83, 2: 79, 1: 75, 0: 70 },
    AN: { 20: 135, 19: 135, 18: 135, 17: 135, 16: 135, 15: 135, 14: 132, 13: 128, 12: 124, 11: 120, 10: 116, 9: 112, 8: 108, 7: 105, 6: 101, 5: 97, 4: 93, 3: 89, 2: 85, 1: 82, 0: 78 },
    GE: { 20: 133, 19: 133, 18: 133, 17: 130, 16: 127, 15: 123, 14: 120, 13: 117, 12: 114, 11: 111, 10: 108, 9: 105, 8: 102, 7: 98, 6: 95, 5: 92, 4: 89, 3: 86, 2: 83, 1: 80, 0: 77 },
    RA: { 20: 133, 19: 133, 18: 133, 17: 133, 16: 133, 15: 133, 14: 129, 13: 126, 12: 122, 11: 118, 10: 114, 9: 111, 8: 107, 7: 103, 6: 100, 5: 96, 4: 92, 3: 89, 2: 85, 1: 81, 0: 77 },
    ZR: { 20: 133, 19: 133, 18: 133, 17: 133, 16: 133, 15: 130, 14: 127, 13: 123, 12: 120, 11: 117, 10: 113, 9: 110, 8: 107, 7: 103, 6: 100, 5: 97, 4: 93, 3: 90, 2: 87, 1: 83, 0: 80 },
    FA: { 20: 134, 19: 134, 18: 134, 17: 134, 16: 130, 15: 127, 14: 123, 13: 120, 12: 116, 11: 113, 10: 109, 9: 105, 8: 102, 7: 98, 6: 95, 5: 91, 4: 88, 3: 84, 2: 80, 1: 77, 0: 74 },
    WU: { 20: 133, 19: 133, 18: 133, 17: 130, 16: 127, 15: 123, 14: 120, 13: 117, 12: 114, 11: 111, 10: 108, 9: 105, 8: 102, 7: 98, 6: 95, 5: 92, 4: 89, 3: 86, 2: 83, 1: 80, 0: 77 },
    ME: { 20: 133, 19: 133, 18: 133, 17: 130, 16: 127, 15: 124, 14: 121, 13: 119, 12: 116, 11: 113, 10: 110, 9: 107, 8: 104, 7: 101, 6: 98, 5: 95, 4: 92, 3: 89, 2: 86, 1: 83, 0: 80 },
  },
  gesamtRanges: [
    { minRs: 171, maxRs: 180, ss: 139, label: '171—180' },
    { minRs: 161, maxRs: 170, ss: 139, label: '161—170' },
    { minRs: 151, maxRs: 160, ss: 139, label: '151—160' },
    { minRs: 141, maxRs: 150, ss: 139, label: '141—150' },
    { minRs: 131, maxRs: 140, ss: 139, label: '131—140' },
    { minRs: 121, maxRs: 130, ss: 139, label: '121—130' },
    { minRs: 111, maxRs: 120, ss: 133, label: '111—120' },
    { minRs: 101, maxRs: 110, ss: 127, label: '101—110' },
    { minRs: 91, maxRs: 100, ss: 121, label: '91—100' },
    { minRs: 81, maxRs: 90, ss: 115, label: '81—90' },
    { minRs: 71, maxRs: 80, ss: 109, label: '71—80' },
    { minRs: 61, maxRs: 70, ss: 104, label: '61—70' },
    { minRs: 51, maxRs: 60, ss: 98, label: '51—60' },
    { minRs: 41, maxRs: 50, ss: 92, label: '41—50' },
    { minRs: 31, maxRs: 40, ss: 86, label: '31—40' },
    { minRs: 21, maxRs: 30, ss: 80, label: '21—30' },
    { minRs: 11, maxRs: 20, ss: 74, label: '11—20' },
    { minRs: 1, maxRs: 10, ss: 68, label: '1—10' },
  ],
};

/**
 * TABEL 8: Usia 13 Tahun (N => 1000)
 */
export const TABEL_8_USIA_13: AgeNormTable = {
  tableNumber: 8,
  tableName: 'Tabel 8. Norma IST untuk Usia 13 Tahun',
  age: 13,
  sampleSize: 'N = > 1000',
  subtestOrder: ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'],
  stats: {
    SE: { mean: 7.1, sd: 2.5 },
    WA: { mean: 7.7, sd: 2.5 },
    AN: { mean: 7.2, sd: 2.5 },
    GE: { mean: 7.0, sd: 2.8 },
    RA: { mean: 7.0, sd: 2.9 },
    ZR: { mean: 6.5, sd: 3.4 },
    FA: { mean: 7.9, sd: 3.2 },
    WU: { mean: 8.0, sd: 3.2 },
    ME: { mean: 7.4, sd: 3.5 },
    GESAMT: { mean: 65, sd: 18 },
  },
  subtestNorms: {
    SE: { 20: 134, 19: 134, 18: 134, 17: 134, 16: 134, 15: 130, 14: 127, 13: 123, 12: 119, 11: 115, 10: 111, 9: 107, 8: 103, 7: 100, 6: 96, 5: 92, 4: 88, 3: 84, 2: 80, 1: 77, 0: 73 },
    WA: { 20: 133, 19: 133, 18: 133, 17: 133, 16: 133, 15: 129, 14: 125, 13: 121, 12: 117, 11: 113, 10: 109, 9: 105, 8: 101, 7: 97, 6: 93, 5: 89, 4: 85, 3: 81, 2: 77, 1: 73, 0: 69 },
    AN: { 20: 132, 19: 132, 18: 132, 17: 132, 16: 132, 15: 132, 14: 129, 13: 125, 12: 121, 11: 117, 10: 114, 9: 110, 8: 106, 7: 103, 6: 99, 5: 95, 4: 91, 3: 88, 2: 84, 1: 80, 0: 77 },
    GE: { 20: 132, 19: 132, 18: 132, 17: 132, 16: 132, 15: 129, 14: 125, 13: 121, 12: 118, 11: 114, 10: 111, 9: 107, 8: 104, 7: 100, 6: 97, 5: 93, 4: 89, 3: 86, 2: 82, 1: 79, 0: 75 },
    RA: { 20: 134, 19: 134, 18: 134, 17: 134, 16: 131, 15: 128, 14: 124, 13: 121, 12: 117, 11: 114, 10: 110, 9: 107, 8: 103, 7: 100, 6: 97, 5: 93, 4: 90, 3: 86, 2: 83, 1: 79, 0: 76 },
    ZR: { 20: 134, 19: 134, 18: 134, 17: 131, 16: 128, 15: 125, 14: 122, 13: 119, 12: 116, 11: 113, 10: 110, 9: 107, 8: 104, 7: 101, 6: 99, 5: 96, 4: 93, 3: 90, 2: 87, 1: 84, 0: 81 },
    FA: { 20: 135, 19: 135, 18: 132, 17: 128, 16: 125, 15: 122, 14: 119, 13: 116, 12: 113, 11: 110, 10: 107, 9: 103, 8: 100, 7: 97, 6: 94, 5: 91, 4: 88, 3: 85, 2: 82, 1: 78, 0: 75 },
    WU: { 20: 134, 19: 134, 18: 131, 17: 128, 16: 125, 15: 122, 14: 119, 13: 116, 12: 113, 11: 109, 10: 106, 9: 103, 8: 100, 7: 97, 6: 94, 5: 91, 4: 88, 3: 84, 2: 81, 1: 78, 0: 75 },
    ME: { 20: 133, 19: 133, 18: 130, 17: 127, 16: 125, 15: 122, 14: 119, 13: 116, 12: 113, 11: 110, 10: 107, 9: 105, 8: 102, 7: 101, 6: 96, 5: 93, 4: 90, 3: 87, 2: 85, 1: 82, 0: 79 },
  },
  gesamtRanges: [
    { minRs: 171, maxRs: 180, ss: 133, label: '171—180' },
    { minRs: 161, maxRs: 170, ss: 133, label: '161—170' },
    { minRs: 151, maxRs: 160, ss: 133, label: '151—160' },
    { minRs: 141, maxRs: 150, ss: 133, label: '141—150' },
    { minRs: 131, maxRs: 140, ss: 133, label: '131—140' },
    { minRs: 121, maxRs: 130, ss: 133, label: '121—130' },
    { minRs: 111, maxRs: 120, ss: 128, label: '111—120' },
    { minRs: 101, maxRs: 110, ss: 122, label: '101—110' },
    { minRs: 91, maxRs: 100, ss: 117, label: '91—100' },
    { minRs: 81, maxRs: 90, ss: 111, label: '81—90' },
    { minRs: 71, maxRs: 80, ss: 106, label: '71—80' },
    { minRs: 61, maxRs: 70, ss: 100, label: '61—70' },
    { minRs: 51, maxRs: 60, ss: 94, label: '51—60' },
    { minRs: 41, maxRs: 50, ss: 89, label: '41—50' },
    { minRs: 31, maxRs: 40, ss: 83, label: '31—40' },
    { minRs: 21, maxRs: 30, ss: 78, label: '21—30' },
    { minRs: 11, maxRs: 20, ss: 72, label: '11—20' },
    { minRs: 1, maxRs: 10, ss: 67, label: '1—10' },
  ],
};

/**
 * TABEL 9: Usia 14 Tahun (N => 1000)
 */
export const TABEL_9_USIA_14: AgeNormTable = {
  tableNumber: 9,
  tableName: 'Tabel 9. Norma IST untuk Usia 14 Tahun',
  age: 14,
  sampleSize: 'N = > 1000',
  subtestOrder: ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'],
  stats: {
    SE: { mean: 7.7, sd: 2.7 },
    WA: { mean: 8.2, sd: 2.8 },
    AN: { mean: 6.8, sd: 3.0 },
    GE: { mean: 7.6, sd: 2.9 },
    RA: { mean: 7.5, sd: 2.8 },
    ZR: { mean: 7.1, sd: 3.5 },
    FA: { mean: 8.4, sd: 3.1 },
    WU: { mean: 8.4, sd: 2.9 },
    ME: { mean: 8.0, sd: 3.4 },
    GESAMT: { mean: 70, sd: 19 },
  },
  subtestNorms: {
    SE: { 20: 134, 19: 134, 18: 134, 17: 134, 16: 131, 15: 127, 14: 123, 13: 120, 12: 116, 11: 112, 10: 109, 9: 105, 8: 101, 7: 97, 6: 94, 5: 90, 4: 86, 3: 83, 2: 79, 1: 75, 0: 71 },
    WA: { 20: 131, 19: 131, 18: 131, 17: 131, 16: 127, 15: 124, 14: 121, 13: 117, 12: 114, 11: 110, 10: 106, 9: 103, 8: 99, 7: 96, 6: 92, 5: 89, 4: 85, 3: 81, 2: 78, 1: 74, 0: 71 },
    AN: { 20: 132, 19: 132, 18: 132, 17: 132, 16: 132, 15: 128, 14: 125, 13: 121, 12: 118, 11: 115, 10: 111, 9: 108, 8: 104, 7: 101, 6: 97, 5: 94, 4: 90, 3: 87, 2: 83, 1: 80, 0: 77 },
    GE: { 20: 132, 19: 132, 18: 132, 17: 132, 16: 129, 15: 126, 14: 122, 13: 119, 12: 115, 11: 112, 10: 108, 9: 105, 8: 101, 7: 97, 6: 94, 5: 91, 4: 88, 3: 84, 2: 81, 1: 77, 0: 74 },
    RA: { 20: 134, 19: 134, 18: 134, 17: 134, 16: 130, 15: 127, 14: 123, 13: 120, 12: 116, 11: 113, 10: 109, 9: 105, 8: 102, 7: 98, 6: 95, 5: 91, 4: 88, 3: 84, 2: 80, 1: 77, 0: 73 },
    ZR: { 20: 131, 19: 131, 18: 131, 17: 129, 16: 125, 15: 123, 14: 120, 13: 117, 12: 114, 11: 111, 10: 108, 9: 105, 8: 103, 7: 100, 6: 97, 5: 94, 4: 91, 3: 88, 2: 85, 1: 83, 0: 80 },
    FA: { 20: 131, 19: 131, 18: 131, 17: 128, 16: 125, 15: 121, 14: 118, 13: 115, 12: 112, 11: 108, 10: 105, 9: 102, 8: 99, 7: 95, 6: 92, 5: 89, 4: 86, 3: 83, 2: 79, 1: 76, 0: 73 },
    WU: { 20: 133, 19: 133, 18: 133, 17: 130, 16: 126, 15: 123, 14: 119, 13: 116, 12: 112, 11: 109, 10: 106, 9: 102, 8: 99, 7: 95, 6: 92, 5: 88, 4: 85, 3: 81, 2: 78, 1: 74, 0: 71 },
    ME: { 20: 129, 19: 129, 18: 129, 17: 126, 16: 124, 15: 121, 14: 118, 13: 115, 12: 112, 11: 109, 10: 106, 9: 103, 8: 100, 7: 97, 6: 94, 5: 91, 4: 88, 3: 85, 2: 82, 1: 79, 0: 76 },
  },
  gesamtRanges: [
    { minRs: 171, maxRs: 180, ss: 134, label: '171—180' },
    { minRs: 161, maxRs: 170, ss: 134, label: '161—170' },
    { minRs: 151, maxRs: 160, ss: 134, label: '151—160' },
    { minRs: 141, maxRs: 150, ss: 134, label: '141—150' },
    { minRs: 131, maxRs: 140, ss: 134, label: '131—140' },
    { minRs: 121, maxRs: 130, ss: 129, label: '121—130' },
    { minRs: 111, maxRs: 120, ss: 124, label: '111—120' },
    { minRs: 101, maxRs: 110, ss: 118, label: '101—110' },
    { minRs: 91, maxRs: 100, ss: 113, label: '91—100' },
    { minRs: 81, maxRs: 90, ss: 108, label: '81—90' },
    { minRs: 71, maxRs: 80, ss: 103, label: '71—80' },
    { minRs: 61, maxRs: 70, ss: 97, label: '61—70' },
    { minRs: 51, maxRs: 60, ss: 92, label: '51—60' },
    { minRs: 41, maxRs: 50, ss: 87, label: '41—50' },
    { minRs: 31, maxRs: 40, ss: 82, label: '31—40' },
    { minRs: 21, maxRs: 30, ss: 76, label: '21—30' },
    { minRs: 11, maxRs: 20, ss: 71, label: '11—20' },
    { minRs: 1, maxRs: 10, ss: 66, label: '1—10' },
  ],
};

/**
 * TABEL 10: Usia 15 Tahun (N => 1000)
 */
export const TABEL_10_USIA_15: AgeNormTable = {
  tableNumber: 10,
  tableName: 'Tabel 10. Norma IST untuk Usia 15 Tahun',
  age: 15,
  sampleSize: 'N = > 1000',
  subtestOrder: ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'],
  stats: {
    SE: { mean: 8.6, sd: 2.9 },
    WA: { mean: 9.0, sd: 2.9 },
    AN: { mean: 7.5, sd: 3.5 },
    GE: { mean: 8.4, sd: 2.9 },
    RA: { mean: 8.4, sd: 3.2 },
    ZR: { mean: 8.2, sd: 3.7 },
    FA: { mean: 8.8, sd: 3.5 },
    WU: { mean: 8.7, sd: 2.9 },
    ME: { mean: 9.0, sd: 3.8 },
    GESAMT: { mean: 70, sd: 19 },
  },
  subtestNorms: {
    SE: { 20: 132, 19: 132, 18: 132, 17: 129, 16: 126, 15: 123, 14: 119, 13: 115, 12: 112, 11: 108, 10: 105, 9: 101, 8: 98, 7: 94, 6: 91, 5: 88, 4: 84, 3: 81, 2: 77, 1: 74, 0: 70 },
    WA: { 20: 131, 19: 131, 18: 131, 17: 128, 16: 124, 15: 121, 14: 117, 13: 114, 12: 110, 11: 107, 10: 103, 9: 100, 8: 97, 7: 93, 6: 90, 5: 86, 4: 83, 3: 79, 2: 76, 1: 72, 0: 69 },
    AN: { 20: 133, 19: 133, 18: 130, 17: 127, 16: 124, 15: 121, 14: 119, 13: 116, 12: 113, 11: 110, 10: 107, 9: 104, 8: 101, 7: 99, 6: 96, 5: 93, 4: 90, 3: 87, 2: 84, 1: 81, 0: 79 },
    GE: { 20: 133, 19: 133, 18: 133, 17: 130, 16: 126, 15: 123, 14: 119, 13: 116, 12: 112, 11: 109, 10: 106, 9: 102, 8: 99, 7: 95, 6: 92, 5: 88, 4: 85, 3: 81, 2: 78, 1: 74, 0: 71 },
    RA: { 20: 133, 19: 133, 18: 130, 17: 127, 16: 124, 15: 121, 14: 118, 13: 114, 12: 111, 11: 108, 10: 105, 9: 102, 8: 99, 7: 96, 6: 93, 5: 89, 4: 86, 3: 83, 2: 80, 1: 77, 0: 74 },
    ZR: { 20: 132, 19: 129, 18: 126, 17: 124, 16: 121, 15: 118, 14: 116, 13: 113, 12: 110, 11: 108, 10: 105, 9: 102, 8: 99, 7: 97, 6: 94, 5: 91, 4: 89, 3: 86, 2: 83, 1: 81, 0: 78 },
    FA: { 20: 132, 19: 129, 18: 126, 17: 123, 16: 121, 15: 118, 14: 115, 13: 112, 12: 109, 11: 106, 10: 103, 9: 101, 8: 98, 7: 95, 6: 92, 5: 89, 4: 86, 3: 83, 2: 81, 1: 78, 0: 75 },
    WU: { 20: 132, 19: 132, 18: 132, 17: 129, 16: 125, 15: 122, 14: 118, 13: 115, 12: 111, 11: 108, 10: 104, 9: 101, 8: 98, 7: 94, 6: 91, 5: 87, 4: 84, 3: 80, 2: 77, 1: 73, 0: 70 },
    ME: { 20: 129, 19: 126, 18: 124, 17: 121, 16: 118, 15: 113, 14: 111, 13: 108, 12: 105, 11: 103, 10: 100, 9: 97, 8: 95, 7: 92, 6: 89, 5: 87, 4: 84, 3: 82, 2: 79, 1: 76, 0: 73 },
  },
  gesamtRanges: [
    { minRs: 171, maxRs: 180, ss: 134, label: '171—180' },
    { minRs: 161, maxRs: 170, ss: 134, label: '161—170' },
    { minRs: 151, maxRs: 160, ss: 134, label: '151—160' },
    { minRs: 141, maxRs: 150, ss: 134, label: '141—150' },
    { minRs: 131, maxRs: 140, ss: 129, label: '131—140' },
    { minRs: 121, maxRs: 130, ss: 124, label: '121—130' },
    { minRs: 111, maxRs: 120, ss: 119, label: '111—120' },
    { minRs: 101, maxRs: 110, ss: 114, label: '101—110' },
    { minRs: 91, maxRs: 100, ss: 109, label: '91—100' },
    { minRs: 81, maxRs: 90, ss: 104, label: '81—90' },
    { minRs: 71, maxRs: 80, ss: 99, label: '71—80' },
    { minRs: 61, maxRs: 70, ss: 94, label: '61—70' },
    { minRs: 51, maxRs: 60, ss: 89, label: '51—60' },
    { minRs: 41, maxRs: 50, ss: 84, label: '41—50' },
    { minRs: 31, maxRs: 40, ss: 79, label: '31—40' },
    { minRs: 21, maxRs: 30, ss: 74, label: '21—30' },
    { minRs: 11, maxRs: 20, ss: 69, label: '11—20' },
    { minRs: 1, maxRs: 10, ss: 64, label: '1—10' },
  ],
};

/**
 * TABEL 11: Usia 16 Tahun (N => 1000)
 */
export const TABEL_11_USIA_16: AgeNormTable = {
  tableNumber: 11,
  tableName: 'Tabel 11. Norma IST untuk Usia 16 Tahun',
  age: 16,
  sampleSize: 'N = > 1000',
  subtestOrder: ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'],
  stats: {
    SE: { mean: 9.5, sd: 3.0 },
    WA: { mean: 9.5, sd: 3.0 },
    AN: { mean: 8.7, sd: 3.5 },
    GE: { mean: 9.0, sd: 3.2 },
    RA: { mean: 8.8, sd: 3.3 },
    ZR: { mean: 8.7, sd: 3.9 },
    FA: { mean: 9.2, sd: 3.6 },
    WU: { mean: 9.1, sd: 3.2 },
    ME: { mean: 10.1, sd: 3.7 },
    GESAMT: { mean: 70, sd: 19 },
  },
  subtestNorms: {
    SE: { 20: 132, 19: 132, 18: 128, 17: 125, 16: 122, 15: 118, 14: 115, 13: 112, 12: 108, 11: 105, 10: 102, 9: 98, 8: 95, 7: 92, 6: 88, 5: 85, 4: 82, 3: 78, 2: 75, 1: 72, 0: 68 },
    WA: { 20: 132, 19: 132, 18: 128, 17: 125, 16: 122, 15: 118, 14: 115, 13: 112, 12: 108, 11: 105, 10: 102, 9: 98, 8: 95, 7: 92, 6: 88, 5: 85, 4: 82, 3: 78, 2: 75, 1: 72, 0: 68 },
    AN: { 20: 132, 19: 129, 18: 127, 17: 124, 16: 121, 15: 118, 14: 115, 13: 112, 12: 109, 11: 107, 10: 104, 9: 101, 8: 98, 7: 95, 6: 92, 5: 89, 4: 87, 3: 84, 2: 81, 1: 78, 0: 75 },
    GE: { 20: 131, 19: 131, 18: 128, 17: 125, 16: 122, 15: 119, 14: 116, 13: 113, 12: 109, 11: 106, 10: 103, 9: 100, 8: 97, 7: 94, 6: 91, 5: 88, 4: 84, 3: 81, 2: 78, 1: 75, 0: 72 },
    RA: { 20: 134, 19: 131, 18: 128, 17: 125, 16: 122, 15: 119, 14: 116, 13: 113, 12: 110, 11: 107, 10: 104, 9: 101, 8: 98, 7: 95, 6: 92, 5: 88, 4: 85, 3: 82, 2: 79, 1: 76, 0: 73 },
    ZR: { 20: 129, 19: 126, 18: 124, 17: 121, 16: 119, 15: 116, 14: 114, 13: 111, 12: 108, 11: 106, 10: 103, 9: 101, 8: 98, 7: 96, 6: 93, 5: 91, 4: 88, 3: 85, 2: 83, 1: 80, 0: 78 },
    FA: { 20: 130, 19: 127, 18: 124, 17: 122, 16: 119, 15: 116, 14: 113, 13: 111, 12: 108, 11: 105, 10: 102, 9: 99, 8: 97, 7: 94, 6: 91, 5: 88, 4: 86, 3: 83, 2: 80, 1: 77, 0: 74 },
    WU: { 20: 134, 19: 131, 18: 128, 17: 125, 16: 122, 15: 118, 14: 115, 13: 112, 12: 109, 11: 106, 10: 103, 9: 100, 8: 97, 7: 93, 6: 90, 5: 87, 4: 84, 3: 81, 2: 78, 1: 75, 0: 72 },
    ME: { 20: 127, 19: 124, 18: 121, 17: 119, 16: 116, 15: 113, 14: 111, 13: 108, 12: 105, 11: 102, 10: 100, 9: 97, 8: 94, 7: 92, 6: 89, 5: 86, 4: 84, 3: 81, 2: 78, 1: 75, 0: 73 },
  },
  gesamtRanges: [
    { minRs: 171, maxRs: 180, ss: 134, label: '171—180' },
    { minRs: 161, maxRs: 170, ss: 134, label: '161—170' },
    { minRs: 151, maxRs: 160, ss: 134, label: '151—160' },
    { minRs: 141, maxRs: 150, ss: 130, label: '141—150' },
    { minRs: 131, maxRs: 140, ss: 125, label: '131—140' },
    { minRs: 121, maxRs: 130, ss: 120, label: '121—130' },
    { minRs: 111, maxRs: 120, ss: 115, label: '111—120' },
    { minRs: 101, maxRs: 110, ss: 110, label: '101—110' },
    { minRs: 91, maxRs: 100, ss: 106, label: '91—100' },
    { minRs: 81, maxRs: 90, ss: 101, label: '81—90' },
    { minRs: 71, maxRs: 80, ss: 96, label: '71—80' },
    { minRs: 61, maxRs: 70, ss: 91, label: '61—70' },
    { minRs: 51, maxRs: 60, ss: 87, label: '51—60' },
    { minRs: 41, maxRs: 50, ss: 82, label: '41—50' },
    { minRs: 31, maxRs: 40, ss: 77, label: '31—40' },
    { minRs: 21, maxRs: 30, ss: 72, label: '21—30' },
    { minRs: 11, maxRs: 20, ss: 68, label: '11—20' },
    { minRs: 1, maxRs: 10, ss: 63, label: '1—10' },
  ],
};

/**
 * Daftar semua tabel norma usia resmi IST (Tabel 7 - 21) yang tersimpan dalam sistem
 */
export const ALL_IST_AGE_NORMS: Record<number, AgeNormTable> = {
  12: TABEL_7_USIA_12,
  13: TABEL_8_USIA_13,
  14: TABEL_9_USIA_14,
  15: TABEL_10_USIA_15,
  16: TABEL_11_USIA_16,
  17: TABEL_12_USIA_17,
  18: TABEL_13_USIA_18,
  19: TABEL_14_USIA_19_20,
  21: TABEL_15_USIA_21_25,
  26: TABEL_16_USIA_26_30,
  31: TABEL_17_USIA_31_35,
  36: TABEL_18_USIA_36_40,
  41: TABEL_19_USIA_41_45,
  46: TABEL_20_USIA_46_50,
  51: TABEL_21_USIA_51_60,
};

export const AVAILABLE_NORM_AGES = [12, 13, 14, 15, 16, 17, 18, 19, 21, 26, 31, 36, 41, 46, 51] as const;

export interface NormTableOption {
  ageKey: number;
  tableNumber: number;
  tableName: string;
  ageRangeLabel: string;
  sampleSize: string;
  table: AgeNormTable;
}

export const NORM_TABLE_OPTIONS: NormTableOption[] = [
  { ageKey: 12, tableNumber: 7, tableName: 'Tabel 7. Usia 12 Tahun', ageRangeLabel: '≤ 12 Tahun', sampleSize: 'N = > 500', table: TABEL_7_USIA_12 },
  { ageKey: 13, tableNumber: 8, tableName: 'Tabel 8. Usia 13 Tahun', ageRangeLabel: '13 Tahun', sampleSize: 'N = > 500', table: TABEL_8_USIA_13 },
  { ageKey: 14, tableNumber: 9, tableName: 'Tabel 9. Usia 14 Tahun', ageRangeLabel: '14 Tahun', sampleSize: 'N = > 500', table: TABEL_9_USIA_14 },
  { ageKey: 15, tableNumber: 10, tableName: 'Tabel 10. Usia 15 Tahun', ageRangeLabel: '15 Tahun', sampleSize: 'N = > 500', table: TABEL_10_USIA_15 },
  { ageKey: 16, tableNumber: 11, tableName: 'Tabel 11. Usia 16 Tahun', ageRangeLabel: '16 Tahun', sampleSize: 'N = > 500', table: TABEL_11_USIA_16 },
  { ageKey: 17, tableNumber: 12, tableName: 'Tabel 12. Usia 17 Tahun', ageRangeLabel: '17 Tahun', sampleSize: 'N = > 1000', table: TABEL_12_USIA_17 },
  { ageKey: 18, tableNumber: 13, tableName: 'Tabel 13. Usia 18 Tahun', ageRangeLabel: '18 Tahun', sampleSize: 'N = > 1000', table: TABEL_13_USIA_18 },
  { ageKey: 19, tableNumber: 14, tableName: 'Tabel 14. Usia 19 - 20 Tahun', ageRangeLabel: '19 - 20 Tahun', sampleSize: 'N = > 1000', table: TABEL_14_USIA_19_20 },
  { ageKey: 21, tableNumber: 15, tableName: 'Tabel 15. Usia 21 - 25 Tahun', ageRangeLabel: '21 - 25 Tahun', sampleSize: 'N = > 1000', table: TABEL_15_USIA_21_25 },
  { ageKey: 26, tableNumber: 16, tableName: 'Tabel 16. Usia 26 - 30 Tahun', ageRangeLabel: '26 - 30 Tahun', sampleSize: 'N = > 1000', table: TABEL_16_USIA_26_30 },
  { ageKey: 31, tableNumber: 17, tableName: 'Tabel 17. Usia 31 - 35 Tahun', ageRangeLabel: '31 - 35 Tahun', sampleSize: 'N = > 1000', table: TABEL_17_USIA_31_35 },
  { ageKey: 36, tableNumber: 18, tableName: 'Tabel 18. Usia 36 - 40 Tahun', ageRangeLabel: '36 - 40 Tahun', sampleSize: 'N = > 1000', table: TABEL_18_USIA_36_40 },
  { ageKey: 41, tableNumber: 19, tableName: 'Tabel 19. Usia 41 - 45 Tahun', ageRangeLabel: '41 - 45 Tahun', sampleSize: 'N = > 1000', table: TABEL_19_USIA_41_45 },
  { ageKey: 46, tableNumber: 20, tableName: 'Tabel 20. Usia 46 - 50 Tahun', ageRangeLabel: '46 - 50 Tahun', sampleSize: 'N = > 1000', table: TABEL_20_USIA_46_50 },
  { ageKey: 51, tableNumber: 21, tableName: 'Tabel 21. Usia 51 - 60 Tahun', ageRangeLabel: '51 - 60 Tahun', sampleSize: 'N = > 500', table: TABEL_21_USIA_51_60 },
];

/**
 * Helper untuk mem-parsing usia dari string/number
 * Contoh: "14 Tahun" -> 14, "15 Thn" -> 15, 13 -> 13
 */
export function parseAgeNumber(ageInput?: string | number | null): number {
  if (ageInput === undefined || ageInput === null || ageInput === '') {
    return 15; // default ke 15 tahun jika kosong
  }
  if (typeof ageInput === 'number') {
    return Math.round(ageInput);
  }
  const match = String(ageInput).match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return 15;
}

/**
 * Mendapatkan Tabel Norma IST yang paling sesuai berdasarkan usia (Tabel 7 - 21)
 */
export function getAgeNormTable(ageInput?: string | number | null): AgeNormTable {
  const age = parseAgeNumber(ageInput);
  if (age <= 12) return TABEL_7_USIA_12;
  if (age === 13) return TABEL_8_USIA_13;
  if (age === 14) return TABEL_9_USIA_14;
  if (age === 15) return TABEL_10_USIA_15;
  if (age === 16) return TABEL_11_USIA_16;
  if (age === 17) return TABEL_12_USIA_17;
  if (age === 18) return TABEL_13_USIA_18;
  if (age >= 19 && age <= 20) return TABEL_14_USIA_19_20;
  if (age >= 21 && age <= 25) return TABEL_15_USIA_21_25;
  if (age >= 26 && age <= 30) return TABEL_16_USIA_26_30;
  if (age >= 31 && age <= 35) return TABEL_17_USIA_31_35;
  if (age >= 36 && age <= 40) return TABEL_18_USIA_36_40;
  if (age >= 41 && age <= 45) return TABEL_19_USIA_41_45;
  if (age >= 46 && age <= 50) return TABEL_20_USIA_46_50;
  return TABEL_21_USIA_51_60; // >= 51 Tahun
}

/**
 * Konversi Raw Score (0-20) ke Standard Score (SS / SW) berdasarkan Norma Usia
 */
export function convertRawToStandardScoreByAge(
  subtest: SubtestCode,
  rw: number,
  ageInput?: string | number | null
): { ss: number; normTable: AgeNormTable } {
  const normTable = getAgeNormTable(ageInput);
  const clampedRw = Math.max(0, Math.min(20, Math.round(rw)));
  const subtestMap = normTable.subtestNorms[subtest];
  const ss = subtestMap?.[clampedRw] ?? 100;
  return { ss, normTable };
}

/**
 * Konversi GESAMT (Total Raw Score 0-180) ke Total IQ / Standard Score berdasarkan Norma Usia
 */
export function convertGesamtToIqByAge(
  totalRaw: number,
  ageInput?: string | number | null
): { totalIQ: number; normTable: AgeNormTable } {
  const normTable = getAgeNormTable(ageInput);
  const clampedTotal = Math.max(0, Math.min(180, Math.round(totalRaw)));

  // Cari rentang gesamt
  for (const range of normTable.gesamtRanges) {
    if (clampedTotal >= range.minRs && clampedTotal <= range.maxRs) {
      return { totalIQ: range.ss, normTable };
    }
  }

  // Fallback jika < 1
  if (clampedTotal <= 0) {
    const lowest = normTable.gesamtRanges[normTable.gesamtRanges.length - 1];
    return { totalIQ: lowest?.ss ?? 63, normTable };
  }

  // Fallback jika > 180
  const highest = normTable.gesamtRanges[0];
  return { totalIQ: highest?.ss ?? 138, normTable };
}

// Re-export Wechsler Tabel 22 norms and utilities
export * from './istWechslerNorms';

