import React, { useState } from 'react';
import {
  BookOpen,
  Compass,
  GraduationCap,
  Table,
  Calculator,
  Layers,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { SUBTEST_INFO, STUDY_FACULTIES, getSubtestCategory } from '../utils/istScoring';
import {
  ALL_IST_AGE_NORMS,
  AVAILABLE_NORM_AGES,
  NORM_TABLE_OPTIONS,
  TABEL_22_WECHSLER_MAP,
  WECHSLER_CLASSIFICATIONS,
  convertSsToWechslerIq,
  convertRawToStandardScoreByAge,
  convertGesamtToIqByAge,
  AgeNormTable,
} from '../data/istAgeNorms';
import { SubtestCode } from '../types/ist';

export const NormGuideView: React.FC = () => {
  const [selectedAge, setSelectedAge] = useState<number>(12);
  const [normViewMode, setNormViewMode] = useState<'subtest' | 'gesamt' | 'wechsler'>('subtest');

  // Interactive Simulator State
  const [simAge, setSimAge] = useState<number>(12);
  const [simSubtest, setSimSubtest] = useState<SubtestCode>('SE');
  const [simRw, setSimRw] = useState<number>(10);
  const [simGesamt, setSimGesamt] = useState<number>(75);
  const [simSsWechsler, setSimSsWechsler] = useState<number>(100);

  const activeNorm: AgeNormTable = ALL_IST_AGE_NORMS[selectedAge] || ALL_IST_AGE_NORMS[12];
  const subtestCodes: SubtestCode[] = ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'];
  const rawScoreRange = Array.from({ length: 21 }, (_, i) => 20 - i); // 20 down to 0

  // Calculate simulated subtest score
  const simResult = convertRawToStandardScoreByAge(simSubtest, simRw, simAge);
  const simCategory = getSubtestCategory(simResult.ss);

  // Calculate simulated gesamt score
  const simGesamtResult = convertGesamtToIqByAge(simGesamt, simAge);
  const simGesamtCategory = getSubtestCategory(simGesamtResult.totalIQ);

  // Calculate simulated wechsler score
  const simWechslerResult = convertSsToWechslerIq(simSsWechsler);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs font-serif">
              Ψ
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Panduan Psikometri & Norma Baku Resmi IST (Intelligenz Struktur Test)
              </h2>
              <p className="text-xs text-slate-500">
                Dokumentasi norma konversi usia resmi (Tabel 7 - 11), 9 subtes IST, logika penjurusan IPA/IPS, dan matriks program studi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Norma Usia Resmi Aktif
            </span>
          </div>
        </div>
      </div>

      {/* 1. OFFICIAL AGE NORM TABLES EXPLORER */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-600" />
              Katalog Tabel Norma IST Berdasarkan Kelompok Usia
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih kelompok usia di bawah untuk melihat tabel konversi Standard Score (SW) dan Total IQ (Gesamt).
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setNormViewMode('subtest')}
              className={`px-3 py-1.5 rounded-md transition ${
                normViewMode === 'subtest'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              9 Subtes (RS 0—20)
            </button>
            <button
              type="button"
              onClick={() => setNormViewMode('gesamt')}
              className={`px-3 py-1.5 rounded-md transition ${
                normViewMode === 'gesamt'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gesamt (Total RS 1—180)
            </button>
            <button
              type="button"
              onClick={() => setNormViewMode('wechsler')}
              className={`px-3 py-1.5 rounded-md transition ${
                normViewMode === 'wechsler'
                  ? 'bg-white text-purple-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabel 22: IQ Wechsler & Persentil
            </button>
          </div>
        </div>

        {/* Age Selector Tabs (Tabel 7 - 21) */}
        {normViewMode !== 'wechsler' && (
          <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-3 border-b border-slate-100 mb-5 custom-horizontal-scrollbar">
            {NORM_TABLE_OPTIONS.map((opt) => {
              const isSelected = selectedAge === opt.ageKey;
              return (
                <button
                  key={opt.ageKey}
                  type="button"
                  onClick={() => setSelectedAge(opt.ageKey)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="font-bold">Tabel {opt.tableNumber}</span>
                  <span className="ml-1 opacity-85 text-[11px]">({opt.ageRangeLabel})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Table Meta & Statistics Banner */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 mb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
            <div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 mr-2">
                Tabel {activeNorm.tableNumber}
              </span>
              <span className="font-bold text-slate-900 text-sm">{activeNorm.tableName}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200">
              Sampel Standarisasi: <span className="font-semibold text-slate-800">{activeNorm.sampleSize}</span>
            </div>
          </div>

          {/* Statistical Parameters: Mean (M) & SD (S) */}
          <div className="text-[11px] text-slate-600">
            <div className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              Parameter Statistik Normalisasi (Mean [M] & Standar Deviasi [S]):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 font-mono">
              {subtestCodes.map((code) => {
                const stat = activeNorm.stats[code];
                return (
                  <div key={code} className="bg-white p-2 rounded border border-slate-200 text-center">
                    <div className="font-bold text-slate-800 text-[11px]">{code}</div>
                    <div className="text-[10px] text-slate-500">M: {stat.mean}</div>
                    <div className="text-[10px] text-slate-500">S: {stat.sd}</div>
                  </div>
                );
              })}
              <div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
                <div className="font-bold text-blue-900 text-[11px]">GESAMT</div>
                <div className="text-[10px] text-blue-700">M: {activeNorm.stats.GESAMT.mean}</div>
                <div className="text-[10px] text-blue-700">S: {activeNorm.stats.GESAMT.sd}</div>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode 1: 9 Subtests RS -> SW Table */}
        {normViewMode === 'subtest' && (
          <div className="overflow-x-auto overflow-y-hidden border border-slate-200 rounded-lg custom-horizontal-scrollbar">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3 border-r border-slate-200 bg-slate-200/80 w-16">
                    RS (RW)
                  </th>
                  {subtestCodes.map((code) => (
                    <th key={code} className="py-2.5 px-2 border-r border-slate-200 min-w-[52px]">
                      <div>{code}</div>
                      <div className="text-[9px] text-slate-500 font-normal">SW</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {rawScoreRange.map((rs, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={rs}
                      className={`hover:bg-blue-50/60 transition-colors ${
                        isEven ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="py-1.5 px-3 font-bold border-r border-slate-200 bg-slate-100/70 text-slate-900">
                        {rs}
                      </td>
                      {subtestCodes.map((code) => {
                        const sw = activeNorm.subtestNorms[code]?.[rs] ?? '-';
                        return (
                          <td
                            key={code}
                            className={`py-1.5 px-2 border-r border-slate-100 ${
                              typeof sw === 'number' && sw >= 120
                                ? 'text-blue-700 font-bold bg-blue-50/30'
                                : typeof sw === 'number' && sw <= 85
                                ? 'text-amber-700 font-medium'
                                : 'text-slate-700'
                            }`}
                          >
                            {sw}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 2: GESAMT RS -> Total IQ Table */}
        {normViewMode === 'gesamt' && (
          <div className="max-w-2xl mx-auto overflow-x-auto overflow-y-hidden border border-slate-200 rounded-lg custom-horizontal-scrollbar">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-4 border-r border-slate-200 w-1/2">
                    Rentang Skor Mentah Total (GESAMT RS)
                  </th>
                  <th className="py-2.5 px-4 bg-blue-50 text-blue-900 w-1/2">
                    Standard Score / IQ Total IST
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {activeNorm.gesamtRanges.map((range, idx) => (
                  <tr
                    key={range.label}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="py-2 px-4 border-r border-slate-200 font-semibold text-slate-800">
                      {range.label}
                    </td>
                    <td className="py-2 px-4 font-bold text-blue-700 bg-blue-50/20">
                      {range.ss}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 3: TABEL 22 - IQ WECHSLER & PERSENTIL */}
        {normViewMode === 'wechsler' && (
          <div className="space-y-6">
            {/* Wechsler Header Banner */}
            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                    Tabel 22
                  </span>
                  <h4 className="text-sm font-bold text-purple-950">
                    Konversi Standard Score (SS) IST ke IQ Wechsler dan Persentil
                  </h4>
                </div>
                <span className="text-[11px] bg-white px-2.5 py-1 rounded-md border border-purple-200 text-purple-800 font-medium self-start sm:self-auto">
                  Berlaku Universal untuk Semua Usia
                </span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                Tabel 22 digunakan untuk mengonversikan Standard Score (SS) IST hasil tes IST ke dalam skala baku IQ Wechsler (Mean = 100, SD = 15) beserta nilai persentil kumulatif populasinya.
              </p>
            </div>

            {/* Wechsler Classifications Grid */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Matriks Penggolongan & Kategori IQ Wechsler (Norma Baku)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {WECHSLER_CLASSIFICATIONS.map((c) => (
                  <div key={c.category} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-purple-300 transition">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{c.category}</span>
                      <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        IQ {c.iqMin}{c.iqMax >= 160 ? '+' : ` - ${c.iqMax}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 mb-1">
                      <span>SS IST: <strong className="text-slate-800 font-mono">{c.ssMin}{c.ssMax >= 140 ? '+' : ` - ${c.ssMax}`}</strong></span>
                      <span>Persentil: <strong className="text-slate-800 font-mono">{c.percentileMin}% - {c.percentileMax}%</strong></span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {c.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Conversion Table */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-blue-600" />
                Tabel Konversi Lengkap SS (140 s/d 58) ➔ IQ Wechsler & Persentil
              </div>
              <div className="max-w-4xl mx-auto overflow-x-auto overflow-y-hidden border border-slate-200 rounded-lg custom-horizontal-scrollbar">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 text-[11px]">
                      <th className="py-2 px-3 border-r border-slate-200 w-24">SS IST</th>
                      <th className="py-2 px-3 border-r border-slate-200 bg-blue-50 text-blue-900 w-28">IQ Wechsler</th>
                      <th className="py-2 px-3 border-r border-slate-200 bg-purple-50 text-purple-900 w-28">Persentil (%)</th>
                      <th className="py-2 px-4 text-left">Klasifikasi / Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {Object.entries(TABEL_22_WECHSLER_MAP)
                      .map(([ssStr, val]) => ({ ss: Number(ssStr), iq: val.iq, percentile: val.percentile }))
                      .sort((a, b) => b.ss - a.ss)
                      .map((row, idx) => {
                        const classified = convertSsToWechslerIq(row.ss);
                        return (
                          <tr
                            key={row.ss}
                            className={`hover:bg-purple-50/50 transition-colors ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                            }`}
                          >
                            <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                              {row.ss}
                            </td>
                            <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-blue-700 bg-blue-50/20">
                              {row.iq}
                            </td>
                            <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-purple-700 bg-purple-50/20">
                              {row.percentile}%
                            </td>
                            <td className="py-1.5 px-4 text-left font-sans text-xs text-slate-700 font-medium">
                              {classified.category}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 2. INTERACTIVE TESTER / CALIBRATION SIMULATOR */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          Simulator Validasi Nilai & Kalibrasi Norma Cepat
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Gunakan simulator interaktif ini untuk memvalidasi hasil konversi rumus tabel dengan cepat tanpa perlu mencari manual di buku norma.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subtest Simulator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Uji Konversi Subtes (RS ➔ SW)
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                  0 — 20
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Usia Peserta:</label>
                  <select
                    value={simAge}
                    onChange={(e) => setSimAge(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {AVAILABLE_NORM_AGES.map((age) => (
                      <option key={age} value={age}>
                        {age} Tahun
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Pilih Subtes:</label>
                  <select
                    value={simSubtest}
                    onChange={(e) => setSimSubtest(e.target.value as SubtestCode)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {subtestCodes.map((code) => (
                      <option key={code} value={code}>
                        {code} ({SUBTEST_INFO[code].name.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Skor Mentah (RS):</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={simRw}
                    onChange={(e) => setSimRw(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Subtest Result Display */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tabel Norma Terpakai</div>
                <div className="text-xs font-semibold text-slate-800">{simResult.normTable.tableName}</div>
                <div className="text-[11px] text-slate-500">{SUBTEST_INFO[simSubtest].name}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Standard Score (SW)</div>
                <div className="text-xl font-mono font-extrabold text-blue-700">{simResult.ss}</div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {simCategory}
                </span>
              </div>
            </div>
          </div>

          {/* GESAMT Simulator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Uji Konversi GESAMT (Total RS ➔ IQ)
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded">
                  0 — 180
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Usia Peserta:</label>
                  <select
                    value={simAge}
                    onChange={(e) => setSimAge(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {AVAILABLE_NORM_AGES.map((age) => (
                      <option key={age} value={age}>
                        {age} Tahun
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Total RS (GESAMT):</label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={simGesamt}
                    onChange={(e) => setSimGesamt(Math.max(0, Math.min(180, Number(e.target.value) || 0)))}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* GESAMT Result Display */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tabel Norma Terpakai</div>
                <div className="text-xs font-semibold text-slate-800">{simGesamtResult.normTable.tableName}</div>
                <div className="text-[11px] text-slate-500">GESAMT Total Skor RS</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total IQ IST</div>
                <div className="text-xl font-mono font-extrabold text-purple-700">{simGesamtResult.totalIQ}</div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {simGesamtCategory}
                </span>
              </div>
            </div>
          </div>

          {/* Wechsler Tabel 22 Simulator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Uji Tabel 22 (SS ➔ IQ Wechsler)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                  Semua Usia
                </span>
              </div>

              <div className="mb-3">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Standard Score IST (SS):</label>
                <input
                  type="number"
                  min={50}
                  max={150}
                  value={simSsWechsler}
                  onChange={(e) => setSimSsWechsler(Math.max(40, Math.min(160, Number(e.target.value) || 0)))}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-md p-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none font-mono"
                  placeholder="Contoh: 100"
                />
              </div>
            </div>

            {/* Wechsler Result Display */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tabel 22 Wechsler</div>
                <div className="text-xs font-semibold text-slate-800">{simWechslerResult.category}</div>
                <div className="text-[11px] text-purple-700 font-semibold">Persentil: {simWechslerResult.percentile}%</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">IQ Wechsler</div>
                <div className="text-xl font-mono font-extrabold text-emerald-700">{simWechslerResult.iq}</div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  SS: {simWechslerResult.ss}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUBTEST DETAIL GRID */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Deskripsi 9 Subtes IST & Aspek Psikologis yang Diukur
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(SUBTEST_INFO).map(([code, info]) => (
            <div key={code} className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                    {code}
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    Ranah {info.domain}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 mb-1">{info.name}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{info.aspect}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 text-[10.5px] text-slate-400 flex justify-between font-medium">
                <span>Skor Maks: {code === 'GE' ? '32 (RS: 20)' : '20'}</span>
                <span>Standar Rata-rata: 100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ACADEMIC STREAMING & FACULTY MATCHING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Aturan Peminatan IPA vs IPS */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            Aturan Peminatan Akademik (IPA vs. IPS)
          </h3>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Sistem menganalisis perbandingan performa kognitif subjek dengan membandingkan rata-rata klaster eksakta dan sosial:
          </p>

          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3.5">
              <div className="text-xs font-semibold text-blue-900 mb-1">
                Arah Peminatan IPA (Eksakta / Sains & Teknologi)
              </div>
              <p className="text-xs text-slate-600 mb-2">
                Cenderung menonjol jika subjek memiliki skor lebih tinggi pada 4 subtes:
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px] font-semibold text-blue-800">
                <span className="px-2 py-0.5 bg-blue-100/60 rounded">RA (Hitungan)</span>
                <span className="px-2 py-0.5 bg-blue-100/60 rounded">ZR (Deret Angka)</span>
                <span className="px-2 py-0.5 bg-blue-100/60 rounded">FA (Bentuk)</span>
                <span className="px-2 py-0.5 bg-blue-100/60 rounded">WU (Kubus 3D)</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3.5">
              <div className="text-xs font-semibold text-amber-900 mb-1">
                Arah Peminatan IPS (Sosial, Humaniora & Bisnis)
              </div>
              <p className="text-xs text-slate-600 mb-2">
                Cenderung menonjol jika subjek memiliki skor lebih tinggi pada 4 subtes:
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px] font-semibold text-amber-800">
                <span className="px-2 py-0.5 bg-amber-100/60 rounded">SE (Kalimat)</span>
                <span className="px-2 py-0.5 bg-amber-100/60 rounded">WA (Kata Berbeda)</span>
                <span className="px-2 py-0.5 bg-amber-100/60 rounded">GE (Dua Pengertian)</span>
                <span className="px-2 py-0.5 bg-amber-100/60 rounded">ME (Memori)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Matriks 11 Bidang Studi */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Matriks 11 Bidang Studi & Subtes Penentu
          </h3>
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Fakultas / Bidang Studi</th>
                  <th className="py-2.5 px-3">Subtes Kunci Penentu</th>
                  <th className="py-2.5 px-3 text-center">Benchmark IQ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {STUDY_FACULTIES.map((fac, idx) => (
                  <tr
                    key={fac.faculty}
                    className={`hover:bg-slate-50/60 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                  >
                    <td className="py-2 px-3 font-medium text-slate-800">{fac.faculty}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-blue-600 font-medium">
                      {fac.requiredSubtests.join(', ')}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 font-semibold">
                      ≥ {fac.benchmark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
