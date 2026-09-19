import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Download,
  Printer,
  X,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  User,
  GraduationCap,
  Brain,
  Scale,
  Search,
  BookOpen,
  Award,
  BarChart3,
  Target,
  FileCheck2,
  Lock,
  Palette,
  Check,
} from 'lucide-react';
import { Participant } from '../types/ist';
import { AppSettings, DEFAULT_APP_SETTINGS, REPORT_THEMES, ReportThemeId } from '../types/settings';
import { downloadReportAsHtml } from '../utils/htmlExport';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SUBTEST_META: Record<string, { code: string; name: string; aspect: string; color: string; domain: string }> = {
  SE: { code: 'SE', name: 'Melengkapi Kalimat', aspect: 'Berpikir konkret-praktis, logis, common sense, pengambilan keputusan, pemaknaan realita.', color: '#0284c7', domain: 'Verbal' },
  WA: { code: 'WA', name: 'Persamaan Kata', aspect: 'Pemahaman bahasa, rasa bahasa, menangkap inti informasi.', color: '#0088a9', domain: 'Verbal' },
  AN: { code: 'AN', name: 'Analogi Verbal', aspect: 'Menemukan hubungan, fleksibilitas berpikir, penalaran dan kesimpulan.', color: '#059669', domain: 'Verbal' },
  GE: { code: 'GE', name: 'Sifat yang Sama', aspect: 'Abstraksi verbal, pembentukan konsep, berpikir logis.', color: '#10b981', domain: 'Verbal' },
  RA: { code: 'RA', name: 'Berhitung', aspect: 'Berpikir matematis, logis-objektif, pemecahan masalah hitungan.', color: '#0284c7', domain: 'Numerik' },
  ZR: { code: 'ZR', name: 'Deret Angka', aspect: 'Penalaran induktif angka, berpikir teoritis, kelincahan berpikir.', color: '#f59e0b', domain: 'Numerik' },
  FA: { code: 'FA', name: 'Memilih Gambar', aspect: 'Kemampuan membayangkan, mengamati, berpikir menyeluruh dan konstruktif.', color: '#f97316', domain: 'Spasial' },
  WU: { code: 'WU', name: 'Kubus', aspect: 'Daya bayang ruang, konstruktif-teknis, analisis visual-spasial.', color: '#8b5cf6', domain: 'Spasial' },
  ME: { code: 'ME', name: 'Ingatan', aspect: 'Atensi, konsentrasi, kemampuan mengingat informasi.', color: '#ec4899', domain: 'Memori' },
};

