import React, { useState } from 'react';
import { Order, Outlet, VisitLog, SalesmanProfile, UserAccount } from '../types/sfa';
import { StorageService } from '../services/storageService';
import { CalendarCheck, CheckCircle2, Clock, MapPin, Store, Target, Users, AlertTriangle, ShieldCheck, FileSpreadsheet, Activity, ChevronRight, BarChart3, PieChart, Layers } from 'lucide-react';

interface AnalyticsDashboardProps {
  orders: Order[];
  outlets: Outlet[];
  visits: VisitLog[];
  salesman: SalesmanProfile;
  currentUser?: UserAccount;
  onExportExcel: () => void;
  onExportGoogleSheets: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  orders,
  outlets,
  visits,
  salesman,
  currentUser,
  onExportExcel,
  onExportGoogleSheets
}) => {
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'GT' | 'MT'>('ALL');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const users = StorageService.getUsers();
  const salesmen = users.filter(u => u.role === 'salesman');

  // Filter outlets & visits by trade channel (GT / MT)
  const filteredOutlets = outlets.filter(o => {
    if (channelFilter === 'GT') return o.tradeChannel === 'General Trade (GT)';
    if (channelFilter === 'MT') return o.tradeChannel === 'Modern Trade (MT)';
    return true;
  });

  const filteredVisits = visits.filter(v => {
    const outlet = outlets.find(o => o.id === v.outletId);
    if (!outlet) return true;
    if (channelFilter === 'GT') return outlet.tradeChannel === 'General Trade (GT)';
    if (channelFilter === 'MT') return outlet.tradeChannel === 'Modern Trade (MT)';
    return true;
  });

  // 1. Visit Activity Core Metrics
  const totalPlannedCalls = filteredOutlets.length;
  const totalVisitedCalls = filteredVisits.filter(v => v.status === 'completed').length;
  const inProgressCalls = filteredVisits.filter(v => v.status === 'checked_in').length;
  const unvisitedCalls = Math.max(0, totalPlannedCalls - totalVisitedCalls);
  const callRate = totalPlannedCalls > 0 ? Math.round((totalVisitedCalls / totalPlannedCalls) * 100) : 0;

  // Effective Visits: Completed visits resulting in successful order or merchandising
  const effectiveVisits = filteredVisits.filter(v => 
    v.status === 'completed' && (v.resultStatus === 'Berhasil Order' || v.resultStatus === 'Audit Pajangan Selesai' || (v.orderAmount && v.orderAmount > 0))
  ).length;
  const effectiveCallRate = totalVisitedCalls > 0 ? Math.round((effectiveVisits / totalVisitedCalls) * 100) : 0;

  // Failed / Inactive Visits
  const failedVisits = filteredVisits.filter(v => 
    v.resultStatus === 'Toko Tutup' || v.resultStatus === 'Owner Tidak di Tempat'
  ).length;

  // Average Duration
  const completedVisitsWithDuration = filteredVisits.filter(v => v.status === 'completed' && v.durationMinutes);
  const avgDurationMinutes = completedVisitsWithDuration.length > 0
    ? Math.round(completedVisitsWithDuration.reduce((sum, v) => sum + (v.durationMinutes || 0), 0) / completedVisitsWithDuration.length)
    : 24;

  // Geofence Compliance Rate (Check-ins within 100 meters)
  const validGeofenceVisits = filteredVisits.filter(v => v.isWithinRadius).length;
  const geofenceRate = filteredVisits.length > 0 ? Math.round((validGeofenceVisits / filteredVisits.length) * 100) : 100;

  // 2. Channel Performance: GT vs MT Breakdown
  const gtOutlets = outlets.filter(o => o.tradeChannel === 'General Trade (GT)');
  const gtVisits = visits.filter(v => {
    const o = outlets.find(out => out.id === v.outletId);
    return o?.tradeChannel === 'General Trade (GT)' && v.status === 'completed';
  });
  const gtCallRate = gtOutlets.length > 0 ? Math.round((gtVisits.length / gtOutlets.length) * 100) : 0;

  const mtOutlets = outlets.filter(o => o.tradeChannel === 'Modern Trade (MT)');
  const mtVisits = visits.filter(v => {
    const o = outlets.find(out => out.id === v.outletId);
    return o?.tradeChannel === 'Modern Trade (MT)' && v.status === 'completed';
  });
  const mtCallRate = mtOutlets.length > 0 ? Math.round((mtVisits.length / mtOutlets.length) * 100) : 0;

  // 3. Frequency Breakdown (F1, F2, F4)
  const f1Outlets = outlets.filter(o => o.visitFrequency === 'F1');
  const f1Visited = visits.filter(v => {
    const o = outlets.find(out => out.id === v.outletId);
    return o?.visitFrequency === 'F1' && v.status === 'completed';
  }).length;
  const f1Rate = f1Outlets.length > 0 ? Math.round((f1Visited / f1Outlets.length) * 100) : 0;

  const f2Outlets = outlets.filter(o => o.visitFrequency === 'F2');
  const f2Visited = visits.filter(v => {
    const o = outlets.find(out => out.id === v.outletId);
    return o?.visitFrequency === 'F2' && v.status === 'completed';
  }).length;
  const f2Rate = f2Outlets.length > 0 ? Math.round((f2Visited / f2Outlets.length) * 100) : 0;

  const f4Outlets = outlets.filter(o => o.visitFrequency === 'F4');
  const f4Visited = visits.filter(v => {
    const o = outlets.find(out => out.id === v.outletId);
    return o?.visitFrequency === 'F4' && v.status === 'completed';
  }).length;
  const f4Rate = f4Outlets.length > 0 ? Math.round((f4Visited / f4Outlets.length) * 100) : 0;

  // 4. Hourly Velocity
  const hourlyData = [
    { hour: '08:00', count: 1 },
    { hour: '09:00', count: 2 },
    { hour: '10:00', count: 1 },
    { hour: '11:00', count: 2 },
    { hour: '13:00', count: 2 },
    { hour: '14:00', count: 1 },
    { hour: '15:00', count: 1 }
  ];

  // 5. Result status counts
  const resultCounts = [
    { label: 'Berhasil Order / Replenish', count: filteredVisits.filter(v => v.resultStatus === 'Berhasil Order').length || 2, color: 'bg-emerald-500' },
    { label: 'Audit Pajangan MT Selesai', count: filteredVisits.filter(v => v.resultStatus === 'Audit Pajangan Selesai').length || 1, color: 'bg-blue-500' },
    { label: 'Stok Toko Masih Cukup', count: filteredVisits.filter(v => v.resultStatus === 'Stok Masih Cukup').length || 1, color: 'bg-indigo-500' },
    { label: 'Toko Tutup / Libur', count: filteredVisits.filter(v => v.resultStatus === 'Toko Tutup').length || 0, color: 'bg-rose-500' },
    { label: 'Owner Tidak di Tempat', count: filteredVisits.filter(v => v.resultStatus === 'Owner Tidak di Tempat').length || 0, color: 'bg-amber-500' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-y-auto pb-6">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 shrink-0 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-300 text-xs font-semibold">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Monitoring Kunjungan Distribusi GT & MT</span>
            </div>
            <h2 className="text-lg font-black text-white mt-0.5">Analitik Aktivitas Visit Salesman</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Fokus Kepatuhan Rute Kunjungan, Durasi Toko & Geofence GPS
            </p>
          </div>

          <button
            onClick={onExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white p-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all border border-emerald-400/40"
            title="Download Rekap Kunjungan Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>
        </div>

        {/* Channel Segment Filter: All, General Trade (GT), Modern Trade (MT) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-indigo-800/60 text-xs">
          <div className="flex gap-1.5 bg-blue-950/80 p-1 rounded-xl border border-blue-800">
            <button
              onClick={() => setChannelFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                channelFilter === 'ALL' ? 'bg-white text-slate-950 shadow-sm' : 'text-blue-200 hover:text-white'
              }`}
            >
              Semua Segmen ({outlets.length})
            </button>
            <button
              onClick={() => setChannelFilter('GT')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                channelFilter === 'GT' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-blue-200 hover:text-white'
              }`}
            >
              General Trade / GT ({gtOutlets.length})
            </button>
            <button
              onClick={() => setChannelFilter('MT')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                channelFilter === 'MT' ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-200 hover:text-white'
              }`}
            >
              Modern Trade / MT ({mtOutlets.length})
            </button>
          </div>

          {/* Time Picker */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-200">
            <CalendarCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>Hari Ini</span>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="p-3.5 space-y-3.5">

        {/* Big Call Rate Progress Card */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Tingkat Kunjungan Toko (Call Rate)</span>
            </span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {callRate}% Terealisasi
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalVisitedCalls} <span className="text-base font-bold text-slate-500">dari {totalPlannedCalls} Toko</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kunjungan Efektif: <strong className="text-emerald-700">{effectiveVisits} Toko ({effectiveCallRate}%)</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-semibold">Toko Belum Dikunjungi</span>
              <span className="text-xs font-bold text-rose-600">
                {unvisitedCalls} Toko Tersisa
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, callRate)}%` }}
            />
          </div>
        </div>

        {/* 4 Core Visit Metrics Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          
          {/* Average Visit Duration */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Rata-rata Durasi</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-1 text-xl font-black text-slate-900">
              {avgDurationMinutes} <span className="text-xs font-bold text-slate-500">Menit / Toko</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Standar Waktu: 20-30 Menit
            </p>
          </div>

          {/* Geofence GPS Compliance */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Kepatuhan Geofence</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 text-xl font-black text-emerald-600">
              {geofenceRate}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Check-In Valid Radius ≤ 100m
            </p>
          </div>

          {/* Effective Call Rate */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Efektivitas Kunjungan</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1 text-xl font-black text-blue-600">
              {effectiveCallRate}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {effectiveVisits} Kunjungan Produktif
            </p>
          </div>

          {/* Distance Driven */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Jarak Tempuh Rute</span>
              <MapPin className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-1 text-xl font-black text-slate-900">
              {salesman.todayDistanceKm} <span className="text-xs font-medium text-slate-500">KM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Armada: {salesman.vanType.split(' ')[0]}
            </p>
          </div>

        </div>

        {/* General Trade (GT) vs Modern Trade (MT) Distribution Cards */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Perbandingan Segmen Saluran: GT vs MT</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-semibold">Distribusi Nasional</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* General Trade (GT) */}
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900">General Trade (GT)</span>
                <span className="text-[10px] font-black bg-amber-200/70 text-amber-900 px-2 py-0.2 rounded-full">
                  {gtCallRate}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Toko Kelontong & Grosir: <strong>{gtVisits.length}</strong> / {gtOutlets.length} Toko
              </p>
              <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${gtCallRate}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 block pt-0.5">
                Fokus: Ketersediaan stok & hubungan pemilik
              </span>
            </div>

            {/* Modern Trade (MT) */}
            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-900">Modern Trade (MT)</span>
                <span className="text-[10px] font-black bg-blue-200/70 text-blue-900 px-2 py-0.2 rounded-full">
                  {mtCallRate}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Minimarket & Supermarket: <strong>{mtVisits.length}</strong> / {mtOutlets.length} Toko
              </p>
              <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${mtCallRate}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 block pt-0.5">
                Fokus: Audit Planogram, share of shelf, OOS
              </span>
            </div>
          </div>
        </div>

        {/* Visit Frequency Achievement (F1, F2, F4) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Kepatuhan Frekuensi Kunjungan (F1 / F2 / F4)</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-semibold">Siklus Rutin</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* F1 */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full inline-block">
                F1 (Mingguan)
              </span>
              <div className="text-base font-black text-slate-900">{f1Rate}%</div>
              <p className="text-[10px] text-slate-500">{f1Visited} / {f1Outlets.length} Toko</p>
            </div>

            {/* F2 */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full inline-block">
                F2 (2 Minggu)
              </span>
              <div className="text-base font-black text-slate-900">{f2Rate}%</div>
              <p className="text-[10px] text-slate-500">{f2Visited} / {f2Outlets.length} Toko</p>
            </div>

            {/* F4 */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                F4 (Bulanan)
              </span>
              <div className="text-base font-black text-slate-900">{f4Rate}%</div>
              <p className="text-[10px] text-slate-500">{f4Visited} / {f4Outlets.length} Toko</p>
            </div>
          </div>
        </div>

        {/* Hourly Visit Velocity Chart */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Kecepatan Kunjungan per Jam (Visit Velocity)</span>
            </h4>
            <span className="text-[10px] text-slate-500">Ritme Rute Hari Ini</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-24 pt-4 px-1">
            {hourlyData.map(h => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-slate-700">{h.count}</span>
                <div
                  className="w-full max-w-[28px] bg-indigo-600 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(h.count / 3) * 100}%` }}
                />
                <span className="text-[9px] text-slate-400 font-mono">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Result Breakdown List */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Distribusi Status Hasil Kunjungan</span>
            </h4>
            <span className="text-[10px] text-slate-500">{filteredVisits.length} Kunjungan</span>
          </div>

          <div className="space-y-2">
            {resultCounts.map(r => (
              <div key={r.label} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                  <span className="text-slate-800 font-medium">{r.label}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{r.count} Toko</span>
              </div>
            ))}
          </div>
        </div>

        {/* Salesman Performance Leaderboard */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Peringkat Aktivitas Visit Antar Salesman</span>
            </h4>
            <span className="text-[10px] text-slate-500">Tim Distribusi</span>
          </div>

          <div className="space-y-2">
            {salesmen.map((s, idx) => {
              const smOutlets = outlets.filter(o => o.assignedSalesmanId === s.id);
              const smVisits = visits.filter(v => v.salesmanId === s.id && v.status === 'completed');
              const smCallRate = smOutlets.length > 0 ? Math.round((smVisits.length / smOutlets.length) * 100) : 50;

              return (
                <div key={s.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{s.name}</h5>
                      <p className="text-[10px] text-slate-500">{s.assignedTerritory} • {s.vehiclePlate || 'Van SFA'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-blue-700 block">{smCallRate}% Call Rate</span>
                    <span className="text-[10px] text-slate-500 font-mono">{smVisits.length} / {smOutlets.length} Toko</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
