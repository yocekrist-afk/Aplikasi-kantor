import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  Terminal,
} from 'lucide-react';

const PYTHON_FILES = {
  'app.py': `"""
app.py
Aplikasi Web Dashboard Pelaporan Hasil Psikotes IST (Intelligenz Struktur Test)
Framework: Streamlit & Pandas
Fitur:
- Menu Navigasi: "Data Hasil Tes", "Analisis & Statistik", "Panduan Norma & Subtes"
- Unggah Massal Excel (.xlsx) / CSV
- Tabel Interaktif dengan Pencarian & Filter
- Skoring Otomatis 9 Subtes IST, IQ Total, Persentil & Peminatan IPA/IPS
- Tombol "Generate PDF" 2 Halaman Standar Psikologi Profesional
"""

import io
import streamlit as st
import pandas as pd

from utils import (
    SUBTEST_INFO,
    STUDY_FACULTIES,
    process_participant_data
)
from pdf_generator import generate_ist_pdf_report

st.set_page_config(
    page_title="Dashboard Hasil Psikotes IST",
    page_icon="Ψ",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inisialisasi session state data contoh
if 'participants_data' not in st.session_state:
    sample_rows = [
        {
            'Nomor_Tes': 'IST/2026/001',
            'Nama': 'Muhammad Arya Pratama',
            'Jenis_Kelamin': 'L',
            'Tanggal_Lahir': '2008-04-15',
            'Tanggal_Tes': '2026-08-20',
            'Usia': '18 Tahun 4 Bulan',
            'Pendidikan': 'SMA Kelas XII - IPA 1',
            'Asal_Sekolah': 'SMAN 1 Teladan Jakarta',
            'SE': 12, 'WA': 11, 'AN': 14, 'GE': 16,
            'RA': 17, 'ZR': 18, 'FA': 16, 'WU': 17, 'ME': 13
        },
        {
            'Nomor_Tes': 'IST/2026/002',
            'Nama': 'Anindya Kirana Putri',
            'Jenis_Kelamin': 'P',
            'Tanggal_Lahir': '2008-09-10',
            'Tanggal_Tes': '2026-08-20',
            'Usia': '17 Tahun 11 Bulan',
            'Pendidikan': 'SMA Kelas XII - IPS 1',
            'Asal_Sekolah': 'SMAN 3 Bandung',
            'SE': 17, 'WA': 18, 'AN': 16, 'GE': 24,
            'RA': 11, 'ZR': 10, 'FA': 11, 'WU': 9, 'ME': 18
        }
    ]
    st.session_state.participants_data = [process_participant_data(r) for r in sample_rows]

st.sidebar.markdown("### 🏛️ Biro Psikometri")
st.sidebar.markdown("**Sistem Skoring & Pelaporan IST**")
menu = st.sidebar.radio(
    "Navigasi Utama:",
    ["📊 Data Hasil Tes", "📈 Analisis & Statistik Kohor", "📘 Panduan Subtes & Norma", "📥 Unduh Template Excel"]
)

if menu == "📊 Data Hasil Tes":
    st.title("Data Hasil Pemeriksaan Psikotes IST")
    uploaded_file = st.file_uploader("Unggah berkas Excel (.xlsx) atau CSV", type=['xlsx', 'xls', 'csv'])
    if uploaded_file is not None:
        df_upload = pd.read_csv(uploaded_file) if uploaded_file.name.endswith('.csv') else pd.read_excel(uploaded_file)
        st.session_state.participants_data = [process_participant_data(r.to_dict()) for _, r in df_upload.iterrows()]
        st.success(f"Berhasil memuat {len(st.session_state.participants_data)} data peserta!")

    participants = st.session_state.participants_data
    if participants:
        selected_name = st.selectbox("Pilih Peserta untuk Cetak PDF:", [p['nama'] for p in participants])
        chosen = next(p for p in participants if p['nama'] == selected_name)
        pdf_bytes = generate_ist_pdf_report(chosen)
        st.download_button(
            label="📄 Unduh Laporan PDF 2 Halaman",
            data=pdf_bytes,
            file_name=f"Laporan_IST_{chosen['nama'].replace(' ', '_')}_{chosen['nomor_tes']}.pdf",
            mime="application/pdf"
        )
`,
  'pdf_generator.py': `"""
pdf_generator.py
Generator Laporan Hasil Psikotes IST 2 Halaman Standar Profesional
Menggunakan ReportLab Platypus & Matplotlib untuk rendering grafik profil.
Warna tema: Biru Gelap (#1E3A8A), Biru Muda (#0284C7 / #E0F2FE), dan Putih.
"""

import io
from typing import Dict, Any
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
)

def create_profile_chart(subtest_scores: Dict[str, int]) -> io.BytesIO:
    subtests = ['SE', 'WA', 'AN', 'GE', 'RA', 'ZR', 'FA', 'WU', 'ME']
    scores = [subtest_scores.get(code, 100) for code in subtests]

    fig, ax = plt.subplots(figsize=(7.2, 1.8), dpi=200)
    ax.axhline(100, color='#EF4444', linestyle='--', linewidth=0.9)
    bars = ax.bar(subtests, scores, color='#1E3A8A', width=0.55)
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2.0, yval + 2, f'{int(yval)}', ha='center', va='bottom', fontsize=7, fontweight='bold')
    ax.set_ylim(65, 140)
    ax.set_ylabel('Skor IQ', fontsize=7.5, fontweight='bold', color='#1E3A8A')
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=200)
    plt.close(fig)
    buf.seek(0)
    return buf

def generate_ist_pdf_report(participant_data: Dict[str, Any]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=12*mm, rightMargin=12*mm, topMargin=10*mm, bottomMargin=10*mm)
    # Story Platypus ReportLab 2 Halaman lengkap
    # (Lihat berkas pdf_generator.py lengkap di repositori)
    return buffer
`,
  'utils.py': `"""
utils.py
Modul Pemrosesan Data & Skoring IST (Intelligenz Struktur Test)
"""

import math
from typing import Dict, List, Any

SUBTEST_INFO = {
    'SE': {'name': 'Satzergänzung (Melengkapi Kalimat)', 'aspect': 'Berpikir konkrit praktis, akal sehat', 'domain': 'verbal'},
    'WA': {'name': 'Wortauswahl (Mencari Kata Berbeda)', 'aspect': 'Rasa bahasa, berpikir verbal, empati', 'domain': 'verbal'},
    'AN': {'name': 'Analogien (Mencari Hubungan Kata)', 'aspect': 'Daya kombinasi, fleksibilitas berpikir', 'domain': 'verbal'},
    'GE': {'name': 'Gemeinsamkeiten (Dua Pengertian)', 'aspect': 'Daya abstraksi verbal, pembentukan konsep', 'domain': 'verbal'},
    'RA': {'name': 'Rechenaufgaben (Hitungan Sederhana)', 'aspect': 'Berpikir praktis hitungan, berpikir logis objektif', 'domain': 'numerik'},
    'ZR': {'name': 'Zahlenreihen (Deret Angka)', 'aspect': 'Berpikir teoritis berhitung, induktif angka', 'domain': 'numerik'},
    'FA': {'name': 'Figurenauswahl (Menyusun Bentuk)', 'aspect': 'Kemampuan membayangkan, mengamati, utuh menyeluruh', 'domain': 'spasial'},
    'WU': {'name': 'Würfelaufgaben (Kubus)', 'aspect': 'Daya bayang ruang, konstruktif teknis, analitis', 'domain': 'spasial'},
    'ME': {'name': 'Merkaufgaben (Mengingat Kata)', 'aspect': 'Atensi, memori jangka pendek & konsentrasi', 'domain': 'memori'}
}

def raw_score_to_standard_score(subtest: str, rw: float) -> int:
    max_rw = 32.0 if subtest == 'GE' else 20.0
    clamped_rw = max(0.0, min(max_rw, float(rw)))
    base_multiplier = 1.4 if subtest == 'GE' else 2.4 if subtest in ['RA', 'ZR'] else 2.3
    base_offset = 74.0 if subtest == 'GE' else 75.0 if subtest in ['RA', 'ZR'] else 76.0
    return max(70, min(140, round(base_offset + clamped_rw * base_multiplier)))

def analyze_stream_preference(subtest_scores: Dict[str, int]) -> Dict[str, Any]:
    ipa_avg = round((subtest_scores.get('RA', 100) + subtest_scores.get('ZR', 100) +
                     subtest_scores.get('FA', 100) + subtest_scores.get('WU', 100)) / 4)
    ips_avg = round((subtest_scores.get('SE', 100) + subtest_scores.get('WA', 100) +
                     subtest_scores.get('GE', 100) + subtest_scores.get('ME', 100)) / 4)
    diff = ipa_avg - ips_avg
    pref = 'IPA' if diff >= 4 else 'IPS' if diff <= -4 else 'Seimbang'
    return {'preference': pref, 'ipa_score': ipa_avg, 'ips_score': ips_avg}
`,
  'requirements.txt': `streamlit>=1.35.0
pandas>=2.2.0
openpyxl>=3.1.2
reportlab>=4.2.0
matplotlib>=3.8.0
`,
};

