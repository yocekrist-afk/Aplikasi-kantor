import React, { useRef, useState, useEffect } from 'react';
import { Camera, CheckCircle2, RefreshCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface WebcamCaptureProps {
  participantId?: string; // Made optional for cases where doc isn't created yet
  onVerified?: () => void;
  onCancel: () => void;
  onCapture?: (base64Image: string) => void; // New callback for registration form
  title?: string;
  description?: string;
}

export function WebcamCapture({ participantId, onVerified, onCancel, onCapture, title = "Verifikasi Wajah", description = "Untuk memastikan keamanan dan validitas tes, silakan ambil swafoto (selfie) sebelum memulai." }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const startCamera = async () => {
    setErrorMsg('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error accessing webcam:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Akses kamera ditolak. Silakan klik ikon gembok (🔒) di kiri atas *address bar* browser Anda, lalu izinkan akses Kamera dan muat ulang halaman.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('Tidak ada kamera yang ditemukan pada perangkat ini.');
      } else {
        setErrorMsg('Tidak dapat mengakses kamera. Pastikan perangkat Anda mendukung fitur ini.');
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run once on mount

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Resize image to max 480px width to ensure it stays well under 1MB limit for Firestore
      const MAX_WIDTH = 480;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        
        // Coba deteksi wajah native jika didukung oleh browser (misal Chrome di Android/Desktop)
        try {
          if ('FaceDetector' in window) {
            // @ts-ignore
            const faceDetector = new window.FaceDetector();
            const faces = await faceDetector.detect(canvas);
            
            if (faces.length === 0) {
              setErrorMsg('Wajah tidak terdeteksi. Pastikan kamera mengarah ke wajah Anda dengan pencahayaan yang cukup, bukan objek lain.');
              return; // Batalkan proses pengambilan foto
            }
          }
        } catch (e) {
          console.warn("FaceDetector API failed or not supported, skipping face check", e);
        }

        // Compress image (quality 0.6) to save Firebase quota
        const base64Image = canvas.toDataURL('image/jpeg', 0.6);
        setPhotoPreview(base64Image);
        setErrorMsg(''); // Bersihkan pesan error jika ada
        
        // Stop stream after capture to save battery/resources
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const retakePhoto = () => {
    setPhotoPreview(null);
    startCamera();
  };

  const submitPhoto = async () => {
    if (!photoPreview) return;
    setIsUploading(true);
    
    if (onCapture) {
      onCapture(photoPreview);
      if(onVerified) onVerified();
      return;
    }

    if (!participantId) {
      setIsUploading(false);
      return;
    }

    try {
      const pRef = doc(db, 'participants', participantId);
      await updateDoc(pRef, {
        photoBase64: photoPreview,
        photoVerifiedAt: new Date().toISOString()
      });
      if(onVerified) onVerified();
    } catch (err) {
      console.error("Gagal mengunggah foto:", err);
      setErrorMsg("Gagal menyimpan verifikasi. Periksa koneksi internet Anda.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 text-center border-b border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 flex-1 flex flex-col items-center justify-center">
          {errorMsg ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-5 rounded-xl flex items-start w-full shadow-sm border border-red-100 dark:border-red-800/50">
              <AlertTriangle className="w-6 h-6 mr-3 shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="font-bold text-sm mb-1">Kamera Bermasalah</h3>
                <p className="text-sm leading-relaxed opacity-90">{errorMsg}</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
              {photoPreview ? (
                <img src={photoPreview} alt="Selfie preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform scale-x-[-1]" // mirror effect
                  ></video>
                  {/* Panduan Wajah (Overlay) */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-3/5 md:w-1/2 aspect-[3/4] border-2 border-white/50 border-dashed rounded-[3rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] transition-all duration-300"></div>
                    <div className="absolute bottom-6 text-white/90 text-xs md:text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      Posisikan wajah Anda di dalam bingkai
                    </div>
                  </div>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          {!photoPreview ? (
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={capturePhoto}
                disabled={!!errorMsg}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
              >
                <Camera className="w-5 h-5" />
                Ambil Foto
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={retakePhoto}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Ulangi
              </button>
              <button 
                type="button"
                onClick={submitPhoto}
                disabled={isUploading}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-[#2ECC71] hover:bg-[#27AE60] transition-colors shadow-lg shadow-green-200 dark:shadow-none"
              >
                {isUploading ? 'Menyimpan...' : 'Gunakan Foto Ini'}
                {!isUploading && <CheckCircle2 className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