interface ReportPreviewProps {
  participant: Participant;
  participantsList?: Participant[];
  settings?: AppSettings;
  onSelectParticipant?: (participant: Participant) => void;
  onClose: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  participant,
  participantsList = [],
  settings,
  onSelectParticipant,
  onClose,
}) => {
  const activeSettings = useMemo(() => settings || DEFAULT_APP_SETTINGS, [settings]);

  const [selectedThemeId, setSelectedThemeId] = useState<ReportThemeId>(
    activeSettings.reportTheme || 'navy'
  );
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    if (activeSettings.reportTheme) {
      setSelectedThemeId(activeSettings.reportTheme);
    }
  }, [activeSettings.reportTheme]);

  const currentTheme = REPORT_THEMES[selectedThemeId] || REPORT_THEMES.navy;

  // Dynamic theme inline style helpers
  const primaryBg = { backgroundColor: currentTheme.primaryDark };
  const primaryText = { color: currentTheme.primaryDark };
  const secondaryBg = { backgroundColor: currentTheme.secondaryAccent };
  const secondaryText = { color: currentTheme.secondaryAccent };
  const tertiaryBg = { backgroundColor: currentTheme.tertiaryAccent };

  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);
  const [exportStep, setExportStep] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string; pdfBlobUrl?: string } | null>(null);

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  // Pagination between participants
  const currentIndex = participantsList.findIndex((p) => p.id === participant.id);
  const handlePrev = async () => {
    if (currentIndex > 0 && onSelectParticipant) {
      onSelectParticipant(participantsList[currentIndex - 1]);
    }
  };
  const handleNext = async () => {
    if (currentIndex < participantsList.length - 1 && onSelectParticipant) {
      onSelectParticipant(participantsList[currentIndex + 1]);
    }
  };

  // Subtests and highest subtest
  const subtests = participant.subtestDetails || [];
  const highestSub = useMemo(() => {
    if (!subtests.length) return { code: 'GE', name: 'Sifat yang Sama', iq: 115 };
    return [...subtests].sort((a, b) => b.iq - a.iq)[0];
  }, [subtests]);

  // Calculations
  const totalPercentile = Math.min(99, Math.max(1, Math.round(50 + (participant.totalIQ - 100) * 1.6)));

  const ipaScore = participant.streamAnalysis?.ipaScore || 110;
  const ipsScore = participant.streamAnalysis?.ipsScore || 107;
  const ipaPercent = Math.round((ipaScore / (ipaScore + ipsScore)) * 100) || 52;
  const ipsPercent = 100 - ipaPercent;

  const verbalAvg = participant.domainSummary?.verbal?.averageIq || 110;
  const verbalCat = participant.domainSummary?.verbal?.category || 'Rata-rata Atas';
  const numerikAvg = participant.domainSummary?.numerik?.averageIq || 108;
  const numerikCat = participant.domainSummary?.numerik?.category || 'Rata-rata Atas';
  const spasialAvg = participant.domainSummary?.spasial?.averageIq || 110;
  const spasialCat = participant.domainSummary?.spasial?.category || 'Rata-rata Atas';
  const memoriAvg = participant.domainSummary?.memori?.averageIq || 105;
  const memoriCat = participant.domainSummary?.memori?.category || 'Rata-rata';

  // Native Print
  const handlePrint = async () => {
    window.print();
  };

  // PDF Download (2-Page A4)
  const handleDownloadPDF = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    setIsExporting(true);
    setFeedback(null);

    try {
      setExportStep('Menyiapkan dokumen A4...');
      await new Promise((r) => setTimeout(r, 60));

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const capturePage = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
        return await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          windowHeight: 4000,
          scrollY: 0,
          scrollX: 0,
          onclone: (clonedDoc) => {
            const clonedElem = clonedDoc.getElementById(element.id);
            if (clonedElem) {
              let curr: HTMLElement | null = clonedElem;
              while (curr && curr !== clonedDoc.body) {
                curr.style.overflow = 'visible';
                curr.style.maxHeight = 'none';
                curr.style.height = 'auto';
                curr = curr.parentElement;
              }
              clonedDoc.body.style.overflow = 'visible';
              clonedDoc.body.style.height = '4000px';
            }
          },
        });
      };

      // Render Page 1
      setExportStep('Mengonversi Halaman 1...');
      const canvas1 = await capturePage(page1Ref.current);
      const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
      const imgHeight1 = (canvas1.height * pdfWidth) / canvas1.width;
      pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight1, pdfHeight));

      // Render Page 2
      setExportStep('Mengonversi Halaman 2...');
      pdf.addPage();
      const canvas2 = await capturePage(page2Ref.current);
      const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
      const imgHeight2 = (canvas2.height * pdfWidth) / canvas2.width;
      pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight2, pdfHeight));

      setExportStep('Menyimpan Berkas PDF...');
      const sanitizedName = participant.nama.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Laporan_IST_${sanitizedName}_${participant.nomorTes.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
      }, 3000);

      setFeedback({
        type: 'success',
        text: `Dokumen "${filename}" berhasil diunduh dalam format PDF standar A4.`,
        pdfBlobUrl: blobUrl,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setFeedback({
        type: 'error',
        text: 'Gagal mengonversi otomatis ke PDF. Gunakan tombol "Cetak / Print" lalu pilih opsi "Save as PDF".',
      });
    } finally {
      setIsExporting(false);
      setExportStep('');
    }
  };

  // HTML Single-File Download
  const handleDownloadHTML = async () => {
    setIsDownloadingHtml(true);
    try {
      downloadReportAsHtml(participant, activeSettings, selectedThemeId);
      setFeedback({
        type: 'success',
        text: `Berkas HTML mandiri (${currentTheme.name}) untuk ${participant.nama} berhasil diunduh. Berkas ini memiliki desain 100% identik dan dapat langsung dibuka di browser apa pun atau dicetak rapi.`,
      });
    } finally {
      setTimeout(() => setIsDownloadingHtml(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-xs flex justify-center p-0 sm:p-4 md:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-5xl bg-slate-100 rounded-none sm:rounded-2xl shadow-2xl flex flex-col h-full max-h-screen overflow-hidden print:max-w-none print:h-auto print:rounded-none print:shadow-none">
        
        {/* Navigation & Action Bar (Hidden on Print) */}
        <div className="bg-[#0b2546] text-white px-5 py-3 flex items-center justify-between border-b border-blue-900/60 shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#0088a9] flex items-center justify-center font-bold text-white shadow-xs">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Pratinjau Laporan Hasil Tes IST
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                  Desain Standar IST (2 Halaman A4)
                </span>
              </div>
              <div className="text-xs text-slate-300">
                {participant.nama} ({participant.nomorTes}) • IQ: <strong className="text-cyan-300">{participant.totalIQ}</strong> ({participant.iqCategory})
              </div>
            </div>
          </div>

          {/* Quick Pagination between participants */}
          {participantsList.length > 1 && (
            <div className="hidden md:flex items-center space-x-1 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                title="Peserta Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono">
                {currentIndex + 1} / {participantsList.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex >= participantsList.length - 1}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                title="Peserta Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Selector Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700 cursor-pointer"
                title="Ganti Tema Warna Laporan (Real-time)"
              >
                <Palette className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline text-slate-300">Tema:</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-xs"
                    style={{ backgroundColor: currentTheme.secondaryAccent }}
                  />
                  <span className="font-semibold text-white">{currentTheme.name.split(' ')[0]}</span>
                </span>
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 text-white animate-in fade-in">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Pilih Tema Warna
                    </span>
                    <span className="text-[10px] text-cyan-400">Pratinjau Langsung</span>
                  </div>
                  <div className="space-y-1">
                    {(Object.keys(REPORT_THEMES) as ReportThemeId[]).map((tId) => {
                      const t = REPORT_THEMES[tId];
                      const isSel = selectedThemeId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedThemeId(t.id);
                            setIsThemeMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition text-left cursor-pointer ${
                            isSel
                              ? 'bg-blue-600/30 text-white font-bold border border-blue-500/50'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex -space-x-1">
                              {t.previewColors.map((c, i) => (
                                <span
                                  key={i}
                                  className="w-3 h-3 rounded-full border border-slate-900 shadow-xs"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                            <div>
                              <div className="text-xs font-semibold leading-none mb-0.5">{t.name}</div>
                              <div className="text-[10px] text-slate-400 leading-tight font-normal">
                                {t.description.split('.')[0]}
                              </div>
                            </div>
                          </div>
                          {isSel && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-semibold transition shadow-xs disabled:opacity-75 cursor-pointer"
              title="Unduh berkas PDF 2 halaman langsung"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? (exportStep || 'Memproses...') : 'Unduh PDF'}</span>
            </button>

            {/* Download HTML Button */}
            <button
              onClick={handleDownloadHTML}
              disabled={isDownloadingHtml}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-75"
              title="Unduh format file HTML mandiri (Single-File Offline)"
            >
              {isDownloadingHtml ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileCode className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingHtml ? 'Mengunduh...' : 'Unduh HTML'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700 cursor-pointer"
              title="Cetak atau Simpan sebagai PDF melalui dialog printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1 cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Notification Banner (Hidden on Print) */}
        {isExporting && (
          <div className="print:hidden bg-blue-50 border-b border-blue-200 px-6 py-2 flex items-center justify-between text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>{exportStep} Harap tunggu beberapa detik...</span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium">Standard A4 210mm × 297mm</span>
          </div>
        )}

        {feedback && !isExporting && (
          <div
            className={`print:hidden px-6 py-2 border-b flex items-center justify-between text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <div className="flex items-center gap-2">
              {feedback.pdfBlobUrl && (
                <a
                  href={feedback.pdfBlobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-blue-700 hover:text-blue-900 flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Dokumen di Tab Baru
                </a>
              )}
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center gap-8 bg-slate-200/70">
          
          {/* ======================================================== */}
          {/* HALAMAN 1 (A4: 210mm x 297mm)                            */}
          {/* ======================================================== */}
          <div
            ref={page1Ref}
            id="ist-report-page-1"
            className="ist-a4-page relative bg-white text-slate-800 shadow-2xl border-2 rounded-2xl px-6 py-4 flex flex-col justify-between shrink-0 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0"
            style={{ borderColor: currentTheme.primaryDark, width: '210mm', height: '297mm', minHeight: '297mm', maxHeight: '297mm', boxSizing: 'border-box' }}
          >
            {/* Top Curved Accent */}
            <svg
              className="absolute top-0 right-0 w-36 h-36 pointer-events-none z-0"
              viewBox="0 0 140 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0C60 0 140 80 140 140V0H0Z" fill={currentTheme.secondaryAccent} opacity="0.14" />
              <path d="M40 0C80 0 140 60 140 100V0H40Z" fill={currentTheme.tertiaryAccent} opacity="0.25" />
            </svg>

            {/* Content Container */}
            <div className="flex flex-col gap-1.5 relative z-10">
              
              {/* Kop Surat / Top Header */}
              <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                {/* Brand Logo & Name */}
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-xs" style={primaryBg}>
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[17px] font-black leading-none tracking-tight" style={primaryText}>
                      PSIKOEDU
                    </div>
                    <div className="text-[8px] text-slate-500 font-semibold mt-0.5">
                      Layanan Psikologi &amp; Pengembangan Potensi
                    </div>
                  </div>
                </div>

                {/* Center Title */}
                <div className="text-center">
                  <h1 className="text-[13px] font-black tracking-wide leading-tight uppercase" style={primaryText}>
                    LAPORAN HASIL
                  </h1>
                  <h2 className="text-[12px] font-black uppercase leading-tight" style={primaryText}>
                    PEMERIKSAAN PSIKOTES
                  </h2>
                  <h3 className="text-[10px] font-bold uppercase tracking-wide" style={secondaryText}>
                    INTELLIGENZ STRUKTUR TEST (IST)
                  </h3>
                  <span className="inline-block text-white text-[8px] font-extrabold px-2.5 py-0.5 rounded-full mt-0.5" style={primaryBg}>
                    {participant.pendidikan || 'SISWA SMP'}
                  </span>
                </div>

                {/* Right Meta Box */}
                <div className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[8px] text-slate-700 bg-white/90 min-w-[170px]">
                  <div className="leading-tight">
                    <span className="text-slate-500">Tanggal Pemeriksaan : </span>
                    <strong className="text-slate-900">{participant.tanggalTes}</strong>
                  </div>
                  <div className="leading-tight mt-0.5">
                    <span className="text-slate-500">Pemeriksa : </span>
                    <strong className="text-slate-900">{activeSettings.psychologistTitle || 'Psikolog Pendidikan'}</strong>
                  </div>
                  <div className="leading-tight mt-0.5">
                    <span className="text-slate-500">Tujuan : </span>
                    <strong className="text-slate-900">Evaluasi potensi intelektual</strong>
                  </div>
                </div>
              </div>

              {/* 1. IDENTITAS PESERTA */}
              <div>
                <div className="inline-flex items-center gap-1.5 text-white text-[8.5px] font-extrabold px-3 py-0.5 rounded-full mb-1" style={primaryBg}>
                  <User className="w-2.5 h-2.5" />
                  1. IDENTITAS PESERTA
                </div>
                <div className="border border-slate-300 rounded-lg p-2 bg-white text-[8.5px]">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-[8px] shrink-0">
                          <User className="w-2.5 h-2.5" />
                        </span>
                        <span className="text-slate-500 w-20">Nama</span>
                        <span>: </span>
                        <strong className="text-slate-900 truncate">{participant.nama}</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-[8px] shrink-0">
                          ⚥
                        </span>
                        <span className="text-slate-500 w-20">Jenis Kelamin</span>
                        <span>: </span>
                        <span className="text-slate-800 font-semibold">
                          {participant.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-[8px] shrink-0">
                          🕒
                        </span>
                        <span className="text-slate-500 w-20">Usia</span>
                        <span>: </span>
                        <span className="text-slate-800 font-semibold">{participant.usia} tahun</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-[8px] shrink-0">
                          🏫
                        </span>
                        <span className="text-slate-500 w-20">Sekolah</span>
                        <span>: </span>
                        <span className="text-slate-800 font-semibold truncate">
                          {participant.asalSekolahInstitusi || activeSettings.institutionName || 'SMP / SMA'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-[8px] shrink-0">
                          🔖
                        </span>
                        <span className="text-slate-500 w-20">Kelas</span>
                        <span>: </span>
                        <span className="text-slate-800 font-semibold">{participant.pendidikan}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 w-24">Tanggal Lahir</span>
                        <span>: </span>
                        <span className="text-slate-800 font-semibold">{participant.tanggalLahir}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 w-24">Tanggal Tes</span>
                        <span>: </span>
                        <span className="text-slate-800 font-semibold">{participant.tanggalTes}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 w-24">Pemeriksa</span>
                        <span>: </span>
                        <span className="text-slate-800 font-semibold truncate">
                          {activeSettings.psychologistName || 'Dewi Lestari, M.Psi., Psikolog'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 w-24">Nomor Peserta</span>
                        <span>: </span>
                        <span className="font-mono font-bold text-slate-800">{participant.nomorTes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. TINGKAT KECERDASAN UMUM (IQ) */}
              <div>
                <div className="inline-flex items-center gap-1.5 text-white text-[8.5px] font-extrabold px-3 py-0.5 rounded-full mb-1" style={primaryBg}>
                  2. TINGKAT KECERDASAN UMUM (IQ)
                </div>
                <div className="border border-slate-300 rounded-lg p-2.5 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9.5px] font-extrabold uppercase text-slate-500">IQ TOTAL</span>
                      <span className="text-4xl font-black leading-none tracking-tight" style={secondaryText}>
                        {participant.totalIQ}
                      </span>
                    </div>
                    <div className="border-l-2 border-slate-200 pl-4 flex items-center">
                      <span className="text-white font-extrabold text-[11px] px-3.5 py-1 rounded-full uppercase tracking-wide shadow-2xs" style={secondaryBg}>
                        {participant.iqCategory}
                      </span>
                    </div>
                  </div>
                  <p className="text-[8.5px] text-slate-600 mt-1.5 leading-tight">
                    IQ <strong>{participant.totalIQ}</strong> menunjukkan bahwa kemampuan intelektual umum berada pada kategori{' '}
                    <strong>{participant.iqCategory}</strong>, yaitu lebih tinggi daripada sekitar{' '}
                    <strong>{totalPercentile}%</strong> dari populasi seusianya. (Persentil {totalPercentile})
                  </p>
                </div>
              </div>

              {/* 3. PROFIL HASIL 9 SUBTES IST */}
              <div>
                <div className="inline-flex items-center gap-1.5 text-white text-[8.5px] font-extrabold px-3 py-0.5 rounded-full mb-1" style={primaryBg}>
                  3. PROFIL HASIL 9 SUBTES IST
                </div>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[8px]">
                    <thead>
                      <tr className="text-white font-semibold" style={primaryBg}>
                        <th className="py-1 px-1.5 text-center w-6">No.</th>
                        <th className="py-1 px-1.5 w-12">Kode</th>
                        <th className="py-1 px-1.5 w-28">Subtes IST</th>
                        <th className="py-1 px-1.5">Aspek yang Diukur</th>
                        <th className="py-1 px-1.5 text-center w-12">Skor Mentah (RW)</th>
                        <th className="py-1 px-1.5 text-center w-12">Skor Standar (SS)</th>
                        <th className="py-1 px-1.5 text-center w-10">IQ</th>
                        <th className="py-1 px-1.5 text-center w-12">Persentil (%)</th>
                        <th className="py-1 px-1.5 text-center w-20">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subtests.map((sub, idx) => {
                        const meta = SUBTEST_META[sub.code] || {
                          code: sub.code,
                          name: sub.name,
                          aspect: sub.measuredAspect,
                          color: '#0284c7',
                        };
                        const isGreen = sub.iq >= 115;
                        const isTeal = sub.iq >= 105 && sub.iq < 115;
                        const isBlue = sub.iq >= 90 && sub.iq < 105;

                        return (
                          <tr
                            key={sub.code}
                            className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'} border-t border-slate-200`}
                          >
                            <td className="py-0.8 px-1.5 text-center text-slate-500 font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-0.8 px-1.5">
                              <span className="inline-flex items-center gap-1 font-bold" style={primaryText}>
                                <span
                                  className="w-3.5 h-3.5 rounded text-white text-[7px] font-extrabold flex items-center justify-center"
                                  style={{ backgroundColor: meta.color }}
                                >
                                  {sub.code}
                                </span>
                                <span>{sub.code}</span>
                              </span>
                            </td>
                            <td className="py-0.8 px-1.5 font-bold text-slate-900">
                              {meta.name}
                            </td>
                            <td className="py-0.8 px-1.5 text-slate-600 text-[7.5px] leading-tight">
                              {meta.aspect}
                            </td>
                            <td className="py-0.8 px-1.5 text-center font-mono font-semibold text-slate-800">
                              {sub.rw}
                            </td>
                            <td className="py-0.8 px-1.5 text-center font-mono font-semibold text-slate-800">
                              {sub.ss}
                            </td>
                            <td className="py-0.8 px-1.5 text-center font-mono font-extrabold" style={primaryText}>
                              {sub.iq}
                            </td>
                            <td className="py-0.8 px-1.5 text-center font-mono text-slate-600">
                              {sub.percentile}%
                            </td>
                            <td className="py-0.8 px-1.5 text-center">
                              <span
                                className={`inline-block px-1.5 py-0.2 rounded-full text-[7px] font-bold ${
                                  isGreen
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isTeal
                                    ? 'bg-teal-100 text-teal-800'
                                    : isBlue
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {sub.category}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. GRAFIK & 5. RINGKASAN RANAH (Dual Grid) */}
              <div className="grid grid-cols-12 gap-2.5">
                
                {/* 4. GRAFIK PROFIL KEMAMPUAN IST (7 Kolom) */}
                <div className="col-span-7 border border-slate-300 rounded-lg p-2 bg-white flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 text-white text-[8px] font-extrabold px-2.5 py-0.5 rounded-full mb-1" style={primaryBg}>
                      4. GRAFIK PROFIL KEMAMPUAN IST
                    </div>
                    
                    {/* Bar Chart Stage */}
                    <div className="relative h-24 flex mt-1">
                      {/* Y-Axis */}
                      <div className="w-5 flex flex-col justify-between text-right pr-1 text-[6.5px] font-mono text-slate-400 font-semibold pb-3.5">
                        <span>150</span>
                        <span>130</span>
                        <span>110</span>
                        <span>90</span>
                        <span>70</span>
                        <span>50</span>
                      </div>

                      {/* Canvas Area */}
                      <div className="relative flex-1 border-l border-b border-slate-300 flex items-end px-1.5 pb-3.5 gap-1.5">
                        {/* Reference lines */}
                        <div className="absolute left-0 right-0 bottom-[90%] border-b border-dashed border-slate-200">
                          <span className="absolute right-1 -top-2 text-[6px] text-slate-400 font-medium">Sangat Tinggi (140+)</span>
                        </div>
                        <div className="absolute left-0 right-0 bottom-[70%] border-b border-dashed border-slate-200">
                          <span className="absolute right-1 -top-2 text-[6px] text-slate-400 font-medium">Tinggi (120-139)</span>
                        </div>
                        <div className="absolute left-0 right-0 bottom-[50%] border-b border-dashed border-slate-300">
                          <span className="absolute right-1 -top-2 text-[6px] text-slate-400 font-medium">Rata-rata Atas (110-119)</span>
                        </div>
                        <div className="absolute left-0 right-0 bottom-[30%] border-b border-dashed border-slate-200">
                          <span className="absolute right-1 -top-2 text-[6px] text-slate-400 font-medium">Rata-rata (90-109)</span>
                        </div>

                        {/* 9 Bars */}
                        {subtests.map((sub) => {
                          const meta = SUBTEST_META[sub.code] || { color: '#0284c7' };
                          const minScale = 50;
                          const maxScale = 150;
                          const heightPct = Math.min(100, Math.max(10, ((sub.iq - minScale) / (maxScale - minScale)) * 100));
                          return (
                            <div key={sub.code} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                              <span className="text-[7px] font-mono font-extrabold mb-0.5 leading-none" style={primaryText}>
                                {sub.iq}
                              </span>
                              <div
                                className="w-full max-w-[14px] rounded-t-xs shadow-2xs transition-all"
                                style={{ height: `${heightPct}%`, backgroundColor: meta.color }}
                              ></div>
                              <span className="absolute -bottom-3 text-[7.5px] font-extrabold leading-none" style={primaryText}>
                                {sub.code}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Star Highlight Box */}
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded p-1.5 flex items-center gap-1.5 text-[7.5px]" style={{ color: currentTheme.primaryDark }}>
                    <div className="w-3.5 h-3.5 rounded-full text-white flex items-center justify-center font-bold text-[8px] shrink-0" style={tertiaryBg}>
                      ★
                    </div>
                    <span>
                      Grafik di atas menggambarkan profil intelektual pada masing-masing subtes. Kekuatan utama tampak pada subtes{' '}
                      <strong>{highestSub.code} ({highestSub.name})</strong>.
                    </span>
                  </div>
                </div>

                {/* 5. RINGKASAN RANAH KEMAMPUAN (5 Kolom) */}
                <div className="col-span-5 border border-slate-300 rounded-lg p-2 bg-white flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 text-white text-[8px] font-extrabold px-2.5 py-0.5 rounded-full mb-1" style={primaryBg}>
                      5. RINGKASAN RANAH KEMAMPUAN
                    </div>

                    <table className="w-full text-left border-collapse text-[7.5px] mt-1">
                      <thead>
                        <tr className="text-white font-semibold" style={primaryBg}>
                          <th className="py-1 px-1.5">Ranah Kemampuan</th>
                          <th className="py-1 px-1.5">Subtes</th>
                          <th className="py-1 px-1.5 text-center">IQ Rerata</th>
                          <th className="py-1 px-1.5 text-center">Kategori</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-1.5 font-bold text-slate-900">Verbal</td>
                          <td className="py-1 px-1.5 text-slate-500">SE, WA, AN, GE</td>
                          <td className="py-1 px-1.5 text-center font-mono font-bold" style={primaryText}>{verbalAvg}</td>
                          <td className="py-1 px-1.5 text-center">
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[6.5px] font-bold">
                              {verbalCat}
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-1.5 font-bold text-slate-900">Angka</td>
                          <td className="py-1 px-1.5 text-slate-500">RA, ZR</td>
                          <td className="py-1 px-1.5 text-center font-mono font-bold" style={primaryText}>{numerikAvg}</td>
                          <td className="py-1 px-1.5 text-center">
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[6.5px] font-bold">
                              {numerikCat}
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-1.5 font-bold text-slate-900">Figural/Spasial</td>
                          <td className="py-1 px-1.5 text-slate-500">FA, WU</td>
                          <td className="py-1 px-1.5 text-center font-mono font-bold" style={primaryText}>{spasialAvg}</td>
                          <td className="py-1 px-1.5 text-center">
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[6.5px] font-bold">
                              {spasialCat}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 px-1.5 font-bold text-slate-900">Memori</td>
                          <td className="py-1 px-1.5 text-slate-500">ME</td>
                          <td className="py-1 px-1.5 text-center font-mono font-bold" style={primaryText}>{memoriAvg}</td>
                          <td className="py-1 px-1.5 text-center">
                            <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[6.5px] font-bold">
                              {memoriCat}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[7px] text-slate-500 leading-tight pt-1 border-t border-slate-200">
                    *Profil ranah didasarkan atas agregasi subtes IST terstandardisasi.
                  </div>
                </div>

              </div>

              {/* GAMBARAN UMUM */}
              <div className="border border-slate-300 rounded-lg p-2 bg-white flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: currentTheme.accentLight, color: currentTheme.secondaryAccent }}>
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9.5px] font-extrabold uppercase tracking-wide" style={secondaryText}>
                      GAMBARAN UMUM
                    </div>
                    <p className="text-[8px] text-slate-700 leading-tight text-justify mt-0.5">
                      Anda memiliki kemampuan intelektual yang berada pada kategori <strong>{participant.iqCategory}</strong> dengan profil yang <strong>seimbang</strong>. Kekuatan utama Anda terlihat pada kemampuan <strong>{highestSub.name} ({highestSub.code})</strong> serta penalaran logis yang baik. Dukungan yang tepat akan membantu Anda mengoptimalkan potensi dalam belajar dan meraih prestasi.
                    </p>
                  </div>
                </div>

                {/* Silhouette Head Graphic */}
                <div className="w-12 h-12 shrink-0 opacity-85">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M25 80V70C25 60 30 50 40 45C35 40 35 30 40 20C45 10 60 10 68 18C75 25 75 35 70 42C78 48 80 58 80 70V80H25Z"
                      fill={currentTheme.accentLight}
                    />
                    <circle cx="55" cy="38" r="14" fill={currentTheme.secondaryAccent} opacity="0.8" />
                    <path d="M55 30V46M47 38H63" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Standard Footer Page 1 */}
            <div className="text-white px-3.5 py-1.5 rounded-lg flex items-center justify-between text-[8px] font-semibold relative z-10" style={primaryBg}>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-300" />
                <span>Laporan ini bersifat rahasia dan hanya untuk keperluan pengembangan potensi peserta.</span>
              </div>
              <div className="text-white px-2 py-0.5 rounded-full text-[7.5px] font-bold" style={secondaryBg}>
                Halaman 1 dari 2
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* HALAMAN 2 (A4: 210mm x 297mm)                            */}
          {/* ======================================================== */}
          <div
            ref={page2Ref}
            id="ist-report-page-2"
            className="ist-a4-page relative bg-white text-slate-800 shadow-2xl border-2 rounded-2xl px-6 py-4 flex flex-col justify-between shrink-0 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0"
            style={{ borderColor: currentTheme.primaryDark, width: '210mm', height: '297mm', minHeight: '297mm', maxHeight: '297mm', boxSizing: 'border-box' }}
          >
            {/* Top Curved Accent */}
            <svg
              className="absolute top-0 right-0 w-36 h-36 pointer-events-none z-0"
              viewBox="0 0 140 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0C60 0 140 80 140 140V0H0Z" fill={currentTheme.secondaryAccent} opacity="0.14" />
              <path d="M40 0C80 0 140 60 140 100V0H40Z" fill={currentTheme.tertiaryAccent} opacity="0.25" />
            </svg>

            {/* Content Container Page 2 */}
            <div className="flex flex-col gap-1.5 relative z-10">
              
              {/* 6. INTERPRETASI DAN ANALISIS HASIL */}
              <div>
                <div className="inline-flex items-center gap-1.5 text-white text-[8.5px] font-extrabold px-3 py-0.5 rounded-full mb-1" style={primaryBg}>
                  <Search className="w-2.5 h-2.5" />
                  6. INTERPRETASI DAN ANALISIS HASIL
                </div>
                <p className="text-[8px] text-slate-700 leading-tight mb-1">
                  Profil kemampuan <strong>{participant.nama}</strong> menunjukkan potensi intelektual yang baik dengan kecenderungan menonjol pada <strong>kemampuan verbal abstrak dan penalaran logis</strong>, serta kemampuan visual-spasial yang seimbang. Kemampuan angka berada pada kategori <strong>{numerikCat}</strong>.
                </p>

                {/* 2 Kolom: Kekuatan Utama & Area Pengembangan */}
                <div className="grid grid-cols-2 gap-2.5 mb-1.5">
                  
                  {/* KEKUATAN UTAMA */}
                  <div className="border border-slate-300 rounded-lg p-2 bg-white">
                    <div className="inline-flex items-center gap-1 bg-emerald-700 text-white text-[8px] font-extrabold px-2.5 py-0.5 rounded-full mb-1.5">
                      <span>✓</span> KEKUATAN UTAMA
                    </div>
                    <div className="space-y-1 text-[7.5px] text-slate-700 leading-tight">
                      <div className="flex items-start gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[7px] shrink-0 mt-0.5">✓</span>
                        <div><strong>Abstraksi verbal &amp; pembentukan konsep sangat baik (GE)</strong> — Mampu memahami ide utama dan generalisasi.</div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[7px] shrink-0 mt-0.5">✓</span>
                        <div><strong>Penalaran logis &amp; pemecahan masalah baik (AN, RA)</strong> — Menemukan hubungan dan menyelesaikan masalah terstruktur.</div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[7px] shrink-0 mt-0.5">✓</span>
                        <div><strong>Kemampuan visual-spasial baik (FA, WU)</strong> — Mudah memahami bentuk, pola, dan relasi ruang.</div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[7px] shrink-0 mt-0.5">✓</span>
                        <div><strong>Konsentrasi dan daya ingat cukup baik (ME)</strong> — Mampu mengingat informasi asosiatif.</div>
                      </div>
                    </div>
                  </div>

                  {/* AREA YANG PERLU DIKEMBANGKAN */}
                  <div className="border border-slate-300 rounded-lg p-2 bg-white">
                    <div className="inline-flex items-center gap-1 bg-orange-600 text-white text-[8px] font-extrabold px-2.5 py-0.5 rounded-full mb-1.5">
                      <span>!</span> AREA YANG PERLU DIKEMBANGKAN
                    </div>
                    <div className="space-y-1 text-[7.5px] text-slate-700 leading-tight">
                      <div className="flex items-start gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-[7px] shrink-0 mt-0.5">1</span>
                        <div><strong>Pemahaman &amp; penguasaan kosakata (WA)</strong> — Perlu memperkaya perbendaharaan kata melalui bacaan berkualitas.</div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-[7px] shrink-0 mt-0.5">2</span>
                        <div><strong>Latihan penalaran angka bertahap (ZR)</strong> — Perlu pembiasaan menemukan pola deret angka kompleks.</div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-[7px] shrink-0 mt-0.5">3</span>
                        <div><strong>Strategi manajemen waktu tugas kompleks</strong> — Perlu latihan efisiensi waktu dan ketelitian kerja.</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 6 KOTAK: ANALISIS POLA KEMAMPUAN */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50/70 text-[7.5px]">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold" style={primaryText}>Kemampuan Verbal</span>
                      <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[6.5px]">BAIK</span>
                    </div>
                    <div className="text-slate-600 leading-tight">Domain verbal kuat dengan abstraksi konsep menonjol.</div>
                  </div>

                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50/70 text-[7.5px]">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold" style={primaryText}>Kemampuan Angka</span>
                      <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[6.5px]">RATA-RATA</span>
                    </div>
                    <div className="text-slate-600 leading-tight">Dasar berhitung baik, perlu penguatan pola angka.</div>
                  </div>

                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50/70 text-[7.5px]">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold" style={primaryText}>Kemampuan Figural</span>
                      <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[6.5px]">BAIK</span>
                    </div>
                    <div className="text-slate-600 leading-tight">Daya bayang ruang dan visual-spasial tergolong baik.</div>
                  </div>

                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50/70 text-[7.5px]">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold" style={primaryText}>Memori</span>
                      <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[6.5px]">RATA-RATA</span>
                    </div>
                    <div className="text-slate-600 leading-tight">Daya ingat baik, perlu latihan konsistensi fokus.</div>
                  </div>

                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50/70 text-[7.5px]">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold" style={primaryText}>Fleksibilitas Berpikir</span>
                      <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[6.5px]">BAIK</span>
                    </div>
                    <div className="text-slate-600 leading-tight">Mampu melihat hubungan konsep dan pola alternatif.</div>
                  </div>

                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50/70 text-[7.5px]">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold" style={primaryText}>Komprehensif (GE+FA)</span>
                      <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[6.5px]">BAIK</span>
                    </div>
                    <div className="text-slate-600 leading-tight">Mampu memahami konsep abstrak dan visualisasi.</div>
                  </div>
                </div>
              </div>

              {/* 7. INDIKASI ARAH PEMINATAN (IPA / IPS) */}
              <div>
                <div className="inline-flex items-center gap-1.5 text-white text-[8.5px] font-extrabold px-3 py-0.5 rounded-full mb-1" style={primaryBg}>
                  <Scale className="w-2.5 h-2.5" />
                  7. INDIKASI ARAH PEMINATAN (IPA / IPS)
                </div>

                <div className="border border-slate-300 rounded-lg p-2 bg-white">
                  <div className="grid grid-cols-12 gap-2 items-center text-center">
                    {/* IPA Donut */}
                    <div className="col-span-4 flex flex-col items-center">
                      <div className="text-[7.5px] font-extrabold mb-1" style={primaryText}>
                        KECENDERUNGAN IPA (RA, ZR, FA, WU)
                      </div>
                      <div className="relative w-14 h-14 mb-1">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="4"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={currentTheme.secondaryAccent}
                            strokeDasharray={`${ipaPercent}, 100`}
                            strokeWidth="4"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-black" style={secondaryText}>
                          {ipaPercent}%
                        </div>
                      </div>
                      <p className="text-[7px] text-slate-500 leading-tight mb-1">
                        Kelompok kemampuan angka dan visual-spasial relatif lebih kuat.
                      </p>
                      <span
                        className="border text-[6.5px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{
                          borderColor: currentTheme.secondaryAccent,
                          color: currentTheme.secondaryAccent,
                          backgroundColor: currentTheme.accentLight,
                        }}
                      >
                        KECOCOKAN TINGGI
                      </span>
                    </div>

                    {/* Center Trophy / Conclusion */}
                    <div className="col-span-4 border-x border-slate-200 px-2 py-1">
                      <div className="text-lg mb-0.5">🏆</div>
                      <div className="text-[8px] font-extrabold mb-0.5" style={primaryText}>
                        KESIMPULAN PEMINATAN
                      </div>
                      <p className="text-[7px] text-slate-600 leading-tight">
                        Anda memiliki kecocokan relatif lebih tinggi pada peminatan{' '}
                        <strong>{participant.streamAnalysis?.preference || 'IPA'}</strong>, namun potensi{' '}
                        <strong>{participant.streamAnalysis?.preference === 'IPA' ? 'IPS' : 'IPA'}</strong> juga cukup baik.
                      </p>
                    </div>

                    {/* IPS Donut */}
                    <div className="col-span-4 flex flex-col items-center">
                      <div className="text-[7.5px] font-extrabold text-orange-700 mb-1">
                        KECENDERUNGAN IPS (SE, WA, GE, ME)
                      </div>
                      <div className="relative w-14 h-14 mb-1">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="4"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#ea580c"
                            strokeDasharray={`${ipsPercent}, 100`}
                            strokeWidth="4"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-black text-orange-600">
                          {ipsPercent}%
                        </div>
                      </div>
                      <p className="text-[7px] text-slate-500 leading-tight mb-1">
                        Kemampuan verbal dan memori berada pada kategori baik.
                      </p>
                      <span className="border border-orange-500 text-orange-600 bg-orange-50 text-[6.5px] font-extrabold px-2 py-0.5 rounded-full">
                        KECOCOKAN BAIK
                      </span>
                    </div>
                  </div>
                  <div className="text-[6.5px] text-slate-500 text-center mt-1 pt-1 border-t border-slate-200">
                    ★ <em>Catatan: Kecenderungan di atas bukan penentu mutlak. Minat, motivasi, dan nilai kepribadian sangat penting untuk dipertimbangkan.</em>
                  </div>
                </div>
              </div>

              {/* 7 (B). POTENSI BIDANG STUDI / JURUSAN KULIAH */}
              <div>
                <div className="inline-flex items-center gap-1.5 text-white text-[8.5px] font-extrabold px-3 py-0.5 rounded-full mb-1" style={primaryBg}>
                  <GraduationCap className="w-2.5 h-2.5" />
                  7. POTENSI BIDANG STUDI / JURUSAN KULIAH
                </div>
                <div className="text-[7.5px] text-slate-600 mb-0.5">
                  Berikut bidang studi yang sesuai dengan profil kemampuan Anda (Semakin banyak ✓ berarti semakin sesuai):
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <table className="w-full text-left border-collapse text-[7px] border border-slate-300 rounded overflow-hidden">
                    <thead>
                      <tr className="text-white font-semibold" style={primaryBg}>
                        <th className="py-0.8 px-1.5">Jurusan / Bidang Studi</th>
                        <th className="py-0.8 px-1.5">Subtes Kunci</th>
                        <th className="py-0.8 px-1.5 text-center">Kesesuaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Kedokteran</td>
                        <td className="py-0.5 px-1.5 text-slate-500">SE, AN, GE, FA, WU</td>
                        <td className="py-0.5 px-1.5 text-center text-emerald-700 font-extrabold">✓✓✓✓</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Teknik</td>
                        <td className="py-0.5 px-1.5 text-slate-500">SE, AN, GE, RA, ZR, FA, WU</td>
                        <td className="py-0.5 px-1.5 text-center text-emerald-700 font-extrabold">✓✓✓✓</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">MIPA</td>
                        <td className="py-0.5 px-1.5 text-slate-500">AN, GE, RA, ZR, FA, WU</td>
                        <td className="py-0.5 px-1.5 text-center text-emerald-700 font-extrabold">✓✓✓✓</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Ekonomi</td>
                        <td className="py-0.5 px-1.5 text-slate-500">SE, AN, RA, ZR</td>
                        <td className="py-0.5 px-1.5 text-center text-emerald-700 font-extrabold">✓✓✓✓</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Sistem Informasi</td>
                        <td className="py-0.5 px-1.5 text-slate-500">SE, AN, GE</td>
                        <td className="py-0.5 px-1.5 text-center text-sky-700 font-extrabold">✓✓✓</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-bold">Psikologi</td>
                        <td className="py-0.5 px-1.5 text-slate-500">SE, WA, AN, GE, ME</td>
                        <td className="py-0.5 px-1.5 text-center text-sky-700 font-extrabold">✓✓</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full text-left border-collapse text-[7px] border border-slate-300 rounded overflow-hidden">
                    <thead>
                      <tr className="text-white font-semibold" style={primaryBg}>
                        <th className="py-0.8 px-1.5">Jurusan / Bidang Studi</th>
                        <th className="py-0.8 px-1.5">Subtes Kunci</th>
                        <th className="py-0.8 px-1.5 text-center">Kesesuaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Hukum</td>
                        <td className="py-0.5 px-1.5 text-slate-500">SE, AN, GE, ME</td>
                        <td className="py-0.5 px-1.5 text-center text-sky-700 font-extrabold">✓✓✓</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Sastra</td>
                        <td className="py-0.5 px-1.5 text-slate-500">WA, AN, GE, ME</td>
                        <td className="py-0.5 px-1.5 text-center text-sky-700 font-extrabold">✓✓✓</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Ilmu Komunikasi</td>
                        <td className="py-0.5 px-1.5 text-slate-500">SE, WA, AN, ME</td>
                        <td className="py-0.5 px-1.5 text-center text-sky-700 font-extrabold">✓✓✓</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Pertanian</td>
                        <td className="py-0.5 px-1.5 text-slate-500">AN, GE, FA, WU</td>
                        <td className="py-0.5 px-1.5 text-center text-sky-700 font-extrabold">✓✓✓</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-0.5 px-1.5 font-bold">Peternakan</td>
                        <td className="py-0.5 px-1.5 text-slate-500">AN, FA, WU</td>
                        <td className="py-0.5 px-1.5 text-center text-sky-700 font-extrabold">✓✓</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-bold">Seni Rupa</td>
                        <td className="py-0.5 px-1.5 text-slate-500">AN, ZR, FA, WU</td>
                        <td className="py-0.5 px-1.5 text-center text-sky-700 font-extrabold">✓✓</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3 KOLOM REKOMENDASI, STRATEGI, KESIMPULAN */}
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-slate-300 rounded p-1.5 bg-white text-[7.5px]">
                  <div className="font-extrabold text-[8px] mb-1 flex items-center gap-1" style={primaryText}>
                    <span className="text-purple-600">★</span> 8. REKOMENDASI PENGEMBANGAN
                  </div>
                  <ul className="space-y-0.5 text-slate-700 leading-tight">
                    <li>• Pertahankan konsistensi belajar sains dan matematika.</li>
                    <li>• Tingkatkan membaca buku untuk kosa kata (WA).</li>
                    <li>• Ikuti klub sains atau robotika untuk logika visual.</li>
                    <li>• Latih komunikasi publik dan presentasi ide.</li>
                  </ul>
                </div>

                <div className="border border-slate-300 rounded p-1.5 bg-white text-[7.5px]">
                  <div className="font-extrabold text-[8px] mb-1 flex items-center gap-1" style={primaryText}>
                    <span style={secondaryText}>✎</span> 10. STRATEGI BELAJAR
                  </div>
                  <ul className="space-y-0.5 text-slate-700 leading-tight">
                    <li>• Gunakan mind-mapping untuk materi konseptual.</li>
                    <li>• Latihan bertahap pola penalaran deret angka.</li>
                    <li>• Jadwal belajar teratur dengan target waktu jelas.</li>
                    <li>• Diskusi kelompok untuk memperdalam pemahaman.</li>
                  </ul>
                </div>

                <div className="border border-slate-300 rounded p-1.5 bg-white text-[7.5px]">
                  <div className="font-extrabold text-[8px] mb-1 flex items-center gap-1" style={primaryText}>
                    <span className="text-emerald-600">✔</span> 11. KESIMPULAN KLINIS
                  </div>
                  <p className="text-slate-700 leading-tight">
                    Subjek memiliki potensi intelektual prima pada kategori <strong>{participant.iqCategory}</strong> dengan daya nalar abstrak dan spasial yang sangat menunjang capaian prestasi akademik lanjutan.
                  </p>
                </div>
              </div>

              {/* VALIDASI, TANDA TANGAN & STEMPEL */}
              <div className="grid grid-cols-12 gap-3 pt-1 border-t border-slate-300 items-end">
                {/* Wechsler Classification Table (4 Kolom) */}
                <div className="col-span-4">
                  <div className="text-[7px] font-bold mb-0.5" style={primaryText}>
                    KETERANGAN KATEGORI IQ (Wechsler)
                  </div>
                  <table className="w-full text-left border-collapse text-[6.5px] border border-slate-200 rounded text-slate-600">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-0.5 px-1 font-semibold">≥ 130 : Sangat Tinggi</td>
                        <td className="py-0.5 px-1">90 - 109 : Rata-rata</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-0.5 px-1 font-semibold">120 - 129 : Tinggi</td>
                        <td className="py-0.5 px-1">80 - 89 : Rata-rata Bawah</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1 font-semibold">110 - 119 : Rata-rata Atas</td>
                        <td className="py-0.5 px-1">≤ 79 : Rendah</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pemeriksa & PSIKOEDU Official Stamp (4 Kolom) */}
                <div className="col-span-4 flex flex-col items-center text-center relative">
                  <div className="text-[7.5px] text-slate-500 mb-0.5">Pemeriksa,</div>
                  <div className="font-serif italic text-lg leading-none my-0.5 select-none" style={{ color: currentTheme.primaryDark }}>
                    Dewi Lestari
                  </div>
                  <div className="text-[8px] font-bold leading-none" style={primaryText}>
                    {activeSettings.psychologistName || 'Dewi Lestari, M.Psi., Psikolog'}
                  </div>
                  <div className="text-[6.5px] text-slate-500 font-mono mt-0.5 leading-none">
                    {activeSettings.psychologistTitle || 'Psikolog Pendidikan'} • {activeSettings.psychologistSipp || 'SIPP: 2025.05.00123'}
                  </div>

                  {/* PSIKOEDU Official Stamp */}
                  {activeSettings.enableSignatureStamp && (
                    <div
                      className="absolute -top-3 right-3 w-16 h-16 border-2 border-dashed rounded-full flex flex-col items-center justify-center -rotate-12 pointer-events-none opacity-85"
                      style={{ borderColor: currentTheme.secondaryAccent, backgroundColor: currentTheme.accentLight }}
                    >
                      <div className="w-13 h-13 border rounded-full flex flex-col items-center justify-center" style={{ borderColor: currentTheme.secondaryAccent }}>
                        <span className="font-serif text-sm font-black leading-none" style={secondaryText}>Ψ</span>
                        <span className="text-[4px] font-black tracking-wider uppercase" style={secondaryText}>PSIKOEDU</span>
                        <span className="text-[3px] font-bold tracking-tight" style={secondaryText}>LAYANAN PSIKOLOGI</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Peserta (4 Kolom) */}
                <div className="col-span-4 flex flex-col items-center text-center">
                  <div className="text-[7.5px] text-slate-500 mb-0.5">
                    {activeSettings.institutionCity || 'Jakarta'}, {participant.tanggalTes}
                  </div>
                  <div className="text-[7.5px] text-slate-500">Peserta,</div>
                  <div className="font-serif italic text-base leading-none my-0.5 select-none" style={{ color: currentTheme.primaryDark }}>
                    {participant.nama.split(' ')[0]}
                  </div>
                  <div className="text-[8px] font-bold border-t border-slate-400 pt-0.5 px-4 min-w-[110px] leading-none" style={primaryText}>
                    ( {participant.nama} )
                  </div>
                </div>
              </div>

            </div>

            {/* Standard Footer Page 2 */}
            <div className="text-white px-3.5 py-1.5 rounded-lg flex items-center justify-between text-[8px] font-semibold relative z-10" style={primaryBg}>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-300" />
                <span>Laporan ini bersifat rahasia dan hanya untuk keperluan pengembangan potensi peserta.</span>
              </div>
              <div className="text-white px-2 py-0.5 rounded-full text-[7.5px] font-bold" style={secondaryBg}>
                Halaman 2 dari 2
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
