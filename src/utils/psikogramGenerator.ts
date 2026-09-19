import { jsPDF } from 'jspdf';
import { ScoredParticipantResult } from './scoringEngine';

export function generatePsikogramPdf(participant: ScoredParticipantResult) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const today = new Date().toLocaleDateString('id-ID');

  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('LAPORAN HASIL TES INTELEGENSI (IST)', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Nama: ${participant.nama}`, 20, 35);
  doc.text(`No. Tes: ${participant.nomorTes}`, 20, 42);
  doc.text(`Usia: ${participant.usia}`, 20, 49);
  doc.text(`Sekolah: ${participant.sekolah}`, 20, 56);
  
  doc.text(`IQ: ${participant.totalIQ} (${participant.iqCategory})`, 130, 35);
  doc.text(`Peminatan: ${participant.streamPreference}`, 130, 42);
  doc.text(`Tanggal: ${today}`, 130, 49);

  // Draw table for subtests
  doc.setFontSize(11);
  doc.text('Rincian Skor Subtes', 20, 70);
  
  let startY = 75;
  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, startY, 170, 8, 'F');
  
  doc.text('Subtes', 25, startY + 5);
  doc.text('Kemampuan', 55, startY + 5);
  doc.text('RS', 120, startY + 5);
  doc.text('SW', 140, startY + 5);
  doc.text('Kategori', 160, startY + 5);
  
  startY += 8;
  
  participant.subtestDetails.forEach((sub, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, startY, 170, 8, 'F');
    }
    doc.text(`${sub.code} - ${sub.name.slice(0, 15)}`, 25, startY + 5);
    
    // Simplification for ability mapping
    let ability = '';
    switch(sub.code) {
      case 'SE': ability = 'Berpikir mandiri, empati, & komprehensi'; break;
      case 'WA': ability = 'Kemampuan bahasa & menangkap inti'; break;
      case 'AN': ability = 'Fleksibilitas berpikir & analogi'; break;
      case 'GE': ability = 'Kemampuan abstraksi & pembentukan konsep'; break;
      case 'RA': ability = 'Berpikir praktis hitungan & logis'; break;
      case 'ZR': ability = 'Berpikir teoretis hitungan (deret)'; break;
      case 'FA': ability = 'Imajinasi visual & antisipasi'; break;
      case 'WU': ability = 'Daya bayang ruang 3 dimensi'; break;
      case 'ME': ability = 'Daya ingat & retensi konsentrasi'; break;
    }
    
    doc.text(ability, 55, startY + 5);
    doc.text(sub.rw.toString(), 122, startY + 5);
    doc.text(sub.ss.toString(), 142, startY + 5);
    doc.text(sub.category, 160, startY + 5);
    
    startY += 8;
  });

  // Draw chart frame (Psikogram)
  startY += 10;
  doc.setFontSize(11);
  doc.text('Grafik Psikogram (Standard Score)', 20, startY);
  startY += 5;
  
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, startY, 170, 80);
  
  // Chart Grid
  doc.setFontSize(8);
  const chartHeight = 80;
  const chartWidth = 170;
  const chartY = startY;
  const chartX = 20;
  
  // Subtest labels (X axis)
  const codes = ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME'];
  const stepX = chartWidth / codes.length;
  
  // Y Axis (SW: 60 - 130)
  const minSw = 60;
  const maxSw = 130;
  const rangeSw = maxSw - minSw;
  
  // Draw horizontal grid lines
  for (let i = 0; i <= 7; i++) {
    const v = 60 + i * 10; // 60, 70, 80 ... 130
    const py = chartY + chartHeight - ((v - minSw) / rangeSw) * chartHeight;
    doc.setDrawColor(220, 220, 220);
    doc.line(chartX, py, chartX + chartWidth, py);
    doc.text(v.toString(), chartX - 6, py + 1);
  }
  
  // Draw standard zone
  doc.setFillColor(230, 245, 230);
  const y90 = chartY + chartHeight - ((90 - minSw) / rangeSw) * chartHeight;
  const y110 = chartY + chartHeight - ((110 - minSw) / rangeSw) * chartHeight;
  doc.rect(chartX, y110, chartWidth, y90 - y110, 'F');
  
  doc.setTextColor(150, 150, 150);
  doc.text('Rata-rata', chartX + chartWidth - 15, y90 - 2);

  // Re-draw grid lines over zone
  for (let i = 0; i <= 7; i++) {
    const v = 60 + i * 10;
    const py = chartY + chartHeight - ((v - minSw) / rangeSw) * chartHeight;
    doc.setDrawColor(220, 220, 220);
    doc.line(chartX, py, chartX + chartWidth, py);
  }

  // Draw profile line
  doc.setDrawColor(50, 100, 200);
  doc.setLineWidth(1);
  doc.setFillColor(50, 100, 200);
  
  let prevX = 0, prevY = 0;
  
  codes.forEach((code, i) => {
    const sub = participant.subtestDetails.find(s => s.code === code);
    const sw = sub ? sub.ss : 60;
    
    // Clamp between 60 and 130
    const clampedSw = Math.max(minSw, Math.min(maxSw, sw));
    
    const px = chartX + (i * stepX) + (stepX / 2);
    const py = chartY + chartHeight - ((clampedSw - minSw) / rangeSw) * chartHeight;
    
    // X Label
    doc.setTextColor(50, 50, 50);
    doc.text(code, px - 2, chartY + chartHeight + 4);
    
    // Line
    if (i > 0) {
      doc.line(prevX, prevY, px, py);
    }
    
    // Point
    doc.circle(px, py, 1.5, 'FD');
    
    // Text value
    doc.setFontSize(7);
    doc.text(sw.toString(), px - 2, py - 3);
    doc.setFontSize(8);
    
    prevX = px;
    prevY = py;
  });

  // Strengths and Weaknesses
  startY += 100;
  doc.setFontSize(11);
  doc.text('Keterangan Peminatan', 20, startY);
  
  doc.setFontSize(9);
  doc.text(participant.streamDescription, 20, startY + 8, { maxWidth: 170 });
  
  // Save
  doc.save(`Psikogram_${participant.nama.replace(/\s+/g, '_')}_${participant.nomorTes}.pdf`);
}
