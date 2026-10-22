import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { ExcelExportService } from './services/excelExportService';
import { Outlet, Product, Order, VisitLog, DailyCallPlan, SalesmanProfile, SyncQueueItem, GeoCoordinate, UserAccount, VisitDay } from './types/sfa';
import { AndroidShell } from './components/AndroidShell';
import { MapView } from './components/MapView';
import { CallPlanView } from './components/CallPlanView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { OutletManager } from './components/OutletManager';
import { SyncAndExportView } from './components/SyncAndExportView';
import { VisitHistoryView } from './components/VisitHistoryView';
import { OrderTakingModal } from './components/OrderTakingModal';
import { InvoiceModal } from './components/InvoiceModal';
import { CheckOutModal } from './components/CheckOutModal';
import { UserManagerModal } from './components/UserManagerModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { AiDebuggerModal } from './components/AiDebuggerModal';
import { DeletionApprovalModal } from './components/DeletionApprovalModal';
import { LaunchTourModal } from './components/LaunchTourModal';
import { BranchSelectorModal } from './components/BranchSelectorModal';
import { AiAssistantModal } from './components/AiAssistantModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => StorageService.getCurrentUser());
  const [users, setUsers] = useState<UserAccount[]>(() => StorageService.getUsers());
  const [salesman, setSalesman] = useState<SalesmanProfile>(() => StorageService.getSalesman());
  const [outlets, setOutlets] = useState<Outlet[]>(() => StorageService.getOutlets());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [callPlan, setCallPlan] = useState<DailyCallPlan>(() => StorageService.getCallPlan());
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());
  const [visits, setVisits] = useState<VisitLog[]>(() => StorageService.getVisits());
  const [activeVisit, setActiveVisit] = useState<VisitLog | null>(() => StorageService.getActiveVisit());
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => StorageService.getSyncQueue());
  const [isOnline, setIsOnline] = useState<boolean>(() => StorageService.getIsOnline());

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'callplan' | 'outlets' | 'visits' | 'sync'>('dashboard');
  
  // Regional Branch Office
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => StorageService.getSelectedBranchId());
  
  // Modals state
  const [orderingOutlet, setOrderingOutlet] = useState<Outlet | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Order | null>(null);
  const [checkingOutVisit, setCheckingOutVisit] = useState<{ visit: VisitLog; outlet: Outlet } | null>(null);
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);
  const [isAndroidInstallOpen, setIsAndroidInstallOpen] = useState(false);
  const [isAiDebuggerOpen, setIsAiDebuggerOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isBranchSelectorOpen, setIsBranchSelectorOpen] = useState(false);
  const [isLaunchTourOpen, setIsLaunchTourOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync state updater
  const refreshState = () => {
    setCurrentUser(StorageService.getCurrentUser());
    setUsers(StorageService.getUsers());
    setSalesman(StorageService.getSalesman());
    setOutlets(StorageService.getOutlets());
    setProducts(StorageService.getProducts());
    setCallPlan(StorageService.getCallPlan());
    setOrders(StorageService.getOrders());
    setVisits(StorageService.getVisits());
    setActiveVisit(StorageService.getActiveVisit());
    setSyncQueue(StorageService.getSyncQueue());
    setIsOnline(StorageService.getIsOnline());
  };

  // Network offline simulation toggle
  const handleToggleOnline = () => {
    const current = StorageService.isSimulatedOffline();
    StorageService.setSimulatedOffline(!current);
    const newOnline = StorageService.getIsOnline();
    setIsOnline(newOnline);
    showToast(newOnline ? 'Terhubung kembali secara online' : 'Mode offline aktif (data tersimpan di HP)');
  };

  // Launch Tour check on first application launch
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('nusantara_sfa_launch_tour_seen');
    if (!hasSeenTour) {
      setIsLaunchTourOpen(true);
    }
  }, []);

  // Automatic Real-Time Cross-Device Synchronization
  useEffect(() => {
    // Initial push to announce current device state to central server
    StorageService.pushServerSync();

    // Fast polling (every 5 seconds) to pull updates from other devices / branch offices
    const interval = setInterval(async () => {
      if (StorageService.getIsOnline()) {
        const syncResult = await StorageService.fetchServerSync();
        if (syncResult.hasUpdates) {
          refreshState();
        }

        // Also process any queued offline items
        const queue = StorageService.getSyncQueue();
        const pending = queue.filter(q => q.status === 'pending');
        if (pending.length > 0) {
          const res = await StorageService.processSyncQueue();
          if (res.syncedCount > 0) {
            refreshState();
            showToast(`Otomatis tersinkronisasi: ${res.syncedCount} transaksi terkirim ke server pusat`);
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle Branch Change
  const handleBranchSelected = (branchId: string) => {
    StorageService.setSelectedBranchId(branchId);
    setSelectedBranchId(branchId);
    refreshState();
    const branchObj = StorageService.getBranches().find(b => b.id === branchId);
    showToast(branchId === 'ALL' ? 'Mode Konsolidasi Nasional (Semua Cabang Aktif)' : `Beralih ke Cabang: ${branchObj?.name || branchId}`);
  };

  // Update live location
  const handleUpdateLocation = (coord: GeoCoordinate) => {
    const updated = StorageService.updateSalesmanLocation(coord, 0.4);
    setSalesman({ ...updated });
    showToast(`GPS Diperbarui: ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`);
  };

  // Handle new order created
  const handleOrderCreated = (newOrder: Order) => {
    setOrderingOutlet(null);
    refreshState();
    setViewingInvoice(newOrder);
    showToast(`Pesanan ${newOrder.orderNumber} berhasil dicatat!`);
  };

  // Handle Check-In
  const handleCheckInCompleted = (visit: VisitLog) => {
    refreshState();
    showToast(`Check-In berhasil di ${visit.outletName}! Timer durasi aktif.`);
  };

  // Handle Check-Out flow
  const handleOpenCheckOutModal = (visit: VisitLog, outlet: Outlet) => {
    setCheckingOutVisit({ visit, outlet });
  };

  const handleCheckOutSubmitted = (checkOutData: any) => {
    if (!checkingOutVisit) return;
    const completed = StorageService.checkOutVisit(checkingOutVisit.visit.id, checkOutData);
    setCheckingOutVisit(null);
    refreshState();
    if (completed) {
      showToast(`Kunjungan ke ${completed.outletName} selesai dicatat (${completed.durationMinutes} menit)!`);
    }
  };

  // Refresh Call Plan with F1, F2, F4 logic
  const handleRefreshPlan = (salesmanId: string, day: VisitDay, week: 'W1' | 'W2' | 'W3' | 'W4') => {
    const updatedPlan = StorageService.generateCallPlan(salesmanId, day, week);
    setCallPlan(updatedPlan);
    showToast(`Jadwal GT & MT diperbarui untuk hari ${day} (${week})`);
  };

  // User Switch
  const handleUserSwitched = (newUser: UserAccount) => {
    setCurrentUser(newUser);
    if (newUser.role === 'salesman') {
      const sm = StorageService.getSalesman();
      sm.id = newUser.id;
      sm.name = newUser.name;
      sm.phone = newUser.phone;
      sm.nik = newUser.nik;
      if (newUser.vehiclePlate) sm.vehiclePlate = newUser.vehiclePlate;
      localStorage.setItem('nusantara_sfa_salesman_v3', JSON.stringify(sm));
      StorageService.generateCallPlan(newUser.id, 'Senin', 'W1');
    }
    refreshState();
    setIsUserManagerOpen(false);
    showToast(`Beralih ke akun ${newUser.role.toUpperCase()}: ${newUser.name}`);
  };

  const pendingCount = syncQueue.filter(q => q.status === 'pending').length;

  return (
    <AndroidShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pendingSyncCount={pendingCount}
      isOnline={isOnline}
      currentUser={currentUser}
      currentBranchId={selectedBranchId}
      onOpenUserManager={() => setIsUserManagerOpen(true)}
      onOpenAndroidInstall={() => setIsAndroidInstallOpen(true)}
      onOpenAiDebugger={() => setIsAiDebuggerOpen(true)}
      onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
      onOpenBranchSelector={() => setIsBranchSelectorOpen(true)}
      onOpenLaunchTour={() => setIsLaunchTourOpen(true)}
      onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
    >
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-12 left-4 right-4 z-50 bg-slate-900/95 text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs */}
      {activeTab === 'dashboard' && (
        <AnalyticsDashboard
          orders={orders}
          outlets={outlets}
          visits={visits}
          salesman={salesman}
          currentUser={currentUser}
          onExportExcel={() => ExcelExportService.exportToExcel(outlets, orders, visits, salesman)}
          onExportGoogleSheets={() => {
            ExcelExportService.exportToExcel(outlets, orders, visits, salesman);
            showToast('File Excel lengkap berhasil diunduh');
          }}
        />
      )}

      {activeTab === 'callplan' && (
        <CallPlanView
          callPlan={callPlan}
          outlets={outlets}
          currentLocation={salesman.currentLocation}
          currentUser={currentUser}
          users={users}
          activeVisit={activeVisit}
          onOpenOrder={(out) => setOrderingOutlet(out)}
          onSelectOnMap={(out) => setActiveTab('map')}
          onCheckInCompleted={handleCheckInCompleted}
          onRequestCheckOut={handleOpenCheckOutModal}
          onRefreshPlan={handleRefreshPlan}
          onOutletScheduleUpdated={refreshState}
        />
      )}

      {activeTab === 'map' && (
        <MapView
          salesman={salesman}
          onUpdateLocation={handleUpdateLocation}
        />
      )}

      {activeTab === 'outlets' && (
        <OutletManager
          outlets={outlets}
          currentLocation={salesman.currentLocation}
          currentUser={currentUser}
          users={users}
          onSelectOutlet={(out) => setActiveTab('map')}
          onOpenOrder={(out) => setOrderingOutlet(out)}
          onOutletAdded={(newOut) => {
            refreshState();
            showToast(`Toko baru ${newOut.name} (NOO) berhasil didaftarkan!`);
          }}
          onOutletDeleted={(outId) => {
            refreshState();
            showToast('Toko berhasil dihapus');
          }}
          onOutletsImported={(count) => {
            refreshState();
            showToast(`Berhasil memperbarui ${count} data toko dari Excel!`);
          }}
          onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
        />
      )}

      {activeTab === 'visits' && (
        <VisitHistoryView
          visits={visits}
          outlets={outlets}
          currentUser={currentUser}
          salesmen={users.filter(u => u.role === 'salesman')}
        />
      )}

      {activeTab === 'sync' && (
        <SyncAndExportView
          syncQueue={syncQueue}
          orders={orders}
          outlets={outlets}
          visits={visits}
          salesman={salesman}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          onSyncCompleted={() => {
            refreshState();
            showToast('Semua data berhasil disinkronisasi ke server pusat');
          }}
        />
      )}

      {/* Order Taking Modal */}
      {orderingOutlet && (
        <OrderTakingModal
          outlet={orderingOutlet}
          products={products}
          currentLocation={salesman.currentLocation}
          salesmanId={currentUser.id}
          salesmanName={currentUser.name}
          onClose={() => setOrderingOutlet(null)}
          onOrderCreated={handleOrderCreated}
        />
      )}

      {/* Digital Invoice / Nota Modal */}
      {viewingInvoice && (
        <InvoiceModal
          order={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {/* Check-Out Modal */}
      {checkingOutVisit && (
        <CheckOutModal
          visit={checkingOutVisit.visit}
          outlet={checkingOutVisit.outlet}
          currentLocation={salesman.currentLocation}
          salesmanName={currentUser.name}
          onClose={() => setCheckingOutVisit(null)}
          onCheckOutSubmitted={handleCheckOutSubmitted}
        />
      )}

      {/* User Accounts Management Modal */}
      {isUserManagerOpen && (
        <UserManagerModal
          currentUser={currentUser}
          onClose={() => setIsUserManagerOpen(false)}
          onUserSwitched={handleUserSwitched}
          onUsersChanged={refreshState}
        />
      )}

      {/* Android Install & Download Modal */}
      {isAndroidInstallOpen && (
        <AndroidInstallModal
          onClose={() => setIsAndroidInstallOpen(false)}
        />
      )}

      {/* AI Auto-Debugger Modal */}
      {isAiDebuggerOpen && (
        <AiDebuggerModal
          onClose={() => setIsAiDebuggerOpen(false)}
          onSystemRepaired={() => {
            refreshState();
            showToast('AI Auto-Debugger berhasil memperbaiki sistem SFA!');
          }}
        />
      )}

      {/* Deletion Approval Modal */}
      {isApprovalModalOpen && (
        <DeletionApprovalModal
          currentUser={currentUser}
          onClose={() => setIsApprovalModalOpen(false)}
          onRequestHandled={() => {
            refreshState();
          }}
        />
      )}

      {/* Launch Tour Onboarding Modal */}
      {isLaunchTourOpen && (
        <LaunchTourModal
          currentUser={currentUser}
          onClose={() => setIsLaunchTourOpen(false)}
          onSwitchToGeneralManager={() => {
            const gmUser = users.find(u => u.role === 'general_manager') || users[0];
            handleUserSwitched(gmUser);
          }}
          onOpenBranchSelector={() => setIsBranchSelectorOpen(true)}
        />
      )}

      {/* Regional Branch Office Selector Modal */}
      {isBranchSelectorOpen && (
        <BranchSelectorModal
          currentUser={currentUser}
          currentBranchId={selectedBranchId}
          branches={StorageService.getBranches()}
          onSelectBranch={handleBranchSelected}
          onSwitchToManager={(managerUserId) => {
            const target = users.find(u => u.id === managerUserId);
            if (target) {
              handleUserSwitched(target);
            }
          }}
          onClose={() => setIsBranchSelectorOpen(false)}
        />
      )}

      {/* AI Assistant Guidance Modal */}
      {isAiAssistantOpen && (
        <AiAssistantModal
          currentUser={currentUser}
          totalOutlets={outlets.length}
          onClose={() => setIsAiAssistantOpen(false)}
        />
      )}

    </AndroidShell>
  );
}
