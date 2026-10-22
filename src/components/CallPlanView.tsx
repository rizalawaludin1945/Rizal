import React, { useState, useEffect } from 'react';
import { DailyCallPlan, Outlet, GeoCoordinate, VisitLog, UserAccount, VisitDay, VisitFrequency, VisitWeekCycle } from '../types/sfa';
import { calculateDistanceMeters, StorageService } from '../services/storageService';
import { stampPhotoWithWatermark } from '../utils/photoWatermark';
import { CheckCircle2, Clock, MapPin, Navigation, Store, Camera, FileText, ChevronRight, Check, AlertTriangle, ShieldCheck, ExternalLink, Calendar, Filter, PlayCircle, StopCircle, RefreshCw, UserCheck, Settings, Plus, Edit3, Shield } from 'lucide-react';

interface CallPlanViewProps {
  callPlan: DailyCallPlan;
  outlets: Outlet[];
  currentLocation: GeoCoordinate;
  currentUser: UserAccount;
  users?: UserAccount[];
  activeVisit: VisitLog | null;
  onOpenOrder: (outlet: Outlet) => void;
  onSelectOnMap: (outlet: Outlet) => void;
  onCheckInCompleted: (visit: VisitLog) => void;
  onRequestCheckOut: (visit: VisitLog, outlet: Outlet) => void;
  onRefreshPlan: (salesmanId: string, day: VisitDay, week: 'W1' | 'W2' | 'W3' | 'W4') => void;
  onOutletScheduleUpdated?: () => void;
}

