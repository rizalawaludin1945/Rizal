import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MapPin, CalendarCheck, Store, RefreshCw, Smartphone, Monitor, Wifi, WifiOff, BatteryCharging, Battery, Signal, Users, Download, FileText, Shield, Sparkles, Bell, Wrench, ChevronDown, CheckCircle2, Sliders, Sun, Volume2, ShieldCheck, Zap, Globe2, Crown, Building2, Compass } from 'lucide-react';
import { UserAccount } from '../types/sfa';
import { StorageService } from '../services/storageService';
import { INDONESIA_BRANCHES } from '../data/branchData';

interface AndroidShellProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'map' | 'callplan' | 'outlets' | 'visits' | 'sync';
  onTabChange: (tab: 'dashboard' | 'map' | 'callplan' | 'outlets' | 'visits' | 'sync') => void;
  pendingSyncCount: number;
  isOnline: boolean;
  currentUser: UserAccount;
  currentBranchId: string;
  onOpenUserManager: () => void;
  onOpenAndroidInstall: () => void;
  onOpenAiDebugger: () => void;
  onOpenApprovalModal?: () => void;
  onOpenBranchSelector: () => void;
  onOpenLaunchTour: () => void;
  onOpenAiAssistant?: () => void;
}

export const AndroidShell: React.FC<AndroidShellProps> = ({
  children,
  activeTab,
  onTabChange,
  pendingSyncCount,
  isOnline,
  currentUser,
  currentBranchId,
  onOpenUserManager,
  onOpenAndroidInstall,
  onOpenAiDebugger,
  onOpenApprovalModal,
  onOpenBranchSelector,
  onOpenLaunchTour,
  onOpenAiAssistant
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'responsive'>('mobile');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS] = useState(() => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || ''));
  
  // Real Battery State from Web Battery API (with robust fallbacks)
  const [batteryLevel, setBatteryLevel] = useState(91);
  const [isCharging, setIsCharging] = useState(false);
  const [batteryHealth, setBatteryHealth] = useState('Baik (31°C)');
  const [carrierName] = useState('Telkomsel 5G');

  // Quick settings toggles state
  const [gpsActive, setGpsActive] = useState(true);
  const [batterySaver, setBatterySaver] = useState(false);

  // Notifications count
  const unreadNotifs = StorageService.getNotifications().filter(n => !n.read).length;
  const pendingApprovals = StorageService.getDeletionRequests().filter(r => r.status === 'pending').length;

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Battery API detection
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {
        // fallback
      });
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:p-3 text-slate-800 font-sans">
      
      {/* Top Device & Quick Management Bar (Zero Avatars!) */}
      <div className="w-full max-w-5xl flex items-center justify-between px-3 py-2 text-xs text-slate-300">
        
        {/* App Title & Current User Tag */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="font-extrabold text-white tracking-wide text-sm">Nusantara SFA</span>

          {/* User Account Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl">
            <span className="font-bold text-slate-200 text-xs">{currentUser.name}</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
              currentUser.role === 'general_manager'
                ? 'bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-xs'
                : currentUser.role === 'branch_manager'
                ? 'bg-teal-700 text-white font-black border border-teal-500'
                : currentUser.role === 'supervisor'
                ? 'bg-purple-900 text-purple-200 border border-purple-700'
                : 'bg-blue-900 text-blue-200 border border-blue-700'
            }`}>
              {currentUser.role === 'general_manager' && <Crown className="w-2.5 h-2.5 text-slate-950" />}
              {currentUser.role === 'branch_manager' && <Building2 className="w-2.5 h-2.5 text-teal-200" />}
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>

          {/* Branch Office Selector Button */}
          <button
            onClick={onOpenBranchSelector}
            className="py-1 px-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Pilih Wilayah Kantor Cabang (Seluruh Indonesia)"
          >
            <Globe2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="max-w-[130px] truncate">
              {currentBranchId === 'ALL'
                ? '👑 Semua Cabang'
                : (INDONESIA_BRANCHES.find(b => b.id === currentBranchId)?.city || 'Cabang')}
            </span>
          </button>

          {/* Switch / Manage Account Button */}
          <button
            onClick={onOpenUserManager}
            className="py-1 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Kelola Akun Pengguna"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Akun</span>
          </button>
        </div>

        {/* Right Tools (Tour, AI Debugger, Approvals, Android Download & Layout Switcher) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Launch Tour Button */}
          <button
            onClick={onOpenLaunchTour}
            className="py-1 px-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-850 border border-indigo-700/60 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Buka Tour Peluncuran Aplikasi Nusantara SFA"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden md:inline">Tour SFA</span>
          </button>

          {/* AI Assistant Guidance Button */}
          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="py-1 px-2.5 rounded-xl bg-teal-900/60 hover:bg-teal-850 border border-teal-500/50 text-teal-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Asisten AI: Panduan Operasional SFA"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden md:inline">Asisten AI</span>
            </button>
          )}

          {/* AI Auto-Debugger Button */}
          <button
            onClick={onOpenAiDebugger}
            className="py-1 px-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="AI Auto-Debugger & System Fixer"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">AI Auto-Debug</span>
          </button>

          {/* Supervisor / GM Approval Notification Bell */}
          {(currentUser.role === 'supervisor' || currentUser.role === 'general_manager') && onOpenApprovalModal && (
            <button
              onClick={onOpenApprovalModal}
              className="py-1 px-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700/60 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors relative"
              title="Persetujuan Hapus Toko dari Salesman"
            >
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Approval</span>
              {pendingApprovals > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center animate-bounce">
                  {pendingApprovals}
                </span>
              )}
            </button>
          )}

          {/* Download & Install on Android & iOS Button */}
          <button
            onClick={onOpenAndroidInstall}
            className="py-1 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            title="Pasang Aplikasi di HP Android & iPhone / iPad (PWA Standalone)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pasang di HP</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/20 text-white font-mono font-bold">Android & iOS</span>
          </button>

          {/* Responsive Layout Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                deviceMode === 'mobile' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">HP</span>
            </button>
            <button
              onClick={() => setDeviceMode('responsive')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                deviceMode === 'responsive' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Layar Lebar</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main App Container (Full edge-to-edge on real smartphones; frame on desktop) */}
      <div
        className={`w-full transition-all duration-300 flex flex-col overflow-hidden bg-slate-100 ${
          deviceMode === 'mobile'
            ? 'max-w-[440px] h-[100dvh] sm:h-[890px] rounded-none sm:rounded-[44px] shadow-none sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-0 sm:border-8 border-slate-800 relative'
            : 'max-w-5xl h-[100dvh] sm:h-[92vh] rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl border-0 sm:border border-slate-800 relative'
        }`}
      >
        
        {/* NATIVE STATUS BAR (Supports iOS & Android status styling, safe-area top inset) */}
        <div 
          onClick={() => setShowQuickSettings(!showQuickSettings)}
          className="bg-slate-950 text-slate-200 px-4 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pb-2 flex items-center justify-between text-xs select-none shrink-0 z-40 border-b border-slate-900 cursor-pointer hover:bg-slate-900/90 transition-colors"
          title="Klik untuk membuka Quick Settings & Status Perangkat"
        >
          
          {/* Left: Time & Active Notification Indicators */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold font-mono tracking-tight text-white text-[13px]">{currentTime}</span>
            
            {/* GPS Active Icon */}
            {gpsActive && (
              <span title="GPS Geofence Aktif" className="text-emerald-400 flex items-center">
                <MapPin className="w-3 h-3 animate-pulse" />
              </span>
            )}

            {/* Pending Sync / Approval Notification Dot */}
            {(pendingSyncCount > 0 || pendingApprovals > 0) && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></div>
            )}
          </div>

          {/* Android Notch / Camera Pinhole */}
          {deviceMode === 'mobile' && (
            <div className="w-20 h-4 bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-950"></div>
              </div>
            </div>
          )}

          {/* Right: REALISTIC ANDROID SIGNAL & BATTERY STATUS */}
          <div className="flex items-center gap-2">
            
            {/* Wi-Fi Indicator */}
            {isOnline ? (
              <div className="flex items-center" title="Wi-Fi Terhubung (Sinyal Penuh)">
                <Wifi className="w-3.5 h-3.5 text-white" />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-400" title="Offline - Mode Lapangan">
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[9px] font-bold">Offline</span>
              </div>
            )}

            {/* Cellular Signal Strength with 5G / 4G LTE Badge */}
            <div className="flex items-center gap-0.5" title={`Sinyal Seluler: ${isOnline ? '5G Kuat (4/4 Bar)' : '2G Edge'}`}>
              <span className="text-[9px] font-mono font-black text-slate-300 mr-0.5">
                {isOnline ? '5G' : 'E'}
              </span>
              
              {/* Ultra-realistic Segmented Signal Bars SVG */}
              <svg className="w-4 h-3.5" viewBox="0 0 20 16" fill="none">
                <rect x="1" y="11" width="3" height="5" rx="0.8" fill={isOnline ? "#ffffff" : "#64748b"} />
                <rect x="5.5" y="8" width="3" height="8" rx="0.8" fill={isOnline ? "#ffffff" : "#64748b"} />
                <rect x="10" y="5" width="3" height="11" rx="0.8" fill={isOnline ? "#ffffff" : "#64748b"} />
                <rect x="14.5" y="2" width="3" height="14" rx="0.8" fill={isOnline ? "#ffffff" : "#334155"} />
              </svg>

              {/* Data Transfer Indicator Arrows */}
              <span className="text-[8px] font-mono text-emerald-400 font-bold tracking-tighter leading-none flex flex-col scale-75">
                <span>▲</span>
                <span className="text-blue-400">▼</span>
              </span>
            </div>

            {/* Real Dynamic Battery Meter */}
            <div className="flex items-center gap-1 pl-1" title={`Baterai: ${batteryLevel}% ${isCharging ? '(Mengisi Daya)' : ''}`}>
              <span className="text-[11px] font-mono font-bold text-white">
                {batteryLevel}%
              </span>

              {/* Graphical Battery Capsule */}
              <div className="relative flex items-center">
                <div className="w-5 h-2.5 rounded-[4px] border border-white/90 p-[1px] flex items-center bg-slate-900 shadow-inner">
                  <div
                    className={`h-full rounded-[2px] transition-all duration-300 ${
                      batteryLevel <= 20 
                        ? 'bg-rose-500' 
                        : batteryLevel <= 50 
                        ? 'bg-amber-400' 
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, batteryLevel))}%` }}
                  />
                </div>
                {/* Battery tip nub */}
                <div className="w-[2px] h-1.5 bg-white/90 rounded-r-xs ml-[0.5px]"></div>

                {/* Charging Bolt */}
                {isCharging && (
                  <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300 absolute -right-3 animate-pulse" />
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ANDROID QUICK SETTINGS / NOTIFICATION SHADE DRAWER */}
        {showQuickSettings && (
          <div className="absolute top-10 left-0 right-0 z-50 bg-slate-900/98 text-white p-4 shadow-2xl border-b border-slate-700 animate-in slide-in-from-top duration-200 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-base font-extrabold text-white">{currentTime}</span>
                <p className="text-xs text-slate-400">{currentDate}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {carrierName}
                </span>
                <button
                  onClick={() => setShowQuickSettings(false)}
                  className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Status Tiles */}
            <div className="grid grid-cols-4 gap-2 pt-3 pb-2 text-center">
              {/* Wi-Fi */}
              <div className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 ${isOnline ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Wifi className="w-4 h-4" />
                <span className="text-[10px] font-bold">Wi-Fi</span>
                <span className="text-[8px] opacity-80">{isOnline ? 'Aktif' : 'Mati'}</span>
              </div>

              {/* Data 5G */}
              <div className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 ${isOnline ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Signal className="w-4 h-4" />
                <span className="text-[10px] font-bold">Data 5G</span>
                <span className="text-[8px] opacity-80">{isOnline ? 'Telkomsel' : 'Offline'}</span>
              </div>

              {/* GPS High Precision */}
              <div 
                onClick={() => setGpsActive(!gpsActive)}
                className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 cursor-pointer transition-colors ${gpsActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                <MapPin className="w-4 h-4" />
                <span className="text-[10px] font-bold">GPS Geofence</span>
                <span className="text-[8px] opacity-80">{gpsActive ? '± 4m Presisi' : 'Nonaktif'}</span>
              </div>

              {/* Battery Saver */}
              <div 
                onClick={() => setBatterySaver(!batterySaver)}
                className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 cursor-pointer transition-colors ${batterySaver ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                <BatteryCharging className="w-4 h-4" />
                <span className="text-[10px] font-bold">Hemat Daya</span>
                <span className="text-[8px] opacity-80">{batterySaver ? 'Aktif' : 'Standar'}</span>
              </div>
            </div>

            {/* System Battery & Hardware Health Card */}
            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80 mt-2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  Kondisi Baterai Salesman:
                </span>
                <span className="font-bold text-white font-mono">{batteryLevel}% ({isCharging ? 'Mengisi Daya' : 'Penggunaan Normal'})</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Suhu & Kesehatan Baterai:</span>
                <span className="text-emerald-400 font-semibold">{batteryHealth}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Kekuatan Sinyal Lapangan:</span>
                <span className="text-blue-300 font-mono font-semibold">{isOnline ? '-68 dBm (Sangat Bagus)' : 'Tidak Ada Sinyal'}</span>
              </div>
            </div>

            {/* Quick Status SFA Alerts */}
            {(pendingApprovals > 0 || pendingSyncCount > 0) && (
              <div className="mt-2.5 space-y-1.5">
                {pendingApprovals > 0 && currentUser.role === 'supervisor' && (
                  <div 
                    onClick={() => { setShowQuickSettings(false); onOpenApprovalModal && onOpenApprovalModal(); }}
                    className="p-2.5 rounded-xl bg-purple-900/60 border border-purple-700 text-purple-200 text-xs flex items-center justify-between cursor-pointer hover:bg-purple-900"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{pendingApprovals} pengajuan hapus toko menunggu persetujuan Anda</span>
                    </div>
                    <span className="text-[10px] font-black underline">Lihat</span>
                  </div>
                )}

                {pendingSyncCount > 0 && (
                  <div 
                    onClick={() => { setShowQuickSettings(false); onTabChange('sync'); }}
                    className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-900/80"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{pendingSyncCount} transaksi tersimpan offline di HP</span>
                    </div>
                    <span className="text-[10px] font-black underline">Sinkron</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 text-center">
              <span className="text-[10px] text-slate-500">Klik di mana saja pada status bar untuk menutup panel</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </div>

        {/* Bottom Navigation Bar with Safe Area Inset for iOS Home Indicator & Android */}
        <div className="bg-white border-t border-slate-200/90 px-1.5 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around shrink-0 z-40 select-none shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          
          {/* Dashboard (Pure Visit Analytics - NO Omzet/Tagihan/SKU) */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Analitik Visit</span>
          </button>

          {/* Call Plan */}
          <button
            onClick={() => onTabChange('callplan')}
            className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all relative ${
              activeTab === 'callplan' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Call Plan</span>
          </button>

          {/* Map Route */}
          <button
            onClick={() => onTabChange('map')}
            className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all ${
              activeTab === 'map' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Peta GPS</span>
          </button>

          {/* Outlets (GT / MT, NOO, Hapus Toko, Approval) */}
          <button
            onClick={() => onTabChange('outlets')}
            className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all relative ${
              activeTab === 'outlets' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Outlet</span>
            {pendingApprovals > 0 && currentUser.role === 'supervisor' && (
              <span className="absolute -top-0.5 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {/* Visit History & Document Photo Proof */}
          <button
            onClick={() => onTabChange('visits')}
            className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all ${
              activeTab === 'visits' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Kunjungan</span>
          </button>

          {/* Sync & Excel */}
          <button
            onClick={() => onTabChange('sync')}
            className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all relative ${
              activeTab === 'sync' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Sync</span>
            {pendingSyncCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-sm">
                {pendingSyncCount}
              </span>
            )}
          </button>

        </div>

        {/* Android Home Indicator Pill */}
        {deviceMode === 'mobile' && (
          <div className="bg-white pb-2 flex justify-center">
            <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
          </div>
        )}

      </div>
    </div>
  );
};
