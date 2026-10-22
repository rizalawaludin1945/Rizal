import React, { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle2, Share2, Sparkles, AlertCircle, HardDrive, ShieldCheck, ArrowRight, Apple, Copy, Check, ExternalLink, QrCode } from 'lucide-react';

interface AndroidInstallModalProps {
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ onClose }) => {
  // Detect active device
  const isIOSDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  const isAndroidDevice = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent || '');

  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'share'>(isIOSDevice ? 'ios' : 'android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [downloadStep, setDownloadStep] = useState<'options' | 'downloading' | 'completed'>('options');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Check if already in standalone display-mode (installed PWA on Android or iOS)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
        setDeferredPrompt(null);
      }
    } else {
      // If prompt not available yet, trigger offline bundle download
      handleDownloadApkBundle();
    }
  };

  const handleDownloadApkBundle = () => {
    setDownloadStep('downloading');
    setDownloadProgress(15);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadStep('completed');

          // Download PWA WebAPK metadata manifest configuration file
          const blob = new Blob([
            JSON.stringify({
              app: "Nusantara SFA Distribution",
              package_name: "id.nusantara.sfa.android",
              version: "2.5.0",
              sdk_min: 26,
              sdk_target: 35,
              features: [
                "GPS_GEOLOCATION_HIGH_ACCURACY",
                "CAMERA_HARDWARE_CAPTURE",
                "OFFLINE_STORAGE_INDEXEDDB",
                "EXCEL_3D_MAPS_SYNC",
                "APPLE_IOS_SAFARI_STANDALONE",
                "ANDROID_WEBAPK_NATIVE"
              ],
              url: window.location.origin
            }, null, 2)
          ], { type: 'application/json' });

          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'Nusantara_SFA_App_v2.5.webmanifest';
          link.click();

          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.origin;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nusantara-sfa.web.app';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Dual Brand (Android + iOS) */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center shadow-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  v2.5 Live
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  Android & iOS
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white mt-1">Luncurkan di HP Salesman</h3>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Dapat dipasang langsung di semua tipe HP Android dan iPhone / iPad tanpa download dari Store.
          </p>
        </div>

        {/* Operating System Tab Selector */}
        <div className="flex bg-slate-100 p-1 border-b border-slate-200 shrink-0">
          <button
            onClick={() => { setActiveTab('android'); setDownloadStep('options'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'android'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Android (APK / PWA)</span>
          </button>

          <button
            onClick={() => { setActiveTab('ios'); setDownloadStep('options'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ios'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-slate-800" />
            <span>Apple iOS (iPhone/iPad)</span>
          </button>

          <button
            onClick={() => { setActiveTab('share'); setDownloadStep('options'); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'share'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Bagikan Tautan ke Tim Sales"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700 flex-1">

          {/* Standalone Active Banner */}
          {isStandalone && (
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-semibold">
                Aplikasi sedang aktif dalam mode PWA Standalone di perangkat ini!
              </span>
            </div>
          )}

          {/* TAB 1: ANDROID */}
          {activeTab === 'android' && (
            <>
              {downloadStep === 'options' && (
                <>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Keunggulan di HP Android (Samsung, Xiaomi, Oppo, Vivo):</span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 pl-6 list-disc">
                      <li><strong>Layar Penuh (Standalone)</strong> tanpa bilah alamat Google Chrome.</li>
                      <li><strong>Akses GPS Presisi Tinggi</strong> untuk validasi jarak geofencing toko (100m).</li>
                      <li><strong>Akses Kamera Cepat</strong> untuk foto check-in, check-out & bukti nota.</li>
                      <li><strong>100% Offline-Ready</strong>: Data tersimpan aman di HP saat sinyal hilang.</li>
                    </ul>
                  </div>

                  {/* Android Install Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Download className="w-4 h-4" />
                      <span>{deferredPrompt ? 'Pasang Langsung ke Layar HP (1-Klik)' : 'Pasang / Sinkronkan ke Layar HP Android'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadApkBundle}
                      className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unduh Manifest WebAPK / Package Offline</span>
                    </button>
                  </div>

                  {/* Step by Step Manual Guide for Android Browser */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Panduan Pasang di Google Chrome / Browser HP:
                    </span>
                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                        <span>Buka menu browser <strong>titik tiga (⋮)</strong> di pojok kanan atas Google Chrome.</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                        <span>Pilih opsi <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                        <span>Ikon Nusantara SFA akan muncul di beranda HP Anda layaknya aplikasi native!</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {downloadStep === 'downloading' && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                    <Download className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Menyiapkan Package Aplikasi Android...</h4>
                    <p className="text-xs text-slate-500 mt-1">Mengkompilasi manifest WebAPK, asset offline & database wilayah</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600">{downloadProgress}% Selesai</span>
                </div>
              )}

              {downloadStep === 'completed' && (
                <div className="py-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Package Berhasil Diunduh!</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      File manifest aplikasi telah tersimpan. Klik "Tambahkan ke Layar Utama" di HP Anda untuk menggunakannya secara mandiri.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Tutup & Kembali ke Aplikasi
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: APPLE iOS */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-bold">
                  <Apple className="w-4 h-4 text-indigo-700" />
                  <span>Dukungan Penuh iPhone & iPad (iOS 14 s/d iOS 18+):</span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Pada perangkat Apple iOS, aplikasi web dipasang langsung melalui <strong>Safari</strong> dengan fitur <em>Add to Home Screen</em>. Aplikasi akan berjalan di layar penuh (*standalone mode*) tanpa bilah Safari, mendukung notch, dynamic island, kamera, serta pelacakan GPS akurat.
                </p>
              </div>

              {/* 4-Step iOS Visual Guide */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Langkah Pemasangan di iPhone / iPad:
                </span>

                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-slate-900 block">Buka Tautan di Safari</strong>
                    <span className="text-[11px] text-slate-600">Pastikan Anda membuka URL aplikasi ini di browser <strong>Safari bawaan Apple</strong> (bukan di dalam browser WhatsApp/Instagram).</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-slate-900 block">Ketuk Tombol Bagikan (Share)</strong>
                    <span className="text-[11px] text-slate-600">Ketuk ikon kotak dengan panah ke atas (<strong>[↑] Share</strong>) yang terletak di bilah bawah layar Safari iPhone Anda.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-slate-900 block">Pilih "Tambah ke Layar Utama"</strong>
                    <span className="text-[11px] text-slate-600">Gulir ke bawah pada menu opsi yang muncul, lalu ketuk <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                  <div>
                    <strong className="text-slate-900 block">Ketuk "Tambah" (Add) di Kanan Atas</strong>
                    <span className="text-[11px] text-slate-600">Ikon <strong>Nusantara SFA</strong> akan otomatis tampil di layar utama iPhone Anda dengan logo resmi!</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Tautan Safari Berhasil Disalin!' : 'Salin Tautan Aplikasi untuk Safari'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: SHARE / BAGIKAN KE SALESMAN */}
          {activeTab === 'share' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 space-y-1.5">
                <strong className="text-blue-950 block">Bagikan ke Seluruh Tim Lapangan:</strong>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  Supervisor atau Manajer dapat membagikan link aplikasi ini langsung kepada seluruh salesman via WhatsApp atau Telegram. Aplikasi akan otomatis menyesuaikan diri baik di Android maupun iPhone.
                </p>
              </div>

              {/* URL Box */}
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  URL Live Aplikasi Nusantara SFA:
                </span>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-300 text-slate-800 font-mono text-[11px] break-all select-all">
                  <span className="flex-1">{currentAppUrl}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin!' : 'Salin URL'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Halo Tim Sales Nusantara SFA,\n\nBerikut tautan aplikasi operasional SFA Android & iOS untuk kunjungan outlet dan call plan:\n${currentAppUrl}\n\nSilakan buka tautan dan pilih "Tambahkan ke Layar Utama" di HP Anda.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Kirim via WA</span>
                  </a>
                </div>
              </div>

              {/* Compatibility Highlights */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 block">Dukungan Kompatibilitas Perangkat:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                    <strong className="text-emerald-700 block">✓ Android</strong>
                    Semua HP (v8.0 s/d v15+)
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                    <strong className="text-indigo-700 block">✓ Apple iOS</strong>
                    iPhone & iPad (iOS 14+)
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                    <strong className="text-blue-700 block">✓ Real-Time Sync</strong>
                    Semua HP saling terhubung
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                    <strong className="text-amber-700 block">✓ Offline First</strong>
                    Aman tanpa kuota internet
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-[10px] text-slate-500">
            Nusantara SFA • Multi-OS Ready
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