export const CallPlanView: React.FC<CallPlanViewProps> = ({
  callPlan,
  outlets,
  currentLocation,
  currentUser,
  users = [],
  activeVisit,
  onOpenOrder,
  onSelectOnMap,
  onCheckInCompleted,
  onRequestCheckOut,
  onRefreshPlan,
  onOutletScheduleUpdated
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'visited'>('all');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'F1' | 'F2' | 'F4'>('all');
  const [selectedDay, setSelectedDay] = useState<VisitDay>(callPlan.dayOfWeek || 'Senin');
  const [selectedWeek, setSelectedWeek] = useState<'W1' | 'W2' | 'W3' | 'W4'>(callPlan.weekCycle || 'W1');

  // Supervisor Daily Call Plan Management State
  const isSupervisor = currentUser.role === 'supervisor' || currentUser.role === 'general_manager' || currentUser.role === 'branch_manager';
  const salesmenList = users.filter(u => u.role === 'salesman');
  const [managedSalesmanId, setManagedSalesmanId] = useState<string>(callPlan.salesmanId || salesmenList[0]?.id || 'SLS-JKT-088');

  // Supervisor Schedule Editor Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [targetOutletId, setTargetOutletId] = useState<string>('');
  const [targetSalesmanId, setTargetSalesmanId] = useState<string>(managedSalesmanId);
  const [targetDay, setTargetDay] = useState<VisitDay>(selectedDay);
  const [targetFreq, setTargetFreq] = useState<VisitFrequency>('F1');
  const [targetCycle, setTargetCycle] = useState<VisitWeekCycle>('Semua');
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  // Check-In Modal State
  const [checkInModalOutlet, setCheckInModalOutlet] = useState<Outlet | null>(null);
  const [visitPurpose, setVisitPurpose] = useState<VisitLog['purpose']>('Taking Order');
  const [visitNotes, setVisitNotes] = useState('');
  const [checkInPhoto, setCheckInPhoto] = useState<string>('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Active visit elapsed seconds ticker
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (callPlan.salesmanId) {
      setManagedSalesmanId(callPlan.salesmanId);
      setTargetSalesmanId(callPlan.salesmanId);
    }
  }, [callPlan.salesmanId]);

  useEffect(() => {
    if (!activeVisit) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(activeVisit.checkInTime).getTime();
    const updateElapsed = () => {
      const nowMs = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeVisit]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDayWeekChange = (newDay: VisitDay, newWeek: 'W1' | 'W2' | 'W3' | 'W4') => {
    setSelectedDay(newDay);
    setSelectedWeek(newWeek);
    onRefreshPlan(managedSalesmanId || callPlan.salesmanId, newDay, newWeek);
  };

  const handleSwitchManagedSalesman = (salesmanId: string) => {
    setManagedSalesmanId(salesmanId);
    setTargetSalesmanId(salesmanId);
    onRefreshPlan(salesmanId, selectedDay, selectedWeek);
  };

  const handleOpenAddScheduleModal = (outlet?: Outlet) => {
    if (outlet) {
      setTargetOutletId(outlet.id);
      setTargetDay(outlet.visitDay || selectedDay);
      setTargetFreq(outlet.visitFrequency || 'F1');
      setTargetCycle(outlet.visitWeekCycle || 'Semua');
      setTargetSalesmanId(outlet.assignedSalesmanId || managedSalesmanId);
    } else {
      const firstAvailable = outlets[0]?.id || '';
      setTargetOutletId(firstAvailable);
      setTargetDay(selectedDay);
      setTargetFreq('F1');
      setTargetCycle('Semua');
      setTargetSalesmanId(managedSalesmanId);
    }
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOutletId) return;

    StorageService.updateOutletSchedule(
      targetOutletId,
      targetSalesmanId,
      targetDay,
      targetFreq,
      targetCycle
    );

    const activeCycle = targetFreq === 'F1' ? selectedWeek : (targetCycle === 'Semua' ? selectedWeek : targetCycle as any);
    onRefreshPlan(targetSalesmanId, targetDay, activeCycle);
    if (onOutletScheduleUpdated) {
      onOutletScheduleUpdated();
    }

    const matchedOutlet = outlets.find(o => o.id === targetOutletId);
    const matchedSalesman = salesmenList.find(s => s.id === targetSalesmanId);
    setScheduleNotice(`Jadwal "${matchedOutlet?.name || 'Toko'}" berhasil disimpan untuk ${matchedSalesman?.name || 'Salesman'} (Hari ${targetDay}, ${targetFreq})`);
    setTimeout(() => setScheduleNotice(null), 3500);

    setIsScheduleModalOpen(false);
  };

  const handleOpenCheckInModal = (outlet: Outlet) => {
    setCheckInModalOutlet(outlet);
    setCheckInPhoto('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80');
    setVisitNotes('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !checkInModalOutlet) return;

    setIsProcessingPhoto(true);
    try {
      const stamped = await stampPhotoWithWatermark(file, {
        outletName: checkInModalOutlet.name,
        salesmanName: currentUser.name,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        type: 'CHECK_IN'
      });
      setCheckInPhoto(stamped);
    } catch {
      // fallback
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSubmitCheckIn = () => {
    if (!checkInModalOutlet) return;

    const dist = calculateDistanceMeters(
      currentLocation.lat,
      currentLocation.lng,
      checkInModalOutlet.location.lat,
      checkInModalOutlet.location.lng
    );

    const newVisit = StorageService.checkInVisit({
      outletId: checkInModalOutlet.id,
      outletName: checkInModalOutlet.name,
      salesmanId: currentUser.id,
      salesmanName: currentUser.name,
      checkInTime: new Date().toISOString(),
      checkInLocation: {
        ...currentLocation,
        timestamp: new Date().toISOString()
      },
      distanceMeters: dist,
      isWithinRadius: dist <= 100,
      purpose: visitPurpose,
      resultStatus: 'Berhasil Order',
      notes: visitNotes,
      photoProofUrl: checkInPhoto,
      checkInPhotoUrl: checkInPhoto
    });

    onCheckInCompleted(newVisit);
    setCheckInModalOutlet(null);
  };

  const openGoogleMapsDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Metrics calculation
  const totalOutlets = callPlan.outlets.length;
  const visitedCount = callPlan.outlets.filter(o => o.status === 'visited').length;
  const progressPercent = totalOutlets > 0 ? Math.round((visitedCount / totalOutlets) * 100) : 0;
  const totalOrderAmount = callPlan.outlets.reduce((acc, o) => acc + (o.orderTotal || 0), 0);

  const filteredItems = callPlan.outlets.filter(item => {
    // Status filter
    if (filterStatus === 'pending' && item.status !== 'pending') return false;
    if (filterStatus === 'in_progress' && item.status !== 'in_progress') return false;
    if (filterStatus === 'visited' && item.status !== 'visited') return false;

    // Frequency filter
    if (filterFrequency !== 'all' && item.visitFrequency !== filterFrequency) return false;

    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-3.5 shrink-0 shadow-md space-y-2.5">
        
        {/* SUPERVISOR CONTROL & SALESMAN SELECTOR */}
        {isSupervisor && (
          <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-amber-500/40 space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-amber-300 font-extrabold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Supervisi Jadwal Harian Salesman</span>
              </span>
              <button
                type="button"
                onClick={() => handleOpenAddScheduleModal()}
                className="py-1 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-transform active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Atur Jadwal Toko</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-400 shrink-0 font-semibold">Salesman:</label>
              <select
                value={managedSalesmanId}
                onChange={(e) => handleSwitchManagedSalesman(e.target.value)}
                className="flex-1 text-xs py-1.5 px-2 rounded-xl bg-slate-800 text-amber-300 font-bold border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {salesmenList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id}) - {s.assignedTerritory}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Schedule Notice Toast */}
        {scheduleNotice && (
          <div className="bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="line-clamp-1">{scheduleNotice}</span>
          </div>
        )}

        {/* Salesman & Territory Bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">{callPlan.salesmanName}</span>
            <span className="text-[10px] bg-blue-800/80 text-blue-200 px-2 py-0.5 rounded-full border border-blue-700/60 font-semibold">
              {callPlan.salesmanId}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-blue-200">
            <Calendar className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-medium">{callPlan.date}</span>
          </div>
        </div>

        {/* Day & Week Frequency Cycle Selector */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-blue-800/60">
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] scrollbar-none py-0.5">
            {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as VisitDay[]).map(day => (
              <button
                key={day}
                onClick={() => handleDayWeekChange(day, selectedWeek)}
                className={`px-2 py-1 rounded-lg font-bold transition-all shrink-0 ${
                  selectedDay === day ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-blue-900/60 text-blue-200 hover:bg-blue-800'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Week Cycle Picker (W1, W2, W3, W4 for F2 and F4) */}
          <div className="flex items-center gap-0.5 bg-blue-950/80 p-0.5 rounded-xl border border-blue-800 shrink-0 text-[10px] font-bold">
            {(['W1', 'W2', 'W3', 'W4'] as const).map(w => (
              <button
                key={w}
                onClick={() => handleDayWeekChange(selectedDay, w)}
                className={`px-1.5 py-0.5 rounded-lg transition-colors ${
                  selectedWeek === w ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-300 hover:text-white'
                }`}
                title={`Siklus Minggu ke-${w.replace('W', '')}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Progress & Stats */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-base font-extrabold text-white">Call Plan Kunjungan</h2>
            <p className="text-[11px] text-blue-200">
              Pencapaian: <strong className="text-emerald-300">{visitedCount}</strong> dari {totalOutlets} Toko ({progressPercent}%)
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-blue-300 uppercase block font-semibold">Total Order Rute</span>
            <span className="text-sm font-extrabold text-amber-300">
              Rp {totalOrderAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-blue-950/80 rounded-full h-1.5 overflow-hidden border border-blue-800">
          <div
            className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Filter Pills (Status & Frequency) */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-800/50 text-[11px]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-0.5 rounded-md font-bold ${filterStatus === 'all' ? 'bg-white text-blue-950' : 'text-blue-200'}`}
            >
              Semua ({totalOutlets})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2 py-0.5 rounded-md font-bold ${filterStatus === 'pending' ? 'bg-white text-blue-950' : 'text-blue-200'}`}
            >
              Pending ({totalOutlets - visitedCount})
            </button>
            <button
              onClick={() => setFilterStatus('visited')}
              className={`px-2 py-0.5 rounded-md font-bold ${filterStatus === 'visited' ? 'bg-white text-blue-950' : 'text-blue-200'}`}
            >
              Selesai ({visitedCount})
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-blue-300 font-bold">Freq:</span>
            {(['all', 'F1', 'F2', 'F4'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterFrequency(f)}
                className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                  filterFrequency === f ? 'bg-amber-400 text-slate-950' : 'text-blue-300 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ACTIVE VISIT BANNER (Sedang Kunjungan) */}
      {activeVisit && (() => {
        const activeOutlet = outlets.find(o => o.id === activeVisit.outletId);
        return (
          <div className="bg-amber-500 text-slate-950 px-3.5 py-2.5 shrink-0 shadow-md flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-950 animate-ping"></div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block">Kunjungan Sedang Berlangsung</span>
                <span className="font-extrabold text-xs text-slate-950 line-clamp-1">{activeVisit.outletName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-950 text-amber-400 font-mono font-bold px-2 py-1 rounded-lg text-xs flex items-center gap-1 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>

              {activeOutlet && (
                <button
                  onClick={() => onRequestCheckOut(activeVisit, activeOutlet)}
                  className="py-1 px-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-900 transition-colors shadow-sm flex items-center gap-1"
                >
                  <StopCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Check-Out</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Outlets List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200 mt-2 space-y-2">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Jadwal Kunjungan</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tidak ada toko yang dijadwalkan pada hari {selectedDay} ({selectedWeek}) dengan filter frekuensi {filterFrequency}.
            </p>
          </div>
        ) : (
          filteredItems.map(planItem => {
            const outlet = outlets.find(o => o.id === planItem.outletId || o.code === planItem.outletCode);
            if (!outlet) return null;

            const dist = calculateDistanceMeters(
              currentLocation.lat,
              currentLocation.lng,
              outlet.location.lat,
              outlet.location.lng
            );
            const isNear = dist <= 100;
            const isVisited = planItem.status === 'visited';
            const isInProgress = activeVisit && activeVisit.outletId === outlet.id;

            return (
              <div
                key={planItem.outletId}
                className={`bg-white rounded-2xl p-3.5 shadow-sm border transition-all ${
                  isInProgress
                    ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-300'
                    : isVisited
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isInProgress
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : isVisited
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {planItem.sequence}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{outlet.name}</h4>
                        
                        {/* GT / MT Channel Tag */}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                          outlet.tradeChannel === 'General Trade (GT)'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {outlet.tradeChannel === 'General Trade (GT)' ? 'GT' : 'MT'} ({outlet.category})
                        </span>

                        {/* Frequency Tag: F1, F2, F4 */}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                          outlet.visitFrequency === 'F1'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : outlet.visitFrequency === 'F2'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {outlet.visitFrequency} ({outlet.visitFrequency === 'F1' ? 'Mingguan' : outlet.visitFrequency === 'F2' ? '2 Minggu' : 'Bulanan'})
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{outlet.address}</p>
                      
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-600 flex-wrap">
                        <span>Owner: <strong>{outlet.ownerName}</strong></span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">{outlet.termOfPayment}</span>
                        <span>•</span>
                        <span className="text-slate-500">{outlet.district}, {outlet.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Distance & Status Badge */}
                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isNear ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Navigation className="w-3 h-3 fill-current" />
                      {dist}m
                    </span>

                    {isInProgress && (
                      <span className="block text-[10px] text-amber-600 font-extrabold mt-1 animate-pulse">
                        ● Sedang Dikunjungi
                      </span>
                    )}

                    {isVisited && (
                      <span className="block text-[10px] text-emerald-600 font-bold mt-1">
                        ✓ Kunjungan Selesai
                      </span>
                    )}
                  </div>
                </div>

                {/* Order total if visited */}
                {planItem.orderTotal ? (
                  <div className="mt-2.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium">Total Pesanan Kunjungan:</span>
                    <span className="font-extrabold text-emerald-950">
                      Rp {planItem.orderTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                ) : null}

                {/* Action Buttons Row */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                  
                  {/* Google Maps Nav */}
                  <button
                    type="button"
                    onClick={() => openGoogleMapsDirections(outlet.location.lat, outlet.location.lng)}
                    className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1 transition-colors text-[11px]"
                    title="Buka Navigasi Rute Google Maps Langsung"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Maps</span>
                  </button>

                  {/* Route Map View */}
                  <button
                    type="button"
                    onClick={() => onSelectOnMap(outlet)}
                    className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1 transition-colors text-[11px]"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Peta Rute</span>
                  </button>

                  {/* Check-In / Check-Out Toggle */}
                  {isInProgress ? (
                    <button
                      type="button"
                      onClick={() => onRequestCheckOut(activeVisit!, outlet)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 transition-colors shadow-sm text-[11px]"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>Check-Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isVisited}
                      onClick={() => handleOpenCheckInModal(outlet)}
                      className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-[11px] ${
                        isVisited
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isVisited ? 'Sudah Visited' : 'Check-In'}</span>
                    </button>
                  )}

                  {/* Order Taking */}
                  <button
                    type="button"
                    onClick={() => onOpenOrder(outlet)}
                    className="py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1 transition-colors shadow-sm text-[11px]"
                  >
                    <span>+ Order</span>
                  </button>
                </div>

                {/* Supervisor quick edit schedule button */}
                {isSupervisor && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      Salesman: <strong className="text-slate-800">{outlet.assignedSalesmanName || 'Belum Ditugaskan'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAddScheduleModal(outlet)}
                      className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Jadwal Kunjungan</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CHECK-IN MODAL (Geotag, Google Maps Nav, & Photo Proof) */}
      {checkInModalOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 shrink-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">Check-In Kunjungan Toko</span>
                <h3 className="font-extrabold text-sm text-white">{checkInModalOutlet.name}</h3>
              </div>
              <button
                onClick={() => setCheckInModalOutlet(null)}
                className="w-7 h-7 rounded-lg bg-blue-950 text-blue-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
              
              {/* GPS Geofence Distance Validation */}
              {(() => {
                const d = calculateDistanceMeters(
                  currentLocation.lat,
                  currentLocation.lng,
                  checkInModalOutlet.location.lat,
                  checkInModalOutlet.location.lng
                );
                const valid = d <= 100;

                return (
                  <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                    valid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {valid ? <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
                      <div>
                        <p className="font-bold">{d} Meter dari Lokasi Toko</p>
                        <p className="text-[10px]">{valid ? 'Radius GPS valid untuk check-in (maksimal 100m)' : 'Perhatian: Posisi GPS melebihi radius 100m'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openGoogleMapsDirections(checkInModalOutlet.location.lat, checkInModalOutlet.location.lng)}
                      className="py-1 px-2 rounded-lg bg-white border border-slate-300 text-blue-600 font-bold text-[10px] shrink-0 flex items-center gap-1 shadow-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Maps</span>
                    </button>
                  </div>
                );
              })()}

              {/* Photo Upload with Timestamp & Watermark */}
              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1 flex items-center justify-between">
                  <span>Foto Bukti Kedatangan Toko *</span>
                  <span className="text-[10px] text-blue-600 font-normal">Geotag Otomatis</span>
                </label>

                <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 h-32 group">
                  <img
                    src={checkInPhoto}
                    alt="Bukti Check-In"
                    className="w-full h-full object-cover"
                  />

                  {isProcessingPhoto && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-semibold">
                      Menyematkan timestamp...
                    </div>
                  )}

                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white p-1.5 text-[9px] font-mono flex items-center justify-between">
                    <span>CHECK-IN: {currentUser.name}</span>
                    <span className="text-amber-300 font-bold">{new Date().toLocaleTimeString('id-ID')}</span>
                  </div>

                  <label className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-md">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Ambil / Ganti Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">Tujuan Kunjungan</label>
                <select
                  value={visitPurpose}
                  onChange={(e) => setVisitPurpose(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                >
                  <option value="Taking Order">Taking Order (Pesanan Baru)</option>
                  <option value="Cek Stok Display">Cek Stok Display & Merchandising</option>
                  <option value="Penagihan">Penagihan Piutang Toko</option>
                  <option value="Kunjungan Rutin">Kunjungan Rutin / Sosialisasi Promo</option>
                  <option value="Retur Barang">Retur Barang Rusak / Expired</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">Catatan Awal Kunjungan</label>
                <input
                  type="text"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Misal: Tiba pukul 09.15, display bersih..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckInModalOutlet(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 bg-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCheckIn}
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Kunci Check-In & Mulai</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUPERVISOR SCHEDULE EDITOR / CREATOR MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 shrink-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Supervisi Rute Distribusi</span>
                <h3 className="font-extrabold text-sm text-white">Atur / Update Jadwal Salesman</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-blue-950 text-blue-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-4 space-y-3 flex-1 overflow-y-auto text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">Pilih Toko / Outlet *</label>
                <select
                  value={targetOutletId}
                  onChange={(e) => {
                    setTargetOutletId(e.target.value);
                    const o = outlets.find(x => x.id === e.target.value);
                    if (o) {
                      setTargetDay(o.visitDay || selectedDay);
                      setTargetFreq(o.visitFrequency || 'F1');
                      setTargetCycle(o.visitWeekCycle || 'Semua');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                >
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code}) - {o.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">Tugaskan ke Akun Salesman *</label>
                <select
                  value={targetSalesmanId}
                  onChange={(e) => setTargetSalesmanId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-blue-900"
                >
                  {salesmenList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) - {s.assignedTerritory}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-800 block mb-1">Hari Kunjungan *</label>
                  <select
                    value={targetDay}
                    onChange={(e) => setTargetDay(e.target.value as VisitDay)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as VisitDay[]).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-800 block mb-1">Frekuensi Kunjungan *</label>
                  <select
                    value={targetFreq}
                    onChange={(e) => setTargetFreq(e.target.value as VisitFrequency)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    <option value="F1">F1 (1x Seminggu)</option>
                    <option value="F2">F2 (2 Minggu Sekali)</option>
                    <option value="F4">F4 (1x Sebulan)</option>
                  </select>
                </div>
              </div>

              {targetFreq !== 'F1' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-800 block mb-1">Siklus Minggu Kunjungan *</label>
                  <select
                    value={targetCycle}
                    onChange={(e) => setTargetCycle(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    <option value="Semua">Semua Minggu</option>
                    <option value="W1">Minggu 1 (W1)</option>
                    <option value="W2">Minggu 2 (W2)</option>
                    <option value="W3">Minggu 3 (W3)</option>
                    <option value="W4">Minggu 4 (W4)</option>
                  </select>
                </div>
              )}

              <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Sinkronisasi Real-Time Otomatis
                </span>
                <p>
                  Perubahan jadwal kunjungan toko ini langsung tersimpan ke server dan tersinkronisasi ke perangkat HP salesman terkait secara instan.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan & Terapkan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
