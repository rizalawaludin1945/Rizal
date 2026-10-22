import React, { useState } from 'react';
import { SyncQueueItem, Order, Outlet, VisitLog, SalesmanProfile } from '../types/sfa';
import { StorageService } from '../services/storageService';
import { ExcelExportService } from '../services/excelExportService';
import { RefreshCw, Wifi, WifiOff, FileSpreadsheet, Download, Copy, Check, CheckCircle2, Clock, AlertTriangle, ExternalLink, HelpCircle, Layers, MapPin, Database } from 'lucide-react';

interface SyncAndExportViewProps {
  syncQueue: SyncQueueItem[];
  orders: Order[];
  outlets: Outlet[];
  visits: VisitLog[];
  salesman: SalesmanProfile;
  isOnline: boolean;
  onToggleOnline: () => void;
  onSyncCompleted: () => void;
}

export const SyncAndExportView: React.FC<SyncAndExportViewProps> = ({
  syncQueue,
  orders,
  outlets,
  visits,
  salesman,
  isOnline,
  onToggleOnline,
  onSyncCompleted
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedTSV, setCopiedTSV] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'export' | 'guide3d'>('export');

  const pendingItems = syncQueue.filter(q => q.status === 'pending' || q.status === 'failed');

  const handleStartSync = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: pendingItems.length });

    await StorageService.processSyncQueue((curr, total) => {
      setSyncProgress({ current: curr, total });
    });

    setIsSyncing(false);
    setSyncProgress(null);
    onSyncCompleted();
  };

  const handleDownloadExcel = () => {
    ExcelExportService.exportToExcel(outlets, orders, visits, salesman);
  };

  const handleDownloadCSV = () => {
    const csvContent = ExcelExportService.generateGoogleSheetsCSV(outlets, orders, salesman);
    ExcelExportService.downloadCSV(csvContent, `SFA_Distribusi_GoogleSheets_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleCopyTSV = () => {
    const tsvContent = ExcelExportService.generateGoogleSheetsTSV(outlets, orders, salesman);
    navigator.clipboard.writeText(tsvContent);
    setCopiedTSV(true);
    setTimeout(() => setCopiedTSV(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shrink-0 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Sinkronisasi & Ekspor Data</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Kelola data offline-first, backup server & ekspor format 3D Maps Excel
            </p>
          </div>

          {/* Network Mode Switcher Button */}
          <button
            onClick={onToggleOnline}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isOnline
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border border-emerald-300'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-300 animate-pulse'
            }`}
            title="Klik untuk simulasi online/offline"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online (Server OK)' : 'Offline (Simulasi)'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 pt-1 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'export' ? 'bg-white text-blue-950 shadow-sm' : 'bg-blue-800/80 text-blue-200 hover:bg-blue-800'
            }`}
          >
            📊 Ekspor Excel & Sheets
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'sync' ? 'bg-white text-blue-950 shadow-sm' : 'bg-blue-800/80 text-blue-200 hover:bg-blue-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronisasi {pendingItems.length > 0 && `(${pendingItems.length})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('guide3d')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'guide3d' ? 'bg-white text-blue-950 shadow-sm' : 'bg-blue-800/80 text-blue-200 hover:bg-blue-800'
            }`}
          >
            🗺️ Panduan 3D Maps
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        
        {/* TAB 1: EXPORT EXCEL & GOOGLE SHEETS */}
        {activeTab === 'export' && (
          <div className="space-y-3.5">
            
            {/* Excel 3D Maps Card */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Download Excel Multi-Sheet (.xlsx)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dukungan Khusus Microsoft Excel 3D Maps (Power Map)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Ready .XLSX
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Struktur Sheet Excel yang Dihasilkan:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                  <li><strong>Sheet 1: 3D_Map_Geotag_Data</strong> (Latitude, Longitude, Kategori, Omset IDR, Height)</li>
                  <li><strong>Sheet 2: Detail_Transaksi_Pesanan</strong> (Faktur, SKU, Harga, Diskon, Geotag Link)</li>
                  <li><strong>Sheet 3: Master_Outlet_Geotag</strong> (Plafon Kredit, Status Kunjungan, No HP)</li>
                  <li><strong>Sheet 4: Ringkasan_KPI_Harian</strong> (Call Rate, Effective Call %, Target vs Actual)</li>
                </ul>
              </div>

              <button
                onClick={handleDownloadExcel}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download File Excel 3D Maps (.xlsx) Sekarang</span>
              </button>
            </div>

            {/* Google Sheets Integration Card */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Format Google Spreadsheet</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Salin instan atau unduh format CSV dengan Geotag Lengkap
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Cloud Ready
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Anda dapat menyalin data ke papan klip (clipboard) dan langsung menekan <strong>Ctrl + V</strong> di Google Sheets baru, atau unduh berkas .CSV berstandar UTF-8.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleCopyTSV}
                  className="py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedTSV ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedTSV ? 'Tersalin ke Clipboard!' : 'Salin untuk Google Sheets'}</span>
                </button>

                <button
                  onClick={handleDownloadCSV}
                  className="py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .CSV</span>
                </button>
              </div>
            </div>

            {/* Live Data Preview Table */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">Preview Data Geotagging Outlet ({outlets.length} Toko)</h4>
                <span className="text-[10px] text-slate-400">Kolom Peta 3D</span>
              </div>

              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                      <th className="py-2 pr-3">Kode</th>
                      <th className="py-2 pr-3">Nama Toko</th>
                      <th className="py-2 pr-3">Latitude</th>
                      <th className="py-2 pr-3">Longitude</th>
                      <th className="py-2 pr-3">Kategori</th>
                      <th className="py-2 text-right">Penjualan (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outlets.slice(0, 5).map(o => {
                      const outletSales = orders
                        .filter(ord => ord.outletId === o.id)
                        .reduce((sum, ord) => sum + ord.grandTotal, 0);

                      return (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-2 pr-3 font-mono font-bold text-slate-600">{o.code}</td>
                          <td className="py-2 pr-3 font-semibold text-slate-800">{o.name}</td>
                          <td className="py-2 pr-3 font-mono text-slate-600">{o.location.lat.toFixed(5)}</td>
                          <td className="py-2 pr-3 font-mono text-slate-600">{o.location.lng.toFixed(5)}</td>
                          <td className="py-2 pr-3 text-slate-600">{o.category}</td>
                          <td className="py-2 text-right font-bold text-blue-900">
                            Rp {outletSales.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: OFFLINE SYNC QUEUE */}
        {activeTab === 'sync' && (
          <div className="space-y-3.5">
            
            {/* Sync Status Banner */}
            <div className={`p-4 rounded-3xl border shadow-sm ${
              isOnline ? 'bg-white border-slate-200' : 'bg-amber-50/80 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${
                    isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isOnline ? 'Terhubung ke Server Distribusi' : 'Mode Offline Aktif'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {pendingItems.length === 0
                        ? 'Semua data telah tersinkronisasi 100%'
                        : `${pendingItems.length} transaksi menunggu pengiriman ke server pusat`}
                    </p>
                  </div>
                </div>

                <button
                  disabled={!isOnline || pendingItems.length === 0 || isSyncing}
                  onClick={handleStartSync}
                  className="px-4 py-2 rounded-xl bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Mengunggah...' : 'Sinkronkan'}</span>
                </button>
              </div>

              {/* Progress bar when syncing */}
              {syncProgress && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Mengirim data ke server ERP/WMS...</span>
                    <span>{syncProgress.current} / {syncProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sync Queue Table */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">Antrean Sinkronisasi (Sync Queue)</h4>
                <span className="text-[10px] text-slate-400">Offline-First Engine</span>
              </div>

              {syncQueue.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Antrean kosong. Belum ada aktivitas baru.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {syncQueue.slice().reverse().map(item => (
                    <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">
                            {item.type === 'ORDER' ? 'Pesanan (SO)' : item.type === 'VISIT' ? 'Kunjungan Toko' : item.type}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.status === 'synced'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'syncing'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          ID: {item.id} • {new Date(item.createdAt).toLocaleTimeString('id-ID')}
                        </p>
                      </div>

                      <div className="text-right">
                        {item.status === 'synced' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: PANDUAN MICROSOFT EXCEL 3D MAPS */}
        {activeTab === 'guide3d' && (
          <div className="space-y-3.5">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Cara Menggunakan Fitur 3D Maps di Excel</h3>
                  <p className="text-xs text-slate-500">Visualisasi 3 Dimensi Geotag Outlet & Volume Penjualan</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="font-bold text-blue-900">Langkah 1: Download & Buka File Excel</p>
                  <p className="text-slate-600 text-[11px]">
                    Tekan tombol <strong>Download File Excel 3D Maps</strong> pada tab Ekspor. Buka file tersebut menggunakan Microsoft Excel 2016, 2019, 2021, atau Microsoft 365.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="font-bold text-blue-900">Langkah 2: Buka Tab Sisipkan (Insert) -&gt; 3D Map</p>
                  <p className="text-slate-600 text-[11px]">
                    Klik sheet <code>3D_Map_Geotag_Data</code>, lalu di ribbon atas klik menu <strong>Insert</strong> &gt; <strong>3D Map</strong> (atau <em>Open 3D Maps / Peta 3D</em>).
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="font-bold text-blue-900">Langkah 3: Konfigurasi Parameter Kolom 3D</p>
                  <p className="text-slate-600 text-[11px]">
                    Excel secara otomatis mendeteksi kolom:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <li><strong>Location:</strong> Latitude & Longitude (Akurasi Geografis 100%)</li>
                    <li><strong>Height (Tinggi Bar):</strong> Masukkan kolom <code>Sales_Amount_IDR</code></li>
                    <li><strong>Category (Warna):</strong> Masukkan kolom <code>Category</code> (Grosir, Warung, GT)</li>
                    <li><strong>Time (Animasi Waktu):</strong> Masukkan kolom <code>Visit_Timestamp</code> untuk melihat urutan kunjungan salesman!</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={handleDownloadExcel}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Excel Sekarang</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