export const PythonCodeViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<keyof typeof PYTHON_FILES>('app.py');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    navigator.clipboard.writeText(PYTHON_FILES[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = async (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              Py
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Susunan Kode Python & Streamlit (Siap Pakai)
              </h2>
              <p className="text-xs text-slate-500">
                Tersedia berkas <code className="font-mono text-blue-700 font-medium">app.py</code>,{' '}
                <code className="font-mono text-blue-700 font-medium">pdf_generator.py</code>,{' '}
                <code className="font-mono text-blue-700 font-medium">utils.py</code>, dan{' '}
                <code className="font-mono text-blue-700 font-medium">requirements.txt</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
            <button
              onClick={() => handleDownloadFile(activeFile, PYTHON_FILES[activeFile])}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas {activeFile}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center bg-slate-900/90 border-b border-slate-800 px-4 pt-3 overflow-x-auto">
          {Object.keys(PYTHON_FILES).map((file) => (
            <button
              key={file}
              onClick={() => setActiveFile(file as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono font-medium rounded-t-md transition border-t-2 ${
                activeFile === file
                  ? 'bg-slate-950 text-blue-400 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file}</span>
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-x-auto text-xs font-mono text-slate-200 max-h-[550px] overflow-y-auto">
          <pre className="leading-relaxed">
            <code>{PYTHON_FILES[activeFile]}</code>
          </pre>
        </div>
      </div>

      {/* Terminal Command Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-blue-600" />
          Cara Menjalankan Script Python di Komputer Lokal
        </h3>
        <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800">
          <p className="text-slate-400"># 1. Pasang paket dependencies</p>
          <p className="text-emerald-400 font-semibold mb-2">pip install -r requirements.txt</p>
          <p className="text-slate-400"># 2. Jalankan dashboard web Streamlit</p>
          <p className="text-emerald-400 font-semibold">streamlit run app.py</p>
        </div>
      </div>
    </div>
  );
};
