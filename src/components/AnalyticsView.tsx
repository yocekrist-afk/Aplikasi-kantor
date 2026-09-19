import React from 'react';
import {
  BarChart3,
  Users,
  Compass,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Brain,
} from 'lucide-react';
import { Participant, SubtestCode } from '../types/ist';
import { SUBTEST_INFO, STUDY_FACULTIES } from '../utils/istScoring';

interface AnalyticsViewProps {
  participants: Participant[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ participants }) => {
  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
        <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-base font-medium text-slate-600">Belum ada data peserta untuk dianalisis.</p>
        <p className="text-xs text-slate-400 mt-1">
          Silakan unggah file Excel atau muat data contoh demo terlebih dahulu.
        </p>
      </div>
    );
  }

  // Aggregate Metrics
  const total = participants.length;
  const avgIq = Math.round(participants.reduce((acc, curr) => acc + curr.totalIQ, 0) / total);

  // Stream counts
  const ipaCount = participants.filter((p) => p.streamAnalysis.preference === 'IPA').length;
  const ipsCount = participants.filter((p) => p.streamAnalysis.preference === 'IPS').length;
  const seimbangCount = participants.filter((p) => p.streamAnalysis.preference === 'Seimbang').length;

  // Domain averages
  const avgVerbal = Math.round(
    participants.reduce((acc, curr) => acc + curr.domainSummary.verbal.averageIq, 0) / total
  );
  const avgNumerik = Math.round(
    participants.reduce((acc, curr) => acc + curr.domainSummary.numerik.averageIq, 0) / total
  );
  const avgSpasial = Math.round(
    participants.reduce((acc, curr) => acc + curr.domainSummary.spasial.averageIq, 0) / total
  );
  const avgMemori = Math.round(
    participants.reduce((acc, curr) => acc + curr.domainSummary.memori.averageIq, 0) / total
  );

  // Subtest averages
  const subtestCodes: SubtestCode[] = ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'];
  const subtestAverages = subtestCodes.map((code) => {
    const sum = participants.reduce((acc, p) => {
      const sub = p.subtestDetails.find((s) => s.code === code);
      return acc + (sub ? sub.iq : 100);
    }, 0);
    return {
      code,
      name: SUBTEST_INFO[code].name.split(' (')[0],
      aspect: SUBTEST_INFO[code].aspect,
      avg: Math.round(sum / total),
    };
  });

  // Top study matches across cohort
  const facultyMatches = STUDY_FACULTIES.map((fac) => {
    const matchCount = participants.reduce((acc, p) => {
      const rec = p.studyRecommendations.find((r) => r.faculty === fac.faculty);
      return acc + (rec?.isMatch ? 1 : 0);
    }, 0);
    return {
      faculty: fac.faculty,
      matchCount,
      percentage: Math.round((matchCount / total) * 100),
    };
  }).sort((a, b) => b.matchCount - a.matchCount);

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards (Professional Polish Design Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-sm font-medium">Total Peserta</div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900 font-mono">{total}</div>
          <div className="text-xs text-slate-500 font-medium mt-2 flex items-center justify-between">
            <span>L: {participants.filter((p) => p.jenisKelamin === 'L').length}</span>
            <span>•</span>
            <span>P: {participants.filter((p) => p.jenisKelamin === 'P').length}</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">100% Valid</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-sm font-medium">Rata-rata IQ Kohor</div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900 font-mono">{avgIq}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">
            {avgIq >= 110 ? 'Kategori Rata-rata Atas' : avgIq >= 90 ? 'Kategori Rata-rata Normal' : 'Kategori Rata-rata Bawah'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-sm font-medium">Distribusi Peminatan</div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900 font-mono flex items-baseline gap-2">
            <span>IPA: {ipaCount}</span>
            <span className="text-sm font-normal text-slate-400">/</span>
            <span className="text-amber-800">IPS: {ipsCount}</span>
          </div>
          <div className="text-xs text-blue-600 font-semibold mt-2">
            Dominan: {ipaCount > ipsCount ? 'Eksakta / Sains' : ipsCount > ipaCount ? 'Sosial & Humaniora' : 'Seimbang'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-sm font-medium">Kategori Cerdas (≥120)</div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900 font-mono">
            {participants.filter((p) => p.totalIQ >= 120).length}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">
            {Math.round((participants.filter((p) => p.totalIQ >= 120).length / total) * 100)}% dari total kohor
          </div>
        </div>
      </div>

      {/* Grid: 4 Domains & Subtest Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Domain Comparison */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Rata-rata 4 Ranah Kemampuan Kohor
          </h3>

          <div className="space-y-4">
            {[
              { label: 'Verbal (SE, WA, AN, GE)', score: avgVerbal, color: 'bg-blue-600' },
              { label: 'Numerik (RA, ZR)', score: avgNumerik, color: 'bg-indigo-600' },
              { label: 'Spasial / Figural (FA, WU)', score: avgSpasial, color: 'bg-cyan-600' },
              { label: 'Memori Kata (ME)', score: avgMemori, color: 'bg-violet-600' },
            ].map((domain) => (
              <div key={domain.label}>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-slate-700">{domain.label}</span>
                  <span className="font-mono font-bold text-slate-900">{domain.score} IQ</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${domain.color} rounded-full transition-all duration-500`}
                    style={{
                      width: `${Math.min(100, Math.max(10, ((domain.score - 70) / (130 - 70)) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Ranah dengan performa tertinggi kohor ini adalah{' '}
            <strong className="text-slate-800">
              {
                [
                  { name: 'Verbal', s: avgVerbal },
                  { name: 'Numerik', s: avgNumerik },
                  { name: 'Spasial', s: avgSpasial },
                  { name: 'Memori', s: avgMemori },
                ].sort((a, b) => b.s - a.s)[0].name
              }
            </strong>
            .
          </div>
        </div>

        {/* 9 Subtest Score Averages */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Distribusi Rata-rata 9 Subtes IST
          </h3>

          <div className="grid grid-cols-3 gap-2.5">
            {subtestAverages.map((sub) => (
              <div key={sub.code} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-blue-600 font-mono text-xs">{sub.code}</span>
                  <span className="font-mono font-bold text-xs text-slate-900">{sub.avg}</span>
                </div>
                <div className="text-[11px] font-medium text-slate-800 truncate" title={sub.name}>
                  {sub.name}
                </div>
                <div className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5" title={sub.aspect}>
                  {sub.aspect}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            *Garis tengah rata-rata populasi standar IST adalah 100. Nilai di atas 100 menandakan keunggulan di atas rata-rata.
          </div>
        </div>
      </div>

      {/* Faculty Match Ranking */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          Tingkat Kecocokan Fakultas / Bidang Studi dalam Kohor
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {facultyMatches.map((item) => (
            <div key={item.faculty} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
              <div className="text-xs font-semibold text-slate-900 mb-1">{item.faculty}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Kecocokan:</span>
                <span className="font-bold text-blue-600 font-mono">
                  {item.matchCount} / {total} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
