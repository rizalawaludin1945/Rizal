import React, { useState } from 'react';
import {
  Compass,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  MapPin,
  Clock,
  Sparkles,
  Banknote,
  Globe2,
  Crown,
  Briefcase,
  Store,
  Layers,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { UserAccount } from '../types/sfa';

interface LaunchTourModalProps {
  currentUser: UserAccount;
  onClose: () => void;
  onSwitchToGeneralManager: () => void;
  onOpenBranchSelector: () => void;
}

export const LaunchTourModal: React.FC<LaunchTourModalProps> = ({
  currentUser,
  onClose,
  onSwitchToGeneralManager,
  onOpenBranchSelector
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      badge: 'Selamat Datang di Nusantara SFA',
      title: 'Solusi Distribusi Nasional General Trade & Modern Trade',
      desc: 'Platform terintegrasi untuk mendistribusikan produk ke ribuan toko kelontong, grosir tradisional (General Trade), dan minimarket/supermarket modern (Modern Trade) di seluruh nusantara.',
      icon: Store,
      color: 'from-blue-600 to-indigo-700',
      highlights: [
        'Khusus segmen distribusi FMCG, F&B, dan Retail Nasional',
        'Offline-First: Tetap lancar di area minim sinyal/remote',
        'Sinkronisasi otomatis real-time ke server pusat'
      ]
    },
    {
      badge: 'Jaringan Multi-Cabang Seluruh Indonesia',
      title: '10 Kantor Cabang Regional Saling Terhubung',
      desc: 'Dari Sabang sampai Merauke, sistem mendukung operasional kantor cabang di Sumatera, DKI & Banten, Jawa Barat, Jawa Tengah, Jawa Timur, Bali-Nusra, Kalimantan, Sulawesi, hingga Maluku & Papua.',
      icon: Globe2,
      color: 'from-teal-600 to-emerald-700',
      highlights: [
        'Setiap kantor cabang mengelola database outlet & tim lokal',
        'Data antar cabang tersinkronisasi dalam satu arsitektur terpadu',
        'Pemilihan wilayah cabang fleksibel dan transparan'
      ]
    },
    {
      badge: 'Hierarki Kepemimpinan & Hak Akses',
      title: 'Akses Penuh Hanya untuk General Manager',
      desc: 'General Manager memegang otoritas tertinggi untuk mengakses SEMUA fitur dan memantau seluruh kantor cabang se-Indonesia. Sementara tiap cabang dipimpin oleh Branch Manager independen.',
      icon: Crown,
      color: 'from-amber-600 to-orange-700',
      highlights: [
        'General Manager: Akses semua fitur, konsolidasi nasional & override approval',
        'Branch Manager: Pemimpin operasional kantor cabang regional',
        'Supervisor & Salesman: Pengawalan rute lapangan & eksekusi Call Plan'
      ]
    },
    {
      badge: 'Disiplin Kunjungan Lapangan',
      title: 'Monitoring Salesman, GPS Geofence & Watermark',
      desc: 'Memastikan kunjungan fisik salesman nyata ke toko dengan proteksi radius toleransi 100m, timer durasi kunjungan otomatis, dan foto check-in / check-out ber-watermark koordinat GPS.',
      icon: MapPin,
      color: 'from-purple-600 to-indigo-700',
      highlights: [
        'Siklus frekuensi kunjungan terstruktur: F1, F2, dan F4',
        'Validasi anti-fraud lokasi GPS saat check-in di toko',
        'Navigasi rute terintegrasi langsung dengan Google Maps'
      ]
    },
    {
      badge: 'Penyederhanaan Order & Keamanan Sistem',
      title: 'Input Total Order Cepat & AI Auto-Debugger',
      desc: 'Input nilai pesanan secara instan dengan nominal total (tanpa kerumitan memilih SKU satu per satu), sistem persetujuan hapus toko berjenjang, dan AI Auto-Debugger yang memperbaiki anomali data.',
      icon: Sparkles,
      color: 'from-blue-700 to-cyan-700',
      highlights: [
        'Input nilai total pesanan cepat dengan tombol nominal pintar',
        'Tanda tangan digital penerima toko langsung di layar HP',
        'Diagnosa mandiri dan perbaikan error aplikasi dengan AI'
      ]
    },
    {
      badge: 'Luncurkan di Semua Perangkat',
      title: 'Support Penuh Semua HP Android & Apple iOS',
      desc: 'Aplikasi dapat langsung dipasang di layar utama semua ponsel pintar Android (Samsung, Oppo, Xiaomi, Vivo) dan iPhone/iPad Apple tanpa perlu membuka App Store atau Play Store.',
      icon: Smartphone,
      color: 'from-emerald-600 to-teal-800',
      highlights: [
        '1-Klik Pasang PWA Standalone di Android (Chrome) & iOS (Safari)',
        'Mode Layar Penuh dengan performa native & GPS akurat',
        'Sinkronisasi otomatis real-time antar perangkat salesman & manajer'
      ]
    }
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner with dynamic gradient */}
        <div className={`bg-gradient-to-r ${step.color} text-white p-6 relative overflow-hidden shrink-0`}>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-white border border-white/30">
              {step.badge}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-xs transition-colors"
              title="Tutup / Lewati Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <step.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">{step.title}</h2>
              <p className="text-xs text-white/80 mt-0.5">Langkah {currentStep + 1} dari {steps.length}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 space-y-4 text-slate-700 overflow-y-auto">
          <p className="text-xs leading-relaxed font-medium text-slate-600">
            {step.desc}
          </p>

          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Keunggulan Utama:
            </span>
            {step.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{h}</span>
              </div>
            ))}
          </div>

          {/* Special Action on Step 2 (Branches) or Step 3 (GM) */}
          {currentStep === 1 && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-teal-900">Ingin Mengganti Kantor Cabang?</p>
                <p className="text-[10px] text-teal-700">Pilih wilayah kantor cabang operasional Anda</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenBranchSelector();
                }}
                className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
              >
                <span>Pilih Cabang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {currentStep === 2 && currentUser.role !== 'general_manager' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-amber-950">Masuk sebagai General Manager?</p>
                <p className="text-[10px] text-amber-800">Buka akses ke semua fitur & semua cabang se-Indonesia</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onSwitchToGeneralManager();
                }}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Beralih ke GM</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer with Step Indicator and Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === i ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Langkah ${i + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="py-2 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className={`py-2 px-4 rounded-xl text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                isLast
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              <span>{isLast ? 'Mulai Gunakan Aplikasi' : 'Lanjut'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
