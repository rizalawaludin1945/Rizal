import React, { useState } from 'react';
import { BranchOffice, UserAccount } from '../types/sfa';
import { StorageService } from '../services/storageService';
import {
  Building2,
  MapPin,
  Users,
  Store,
  Phone,
  CheckCircle2,
  X,
  Search,
  Globe2,
  Crown,
  ChevronRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface BranchSelectorModalProps {
  currentUser: UserAccount;
  currentBranchId: string;
  branches: BranchOffice[];
  onSelectBranch: (branchId: string) => void;
  onSwitchToManager: (managerUserId: string) => void;
  onClose: () => void;
}

export const BranchSelectorModal: React.FC<BranchSelectorModalProps> = ({
  currentUser,
  currentBranchId,
  branches,
  onSelectBranch,
  onSwitchToManager,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Semua');

  const isGM = currentUser.role === 'general_manager';

  const regions = [
    'Semua',
    'DKI & Banten',
    'Jawa Barat',
    'Jawa Tengah & DIY',
    'Jawa Timur',
    'Sumatera Utara',
    'Sumatera Selatan',
    'Bali & Nusa Tenggara',
    'Kalimantan',
    'Sulawesi',
    'Maluku & Papua'
  ];

  const filteredBranches = branches.filter(b => {
    const matchRegion = selectedRegion === 'Semua' || b.region === selectedRegion;
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.managerName.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4.5 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <Globe2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                  Seluruh Indonesia
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Multi-Cabang Terhubung
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-0.5">Pilihan Wilayah Kantor Cabang</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama kantor cabang, kota, alamat, atau kepala cabang..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Region Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            {regions.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-semibold ${
                  selectedRegion === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

        </div>

        {/* Branch List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100">

          {/* NATIONAL CONSOLIDATION CARD (Accessible to General Manager or Preview) */}
          <div
            onClick={() => {
              if (isGM) {
                onSelectBranch('ALL');
                onClose();
              }
            }}
            className={`p-4 rounded-2xl border-2 transition-all relative ${
              currentBranchId === 'ALL'
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-500 shadow-md ring-2 ring-amber-400/40'
                : 'bg-white border-amber-200 hover:border-amber-400 cursor-pointer shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                      Seluruh Indonesia
                    </span>
                    <span className="text-[10px] font-bold text-amber-800">
                      ★ Hak Akses Khusus General Manager
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    Konsolidasi Nasional (Semua Kantor Cabang)
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Menampilkan rekapitulasi data kunjungan, outlet, dan transaksi dari ke-10 kantor cabang se-Indonesia
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {currentBranchId === 'ALL' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aktif Dipilih
                  </span>
                ) : isGM ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBranch('ALL');
                      onClose();
                    }}
                    className="py-1 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Pilih Nasional
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                    Khusus General Manager
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* LIST OF 10 BRANCHES */}
          <div className="space-y-3">
            {filteredBranches.map(branch => {
              const isSelected = currentBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  className={`bg-white rounded-2xl p-4 border-2 transition-all shadow-xs ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/30'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {/* Top Bar of Branch Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          {branch.code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {branch.region}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Online Synced
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">{branch.name}</h4>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{branch.address}</span>
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cabang Aktif
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Branch Operational Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Kepala Cabang (Branch Manager):</span>
                      <strong className="text-slate-900 block text-[11px] truncate">{branch.managerName}</strong>
                      <span className="text-[10px] text-blue-700 font-mono">{branch.managerPhone}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Jaringan Outlet GT/MT:</span>
                      <strong className="text-slate-900 block text-xs">±{branch.totalOutletsCount} Toko</strong>
                      <span className="text-[10px] text-slate-500">Terdaftar Aktif</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 block">Armada Salesman Cabang:</span>
                      <strong className="text-slate-900 block text-xs">{branch.activeSalesmenCount} Salesman</strong>
                      <span className="text-[10px] text-slate-500">Van & TO Lapangan</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                    
                    {/* Switch to this Branch Manager Account Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchToManager(branch.managerUserId);
                        onSelectBranch(branch.id);
                        onClose();
                      }}
                      className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold flex items-center gap-1.5 transition-colors text-[11px] border border-indigo-200"
                      title={`Beralih akun ke Branch Manager ${branch.managerName}`}
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Masuk sbg Kepala Cabang</span>
                    </button>

                    {/* Select This Branch for Data Filtering */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBranch(branch.id);
                        onClose();
                      }}
                      className={`py-1.5 px-3.5 rounded-xl font-bold flex items-center gap-1 transition-all text-xs ${
                        isSelected
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      }`}
                    >
                      <span>{isSelected ? 'Sedang Dipilih' : 'Pilih Cabang Ini'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Cabang aktif saat ini:</span>
            <strong className="text-blue-900">
              {currentBranchId === 'ALL'
                ? 'Semua Cabang (Konsolidasi Nasional)'
                : (branches.find(b => b.id === currentBranchId)?.name || 'Cabang Terpilih')}
            </strong>
          </div>

          <button
            onClick={onClose}
            className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
