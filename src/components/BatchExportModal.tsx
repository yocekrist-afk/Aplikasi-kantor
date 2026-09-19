import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  FileText,
  Users,
} from 'lucide-react';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Participant } from '../types/ist';
import { AppSettings } from '../types/settings';

interface BatchExportModalProps {
  participants: Participant[];
  settings: AppSettings;
  onClose: () => void;
}

const SUBTEST_DETAILS: Record<string, { label: string; indoName: string }> = {
  SE: { label: 'Satzergänzung', indoName: 'Melengkapi Kalimat' },
  WA: { label: 'Wortauswahl', indoName: 'Mencari Kata Berbeda' },
  AN: { label: 'Analogien', indoName: 'Analogi Verbal' },
  GE: { label: 'Gemeinsamkeiten', indoName: 'Persamaan Konsep' },
  RA: { label: 'Rechenaufgaben', indoName: 'Hitungan Praktis' },
  ZR: { label: 'Zahlenreihen', indoName: 'Deret Angka' },
  FA: { label: 'Figurenauswahl', indoName: 'Potongan Gambar' },
  WU: { label: 'Würfelaufgaben', indoName: 'Rotasi Kubus' },
  ME: { label: 'Merkaufgaben', indoName: 'Mengingat Kata' },
};

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  participants,
  settings,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [zipBlobUrl, setZipBlobUrl] = useState<string | null>(null);
  const [zipFilename, setZipFilename] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(
    participants.length > 0 ? participants[0] : null
  );

  const total = participants.length;
  const progressPercent = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  const handleStartExport = async () => {
    if (participants.length === 0) return;
    setIsProcessing(true);
    setIsFinished(false);
    setErrorMsg(null);
    cancelRef.current = false;
    setCurrentIndex(0);

    const zip = new JSZip();

    try {
      for (let i = 0; i < participants.length; i++) {
        if (cancelRef.current) {
          setCurrentStatus('Proses dibatalkan.');
          setIsProcessing(false);
          return;
        }

        const p = participants[i];
        setCurrentIndex(i);
        setActiveParticipant(p);
        setCurrentStatus(`Memproses peserta (${i + 1}/${total}): ${p.nama}...`);

        // Wait for DOM to render the new activeParticipant
        await new Promise((resolve) => setTimeout(resolve, 150));

        if (!containerRef.current) {
          throw new Error('Elemen perender dokumen tidak tersedia.');
        }

        const page1Elem = containerRef.current.querySelector('#batch-page-1') as HTMLElement;
        const page2Elem = containerRef.current.querySelector('#batch-page-2') as HTMLElement;

        if (!page1Elem || !page2Elem) {
          throw new Error('Gagal merender halaman laporan.');
        }

        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

        const capture = async (el: HTMLElement) => {
          return await html2canvas(el, {
            scale: 1.8,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200,
            windowHeight: 4000,
          });
        };

        // Capture page 1
        const c1 = await capture(page1Elem);
        const imgData1 = c1.toDataURL('image/jpeg', 0.92);
        const h1 = (c1.height * pdfWidth) / c1.width;
        pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, Math.min(h1, pdfHeight));

        // Capture page 2
        pdf.addPage();
        const c2 = await capture(page2Elem);
        const imgData2 = c2.toDataURL('image/jpeg', 0.92);
        const h2 = (c2.height * pdfWidth) / c2.width;
        pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, Math.min(h2, pdfHeight));

        const sanitizedName = p.nama.replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedNo = p.nomorTes.replace(/[/\\?%*:|"<>]/g, '-');
        const filename = `Laporan_IST_${sanitizedName}_${sanitizedNo}.pdf`;

        const pdfBlob = pdf.output('blob');
        zip.file(filename, pdfBlob);

        setCurrentIndex(i + 1);
      }

      setCurrentStatus('Mengemas file ZIP...');
      const dateStr = new Date().toISOString().split('T')[0];
      const zipName = `Kumpulan_Laporan_IST_${total}_Peserta_${dateStr}.zip`;
      setZipFilename(zipName);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      setZipBlobUrl(url);

      // Auto-trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 2000);

      setIsFinished(true);
      setCurrentStatus('Semua laporan berhasil diekspor dan diunduh!');
    } catch (err: any) {
      console.error('Batch export error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses laporan massal.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    cancelRef.current = true;
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Unduh PDF Massal (Batch ZIP)
              </h2>
              <p className="text-xs text-slate-300">
                Ekspor seluruh berkas laporan PDF A4 dalam satu file arsip .ZIP
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm text-slate-700">
          
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-center gap-3.5">
            <Users className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                Target Peserta untuk Diekspor
              </div>
              <div className="text-sm font-semibold text-blue-900 mt-0.5">
                {total} Peserta Terpilih
              </div>
              <div className="text-[11px] text-slate-500">
                Masing-masing peserta akan dikonversi menjadi file PDF 2 halaman standar A4.
              </div>
            </div>
          </div>

          {/* Progress / Status Area */}
          {isProcessing && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  {currentStatus}
                </span>
                <span className="font-mono font-bold text-blue-600">
                  {currentIndex}/{total} ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {isFinished && zipBlobUrl && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Selesai! Berkas ZIP siap diunduh.</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Jika unduhan otomatis tidak dimulai, klik tombol di bawah untuk mengunduh arsip "{zipFilename}".
              </p>
              <a
                href={zipBlobUrl}
                download={zipFilename}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File ZIP Sekarang</span>
              </a>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Estimasi waktu: ~1-2 detik per peserta
            </span>

            <div className="flex items-center space-x-2">
              {isProcessing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
                >
                  Batalkan
                </button>
              )}
              {!isProcessing && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
                >
                  {isFinished ? 'Tutup' : 'Batal'}
                </button>
              )}
              <button
                type="button"
                onClick={handleStartExport}
                disabled={isProcessing || total === 0}
                className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isProcessing ? 'Mengekspor...' : 'Mulai Ekspor ZIP'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Render Container for Offscreen DOM Capture */}
        <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0 select-none">
          <div ref={containerRef}>
            {activeParticipant && (
              <>
                {/* Batch Page 1 */}
                <div
                  id="batch-page-1"
                  className="bg-white text-slate-800 px-7 py-5 flex flex-col justify-between"
                  style={{ width: '210mm', height: '297mm', minHeight: '297mm', maxHeight: '297mm', boxSizing: 'border-box' }}
                >
                  <div className="flex flex-col gap-2">
                    {/* Header */}
                    <div className="border-b border-blue-950 pb-2 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-950 text-white flex items-center justify-center font-serif text-xl font-bold">
                            Ψ
                          </div>
                          <div>
                            <h1 className="text-[12.5px] font-black text-blue-950 uppercase tracking-tight leading-tight">
                              Laporan Hasil Pemeriksaan Psikologis
                            </h1>
                            <p className="text-[10px] font-bold text-blue-700 tracking-wide uppercase">
                              {settings.reportSubtitle}
                            </p>
                            <p className="text-[8.5px] text-slate-500 font-medium">
                              {settings.institutionName} • {settings.institutionTagline}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[8.5px] text-slate-600 leading-tight">
                          <div className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[8px] uppercase tracking-wider mb-0.5">
                            Rahasia / Confidential
                          </div>
                          <div className="font-mono text-slate-700 font-semibold">No: {activeParticipant.nomorTes}</div>
                          <div className="text-[8px] text-slate-400">Tgl: {activeParticipant.tanggalTes} • Hal 1/2</div>
                        </div>
                      </div>
                      <div className="w-full h-0.5 bg-blue-950 mt-1.5 rounded-full"></div>
                    </div>

                    {/* Participant Demographics */}
                    <div className="grid grid-cols-12 gap-2.5 items-stretch">
                      <div className="col-span-8 bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-950 mb-1.5 pb-1 border-b border-slate-200">
                          Identitas Subjek Pemeriksaan
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          <div>
                            <span className="text-slate-500 text-[9px] block">Nama Lengkap</span>
                            <strong className="text-slate-900 text-[11px] block truncate">{activeParticipant.nama}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block">Nomor Peserta / Tes</span>
                            <span className="font-mono text-slate-800 text-[10.5px] font-semibold block">{activeParticipant.nomorTes}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block">JK / Usia</span>
                            <span className="text-slate-800 text-[10px] block">{activeParticipant.jenisKelamin} • {activeParticipant.usia}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block">Tanggal Lahir</span>
                            <span className="text-slate-800 text-[10px] block">{activeParticipant.tanggalLahir}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block">Pendidikan</span>
                            <span className="text-slate-800 text-[10px] block truncate">{activeParticipant.pendidikan}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] block">Tanggal Tes</span>
                            <span className="text-slate-800 text-[10px] block">{activeParticipant.tanggalTes}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 rounded-lg bg-blue-950 text-white p-2.5 flex flex-col justify-between items-center text-center">
                        <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">
                          Taraf Inteligensi Umum
                        </div>
                        <div className="my-1">
                          <span className="text-3xl font-black font-mono tracking-tight text-white leading-none">
                            {activeParticipant.totalIQ}
                          </span>
                          <span className="text-[9px] text-blue-300 font-bold ml-1 uppercase">IQ IST</span>
                          <div className="mt-1 px-2 py-0.5 rounded-full bg-blue-800 text-white font-bold text-[9.5px]">
                            {activeParticipant.iqCategory}
                          </div>
                        </div>
                        <div className="w-full text-[8.5px] text-blue-200 border-t border-blue-800 pt-1 flex justify-around">
                          <span>RW: <strong className="text-white">{activeParticipant.totalRaw}</strong></span>
                          <span>•</span>
                          <span>SS: <strong className="text-white">{activeParticipant.totalSS}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Subtests Table */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-[9px]">
                        <thead>
                          <tr className="bg-slate-900 text-white font-semibold">
                            <th className="py-1 px-2 text-center w-10">Kode</th>
                            <th className="py-1 px-2">Subtes & Aspek Intelektual</th>
                            <th className="py-1 px-2 text-center w-12">RW</th>
                            <th className="py-1 px-2 text-center w-12">SW</th>
                            <th className="py-1 px-2 text-center w-14">Nilai IQ</th>
                            <th className="py-1 px-2 text-center w-14">Persentil</th>
                            <th className="py-1 px-2 text-center w-24">Kategori</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeParticipant.subtestDetails.map((sub, idx) => {
                            const meta = SUBTEST_DETAILS[sub.code] || { label: sub.name, indoName: '' };
                            return (
                              <tr key={sub.code} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-t border-slate-200`}>
                                <td className="py-0.5 px-2 text-center font-mono font-bold text-blue-950">{sub.code}</td>
                                <td className="py-0.5 px-2">
                                  <span className="font-bold text-slate-900 mr-1">{meta.label}</span>
                                  <span className="text-[8px] text-slate-500">({meta.indoName})</span>
                                </td>
                                <td className="py-0.5 px-2 text-center font-mono text-slate-700">{sub.rw}</td>
                                <td className="py-0.5 px-2 text-center font-mono text-slate-700">{sub.ss}</td>
                                <td className="py-0.5 px-2 text-center font-mono font-bold text-blue-900">{sub.iq}</td>
                                <td className="py-0.5 px-2 text-center font-mono text-slate-600">{sub.percentile}%</td>
                                <td className="py-0.5 px-2 text-center">
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-semibold bg-slate-100 text-slate-800">
                                    {sub.category}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 4 Domains */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                        <div className="text-[9px] font-bold text-blue-950">VERBAL: {activeParticipant.domainSummary.verbal.averageIq}</div>
                        <div className="text-[8px] text-blue-700">{activeParticipant.domainSummary.verbal.category}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                        <div className="text-[9px] font-bold text-blue-950">NUMERIK: {activeParticipant.domainSummary.numerik.averageIq}</div>
                        <div className="text-[8px] text-blue-700">{activeParticipant.domainSummary.numerik.category}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                        <div className="text-[9px] font-bold text-blue-950">SPASIAL: {activeParticipant.domainSummary.spasial.averageIq}</div>
                        <div className="text-[8px] text-blue-700">{activeParticipant.domainSummary.spasial.category}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
                        <div className="text-[9px] font-bold text-blue-950">MEMORI: {activeParticipant.domainSummary.memori.averageIq}</div>
                        <div className="text-[8px] text-blue-700">{activeParticipant.domainSummary.memori.category}</div>
                      </div>
                    </div>

                    {/* General Narrative */}
                    <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2">
                      <div className="text-[9.5px] font-bold text-blue-950 uppercase mb-1">
                        Gambaran Umum Potensi Intelektual
                      </div>
                      <p className="text-[9px] text-slate-700 leading-relaxed text-justify">
                        {activeParticipant.generalDescription}
                      </p>
                    </div>
                  </div>

                  {/* Footer 1 */}
                  <div className="pt-1.5 border-t border-slate-300 flex justify-between items-center text-[8px] text-slate-500">
                    <span>Dokumen Asli & Rahasia • {settings.institutionName}</span>
                    <span className="font-mono">Halaman 1 dari 2</span>
                  </div>
                </div>

                {/* Batch Page 2 */}
                <div
                  id="batch-page-2"
                  className="bg-white text-slate-800 px-7 py-5 flex flex-col justify-between"
                  style={{ width: '210mm', height: '297mm', minHeight: '297mm', maxHeight: '297mm', boxSizing: 'border-box' }}
                >
                  <div className="flex flex-col gap-2">
                    {/* Header Page 2 */}
                    <div className="border-b border-blue-950 pb-2 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-950 text-white flex items-center justify-center font-serif text-xl font-bold">
                            Ψ
                          </div>
                          <div>
                            <h1 className="text-[12.5px] font-black text-blue-950 uppercase tracking-tight leading-tight">
                              Laporan Hasil Pemeriksaan Psikologis
                            </h1>
                            <p className="text-[10px] font-bold text-blue-700 tracking-wide uppercase">
                              Interpretasi Klinis, Peminatan Studi & Rekomendasi
                            </p>
                            <p className="text-[8.5px] text-slate-500 font-medium">
                              {settings.institutionName} • {settings.institutionTagline}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[8.5px] text-slate-600 leading-tight">
                          <div className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[8px] uppercase tracking-wider mb-0.5">
                            Rahasia / Confidential
                          </div>
                          <div className="font-mono text-slate-700 font-semibold">No: {activeParticipant.nomorTes}</div>
                          <div className="text-[8px] text-slate-400">Tgl: {activeParticipant.tanggalTes} • Hal 2/2</div>
                        </div>
                      </div>
                      <div className="w-full h-0.5 bg-blue-950 mt-1.5 rounded-full"></div>
                    </div>

                    {/* Strengths & Growth Areas */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-emerald-50 border border-emerald-300 rounded p-2">
                        <div className="text-[10px] font-bold text-emerald-950 uppercase mb-1">
                          Kekuatan Utama (Dominant Assets)
                        </div>
                        <div className="space-y-1">
                          {activeParticipant.strengths.slice(0, 2).map((st, i) => (
                            <div key={i} className="bg-white rounded p-1 border border-emerald-200 text-[8.5px]">
                              <div className="font-bold text-emerald-950">#{i + 1} {st.code} ({st.name.split(' ')[0]}) - IQ {st.iq}</div>
                              <p className="text-slate-700 leading-tight">{st.description || 'Kapasitas penalaran superior.'}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-300 rounded p-2">
                        <div className="text-[10px] font-bold text-amber-950 uppercase mb-1">
                          Area Pengembangan (Growth Areas)
                        </div>
                        <div className="space-y-1">
                          {activeParticipant.developmentAreas.slice(0, 2).map((ga, i) => (
                            <div key={i} className="bg-white rounded p-1 border border-amber-200 text-[8.5px]">
                              <div className="font-bold text-amber-950">#{i + 1} {ga.code} ({ga.name.split(' ')[0]}) - IQ {ga.iq}</div>
                              <p className="text-slate-700 leading-tight">{ga.recommendation || 'Perlu pembiasaan latihan berkala.'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stream Analysis */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9.5px] font-bold text-blue-950 uppercase">Analisis Peminatan Akademik (IPA vs. IPS)</span>
                        <span className="text-[9px] font-bold text-blue-900">Kecenderungan: {activeParticipant.streamAnalysis.preference}</span>
                      </div>
                      <p className="text-[9px] text-slate-700 leading-tight text-justify">
                        {activeParticipant.streamAnalysis.description}
                      </p>
                    </div>

                    {/* Faculty recommendations */}
                    <div className="border border-slate-300 rounded overflow-hidden">
                      <table className="w-full text-left border-collapse text-[8.5px]">
                        <thead>
                          <tr className="bg-slate-900 text-white font-semibold">
                            <th className="py-0.8 px-2 text-center w-8">Rank</th>
                            <th className="py-0.8 px-2">Bidang Studi / Fakultas</th>
                            <th className="py-0.8 px-2 text-center w-20">Indeks Skor</th>
                            <th className="py-0.8 px-2 text-center w-32">Kesesuaian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeParticipant.studyRecommendations.slice(0, 4).map((st, i) => (
                            <tr key={i} className="border-t border-slate-200">
                              <td className="py-0.5 px-2 text-center font-bold">#{i + 1}</td>
                              <td className="py-0.5 px-2 font-bold">{st.faculty}</td>
                              <td className="py-0.5 px-2 text-center font-mono font-bold text-blue-950">{st.matchScore}</td>
                              <td className="py-0.5 px-2 text-center text-emerald-800 font-semibold">{st.suitability}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-3 pt-2 items-end text-center">
                      <div>
                        <p className="text-[8px] text-slate-500 mb-6">Subjek Pemeriksaan,</p>
                        <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 text-[9.5px]">
                          ( {activeParticipant.nama} )
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        {settings.enableSignatureStamp && (
                          <div className="w-13 h-13 rounded-full border border-dashed border-blue-800 flex flex-col items-center justify-center text-blue-900 text-[6px] font-bold p-1">
                            <span>VERIFIED</span>
                            <span className="text-[5px] text-slate-500 font-mono">IST-70 PSYCHOMETRIC</span>
                          </div>
                        )}
                        <span className="text-[7px] text-slate-400 mt-0.5">Kota: {settings.institutionCity}</span>
                      </div>

                      <div>
                        <p className="text-[8px] text-slate-500 mb-6">Psikolog Penanggung Jawab,</p>
                        <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 text-[9.5px]">
                          {settings.psychologistName}
                        </p>
                        <p className="text-[7px] text-slate-500 font-mono leading-none mt-0.5">{settings.psychologistSipp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer 2 */}
                  <div className="pt-1.5 border-t border-slate-300 flex justify-between items-center text-[8px] text-slate-500">
                    <span>Dokumen Asli & Rahasia • {settings.institutionName}</span>
                    <span className="font-mono">Halaman 2 dari 2</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
