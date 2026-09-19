import React, { useState } from 'react';
import { X, CheckCircle2, Save, FileEdit, AlertCircle, RotateCcw } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ScoredParticipantResult } from '../utils/scoringEngine';
import { SubtestCode } from '../types/ist';

interface ManualCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ScoredParticipantResult;
}

export function ManualCorrectionModal({ isOpen, onClose, participant }: ManualCorrectionModalProps) {
  const [activeSubtest, setActiveSubtest] = useState<SubtestCode>('SE');
  const [isSaving, setIsSaving] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Record<number, number>>>(
    participant.originalParticipant.scoreOverrides || {}
  );
  
  if (!isOpen) return null;

  const currentSubtestData = participant.subtestDetails.find(s => s.code === activeSubtest);
  const itemScores = currentSubtestData?.itemScores || [];

  const handleScoreChange = (no: number, newScore: number) => {
    setLocalOverrides(prev => ({
      ...prev,
      [activeSubtest]: {
        ...(prev[activeSubtest] || {}),
        [no]: newScore
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pRef = doc(db, 'participants', participant.participantId);
      await updateDoc(pRef, {
        scoreOverrides: localOverrides
      });
      // the snapshot listener in TabulasiPenilaian will re-trigger scoring logic
      onClose();
    } catch (error) {
      console.error("Gagal menyimpan koreksi manual:", error);
      alert("Gagal menyimpan koreksi. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl z-10 flex flex-col h-[90vh] border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Panel Koreksi Manual</h2>
              <p className="text-sm text-gray-500">{participant.nama} ({participant.nomorTes})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 sm:w-56 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 flex flex-col overflow-y-auto">
            <div className="p-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Pilih Subtes</div>
              <div className="space-y-1">
                {participant.subtestDetails.map(sub => (
                  <button
                    key={sub.code}
                    onClick={() => setActiveSubtest(sub.code)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSubtest === sub.code 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    {sub.code} - {sub.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10 shadow-sm">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Review Jawaban Subtes {activeSubtest}</h3>
                <p className="text-sm text-gray-500">Sesuaikan poin jawaban jika sistem keliru membaca jawaban partisipan.</p>
              </div>
                            <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLocalOverrides(prev => {
                      const next = { ...prev };
                      delete next[activeSubtest];
                      return next;
                    });
                  }}
                  className="group bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 active:bg-gray-200 dark:active:bg-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />
                  <span>Reset Subtes Ini</span>
                </button>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Setiap perubahan akan menimpa skor sistem.</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/50">
              {itemScores.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Belum ada jawaban pada subtes ini atau detail jawaban tidak tersedia.</p>
                </div>
              ) : (
                <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">No.</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Kunci Sistem</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Jawaban Peserta</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase">Poin (Override)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {itemScores.map(item => {
                        const currentOverride = localOverrides[activeSubtest]?.[item.no];
                        const displayedScore = currentOverride !== undefined ? currentOverride : item.score;
                        const isOverridden = currentOverride !== undefined;
                        
                        return (
                          <tr key={item.no} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors">
                            <td className="px-4 py-3 font-mono font-medium text-gray-500 w-12">{item.no}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 w-1/3">
                              <span className="font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs inline-block whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title={item.keyDisplay}>
                                {item.keyDisplay}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                              {item.userAnswer}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {displayedScore > 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full">
                                  <X className="w-4 h-4" />
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <input 
                                  type="number"
                                  min="0"
                                  max={activeSubtest === 'GE' ? 2 : 1}
                                  value={displayedScore}
                                  onChange={(e) => handleScoreChange(item.no, parseInt(e.target.value) || 0)}
                                  className={`w-14 text-center rounded-lg border px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isOverridden 
                                      ? 'bg-amber-50 border-amber-300 text-amber-700' 
                                      : 'bg-white border-gray-300 text-gray-900 dark:bg-gray-900 dark:border-gray-600 dark:text-white'
                                  }`}
                                />
                                {isOverridden && (
                                  <button 
                                    onClick={() => {
                                      setLocalOverrides(prev => {
                                        const newOv = { ...prev };
                                        if (newOv[activeSubtest]) {
                                          delete newOv[activeSubtest][item.no];
                                        }
                                        return newOv;
                                      });
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 underline"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        
                {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-between gap-3">
          <button
            onClick={() => {
              setLocalOverrides({});
            }}
            className="group px-5 py-2.5 rounded-xl font-bold text-red-600 bg-white border border-red-200 dark:bg-gray-800 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95 active:bg-red-100 dark:active:bg-red-900/50 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
          >
            <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
            Kembalikan ke Nilai Sistem Asli
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 active:bg-gray-200 dark:active:bg-gray-600 transition-all duration-200 shadow-sm"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 active:bg-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <span className="animate-pulse">Menyimpan...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Override
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
