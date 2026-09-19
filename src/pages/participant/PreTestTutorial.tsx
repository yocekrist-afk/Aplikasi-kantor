import React, { useState } from 'react';
import { getISTTutorialContent } from './ISTTutorialContent';
import { preloadMultipleImages } from '../../utils/imagePreloader';
import { AssetImage } from '../../components/AssetImage';
import { BookOpen, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, XCircle, Info, Delete, RotateCcw } from 'lucide-react';

interface PreTestTutorialProps {
  subtestName: string;
  onStartTest: () => void;
  onCancel: () => void;
}

export function PreTestTutorial({ subtestName, onStartTest, onCancel }: PreTestTutorialProps) {
  const [step, setStep] = useState(1);

  const [dummyAnswer, setDummyAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");

  const sName = (subtestName || '').toLowerCase().replace(/subtest/g, 'subtes');
  const isSubtes7 = sName.includes('subtes 7') || sName.includes('ist_7') || sName.includes('ist 7') || sName.includes('fa') || sName.includes('potongan');
  const isSubtes8 = sName.includes('subtes 8') || sName.includes('ist_8') || sName.includes('ist 8') || sName.includes('wu') || sName.includes('kubus');

  // Sistem Preloading Gambar (Unduh di Belakang Layar)
  React.useEffect(() => {
    let imagesToPreload: string[] = [];
    
    if (isSubtes7) {
      const options = ['a', 'b', 'c', 'd', 'e'].flatMap(opt => [
        `/assets/ist/subtes7_opt_p1_${opt}.webp`,
        `/assets/ist/subtes7_opt_p2_${opt}.webp`,
        `/assets/ist/subtes7_tut_opt_${opt}.webp`
      ]);
      const questions = Array.from({length: 20}, (_, i) => `/assets/ist/subtes7_q${i+1}.webp`);
      const refSheets = [
        '/assets/ist/subtes7_tutorial_reference.webp',
        '/assets/ist/subtes7_options_part1.webp', 
        '/assets/ist/subtes7_options_part2.webp',
        '/assets/ist/subtes7_tut_ex_01.webp',
        '/assets/ist/subtes7_tut_ex_02.webp',
        '/assets/ist/subtes7_tut_ex_03.webp',
        '/assets/ist/subtes7_tut_ex_04.webp'
      ];
      imagesToPreload = [...options, ...questions, ...refSheets];
    } else if (isSubtes8) {
      const options = ['a', 'b', 'c', 'd', 'e'].flatMap(opt => [
        `/assets/ist/subtes8_opt_${opt}.webp`,
        `/assets/ist/subtes8_opt_${opt.toUpperCase()}.webp`
      ]);
      const questions = Array.from({length: 20}, (_, i) => `/assets/ist/subtes8_q${i+1}.webp`);
      const examples = Array.from({length: 5}, (_, i) => `/assets/ist/subtes8_tut_ex_0${i+1}.webp`);
      const refSheets = ['/assets/ist/subtes8_reference_cubes.webp'];
      imagesToPreload = [...options, ...questions, ...examples, ...refSheets];
    }
    
    if (imagesToPreload.length > 0) {
      preloadMultipleImages(imagesToPreload).then(() => {
        console.log(`Berhasil melakukan preloading ${imagesToPreload.length} gambar ke dalam Cache (WebP)`);
      });
    }
  }, [subtestName]);

  const istContent = getISTTutorialContent(subtestName);

  // State khusus tutorial RMIB
  const tutorialJobs = ['Dokter (Medis)', 'Insinyur (Teknik)', 'Seniman (Seni)', 'Akuntan (Hitungan)'];
  const [rankedTutorialJobs, setRankedTutorialJobs] = useState<string[]>([]);
  const unrankedTutorialJobs = tutorialJobs.filter(j => !rankedTutorialJobs.includes(j));

  const isRMIB = sName.includes('rmib') || sName.includes('minat');
  const isISTNumber = sName.includes('subtes 5') || sName.includes('ist_5') || sName.includes('ra') || sName.includes('subtes 6') || sName.includes('ist_6') || sName.includes('zr');



  const checkAnswer = (answer: string) => {
    setDummyAnswer(answer);
    setIsCorrect(answer === 'C');
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A1A] to-gray-800 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-[#8BC34A]" />
              <span className="text-[#8BC34A] font-semibold text-sm tracking-wider uppercase">Instruksi & Tutorial</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">{subtestName}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          
          {/* Step 1: General Instructions */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="prose prose-blue max-w-none text-gray-600">
                <p className="text-lg">Selamat datang di modul <strong>{subtestName}</strong>.</p>
                
                {isRMIB ? (
                  <p>Tes ini bukan bertujuan mengukur kecerdasan Anda, melainkan bertujuan mengukur kecenderungan <strong>minat Anda terhadap berbagai jenis pekerjaan</strong>.</p>
                ) : (
                  <p>Pada subtes ini, Anda akan diminta untuk menyelesaikan berbagai soal yang mengukur kemampuan spesifik Anda. Waktu akan dibatasi secara ketat.</p>
                )}
                
                <h3 className="text-gray-800 font-bold text-lg mt-6 mb-3">Aturan Main:</h3>
                <ul className="space-y-3">
                  {isRMIB ? (
                     <>
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                          <span>Anda akan diberikan 9 kelompok pekerjaan. Tiap kelompok terdiri dari 12 macam pekerjaan.</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                          <span>Tugas Anda adalah <strong>mengurutkan ke-12 pekerjaan tersebut</strong> dari yang PALING Anda sukai (Ranking 1) hingga yang PALING TIDAK Anda sukai (Ranking 12).</span>
                        </li>
                     </>
                  ) : (
                     <>
                        <li className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                          <span>Kerjakan secepat dan setepat mungkin.</span>
                        </li>
                     </>
                  )}
                  <li className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />
                    <span>Waktu akan terus berjalan meskipun Anda me-refresh halaman atau menutup browser.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                    <span>Jawaban Anda otomatis tersimpan setiap kali Anda memodifikasinya atau berpindah halaman.</span>
                  </li>
                </ul>
              </div>
              
              <div className="pt-6 flex justify-end gap-3">
                <button onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Batal</button>
                <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  Lanjut ke Contoh Soal <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Practice Question */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                <p className="text-sm text-blue-800 font-medium">Ini adalah contoh soal. Hasil dari soal ini tidak akan dinilai. Silakan coba menjawab untuk membiasakan diri dengan sistem.</p>
              </div>

              {istContent ? (
                 <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-left">
                   <h4 className="font-semibold text-gray-800 mb-2">{istContent.title}</h4>
                   <p className="text-gray-600 text-sm mb-6 whitespace-pre-wrap">{istContent.intro}</p>
                   
                   {/* Reference Banner for Subtest 7 & 8 */}
                   {isSubtes7 && (
                     <div className="mb-5 bg-blue-50/50 border-2 border-blue-200 rounded-xl p-4 text-center shadow-xs">
                       <div className="flex items-center justify-center gap-2 mb-2">
                         <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                           Bentuk Acuan Pilihan (a, b, c, d, e):
                         </p>
                       </div>
                       <div className="overflow-hidden relative flex justify-center">
                         <AssetImage 
                           src="/assets/ist/subtes7_tutorial_reference.webp" 
                           alt="Bentuk Acuan Tutorial" 
                           className="mx-auto object-contain mix-blend-multiply"
                         />
                       </div>
                       <p className="text-[11px] text-gray-500 mt-2">
                         a = Lingkaran penuh &nbsp;|&nbsp; b = Setengah lingkaran &nbsp;|&nbsp; c = Bujur sangkar &nbsp;|&nbsp; d = Segitiga siku-siku &nbsp;|&nbsp; e = Juring bundar
                       </p>
                     </div>
                   )}
                   {isSubtes8 && (
                     <div className="mb-5 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl p-4 text-center shadow-xs">
                       <div className="flex items-center justify-center gap-2 mb-2">
                         <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                           5 Kubus Acuan Utama (a, b, c, d, e):
                         </p>
                       </div>
                       <div className="bg-white rounded-lg p-2 border border-indigo-100 flex items-center justify-center">
                         <AssetImage 
                           src="/assets/ist/subtes8_reference_cubes.webp" 
                           alt="5 Kubus Acuan Utama" 
                           className="max-h-28 sm:max-h-36 mx-auto object-contain"
                           onError={(e) => {
                             (e.target as HTMLImageElement).src = '/assets/ist/subtes8_reference_cubes.png';
                           }}
                         />
                       </div>
                       <p className="text-[11px] text-gray-500 mt-2">
                         a, b, c, d, dan e adalah 5 kubus acuan berbeda. Kubus-kubus ini dapat diputar atau digulingkan dalam pikiran Anda.
                       </p>
                     </div>
                   )}
                   
                   <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
                    {/* Tabs Navigasi Contoh Soal jika lebih dari 1 contoh */}
                    {istContent.examples.length > 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Pilih Contoh:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {istContent.examples.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setCurrentExampleIndex(idx);
                                  setDummyAnswer(null);
                                  setIsCorrect(null);
                                  setInputValue("");
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                  currentExampleIndex === idx
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                Contoh {String(idx + 1).padStart(2, "0")}
                              </button>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-500">
                          Contoh {currentExampleIndex + 1} dari {istContent.examples.length}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-gray-700 text-sm">
                        Contoh Soal {istContent.examples.length > 1 ? `(${currentExampleIndex + 1} dari ${istContent.examples.length})` : ""}:
                      </h5>
                      <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2.5 py-0.5 rounded-md">
                        Contoh {String(currentExampleIndex + 1).padStart(2, "0")}
                      </span>
                    </div>
                     <p className="font-medium text-gray-800 mb-3">{istContent.examples[currentExampleIndex].q}</p>
                     
                     {istContent.examples[currentExampleIndex].img && (
                       <div className="mb-4 flex justify-center">
                         <div className="border-2 border-slate-200 rounded-xl p-3 bg-white flex flex-col items-center shadow-xs w-full max-w-xs">
                           <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                             {isSubtes8 ? `Kubus Soal Contoh ${currentExampleIndex + 1}:` : `Potongan Gambar Contoh ${currentExampleIndex + 1}:`}
                           </p>
                           <div className="w-full h-28 sm:h-36 flex items-center justify-center p-1">
                             <AssetImage 
                               src={istContent.examples[currentExampleIndex].img} 
                               alt={isSubtes8 ? `Kubus Soal Contoh ${currentExampleIndex + 1}` : `Potongan Contoh ${currentExampleIndex + 1}`}
                               className="max-h-full max-w-full object-contain"
                               onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 if (target && target.src && target.src.endsWith(".webp")) {
                                   target.src = target.src.replace(".webp", ".png");
                                 }
                               }}
                             />
                           </div>
                         </div>
                       </div>
                     )}
                     
                     {istContent.examples[currentExampleIndex].opts.length > 0 ? (
                       (isSubtes7 || isSubtes8) ? (
                         <div className="grid grid-cols-5 gap-2 sm:gap-3">
                           {istContent.examples[currentExampleIndex].opts.map((opt) => {
                             const optLetter = opt[0].toUpperCase();
                             const isSelected = dummyAnswer?.toLowerCase() === opt[0].toLowerCase();
                             const isActuallyCorrect = opt[0].toLowerCase() === istContent.examples[currentExampleIndex].a.toLowerCase();
                             const showCorrect = isSelected && isCorrect;
                             const showWrong = isSelected && !isCorrect;
                             const showRevealed = dummyAnswer !== null && !isSelected && isActuallyCorrect;
                             
                             const optImg = isSubtes7
                               ? `/assets/ist/subtes7_tut_opt_${opt[0].toLowerCase()}.webp`
                               : `/assets/ist/subtes8_opt_${opt[0].toLowerCase()}.webp`;

                             return (
                               <button
                                 key={opt}
                                 type="button"
                                 onClick={() => {
                                   setDummyAnswer(opt[0]);
                                   setIsCorrect(isActuallyCorrect);
                                 }}
                                 className={`p-2 sm:p-3 border-2 rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer ${
                                   showCorrect ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200' :
                                   showWrong ? 'border-red-500 bg-red-50' :
                                   showRevealed ? 'border-emerald-400 bg-emerald-50/60' :
                                   isSelected ? 'border-blue-500 bg-blue-50' :
                                   'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                                 }`}
                               >
                                 <div className="w-full flex items-center justify-between mb-1">
                                   <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                                     showCorrect || showRevealed ? 'bg-emerald-600 text-white' :
                                     showWrong ? 'bg-red-600 text-white' :
                                     'bg-gray-100 text-gray-700'
                                   }`}>
                                     {optLetter}
                                   </span>
                                   {showCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                   {showRevealed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                   {showWrong && <XCircle className="w-4 h-4 text-red-600" />}
                                 </div>
                                 <div className="w-full h-12 sm:h-16 flex items-center justify-center p-1 my-1">
                                   <AssetImage 
                                     src={optImg} 
                                     alt={`Pilihan ${optLetter}`} 
                                     className="max-h-full max-w-full object-contain"
                                     onError={(e) => {
                                       const target = e.target as HTMLImageElement;
                                       if (!target.src.includes(`subtes8_opt_${optLetter}`)) {
                                         target.src = `/assets/ist/subtes8_opt_${optLetter}.webp`;
                                       }
                                     }}
                                   />
                                 </div>
                                 <span className="text-[11px] font-bold text-gray-600">
                                   {isSubtes7 ? `Bentuk ${optLetter}` : `Kubus ${optLetter}`}
                                 </span>
                               </button>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="space-y-2">
                           {istContent.examples[currentExampleIndex].opts.map((opt) => {
                             const isSelected = dummyAnswer === opt[0];
                             const isActuallyCorrect = opt[0].toLowerCase() === istContent.examples[currentExampleIndex].a.toLowerCase();
                             const showCorrect = isSelected && isCorrect;
                             const showWrong = isSelected && !isCorrect;
                             return (
                               <button
                                 key={opt}
                                 onClick={() => {
                                   setDummyAnswer(opt[0]);
                                   setIsCorrect(isActuallyCorrect);
                                 }}
                                 className={`w-full flex items-center justify-between p-3 border rounded-lg text-left transition-all text-sm ${
                                   showCorrect ? 'border-green-500 bg-green-50 text-green-700 font-bold' :
                                   showWrong ? 'border-red-500 bg-red-50 text-red-700' :
                                   'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                                 }`}
                               >
                                 <span>{opt}</span>
                                 {showCorrect && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                 {showWrong && <XCircle className="w-4 h-4 text-red-600" />}
                               </button>
                             )
                           })}
                         </div>
                       )
                     ) : isISTNumber ? (
                       <div className="flex flex-col gap-3 items-center">
                         <div className="w-full bg-white border-2 border-gray-300 rounded-lg p-4 text-center text-2xl font-bold text-gray-800 tracking-[0.25em] min-h-[70px] flex items-center justify-center">
                            {inputValue || <span className="text-gray-400 font-normal text-sm tracking-normal">Jawaban Anda...</span>}
                         </div>

                         <div className="text-xs text-gray-500 flex items-center gap-1.5 -mt-1">
                           <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                           <span>Setiap angka hanya dapat dipilih 1 kali</span>
                         </div>

                         <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-sm">
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => {
                             const numStr = String(num);
                             const isSelected = inputValue.includes(numStr);

                             return (
                               <button
                                 key={num}
                                 type="button"
                                 onClick={() => !dummyAnswer && !isSelected && setInputValue(prev => prev + numStr)}
                                 disabled={dummyAnswer !== null || isSelected}
                                 className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 font-bold text-lg sm:text-xl transition-all flex items-center justify-center shadow-sm ${
                                   isSelected
                                     ? "border-blue-600 bg-blue-600 text-white cursor-not-allowed opacity-90 shadow-inner"
                                     : "border-gray-300 bg-white text-gray-800 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                 }`}
                                 title={isSelected ? "Angka sudah dipilih" : "Pilih angka"}
                               >
                                 {num}
                               </button>
                             );
                           })}
                         </div>
                         <div className="flex gap-2 w-full max-w-sm mt-3">
                           <button 
                             type="button"
                             onClick={() => !dummyAnswer && setInputValue(prev => prev.slice(0, -1))}
                             disabled={!inputValue || dummyAnswer !== null}
                             className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg py-3 font-bold text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 cursor-pointer"
                           >
                             <Delete className="w-4 h-4" />
                             <span>Hapus</span>
                           </button>
                           <button 
                             type="button"
                             onClick={() => !dummyAnswer && setInputValue('')}
                             disabled={!inputValue || dummyAnswer !== null}
                             className="px-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg py-3 font-bold text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 cursor-pointer"
                             title="Reset jawaban"
                           >
                             <RotateCcw className="w-4 h-4" />
                             <span>Reset</span>
                           </button>
                           <button 
                             type="button"
                             className="flex-1 bg-blue-600 text-white rounded-lg py-3 font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                             disabled={!inputValue.trim() || dummyAnswer !== null}
                             onClick={() => {
                               setDummyAnswer(inputValue);
                               setIsCorrect(inputValue.toLowerCase().trim() === istContent.examples[currentExampleIndex].a.toLowerCase());
                             }}
                           >
                             Cek
                           </button>
                         </div>
                       </div>
                     ) : (
                       <div className="flex gap-2">
                         <input 
                           type="text" 
                           placeholder="Ketik jawaban Anda di sini..."
                           className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           value={inputValue}
                           disabled={dummyAnswer !== null}
                           onChange={(e) => setInputValue(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && inputValue.trim() && !dummyAnswer) {
                               setDummyAnswer(inputValue);
                               setIsCorrect(inputValue.toLowerCase().trim() === istContent.examples[currentExampleIndex].a.toLowerCase());
                             }
                           }}
                         />
                         <button 
                           className="px-6 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           disabled={!inputValue.trim() || dummyAnswer !== null}
                           onClick={() => {
                             setDummyAnswer(inputValue);
                             setIsCorrect(inputValue.toLowerCase().trim() === istContent.examples[currentExampleIndex].a.toLowerCase());
                           }}
                         >
                           Cek
                         </button>
                       </div>
                     )}
                   </div>
                   
                    {/* Kotak Kunci Jawaban & Pembahasan Resmi */}
                    <div className={`p-4 rounded-xl text-sm font-medium animate-in fade-in border ${
                      dummyAnswer === null
                        ? "border-emerald-300 bg-emerald-50/90 text-emerald-950"
                        : isCorrect
                          ? "border-emerald-400 bg-emerald-50 text-emerald-950"
                          : "border-amber-300 bg-amber-50 text-amber-950"
                    }`}>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Kunci Jawaban Resmi: {isSubtes8 ? `Kubus ${istContent.examples[currentExampleIndex].a.toUpperCase()}` : isSubtes7 ? `Bentuk ${istContent.examples[currentExampleIndex].a.toUpperCase()}` : istContent.examples[currentExampleIndex].a.toUpperCase()}
                        </span>
                        {dummyAnswer !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isCorrect ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"
                          }`}>
                            {isCorrect ? "✓ Pilihan Anda Benar" : `✕ Pilihan Anda: ${dummyAnswer.toUpperCase()} (Kurang Tepat)`}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 font-semibold">
                          (Pembahasan Contoh {currentExampleIndex + 1})
                        </span>
                      </div>

                      <div className="leading-relaxed whitespace-pre-line text-sm mt-2 text-gray-800">
                        {istContent.examples[currentExampleIndex].exp}
                      </div>

                      {dummyAnswer === null && (
                        <p className="mt-3 pt-2.5 border-t border-emerald-200/60 text-xs text-emerald-800 flex items-center gap-1.5 font-normal">
                          <Info className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span>Tip: Anda juga dapat mencoba mengklik pilihan di atas untuk membiasakan diri sebelum memulai ujian.</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      {currentExampleIndex > 0 && (
                        <button 
                          type="button"
                          onClick={() => {
                            setCurrentExampleIndex(currentExampleIndex - 1);
                            setDummyAnswer(null);
                            setIsCorrect(null);
                            setInputValue("");
                          }}
                          className="w-1/3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          ← Contoh Sebelumnya
                        </button>
                      )}
                      {currentExampleIndex < istContent.examples.length - 1 ? (
                        <button 
                          type="button"
                          onClick={() => {
                            setCurrentExampleIndex(currentExampleIndex + 1);
                            setDummyAnswer(null);
                            setIsCorrect(null);
                            setInputValue("");
                          }}
                          className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1"
                        >
                          Lihat Contoh Berikutnya ({currentExampleIndex + 2} / {istContent.examples.length}) →
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={nextStep}
                          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1"
                        >
                          Selesai Membaca Contoh, Lanjut ke Konfirmasi →
                        </button>
                      )}
                    </div>
                 </div>
              ) : isRMIB ? (
                 <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                   <h4 className="font-semibold text-gray-800 mb-2">Simulasi Mengurutkan Pekerjaan</h4>
                   <p className="text-gray-600 text-sm mb-6">
                     Klik pada pekerjaan di sebelah kiri untuk memindahkannya ke daftar pilihan di sebelah kanan, berurutan dari yang paling disukai.
                   </p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold text-xs text-gray-500 uppercase mb-2">Daftar Pekerjaan</h5>
                        <div className="space-y-2">
                          {unrankedTutorialJobs.map(job => (
                            <button
                              key={job}
                              onClick={() => setRankedTutorialJobs([...rankedTutorialJobs, job])}
                              className="w-full text-left px-3 py-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm transition-colors text-gray-700 font-medium"
                            >
                              + {job}
                            </button>
                          ))}
                          {unrankedTutorialJobs.length === 0 && (
                            <div className="p-3 text-center text-xs text-green-600 bg-green-50 rounded-lg border border-dashed border-green-200 flex flex-col items-center">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mb-1" />
                              Semua terpilih
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-xs text-gray-500 uppercase mb-2">Urutan (1 = Paling Suka)</h5>
                        <div className="space-y-2">
                          {rankedTutorialJobs.map((job, idx) => (
                            <button
                              key={job}
                              onClick={() => setRankedTutorialJobs(rankedTutorialJobs.filter(j => j !== job))}
                              className="w-full flex items-center px-3 py-2.5 bg-blue-50 border border-blue-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 rounded-lg text-sm transition-colors text-blue-900 font-medium group"
                            >
                               <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold mr-2 group-hover:hidden">{idx + 1}</span>
                               <span className="w-5 h-5 rounded-full bg-red-500 text-white items-center justify-center text-[10px] font-bold mr-2 hidden group-hover:flex">✕</span>
                               {job}
                            </button>
                          ))}
                          {rankedTutorialJobs.length === 0 && (
                            <div className="p-3 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center">
                              Belum ada pilihan
                            </div>
                          )}
                        </div>
                      </div>
                   </div>

                   {rankedTutorialJobs.length === tutorialJobs.length && (
                     <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-sm font-medium animate-in fade-in flex items-start">
                       <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 shrink-0" />
                       Bagus sekali! Anda sudah memahami cara mengurutkannya. Di tes sesungguhnya akan ada 12 pekerjaan per grup. Silakan lanjut.
                     </div>
                   )}
                 </div>
              ) : subtestName.toLowerCase().includes('trial') || subtestName.toLowerCase().includes('simulasi') || subtestName.toLowerCase().includes('pemanasan') ? (
                 <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-center">
                   <h4 className="font-semibold text-gray-800 mb-2">Simulasi Bebas</h4>
                   <p className="text-gray-600 text-sm mb-4">
                     Tidak ada pertanyaan contoh khusus untuk simulasi ini. Anda dapat langsung melanjutkan untuk mencoba simulasi pengerjaan tes.
                   </p>
                 </div>
              ) : (
                 <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                   <h4 className="font-semibold text-gray-800 mb-4">Contoh Soal:<br/><span className="font-normal text-gray-600">Tentukan lanjutan dari deret angka berikut: 2, 4, 6, 8, ...</span></h4>
                   
                   <div className="space-y-3">
                     {['A. 9', 'B. 12', 'C. 10', 'D. 11'].map((opt) => {
                       const isSelected = dummyAnswer === opt[0];
                       const showCorrect = isSelected && isCorrect;
                       const showWrong = isSelected && !isCorrect;

                       return (
                         <button
                           key={opt}
                           onClick={() => checkAnswer(opt[0])}
                           className={`w-full flex items-center justify-between p-4 border rounded-xl text-left transition-all ${
                             showCorrect ? 'border-green-500 bg-green-50 text-green-700' :
                             showWrong ? 'border-red-500 bg-red-50 text-red-700' :
                             'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                           }`}
                         >
                           <span className="font-medium">{opt}</span>
                           {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                           {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
                         </button>
                       )
                     })}
                   </div>

                   {dummyAnswer && (
                     <div className={`mt-4 p-4 rounded-lg text-sm font-medium animate-in fade-in ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                       {isCorrect ? 'Tepat sekali! Polanya adalah ditambah 2.' : 'Kurang tepat. Coba perhatikan lagi polanya (ditambah 2).'}
                     </div>
                   )}
                 </div>
              )}

              <div className="pt-4 flex justify-between">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Kembali</button>
                <button 
                  onClick={() => {
                    if (istContent && currentExampleIndex < istContent.examples.length - 1) {
                      setCurrentExampleIndex(currentExampleIndex + 1);
                      setDummyAnswer(null);
                      setIsCorrect(null);
                      setInputValue("");
                    } else {
                      nextStep();
                    }
                  }} 
                  disabled={
                    isRMIB ? rankedTutorialJobs.length !== tutorialJobs.length : false
                  }
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none cursor-pointer"
                >
                  {istContent && currentExampleIndex < istContent.examples.length - 1 
                    ? `Contoh Berikutnya (${currentExampleIndex + 2}/${istContent.examples.length})` 
                    : "Selanjutnya"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {step === 3 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-500 py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Anda Sudah Siap!</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Waktu akan mulai berjalan segera setelah Anda menekan tombol di bawah. Pastikan koneksi internet Anda stabil.
              </p>

              <div className="pt-8">
                <button 
                  onClick={onStartTest}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white bg-[#1A1A1A] hover:bg-black transition-colors shadow-xl"
                >
                  Mulai Waktu Ujian Sekarang <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={onCancel} className="mt-4 px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
                  Nanti Saja
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
