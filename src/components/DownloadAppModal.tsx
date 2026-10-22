import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, Copy, Check, QrCode, Globe, ShieldCheck, ArrowRight, ExternalLink, X, Info } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  appUrl
}) => {
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'android_pwa' | 'share' | 'apk_guide'>('android_pwa');

  // Listen for beforeinstallprompt event on Android Chrome
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setActiveTab('android_pwa');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-800 text-blue-200 border border-blue-700">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Unduh & Pasang Nusantara SFA</h3>
              <p className="text-xs text-blue-200 mt-0.5">Panduan Instalasi di HP Android Salesman</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 grid grid-cols-3 gap-1.5 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('android_pwa')}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === 'android_pwa' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📱 Pasang di Android
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === 'share' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔗 Bagikan ke Tim
          </button>

          <button
            onClick={() => setActiveTab('apk_guide')}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeTab === 'apk_guide' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 File APK Asli
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700 leading-relaxed">
          
          {/* TAB 1: Pasang di Android (PWA / Web-APK) */}
          {activeTab === 'android_pwa' && (
            <div className="space-y-3.5">
              
              {/* Highlight Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Aplikasi Siap Pasang Langsung di HP Android
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Aplikasi ini menggunakan teknologi <strong>Progressive Web App (PWA / Web-APK)</strong> resmi dari Google yang berjalan layar penuh (*fullscreen*) tanpa address bar browser, memiliki ikon di menu aplikasi, dan dapat diakses secara offline.
                  </p>
                </div>
              </div>

              {/* Direct Install Button if supported */}
              {deferredPrompt && (
                <button
                  onClick={handleInstallPWA}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse"
                >
                  <Download className="w-5 h-5" />
                  <span>Pasang Aplikasi di HP Sekarang (1-Klik)</span>
                </button>
              )}

              {/* Step by Step Android Installation Guide */}
              <div className="space-y-2.5">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  Cara Memasang di HP Android (Google Chrome):
                </span>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">Buka Link Aplikasi di HP Salesman</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Buka browser <strong>Google Chrome</strong> atau Samsung Internet di HP Android, lalu kunjungi URL aplikasi ini.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">Tekan Menu Titik Tiga (⋮) di Kanan Atas</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Klik tombol opsi menu titik tiga (⋮) yang berada di sudut kanan atas Google Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">Pilih "Tambahkan ke Layar Utama" atau "Instal Aplikasi"</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pilih menu <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong> atau <strong>"Instal aplikasi" (Install App)</strong>, lalu tekan <em>Instal</em>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      ✓
                    </span>
                    <div>
                      <p className="font-bold text-emerald-900">Selesai! Ikon Nusantara SFA Muncul di Menu HP</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Aplikasi langsung dapat dibuka seperti aplikasi Android biasa dari Play Store tanpa perlu download berkas manual yang rumit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Bagikan Link ke Tim Salesman */}
          {activeTab === 'share' && (
            <div className="space-y-3.5">
              <p className="text-slate-600">
                Bagikan tautan langsung aplikasi ini ke seluruh tim salesman distribusi di lapangan via WhatsApp atau Telegram:
              </p>

              {/* URL Box */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tautan Aplikasi Produksi (Shared URL):</span>
                <div className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-xs text-blue-800 break-all select-all">
                  {appUrl}
                </div>

                <button
                  onClick={handleCopyUrl}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tautan Berhasil Disalin!' : 'Salin Link untuk WhatsApp'}</span>
                </button>
              </div>

              {/* Tips for Sales Manager */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-[11px] text-indigo-900 space-y-1">
                <span className="font-bold block">💡 Petunjuk untuk Supervisor Distribusi:</span>
                <p>
                  Setiap salesman dapat langsung membuka tautan ini di smartphone masing-masing, memilih akun salesman mereka (atau mendaftar dengan NIK mereka), dan mulai mencatat kunjungan serta pesanan outlet secara offline.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Konversi ke File .APK Asli */}
          {activeTab === 'apk_guide' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">
                  Ingin Membuat File Installer (.apk) atau (.aab) Sendiri?
                </h4>
                <p className="text-xs text-slate-600">
                  Karena aplikasi ini dibangun dengan arsitektur standar Web & TypeScript, Anda dapat membungkusnya (*wrap*) menjadi file `.apk` Android asli menggunakan <strong>Capacitor (Official Android Bridge)</strong> dengan 3 langkah mudah:
                </p>

                <div className="p-2.5 bg-slate-900 rounded-xl font-mono text-[11px] text-emerald-400 space-y-1">
                  <p># 1. Install Capacitor Android</p>
                  <p className="text-white">npm install @capacitor/core @capacitor/android</p>
                  <p className="text-emerald-400 mt-1"># 2. Inisialisasi Proyek Android</p>
                  <p className="text-white">npx cap init "Nusantara SFA" "com.nusantara.sfa"</p>
                  <p className="text-white">npx cap add android</p>
                  <p className="text-emerald-400 mt-1"># 3. Build & Buka di Android Studio untuk generate .APK</p>
                  <p className="text-white">npm run build && npx cap copy</p>
                  <p className="text-white">npx cap open android</p>
                </div>

                <p className="text-[11px] text-slate-500">
                  File `.apk` yang dihasilkan dapat di-install secara langsung di seluruh HP salesman kantor tanpa biaya Google Play Store.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Nusantara SFA • Siap Dipakai di Seluruh Smartphone
          </span>

          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
