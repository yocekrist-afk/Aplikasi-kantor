import { Participant } from '../types/ist';
import { AppSettings, ReportThemeId, REPORT_THEMES } from '../types/settings';

export function generateReportHtml(
  participant: Participant,
  settings: AppSettings,
  themeIdOverride?: ReportThemeId
): string {
  const sanitize = (text: string | number | undefined) => {
    if (text === undefined || text === null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const themeId = themeIdOverride || settings.reportTheme || 'navy';
  const theme = REPORT_THEMES[themeId] || REPORT_THEMES.navy;

  const institutionName = participant.asalSekolahInstitusi || settings.institutionName || 'PSIKOEDU';
  const psychologistName = settings.psychologistName || 'Dewi Lestari, M.Psi., Psikolog';
  const psychologistTitle = settings.psychologistTitle || 'Psikolog Pendidikan';
  const psychologistSipp = settings.psychologistSipp || 'SIPP: 2025.05.00123';
  const institutionCity = settings.institutionCity || 'Jakarta';

  // Subtest details
  const subtests = participant.subtestDetails || [];
  
  // Percentile calculation
  const totalPercentile = Math.min(99, Math.max(1, Math.round(50 + (participant.totalIQ - 100) * 1.6)));

  // Domain scores
  const verbalAvg = participant.domainSummary?.verbal?.averageIq || 110;
  const verbalCat = participant.domainSummary?.verbal?.category || 'Rata-rata Atas';
  const numerikAvg = participant.domainSummary?.numerik?.averageIq || 108;
  const numerikCat = participant.domainSummary?.numerik?.category || 'Rata-rata Atas';
  const spasialAvg = participant.domainSummary?.spasial?.averageIq || 110;
  const spasialCat = participant.domainSummary?.spasial?.category || 'Rata-rata Atas';
  const memoriAvg = participant.domainSummary?.memori?.averageIq || 105;
  const memoriCat = participant.domainSummary?.memori?.category || 'Rata-rata';

  // Stream scores
  const ipaScore = participant.streamAnalysis?.ipaScore || 110;
  const ipsScore = participant.streamAnalysis?.ipsScore || 107;
  const ipaPercent = Math.round((ipaScore / (ipaScore + ipsScore)) * 100) || 52;
  const ipsPercent = 100 - ipaPercent;

  // Find highest subtest
  const highestSub = [...subtests].sort((a, b) => b.iq - a.iq)[0] || { code: 'GE', name: 'Sifat yang Sama', iq: 115 };

  // Subtest meta labels and measured aspects
  const subtestMeta: Record<string, { code: string; name: string; aspect: string; color: string }> = {
    SE: { code: 'SE', name: 'Melengkapi Kalimat', aspect: 'Berpikir konkret-praktis, logis, common sense, pengambilan keputusan, pemaknaan realita.', color: '#0284c7' },
    WA: { code: 'WA', name: 'Persamaan Kata', aspect: 'Pemahaman bahasa, rasa bahasa, menangkap inti informasi.', color: '#0088a9' },
    AN: { code: 'AN', name: 'Analogi Verbal', aspect: 'Menemukan hubungan, fleksibilitas berpikir, penalaran dan kesimpulan.', color: '#059669' },
    GE: { code: 'GE', name: 'Sifat yang Sama', aspect: 'Abstraksi verbal, pembentukan konsep, berpikir logis.', color: '#10b981' },
    RA: { code: 'RA', name: 'Berhitung', aspect: 'Berpikir matematis, logis-objektif, pemecahan masalah hitungan.', color: '#0284c7' },
    ZR: { code: 'ZR', name: 'Deret Angka', aspect: 'Penalaran induktif angka, berpikir teoritis, kelincahan berpikir.', color: '#f59e0b' },
    FA: { code: 'FA', name: 'Memilih Gambar', aspect: 'Kemampuan membayangkan, mengamati, berpikir menyeluruh dan konstruktif.', color: '#f97316' },
    WU: { code: 'WU', name: 'Kubus', aspect: 'Daya bayang ruang, konstruktif-teknis, analisis visual-spasial.', color: '#8b5cf6' },
    ME: { code: 'ME', name: 'Ingatan', aspect: 'Atensi, konsentrasi, kemampuan mengingat informasi.', color: '#ec4899' },
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Hasil Pemeriksaan Psikotes IST - ${sanitize(participant.nama)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Caveat:wght@600&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-navy: ${theme.primaryDark};
      --primary-teal: ${theme.secondaryAccent};
      --primary-cyan: ${theme.tertiaryAccent};
      --primary-light-bg: ${theme.accentLight};
      --border-color: #cbd5e1;
      --text-dark: #0f172a;
      --text-muted: #64748b;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #e2e8f0;
      color: var(--text-dark);
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
      padding: 24px 12px;
    }

    .report-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
    }

    /* Standard A4 Page Definition */
    .a4-page {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      background: #ffffff;
      padding: 20px 24px 16px 24px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid var(--primary-navy);
      border-radius: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }

    /* Decorative Corner Accents */
    .corner-accent-top {
      position: absolute;
      top: 0;
      right: 0;
      width: 140px;
      height: 140px;
      pointer-events: none;
      z-index: 1;
    }

    .corner-accent-bottom {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 120px;
      height: 80px;
      pointer-events: none;
      z-index: 1;
    }

    /* Headers & Subtitles */
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
      padding-bottom: 8px;
    }

    .brand-box {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-square {
      width: 38px;
      height: 38px;
      background: var(--primary-navy);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }

    .logo-square svg {
      width: 22px;
      height: 22px;
      fill: #ffffff;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 900;
      color: var(--primary-navy);
      letter-spacing: -0.5px;
      line-height: 1;
    }

    .brand-subtitle {
      font-size: 8px;
      color: var(--text-muted);
      font-weight: 600;
      margin-top: 2px;
    }

    .header-center {
      text-align: center;
    }

    .header-center h1 {
      font-size: 14px;
      font-weight: 800;
      color: var(--primary-navy);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }

    .header-center h2 {
      font-size: 13px;
      font-weight: 800;
      color: var(--primary-navy);
      text-transform: uppercase;
      line-height: 1.1;
    }

    .header-center h3 {
      font-size: 11px;
      font-weight: 800;
      color: var(--primary-teal);
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    .pill-badge {
      display: inline-block;
      background: var(--primary-navy);
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 9999px;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }

    .meta-box {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 8.5px;
      color: var(--text-dark);
      background: #ffffff;
      min-width: 175px;
    }

    .meta-box div {
      line-height: 1.35;
    }

    .meta-box span.lbl {
      color: var(--text-muted);
    }

    /* Section Pills */
    .section-header-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--primary-navy);
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 2.5px 10px;
      border-radius: 9999px;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }

    .section-header-pill svg {
      width: 11px;
      height: 11px;
      fill: currentColor;
    }

    .section-box {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background: #ffffff;
      padding: 8px 12px;
      margin-bottom: 8px;
    }

    /* Participant Info Section */
    .info-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 12px;
      font-size: 9px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }

    .info-icon {
      width: 16px;
      height: 16px;
      background: #e0f2fe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-cyan);
      flex-shrink: 0;
    }

    .info-icon svg {
      width: 9px;
      height: 9px;
    }

    .info-label {
      color: var(--text-muted);
      width: 75px;
    }

    .info-value {
      font-weight: 700;
      color: var(--text-dark);
    }

    /* IQ Card Section */
    .iq-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 2px 4px;
    }

    .iq-score-block {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .iq-score-block .iq-lbl {
      font-size: 10px;
      font-weight: 800;
      color: var(--text-muted);
      line-height: 1;
    }

    .iq-score-block .iq-number {
      font-size: 44px;
      font-weight: 900;
      color: var(--primary-teal);
      line-height: 1;
      letter-spacing: -1.5px;
    }

    .iq-cat-block {
      border-left: 2px solid var(--border-color);
      padding-left: 14px;
    }

    .iq-cat-pill {
      background: var(--primary-teal);
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 9999px;
      display: inline-block;
      letter-spacing: 0.5px;
    }

    .iq-explanation {
      font-size: 8.5px;
      color: var(--text-muted);
      margin-top: 5px;
      line-height: 1.35;
    }

    /* Subtests Table */
    .subtests-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .subtests-table thead {
      background: var(--primary-navy);
      color: #ffffff;
      font-weight: 700;
    }

    .subtests-table th {
      padding: 4.5px 6px;
      text-align: left;
    }

    .subtests-table th.tc {
      text-align: center;
    }

    .subtests-table td {
      padding: 3.5px 6px;
      border-top: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .subtests-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .badge-sub {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-weight: 700;
      color: var(--primary-navy);
    }

    .sub-icon {
      width: 13px;
      height: 13px;
      border-radius: 3px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 7px;
      font-weight: 800;
      color: #ffffff;
    }

    .badge-cat {
      display: inline-block;
      padding: 1.5px 7px;
      border-radius: 9999px;
      font-size: 7.5px;
      font-weight: 700;
    }

    .badge-cat.green {
      background: #dcfce7;
      color: #15803d;
    }

    .badge-cat.teal {
      background: #ccfbf1;
      color: #0f766e;
    }

    .badge-cat.blue {
      background: #e0f2fe;
      color: #0369a1;
    }

    .badge-cat.amber {
      background: #fef3c7;
      color: #b45309;
    }

    /* Dual Section: Chart & Domain Summary */
    .dual-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 10px;
      margin-bottom: 8px;
    }

    /* Bar Chart Component */
    .chart-container {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 6px 8px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .chart-stage {
      position: relative;
      height: 100px;
      margin-top: 4px;
      display: flex;
    }

    .chart-y-axis {
      width: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 7px;
      color: var(--text-muted);
      font-weight: 600;
      padding-bottom: 14px;
      text-align: right;
      padding-right: 3px;
    }

    .chart-canvas {
      flex: 1;
      position: relative;
      border-left: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      align-items: flex-end;
      padding: 0 4px 14px 4px;
      gap: 6px;
    }

    .chart-guide-line {
      position: absolute;
      left: 0;
      right: 0;
      border-bottom: 1px dashed #e2e8f0;
      z-index: 1;
    }

    .chart-guide-label {
      position: absolute;
      right: 2px;
      font-size: 6.5px;
      color: #94a3b8;
      font-weight: 600;
      transform: translateY(-50%);
    }

    .bar-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    .bar-val {
      font-size: 7.5px;
      font-weight: 800;
      color: var(--primary-navy);
      margin-bottom: 1px;
    }

    .bar-fill {
      width: 100%;
      max-width: 16px;
      border-radius: 3px 3px 0 0;
      transition: height 0.3s;
    }

    .bar-lbl {
      position: absolute;
      bottom: -13px;
      font-size: 8px;
      font-weight: 800;
      color: var(--primary-navy);
    }

    .chart-star-note {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 4px 6px;
      font-size: 8px;
      color: var(--primary-navy);
      margin-top: 6px;
    }

    .star-circle {
      width: 15px;
      height: 15px;
      background: var(--primary-cyan);
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      flex-shrink: 0;
    }

    /* Domain Summary Table */
    .domain-container {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 6px 8px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }

    .domain-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      margin-top: 4px;
    }

    .domain-table th {
      background: var(--primary-navy);
      color: #ffffff;
      padding: 4px 6px;
      text-align: left;
      font-size: 8px;
    }

    .domain-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #f1f5f9;
    }

    /* Overview Section */
    .overview-box {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: #ffffff;
      margin-bottom: 6px;
    }

    .overview-left {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex: 1;
    }

    .target-circle {
      width: 26px;
      height: 26px;
      background: #e0f2fe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-cyan);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .overview-title {
      font-size: 10px;
      font-weight: 800;
      color: var(--primary-teal);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .overview-text {
      font-size: 8.5px;
      color: #334155;
      line-height: 1.35;
      text-align: justify;
    }

    .head-silhouette {
      width: 50px;
      height: 50px;
      flex-shrink: 0;
      opacity: 0.9;
    }

    /* Standardized Footer */
    .page-footer {
      background: var(--primary-navy);
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8px;
      font-weight: 600;
      position: relative;
      z-index: 2;
    }

    .page-footer .footer-left {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .page-footer .page-number {
      font-weight: 700;
      background: var(--primary-teal);
      padding: 2px 8px;
      border-radius: 9999px;
    }

    /* ======================================================== */
    /* PAGE 2 STYLES                                            */
    /* ======================================================== */
    .interpret-intro {
      font-size: 8.5px;
      color: #334155;
      margin-bottom: 6px;
      line-height: 1.35;
    }

    .strengths-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }

    .strength-card {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 8px 10px;
      background: #ffffff;
    }

    .pill-green {
      background: #15803d;
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 6px;
    }

    .pill-orange {
      background: #ea580c;
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 6px;
    }

    .point-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 8px;
      color: #334155;
      line-height: 1.3;
    }

    .point-circle-green {
      width: 13px;
      height: 13px;
      background: #dcfce7;
      color: #15803d;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 800;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .point-circle-orange {
      width: 13px;
      height: 13px;
      background: #ffedd5;
      color: #ea580c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 800;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* 6 Pattern Analysis Cards */
    .pattern-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }

    .pattern-card {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 6px 8px;
      background: #ffffff;
      font-size: 8px;
    }

    .pattern-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }

    .pattern-title {
      font-weight: 800;
      color: var(--primary-navy);
      font-size: 8px;
    }

    /* Peminatan IPA / IPS Section */
    .stream-box {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 6px 10px;
      margin-bottom: 8px;
      background: #ffffff;
    }

    .stream-3col {
      display: grid;
      grid-template-columns: 1fr 0.8fr 1fr;
      gap: 12px;
      align-items: center;
      text-align: center;
    }

    .donut-meter-container {
      position: relative;
      width: 60px;
      height: 60px;
      margin: 0 auto 4px auto;
    }

    .donut-meter-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 13px;
      font-weight: 900;
    }

    .stream-desc {
      font-size: 7.5px;
      color: var(--text-muted);
      line-height: 1.25;
      margin-bottom: 4px;
    }

    .stream-pill {
      font-size: 7.5px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 9999px;
      display: inline-block;
    }

    /* Matriks Jurusan Table */
    .majors-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 6px;
    }

    .majors-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .majors-table th {
      background: var(--primary-navy);
      color: #ffffff;
      padding: 3.5px 5px;
      font-size: 7.5px;
    }

    .majors-table td {
      padding: 3px 5px;
      border-bottom: 1px solid #f1f5f9;
    }

    /* 3-Column Recommendations */
    .recom-3col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }

    .recom-box {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 6px 8px;
      background: #ffffff;
      font-size: 7.5px;
    }

    .recom-title {
      font-weight: 800;
      color: var(--primary-navy);
      font-size: 8px;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .recom-list {
      list-style: none;
    }

    .recom-list li {
      margin-bottom: 2px;
      padding-left: 8px;
      position: relative;
      line-height: 1.25;
      color: #334155;
    }

    .recom-list li::before {
      content: "•";
      color: var(--primary-cyan);
      position: absolute;
      left: 0;
      font-weight: 800;
    }

    /* Signatures and Validation Section */
    .validation-row {
      display: grid;
      grid-template-columns: 1fr 1.1fr 1fr;
      gap: 12px;
      align-items: flex-end;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid #e2e8f0;
    }

    .wechsler-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 6.5px;
      color: var(--text-muted);
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .wechsler-table th {
      background: #f1f5f9;
      color: var(--primary-navy);
      padding: 2px 4px;
      font-weight: 700;
    }

    .wechsler-table td {
      padding: 1.5px 4px;
      border-top: 1px solid #f8fafc;
    }

    .sig-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
    }

    .sig-right {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .sig-cursive {
      font-family: 'Caveat', cursive;
      font-size: 26px;
      color: #1e3a8a;
      line-height: 1;
      margin: 1px 0;
      transform: rotate(-3deg);
    }

    /* PSIKOEDU Stamp Seal */
    .psikoedu-seal {
      width: 65px;
      height: 65px;
      border: 2px dashed #0284c7;
      border-radius: 50%;
      position: absolute;
      top: 5px;
      right: 15px;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: rotate(-12deg);
      opacity: 0.85;
      background: rgba(224, 242, 254, 0.25);
    }

    .psikoedu-seal .seal-circle {
      width: 53px;
      height: 53px;
      border: 1px solid #0284c7;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .psikoedu-seal span.psi {
      font-size: 16px;
      font-weight: 900;
      color: #0369a1;
      line-height: 1;
    }

    .psikoedu-seal span.txt {
      font-size: 4.5px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Print Media Query */
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .report-wrapper {
        gap: 0 !important;
      }

      .a4-page {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        page-break-after: always;
        break-after: page;
        margin: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
      }

      @page {
        size: A4 portrait;
        margin: 0;
      }
    }
  </style>
</head>
<body>

  <div class="report-wrapper">

    <!-- ======================================================== -->
    <!-- HALAMAN 1: PROFIL SUBTES & GRAFIK KEMAMPUAN IST          -->
    <!-- ======================================================== -->
    <div class="a4-page" id="page-1">
      
      <!-- Corner Decorative Accent -->
      <svg class="corner-accent-top" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0C60 0 140 80 140 140V0H0Z" fill="${theme.secondaryAccent}" opacity="0.14"/>
        <path d="M40 0C80 0 140 60 140 100V0H40Z" fill="${theme.tertiaryAccent}" opacity="0.25"/>
      </svg>

      <div>
        <!-- Standard Header -->
        <div class="header-container">
          <div class="brand-box">
            <div class="logo-square">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.78 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z"/>
              </svg>
            </div>
            <div>
              <div class="brand-title">PSIKOEDU</div>
              <div class="brand-subtitle">Layanan Psikologi &amp; Pengembangan Potensi</div>
            </div>
          </div>

          <div class="header-center">
            <h1>LAPORAN HASIL</h1>
            <h2>PEMERIKSAAN PSIKOTES</h2>
            <h3>INTELLIGENZ STRUKTUR TEST (IST)</h3>
            <span class="pill-badge">${sanitize(participant.pendidikan || 'SISWA SMP')}</span>
          </div>

          <div class="meta-box">
            <div><span class="lbl">Tanggal Pemeriksaan : </span><strong>${sanitize(participant.tanggalTes)}</strong></div>
            <div><span class="lbl">Pemeriksa : </span><strong>${sanitize(psychologistTitle)}</strong></div>
            <div><span class="lbl">Tujuan Pemeriksaan : </span><strong>Evaluasi potensi intelektual</strong></div>
          </div>
        </div>

        <!-- 1. IDENTITAS PESERTA -->
        <div class="section-header-pill">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          1. IDENTITAS PESERTA
        </div>

        <div class="section-box">
          <div class="info-grid">
            <div>
              <div class="info-item">
                <div class="info-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>
                <span class="info-label">Nama</span>
                <span>: </span><strong class="info-value">${sanitize(participant.nama)}</strong>
              </div>
              <div class="info-item">
                <div class="info-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg></div>
                <span class="info-label">Jenis Kelamin</span>
                <span>: </span><span class="info-value">${participant.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              </div>
              <div class="info-item">
                <div class="info-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg></div>
                <span class="info-label">Usia</span>
                <span>: </span><span class="info-value">${sanitize(participant.usia)} tahun</span>
              </div>
              <div class="info-item">
                <div class="info-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg></div>
                <span class="info-label">Sekolah</span>
                <span>: </span><span class="info-value">${sanitize(institutionName)}</span>
              </div>
              <div class="info-item">
                <div class="info-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg></div>
                <span class="info-label">Kelas</span>
                <span>: </span><span class="info-value">${sanitize(participant.pendidikan)}</span>
              </div>
            </div>

            <div>
              <div class="info-item">
                <span class="info-label">Tanggal Lahir</span>
                <span>: </span><span class="info-value">${sanitize(participant.tanggalLahir)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tanggal Tes</span>
                <span>: </span><span class="info-value">${sanitize(participant.tanggalTes)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Pemeriksa</span>
                <span>: </span><span class="info-value">${sanitize(psychologistName)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. TINGKAT KECERDASAN UMUM (IQ) -->
        <div class="section-header-pill">
          2. TINGKAT KECERDASAN UMUM (IQ)
        </div>

        <div class="section-box">
          <div class="iq-row">
            <div class="iq-score-block">
              <span class="iq-lbl">IQ TOTAL</span>
              <span class="iq-number">${participant.totalIQ}</span>
            </div>
            <div class="iq-cat-block">
              <span class="iq-cat-pill">${sanitize(participant.iqCategory.toUpperCase())}</span>
            </div>
          </div>
          <p class="iq-explanation">
            IQ <strong>${participant.totalIQ}</strong> menunjukkan bahwa kemampuan intelektual umum berada pada kategori 
            <strong>${sanitize(participant.iqCategory)}</strong>, yaitu lebih tinggi daripada sekitar 
            <strong>${totalPercentile}%</strong> dari populasi seusianya. (Persentil ${totalPercentile})
          </p>
        </div>

        <!-- 3. PROFIL HASIL 9 SUBTES IST -->
        <div class="section-header-pill">
          3. PROFIL HASIL 9 SUBTES IST
        </div>

        <table class="subtests-table">
          <thead>
            <tr>
              <th class="tc" style="width: 25px;">No.</th>
              <th style="width: 50px;">Kode</th>
              <th style="width: 120px;">Subtes IST</th>
              <th>Aspek yang Diukur</th>
              <th class="tc" style="width: 55px;">Skor Mentah (RW)</th>
              <th class="tc" style="width: 55px;">Skor Standar (SS)</th>
              <th class="tc" style="width: 40px;">IQ</th>
              <th class="tc" style="width: 50px;">Persentil (%)</th>
              <th class="tc" style="width: 90px;">Kategori</th>
            </tr>
          </thead>
          <tbody>
            ${subtests.map((sub, idx) => {
              const meta = subtestMeta[sub.code] || { code: sub.code, name: sub.name, aspect: sub.measuredAspect, color: '#0284c7' };
              const catClass = sub.iq >= 115 ? 'green' : (sub.iq >= 105 ? 'teal' : (sub.iq >= 90 ? 'blue' : 'amber'));
              return `
                <tr>
                  <td class="tc" style="color: #64748b;">${idx + 1}</td>
                  <td>
                    <div class="badge-sub">
                      <span class="sub-icon" style="background-color: ${meta.color};">${sub.code}</span>
                      <span>${sub.code}</span>
                    </div>
                  </td>
                  <td><strong>${sanitize(meta.name)}</strong></td>
                  <td style="color: #475569; font-size: 8px;">${sanitize(meta.aspect)}</td>
                  <td class="tc" style="font-family: monospace; font-weight: 600;">${sub.rw}</td>
                  <td class="tc" style="font-family: monospace; font-weight: 600;">${sub.ss}</td>
                  <td class="tc" style="font-family: monospace; font-weight: 800; color: var(--primary-navy);">${sub.iq}</td>
                  <td class="tc" style="font-family: monospace; color: #64748b;">${sub.percentile}%</td>
                  <td class="tc">
                    <span class="badge-cat ${catClass}">${sanitize(sub.category)}</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- 4. GRAFIK & 5. RINGKASAN RANAH -->
        <div class="dual-grid">
          
          <!-- 4. GRAFIK PROFIL KEMAMPUAN IST -->
          <div class="chart-container">
            <div>
              <div class="section-header-pill" style="margin-bottom: 2px;">
                4. GRAFIK PROFIL KEMAMPUAN IST
              </div>
              <div class="chart-stage">
                <!-- Sumbu Y -->
                <div class="chart-y-axis">
                  <span>150</span>
                  <span>130</span>
                  <span>110</span>
                  <span>90</span>
                  <span>70</span>
                  <span>50</span>
                </div>

                <!-- Canvas Bar -->
                <div class="chart-canvas">
                  <!-- Dotted reference lines -->
                  <div class="chart-guide-line" style="bottom: 90%;"><span class="chart-guide-label">Sangat Tinggi (140+)</span></div>
                  <div class="chart-guide-line" style="bottom: 70%;"><span class="chart-guide-label">Tinggi (120-139)</span></div>
                  <div class="chart-guide-line" style="bottom: 50%;"><span class="chart-guide-label">Rata-rata Atas (110-119)</span></div>
                  <div class="chart-guide-line" style="bottom: 30%;"><span class="chart-guide-label">Rata-rata (90-109)</span></div>
                  <div class="chart-guide-line" style="bottom: 15%;"><span class="chart-guide-label">Rata-rata Bawah (80-89)</span></div>

                  <!-- 9 Bars -->
                  ${subtests.map((sub) => {
                    const meta = subtestMeta[sub.code] || { color: '#0284c7' };
                    const minScale = 50;
                    const maxScale = 150;
                    const heightPct = Math.min(100, Math.max(10, ((sub.iq - minScale) / (maxScale - minScale)) * 100));
                    return `
                      <div class="bar-col">
                        <span class="bar-val">${sub.iq}</span>
                        <div class="bar-fill" style="height: ${heightPct}%; background-color: ${meta.color};"></div>
                        <span class="bar-lbl">${sub.code}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <div class="chart-star-note">
              <div class="star-circle">★</div>
              <span>Grafik di atas menggambarkan profil kemampuan intelektual Anda pada masing-masing subtes. Kekuatan utama tampak pada subtes <strong>${highestSub.code} (${sanitize(highestSub.name)})</strong>.</span>
            </div>
          </div>

          <!-- 5. RINGKASAN RANAH KEMAMPUAN -->
          <div class="domain-container">
            <div class="section-header-pill" style="margin-bottom: 2px;">
              5. RINGKASAN RANAH KEMAMPUAN
            </div>
            
            <table class="domain-table">
              <thead>
                <tr>
                  <th>Ranah Kemampuan</th>
                  <th>Subtes</th>
                  <th style="text-align: center;">IQ Rata-rata</th>
                  <th style="text-align: center;">Kategori</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Verbal</strong></td>
                  <td style="color: #64748b;">SE, WA, AN, GE</td>
                  <td style="text-align: center; font-family: monospace; font-weight: 800; color: var(--primary-navy);">${verbalAvg}</td>
                  <td style="text-align: center;"><span class="badge-cat green">${sanitize(verbalCat)}</span></td>
                </tr>
                <tr>
                  <td><strong>Angka</strong></td>
                  <td style="color: #64748b;">RA, ZR</td>
                  <td style="text-align: center; font-family: monospace; font-weight: 800; color: var(--primary-navy);">${numerikAvg}</td>
                  <td style="text-align: center;"><span class="badge-cat green">${sanitize(numerikCat)}</span></td>
                </tr>
                <tr>
                  <td><strong>Figural/Spasial</strong></td>
                  <td style="color: #64748b;">FA, WU</td>
                  <td style="text-align: center; font-family: monospace; font-weight: 800; color: var(--primary-navy);">${spasialAvg}</td>
                  <td style="text-align: center;"><span class="badge-cat green">${sanitize(spasialCat)}</span></td>
                </tr>
                <tr>
                  <td><strong>Memori</strong></td>
                  <td style="color: #64748b;">ME</td>
                  <td style="text-align: center; font-family: monospace; font-weight: 800; color: var(--primary-navy);">${memoriAvg}</td>
                  <td style="text-align: center;"><span class="badge-cat teal">${sanitize(memoriCat)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <!-- GAMBARAN UMUM -->
        <div class="overview-box">
          <div class="overview-left">
            <div class="target-circle">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/></svg>
            </div>
            <div>
              <div class="overview-title">GAMBARAN UMUM</div>
              <p class="overview-text">
                Anda memiliki kemampuan intelektual yang berada pada kategori <strong>${sanitize(participant.iqCategory)}</strong> dengan profil yang <strong>seimbang</strong>. Kekuatan utama Anda terlihat pada kemampuan <strong>${sanitize(highestSub.name)} (${highestSub.code})</strong> serta kemampuan bernalar logis yang baik. Dukungan yang tepat akan membantu Anda mengoptimalkan potensi dalam belajar dan meraih prestasi.
              </p>
            </div>
          </div>

          <div class="head-silhouette">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 80V70C25 60 30 50 40 45C35 40 35 30 40 20C45 10 60 10 68 18C75 25 75 35 70 42C78 48 80 58 80 70V80H25Z" fill="#e0f2fe"/>
              <circle cx="55" cy="38" r="14" fill="#0088a9" opacity="0.8"/>
              <path d="M55 30V46M47 38H63" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

      </div>

      <!-- Footer Page 1 -->
      <div class="page-footer">
        <div class="footer-left">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          <span>Laporan ini bersifat rahasia dan hanya untuk keperluan pengembangan potensi peserta.</span>
        </div>
        <div class="page-number">Halaman 1 dari 2</div>
      </div>

    </div>


    <!-- ======================================================== -->
    <!-- HALAMAN 2: INTERPRETASI, PEMINATAN & PENGESAHAN          -->
    <!-- ======================================================== -->
    <div class="a4-page" id="page-2">
      
      <!-- Corner Decorative Accent -->
      <svg class="corner-accent-top" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0C60 0 140 80 140 140V0H0Z" fill="${theme.secondaryAccent}" opacity="0.14"/>
        <path d="M40 0C80 0 140 60 140 100V0H40Z" fill="${theme.tertiaryAccent}" opacity="0.25"/>
      </svg>

      <div>
        <!-- 6. INTERPRETASI DAN ANALISIS HASIL -->
        <div class="section-header-pill">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          6. INTERPRETASI DAN ANALISIS HASIL
        </div>

        <p class="interpret-intro">
          Profil kemampuan <strong>${sanitize(participant.nama)}</strong> menunjukkan potensi intelektual yang baik dengan kecenderungan menonjol pada <strong>kemampuan verbal abstrak dan penalaran logis</strong>, serta kemampuan visual-spasial yang seimbang. Kemampuan angka berada pada kategori <strong>${sanitize(numerikCat)}</strong>.
        </p>

        <!-- KEKUATAN & PENGEMBANGAN DUA KOLOM -->
        <div class="strengths-grid">
          
          <!-- KEKUATAN UTAMA -->
          <div class="strength-card">
            <div class="pill-green">
              <span>✓</span> KEKUATAN UTAMA
            </div>
            <div class="point-item">
              <div class="point-circle-green">✓</div>
              <div><strong>Abstraksi verbal dan pembentukan konsep sangat baik (GE)</strong> — Mampu memahami ide utama dan membuat generalisasi dengan baik.</div>
            </div>
            <div class="point-item">
              <div class="point-circle-green">✓</div>
              <div><strong>Penalaran logis dan pemecahan masalah baik (AN, RA)</strong> — Dapat menemukan hubungan dan menyelesaikan masalah secara sistematis.</div>
            </div>
            <div class="point-item">
              <div class="point-circle-green">✓</div>
              <div><strong>Kemampuan visual-spasial baik (FA, WU)</strong> — Mudah memahami bentuk, pola, dan hubungan ruang.</div>
            </div>
            <div class="point-item">
              <div class="point-circle-green">✓</div>
              <div><strong>Konsentrasi dan daya ingat cukup baik (ME)</strong> — Mampu mengingat informasi dan mempertahankannya.</div>
            </div>
          </div>

          <!-- AREA YANG PERLU DIKEMBANGKAN -->
          <div class="strength-card">
            <div class="pill-orange">
              <span>!</span> AREA YANG PERLU DIKEMBANGKAN
            </div>
            <div class="point-item">
              <div class="point-circle-orange">1</div>
              <div><strong>Pemahaman dan penguasaan kosakata (WA)</strong> — Perlu memperbanyak membaca dan memperkaya perbendaharaan kata.</div>
            </div>
            <div class="point-item">
              <div class="point-circle-orange">2</div>
              <div><strong>Latihan penalaran angka bertahap (ZR)</strong> — Perlu pembiasaan dalam menemukan pola angka yang lebih kompleks.</div>
            </div>
            <div class="point-item">
              <div class="point-circle-orange">3</div>
              <div><strong>Strategi mengelola waktu saat bekerja pada tugas kompleks</strong> — Perlu peningkatan dalam efisiensi waktu dan ketelitian.</div>
            </div>
          </div>

        </div>

        <!-- ANALISIS POLA KEMAMPUAN (6 KOTAK) -->
        <div class="pattern-grid">
          <div class="pattern-card">
            <div class="pattern-card-header">
              <span class="pattern-title">Kemampuan Verbal</span>
              <span class="badge-cat green">BAIK</span>
            </div>
            <div style="color: #64748b; font-size: 7.5px;">Domain verbal kuat dengan abstraksi dan penalaran verbal yang menonjol.</div>
          </div>
          <div class="pattern-card">
            <div class="pattern-card-header">
              <span class="pattern-title">Kemampuan Angka</span>
              <span class="badge-cat amber">RATA-RATA</span>
            </div>
            <div style="color: #64748b; font-size: 7.5px;">Dasar berhitung baik, namun perlu penguatan pada penalaran pola angka.</div>
          </div>
          <div class="pattern-card">
            <div class="pattern-card-header">
              <span class="pattern-title">Kemampuan Figural</span>
              <span class="badge-cat green">BAIK</span>
            </div>
            <div style="color: #64748b; font-size: 7.5px;">Daya bayang ruang dan analisis visual-spasial tergolong baik.</div>
          </div>
          <div class="pattern-card">
            <div class="pattern-card-header">
              <span class="pattern-title">Memori</span>
              <span class="badge-cat amber">RATA-RATA</span>
            </div>
            <div style="color: #64748b; font-size: 7.5px;">Daya ingat baik namun perlu latihan konsistensi atensi lebih lama.</div>
          </div>
          <div class="pattern-card">
            <div class="pattern-card-header">
              <span class="pattern-title">Fleksibilitas Berpikir</span>
              <span class="badge-cat green">BAIK</span>
            </div>
            <div style="color: #64748b; font-size: 7.5px;">Mampu melihat hubungan antar konsep dan menemukan pola alternatif.</div>
          </div>
          <div class="pattern-card">
            <div class="pattern-card-header">
              <span class="pattern-title">Komprehensif (GE+FA)</span>
              <span class="badge-cat green">BAIK</span>
            </div>
            <div style="color: #64748b; font-size: 7.5px;">Mampu memahami konsep abstrak dan menerapkannya dalam visual.</div>
          </div>
        </div>

        <!-- 7. INDIKASI ARAH PEMINATAN (IPA / IPS) -->
        <div class="section-header-pill">
          <svg viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 4.5l6 5.4v6.1H6v-6.1l6-5.4z"/></svg>
          7. INDIKASI ARAH PEMINATAN (IPA / IPS)
        </div>

        <div class="stream-box">
          <div class="stream-3col">
            
            <!-- IPA -->
            <div>
              <div style="font-size: 8px; font-weight: 800; color: var(--primary-navy); margin-bottom: 2px;">KECENDERUNGAN IPA (RA, ZR, FA, WU)</div>
              <div class="donut-meter-container">
                <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" stroke-width="4.5"/>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0088a9" stroke-dasharray="${ipaPercent}, 100" stroke-width="4.5"/>
                </svg>
                <div class="donut-meter-text" style="color: var(--primary-teal);">${ipaPercent}%</div>
              </div>
              <div class="stream-desc">Kelompok kemampuan angka dan visual-spasial relatif lebih kuat.</div>
              <span class="stream-pill" style="border: 1px solid var(--primary-teal); color: var(--primary-teal); background: #f0fdfa;">KECOCOKAN TINGGI</span>
            </div>

            <!-- KESIMPULAN TENGAH -->
            <div style="border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 0 8px;">
              <div style="font-size: 16px; margin-bottom: 2px;">🏆</div>
              <div style="font-size: 8px; font-weight: 800; color: var(--primary-navy); margin-bottom: 2px;">KESIMPULAN PEMINATAN</div>
              <p style="font-size: 7.5px; color: #475569; line-height: 1.25;">
                Anda memiliki kecocokan relatif lebih tinggi pada peminatan <strong>${participant.streamAnalysis?.preference || 'IPA'}</strong>, namun potensi <strong>${participant.streamAnalysis?.preference === 'IPA' ? 'IPS' : 'IPA'}</strong> juga cukup baik.
              </p>
            </div>

            <!-- IPS -->
            <div>
              <div style="font-size: 8px; font-weight: 800; color: #ea580c; margin-bottom: 2px;">KECENDERUNGAN IPS (SE, WA, GE, ME)</div>
              <div class="donut-meter-container">
                <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" stroke-width="4.5"/>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ea580c" stroke-dasharray="${ipsPercent}, 100" stroke-width="4.5"/>
                </svg>
                <div class="donut-meter-text" style="color: #ea580c;">${ipsPercent}%</div>
              </div>
              <div class="stream-desc">Kemampuan verbal dan memori berada pada kategori baik.</div>
              <span class="stream-pill" style="border: 1px solid #ea580c; color: #ea580c; background: #fff7ed;">KECOCOKAN BAIK</span>
            </div>

          </div>
          <div style="font-size: 7px; color: #64748b; margin-top: 4px; text-align: center;">
            ★ <em>Catatan: Kecenderungan di atas bukan penentu mutlak. Minat, motivasi, dan nilai kepribadian sangat penting untuk dipertimbangkan.</em>
          </div>
        </div>

        <!-- 7 (B). POTENSI BIDANG STUDI / JURUSAN KULIAH -->
        <div class="section-header-pill">
          <svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
          7. POTENSI BIDANG STUDI / JURUSAN KULIAH
        </div>
        <div style="font-size: 7.5px; color: #64748b; margin-bottom: 4px;">
          Berikut bidang studi yang sesuai dengan profil kemampuan Anda (Semakin banyak ✓ berarti semakin sesuai):
        </div>

        <div class="majors-grid">
          <table class="majors-table">
            <thead>
              <tr>
                <th>Jurusan / Bidang Studi</th>
                <th>Subtes Kunci</th>
                <th style="text-align: center;">Kesesuaian</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><strong>Kedokteran</strong></td><td style="color:#64748b;">SE, AN, GE, FA, WU</td><td style="text-align:center; color:#15803d; font-weight:800;">✓✓✓✓</td></tr>
              <tr><td><strong>Teknik</strong></td><td style="color:#64748b;">SE, AN, GE, RA, ZR, FA, WU</td><td style="text-align:center; color:#15803d; font-weight:800;">✓✓✓✓</td></tr>
              <tr><td><strong>MIPA</strong></td><td style="color:#64748b;">AN, GE, RA, ZR, FA, WU</td><td style="text-align:center; color:#15803d; font-weight:800;">✓✓✓✓</td></tr>
              <tr><td><strong>Ekonomi</strong></td><td style="color:#64748b;">SE, AN, RA, ZR</td><td style="text-align:center; color:#15803d; font-weight:800;">✓✓✓✓</td></tr>
              <tr><td><strong>Sistem Informasi</strong></td><td style="color:#64748b;">SE, AN, GE</td><td style="text-align:center; color:#0369a1; font-weight:800;">✓✓✓</td></tr>
              <tr><td><strong>Psikologi</strong></td><td style="color:#64748b;">SE, WA, AN, GE, ME</td><td style="text-align:center; color:#0369a1; font-weight:800;">✓✓</td></tr>
            </tbody>
          </table>

          <table class="majors-table">
            <thead>
              <tr>
                <th>Jurusan / Bidang Studi</th>
                <th>Subtes Kunci</th>
                <th style="text-align: center;">Kesesuaian</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><strong>Hukum</strong></td><td style="color:#64748b;">SE, AN, GE, ME</td><td style="text-align:center; color:#0369a1; font-weight:800;">✓✓✓</td></tr>
              <tr><td><strong>Sastra</strong></td><td style="color:#64748b;">WA, AN, GE, ME</td><td style="text-align:center; color:#0369a1; font-weight:800;">✓✓✓</td></tr>
              <tr><td><strong>Ilmu Komunikasi</strong></td><td style="color:#64748b;">SE, WA, AN, ME</td><td style="text-align:center; color:#0369a1; font-weight:800;">✓✓✓</td></tr>
              <tr><td><strong>Pertanian</strong></td><td style="color:#64748b;">AN, GE, FA, WU</td><td style="text-align:center; color:#0369a1; font-weight:800;">✓✓✓</td></tr>
              <tr><td><strong>Peternakan</strong></td><td style="color:#64748b;">AN, FA, WU</td><td style="text-align:center; color:#0369a1; font-weight:800;">✓✓</td></tr>
              <tr><td><strong>Seni Rupa</strong></td><td style="color:#64748b;">AN, ZR, FA, WU</td><td style="text-align:center; color:#0369a1; font-weight:800;">✓✓</td></tr>
            </tbody>
          </table>
        </div>

        <!-- 3 KOLOM REKOMENDASI, STRATEGI, KESIMPULAN -->
        <div class="recom-3col">
          <div class="recom-box">
            <div class="recom-title">
              <span style="color:#9333ea;">★</span> 8. REKOMENDASI PENGEMBANGAN
            </div>
            <ul class="recom-list">
              <li>Pertahankan konsistensi belajar pada bidang sains dan matematika.</li>
              <li>Tingkatkan membaca buku untuk memperluas kosa kata (WA).</li>
              <li>Ikuti klub sains atau robotika untuk mengasah logika visual.</li>
              <li>Latih kemampuan presentasi dan komunikasi publik.</li>
            </ul>
          </div>

          <div class="recom-box">
            <div class="recom-title">
              <span style="color:#0284c7;">✎</span> 10. STRATEGI BELAJAR
            </div>
            <ul class="recom-list">
              <li>Gunakan diagram dan mind-mapping untuk materi konseptual.</li>
              <li>Lakukan latihan bertahap pada penalaran deret angka.</li>
              <li>Buat jadwal belajar teratur dengan target waktu yang jelas.</li>
              <li>Diskusikan topik belajar bersama teman kelompok.</li>
            </ul>
          </div>

          <div class="recom-box">
            <div class="recom-title">
              <span style="color:#16a34a;">✔</span> 11. KESIMPULAN KLINIS
            </div>
            <p style="color: #334155; line-height: 1.25;">
              Subjek memiliki potensi intelektual prima pada kategori <strong>${sanitize(participant.iqCategory)}</strong> dengan daya nalar abstrak dan spasial yang sangat mendukung keberhasilan akademik pada jenjang lanjutan.
            </p>
          </div>
        </div>

        <!-- VALIDASI & TANDA TANGAN -->
        <div class="validation-row">
          
          <!-- Wechsler Table -->
          <div>
            <div style="font-size: 7px; font-weight: 800; color: var(--primary-navy); margin-bottom: 2px;">KETERANGAN KATEGORI IQ (Wechsler)</div>
            <table class="wechsler-table">
              <tr>
                <td><strong>≥ 130</strong> : Sangat Tinggi</td>
                <td><strong>90 - 109</strong> : Rata-rata</td>
              </tr>
              <tr>
                <td><strong>120 - 129</strong> : Tinggi</td>
                <td><strong>80 - 89</strong> : Rata-rata Bawah</td>
              </tr>
              <tr>
                <td><strong>110 - 119</strong> : Rata-rata Atas</td>
                <td><strong>≤ 79</strong> : Rendah</td>
              </tr>
            </table>
          </div>

          <!-- Pemeriksa & Stamp Seal -->
          <div class="sig-center">
            <div style="font-size: 7.5px; color: var(--text-muted); margin-bottom: 2px;">Pemeriksa,</div>
            <div class="sig-cursive">Dewi Lestari</div>
            <div style="font-size: 8px; font-weight: 800; color: var(--primary-navy);">${sanitize(psychologistName)}</div>
            <div style="font-size: 7px; color: var(--text-muted);">${sanitize(psychologistTitle)} • ${sanitize(psychologistSipp)}</div>

            <!-- PSIKOEDU Official Stamp -->
            <div class="psikoedu-seal">
              <div class="seal-circle">
                <span class="psi">Ψ</span>
                <span class="txt">PSIKOEDU</span>
                <span class="txt" style="font-size:3.5px;">LAYANAN PSIKOLOGI</span>
              </div>
            </div>
          </div>

          <!-- Peserta -->
          <div class="sig-right">
            <div style="font-size: 7.5px; color: var(--text-muted); margin-bottom: 2px;">${sanitize(institutionCity)}, ${sanitize(participant.tanggalTes)}</div>
            <div style="font-size: 7.5px; color: var(--text-muted);">Peserta,</div>
            <div class="sig-cursive" style="font-size: 22px;">${sanitize(participant.nama.split(' ')[0])}</div>
            <div style="font-size: 8px; font-weight: 800; color: var(--primary-navy); border-top: 1px solid #cbd5e1; padding-top: 1px; min-width: 100px;">
              ( ${sanitize(participant.nama)} )
            </div>
          </div>

        </div>

      </div>

      <!-- Footer Page 2 -->
      <div class="page-footer">
        <div class="footer-left">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          <span>Laporan ini bersifat rahasia dan hanya untuk keperluan pengembangan potensi peserta.</span>
        </div>
        <div class="page-number">Halaman 2 dari 2</div>
      </div>

    </div>

  </div>

</body>
</html>`;
}

export function downloadReportAsHtml(participant: Participant, settings: AppSettings, themeIdOverride?: ReportThemeId) {
  const htmlContent = generateReportHtml(participant, settings, themeIdOverride);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedName = participant.nama.replace(/[^a-zA-Z0-9]/g, '_');
  link.href = url;
  link.download = `Laporan_IST_${sanitizedName}_${participant.nomorTes.replace(/[/\\?%*:|"<>]/g, '-')}.html`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 2000);
}
