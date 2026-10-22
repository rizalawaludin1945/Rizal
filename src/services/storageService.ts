import { Outlet, Product, Order, VisitLog, DailyCallPlan, SalesmanProfile, SyncQueueItem, GeoCoordinate, UserAccount, DailyCallPlanItem, VisitDay, VisitFrequency, VisitWeekCycle, OutletDeletionRequest, AppNotification, BranchOffice, UserRole } from '../types/sfa';
import { INITIAL_OUTLETS, INITIAL_PRODUCTS, INITIAL_CALL_PLAN, INITIAL_ORDERS, INITIAL_VISITS, INITIAL_SALESMAN, INITIAL_USERS, INITIAL_DELETION_REQUESTS, INITIAL_NOTIFICATIONS } from '../data/mockData';
import { INDONESIA_BRANCHES } from '../data/branchData';

const KEYS = {
  USERS: 'nusantara_sfa_users_v4',
  CURRENT_USER: 'nusantara_sfa_current_user_v4',
  OUTLETS: 'nusantara_sfa_outlets_v4',
  PRODUCTS: 'nusantara_sfa_products_v4',
  CALL_PLAN: 'nusantara_sfa_call_plan_v4',
  ORDERS: 'nusantara_sfa_orders_v4',
  VISITS: 'nusantara_sfa_visits_v4',
  ACTIVE_VISIT: 'nusantara_sfa_active_visit_v4',
  SALESMAN: 'nusantara_sfa_salesman_v4',
  SYNC_QUEUE: 'nusantara_sfa_sync_queue_v4',
  DELETION_REQUESTS: 'nusantara_sfa_del_requests_v4',
  NOTIFICATIONS: 'nusantara_sfa_notifs_v4',
  OFFLINE_MODE: 'nusantara_sfa_simulated_offline_v4',
  SELECTED_BRANCH: 'nusantara_sfa_selected_branch_v4'
};

// Calculate distance between two lat/lng in meters (Haversine Formula)
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export class StorageService {
  private static load<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item);
    } catch {
      return fallback;
    }
  }

  private static save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // --- Network Offline Simulation ---
  static isSimulatedOffline(): boolean {
    return this.load<boolean>(KEYS.OFFLINE_MODE, false);
  }

  static setSimulatedOffline(offline: boolean): void {
    this.save(KEYS.OFFLINE_MODE, offline);
  }

  static getIsOnline(): boolean {
    if (this.isSimulatedOffline()) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // --- User Account Management (Hapus Akun HANYA oleh Supervisor) ---
  static getUsers(): UserAccount[] {
    return this.load<UserAccount[]>(KEYS.USERS, INITIAL_USERS);
  }

  static saveUsers(users: UserAccount[]): void {
    this.save(KEYS.USERS, users);
  }

  static getCurrentUser(): UserAccount {
    return this.load<UserAccount>(KEYS.CURRENT_USER, INITIAL_USERS[0]); // Default: General Manager H. Hendra Wijaya, MBA
  }

  static setCurrentUser(user: UserAccount): void {
    this.save(KEYS.CURRENT_USER, user);
  }

  static addUser(newUser: UserAccount): void {
    const users = this.getUsers();
    users.unshift(newUser);
    this.saveUsers(users);
  }

  /**
   * Hapus akun: Hanya bisa dilakukan jika requester adalah SUPERVISOR atau GENERAL MANAGER
   */
  static deleteUser(userId: string, requestingUserRole: UserRole): { success: boolean; message: string } {
    if (requestingUserRole !== 'supervisor' && requestingUserRole !== 'general_manager') {
      return { success: false, message: 'Izin Ditolak: Hanya Supervisor dan General Manager yang berhak menghapus akun pengguna.' };
    }

    const current = this.getCurrentUser();
    if (userId === current.id) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang Anda gunakan saat ini.' };
    }

    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    if (filtered.length === users.length) {
      return { success: false, message: 'Akun tidak ditemukan.' };
    }

    this.saveUsers(filtered);
    return { success: true, message: `Akun berhasil dihapus oleh ${requestingUserRole === 'general_manager' ? 'General Manager' : 'Supervisor'}.` };
  }

  static verifySecurityCode(userId: string, code: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.securityCode.trim() === code.trim() : false;
  }

  // --- Multi-Branch Indonesian Distribution System ---
  static getBranches(): BranchOffice[] {
    return INDONESIA_BRANCHES;
  }

  static getSelectedBranchId(): string {
    const user = this.getCurrentUser();
    const stored = localStorage.getItem(KEYS.SELECTED_BRANCH);
    if (stored) return stored;
    if (user.role === 'general_manager') return 'ALL';
    return user.branchId || 'CBG-JKT';
  }

  static setSelectedBranchId(branchId: string): void {
    localStorage.setItem(KEYS.SELECTED_BRANCH, branchId);
  }

  // --- Master Outlets (General Trade & Modern Trade) ---
  static getOutlets(): Outlet[] {
    return this.load<Outlet[]>(KEYS.OUTLETS, INITIAL_OUTLETS);
  }

  static saveOutlets(outlets: Outlet[]): void {
    this.save(KEYS.OUTLETS, outlets);
  }

  static addOutlet(newOutlet: Outlet): void {
    const list = this.getOutlets();
    list.unshift(newOutlet);
    this.saveOutlets(list);
    this.enqueueSync('NEW_OUTLET', newOutlet);
    this.pushServerSync();
  }

  /**
   * Direct delete outlet (Digunakan langsung oleh Supervisor, atau setelah approval)
   */
  static deleteOutletDirect(outletId: string): boolean {
    const list = this.getOutlets();
    const outletToDelete = list.find(o => o.id === outletId);
    if (!outletToDelete) return false;

    const filtered = list.filter(o => o.id !== outletId);
    this.saveOutlets(filtered);

    // Remove from active call plan
    const plan = this.getCallPlan();
    if (plan && plan.outlets) {
      plan.outlets = plan.outlets.filter(o => o.outletId !== outletId);
      this.saveCallPlan(plan);
    }

    this.enqueueSync('DELETE_OUTLET', { outletId, code: outletToDelete.code });
    this.pushServerSync();
    return true;
  }

  // --- Deletion Requests & Supervisor Approval Workflow ---
  static getDeletionRequests(): OutletDeletionRequest[] {
    return this.load<OutletDeletionRequest[]>(KEYS.DELETION_REQUESTS, INITIAL_DELETION_REQUESTS);
  }

  static saveDeletionRequests(reqs: OutletDeletionRequest[]): void {
    this.save(KEYS.DELETION_REQUESTS, reqs);
  }

  static requestOutletDeletion(request: Omit<OutletDeletionRequest, 'id' | 'status' | 'requestedAt'>): OutletDeletionRequest {
    const newReq: OutletDeletionRequest = {
      ...request,
      id: `DEL-REQ-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    const reqs = this.getDeletionRequests();
    reqs.unshift(newReq);
    this.saveDeletionRequests(reqs);

    // Create Notification for Supervisors
    this.addNotification({
      type: 'DELETION_REQUEST',
      title: 'Pengajuan Hapus Toko Menunggu Persetujuan',
      message: `${request.requestedByUserName} (${request.tradeChannel}) mengajukan penghapusan toko "${request.outletName}" (${request.reason}).`,
      relatedId: newReq.id
    });

    this.enqueueSync('DELETE_REQUEST', newReq);
    this.pushServerSync();
    return newReq;
  }

  static approveDeletionRequest(requestId: string, supervisor: UserAccount, reviewNotes?: string): boolean {
    if (supervisor.role !== 'supervisor' && supervisor.role !== 'general_manager' && supervisor.role !== 'branch_manager') return false;

    const reqs = this.getDeletionRequests();
    const idx = reqs.findIndex(r => r.id === requestId);
    if (idx === -1) return false;

    const req = reqs[idx];
    req.status = 'approved';
    req.reviewedBySupervisorId = supervisor.id;
    req.reviewedBySupervisorName = supervisor.name;
    req.reviewedAt = new Date().toISOString();
    req.reviewNotes = reviewNotes || 'Disetujui untuk dihapus dari master data distribusi.';
    this.saveDeletionRequests(reqs);

    // Execute actual outlet removal
    this.deleteOutletDirect(req.outletId);

    // Notify the salesman
    this.addNotification({
      type: 'DELETION_APPROVED',
      title: 'Pengajuan Hapus Toko Disetujui',
      message: `${supervisor.role === 'general_manager' ? 'General Manager' : supervisor.role === 'branch_manager' ? 'Branch Manager' : 'Supervisor'} ${supervisor.name} telah menyetujui penghapusan toko "${req.outletName}". Toko telah dihapus dari rute kunjungan Anda.`,
      relatedId: req.id
    });

    this.pushServerSync();
    return true;
  }

  static rejectDeletionRequest(requestId: string, supervisor: UserAccount, reason: string): boolean {
    if (supervisor.role !== 'supervisor' && supervisor.role !== 'general_manager' && supervisor.role !== 'branch_manager') return false;

    const reqs = this.getDeletionRequests();
    const idx = reqs.findIndex(r => r.id === requestId);
    if (idx === -1) return false;

    const req = reqs[idx];
    req.status = 'rejected';
    req.reviewedBySupervisorId = supervisor.id;
    req.reviewedBySupervisorName = supervisor.name;
    req.reviewedAt = new Date().toISOString();
    req.reviewNotes = reason || 'Ditolak: Toko masih berpotensi atau piutang belum terselesaikan.';
    this.saveDeletionRequests(reqs);

    // Notify the salesman
    this.addNotification({
      type: 'DELETION_REJECTED',
      title: 'Pengajuan Hapus Toko Ditolak',
      message: `${supervisor.role === 'general_manager' ? 'General Manager' : supervisor.role === 'branch_manager' ? 'Branch Manager' : 'Supervisor'} ${supervisor.name} menolak penghapusan toko "${req.outletName}". Alasan: ${req.reviewNotes}`,
      relatedId: req.id
    });

    this.pushServerSync();
    return true;
  }

  // --- Notifications ---
  static getNotifications(): AppNotification[] {
    return this.load<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  static saveNotifications(notifs: AppNotification[]): void {
    this.save(KEYS.NOTIFICATIONS, notifs);
  }

  static addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    const list = this.getNotifications();
    list.unshift(newNotif);
    this.saveNotifications(list);
    return newNotif;
  }

  static markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.saveNotifications(list);
    }
  }

  // --- Bulk Import Outlets ---
  static importOutlets(importedOutlets: Outlet[]): { added: number; updated: number } {
    const current = this.getOutlets();
    let added = 0;
    let updated = 0;

    importedOutlets.forEach(imp => {
      const idx = current.findIndex(c => c.code.toLowerCase() === imp.code.toLowerCase() || c.id === imp.id);
      if (idx >= 0) {
        current[idx] = { ...current[idx], ...imp };
        updated++;
      } else {
        current.unshift(imp);
        added++;
      }
    });

    this.saveOutlets(current);
    return { added, updated };
  }

  // --- Master Products ---
  static getProducts(): Product[] {
    return this.load<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  // --- Daily Call Plan (F1, F2, F4 for GT & MT) ---
  static getCallPlan(): DailyCallPlan {
    return this.load<DailyCallPlan>(KEYS.CALL_PLAN, INITIAL_CALL_PLAN);
  }

  static saveCallPlan(plan: DailyCallPlan): void {
    this.save(KEYS.CALL_PLAN, plan);
  }

  static generateCallPlan(salesmanId: string, day: VisitDay, weekCycle: 'W1' | 'W2' | 'W3' | 'W4'): DailyCallPlan {
    const allOutlets = this.getOutlets();
    const salesmanOutlets = allOutlets.filter(o => o.assignedSalesmanId === salesmanId);

    const eligibleOutlets = salesmanOutlets.filter(outlet => {
      if (outlet.visitDay !== day) return false;
      if (outlet.visitFrequency === 'F1') return true;
      if (outlet.visitFrequency === 'F2') {
        if (outlet.visitWeekCycle === 'W1' || outlet.visitWeekCycle === 'W3') {
          return weekCycle === 'W1' || weekCycle === 'W3';
        } else {
          return weekCycle === 'W2' || weekCycle === 'W4';
        }
      }
      if (outlet.visitFrequency === 'F4') {
        return outlet.visitWeekCycle === weekCycle || outlet.visitWeekCycle === 'Semua';
      }
      return true;
    });

    const user = this.getUsers().find(u => u.id === salesmanId);
    const visits = this.getVisits();

    const planItems: DailyCallPlanItem[] = eligibleOutlets.map((outlet, index) => {
      const todayVisit = visits.find(v => v.outletId === outlet.id && v.status === 'completed');
      const inProgressVisit = visits.find(v => v.outletId === outlet.id && v.status === 'checked_in');

      return {
        outletId: outlet.id,
        outletCode: outlet.code,
        outletName: outlet.name,
        tradeChannel: outlet.tradeChannel || 'General Trade (GT)',
        address: outlet.address,
        location: outlet.location,
        sequence: index + 1,
        status: todayVisit ? 'visited' : (inProgressVisit ? 'in_progress' : 'pending'),
        visitFrequency: outlet.visitFrequency,
        visitDay: outlet.visitDay,
        visitId: todayVisit?.id || inProgressVisit?.id,
        orderTotal: todayVisit?.orderAmount
      };
    });

    const plan: DailyCallPlan = {
      id: `DCP-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dayOfWeek: day,
      weekCycle,
      salesmanId,
      salesmanName: user ? user.name : 'Salesman',
      beatRouteName: `Rute ${day} (${weekCycle}) - ${user ? user.assignedTerritory : 'Wilayah GT & MT'}`,
      outlets: planItems
    };

    this.saveCallPlan(plan);
    return plan;
  }

  // --- Active Visit Lifecycle ---
  static getActiveVisit(): VisitLog | null {
    return this.load<VisitLog | null>(KEYS.ACTIVE_VISIT, null);
  }

  static setActiveVisit(visit: VisitLog | null): void {
    this.save(KEYS.ACTIVE_VISIT, visit);
  }

  static checkInVisit(visitData: Omit<VisitLog, 'id' | 'status' | 'synced'>): VisitLog {
    const isOnline = this.getIsOnline();
    const newVisit: VisitLog = {
      ...visitData,
      id: `VIS-${Date.now()}`,
      status: 'checked_in',
      synced: isOnline
    };

    const visits = this.getVisits();
    visits.unshift(newVisit);
    this.save(KEYS.VISITS, visits);
    this.setActiveVisit(newVisit);

    const plan = this.getCallPlan();
    if (plan && plan.outlets) {
      plan.outlets = plan.outlets.map(o => {
        if (o.outletId === newVisit.outletId) {
          return { ...o, status: 'in_progress', visitId: newVisit.id };
        }
        return o;
      });
      this.saveCallPlan(plan);
    }

    this.enqueueSync('VISIT', newVisit);
    return newVisit;
  }

  static checkOutVisit(
    visitId: string,
    checkOutData: {
      checkOutTime: string;
      checkOutLocation: GeoCoordinate;
      durationMinutes: number;
      resultStatus: VisitLog['resultStatus'];
      purpose: VisitLog['purpose'];
      notes?: string;
      checkOutPhotoUrl?: string;
      orderId?: string;
      orderAmount?: number;
    }
  ): VisitLog | null {
    const visits = this.getVisits();
    const index = visits.findIndex(v => v.id === visitId);
    if (index === -1) return null;

    const updatedVisit: VisitLog = {
      ...visits[index],
      ...checkOutData,
      status: 'completed',
      photoProofUrl: checkOutData.checkOutPhotoUrl || visits[index].checkInPhotoUrl,
      synced: this.getIsOnline()
    };

    visits[index] = updatedVisit;
    this.save(KEYS.VISITS, visits);
    this.setActiveVisit(null);

    const plan = this.getCallPlan();
    if (plan && plan.outlets) {
      plan.outlets = plan.outlets.map(o => {
        if (o.outletId === updatedVisit.outletId) {
          return {
            ...o,
            status: 'visited',
            visitId: updatedVisit.id,
            orderTotal: (o.orderTotal || 0) + (checkOutData.orderAmount || 0)
          };
        }
        return o;
      });
      this.saveCallPlan(plan);
    }

    const outlets = this.getOutlets();
    const outletIdx = outlets.findIndex(o => o.id === updatedVisit.outletId);
    if (outletIdx !== -1) {
      outlets[outletIdx].lastVisitDate = new Date().toISOString().split('T')[0];
      this.saveOutlets(outlets);
    }

    this.enqueueSync('VISIT', updatedVisit);
    return updatedVisit;
  }

  static cancelActiveVisit(): void {
    const active = this.getActiveVisit();
    if (!active) return;

    const visits = this.getVisits();
    const updated = visits.map(v => v.id === active.id ? { ...v, status: 'cancelled' as const } : v);
    this.save(KEYS.VISITS, updated);
    this.setActiveVisit(null);

    const plan = this.getCallPlan();
    if (plan && plan.outlets) {
      plan.outlets = plan.outlets.map(o => o.outletId === active.outletId ? { ...o, status: 'pending' as const } : o);
      this.saveCallPlan(plan);
    }
  }

  // --- Orders ---
  static getOrders(): Order[] {
    return this.load<Order[]>(KEYS.ORDERS, INITIAL_ORDERS);
  }

  static saveOrders(orders: Order[]): void {
    this.save(KEYS.ORDERS, orders);
  }

  static createOrder(order: Order): Order {
    const isOnline = this.getIsOnline();
    const finalOrder: Order = {
      ...order,
      status: isOnline ? 'Terkirim ke Server' : 'Tersimpan (Offline)',
      syncedAt: isOnline ? new Date().toISOString() : undefined
    };

    const orders = this.getOrders();
    orders.unshift(finalOrder);
    this.saveOrders(orders);

    this.enqueueSync('ORDER', finalOrder);

    const active = this.getActiveVisit();
    if (active && active.outletId === finalOrder.outletId) {
      active.orderId = finalOrder.id;
      active.orderAmount = finalOrder.grandTotal;
      this.setActiveVisit(active);
    }

    return finalOrder;
  }

  // --- Visits Master ---
  static getVisits(): VisitLog[] {
    return this.load<VisitLog[]>(KEYS.VISITS, INITIAL_VISITS);
  }

  // --- Salesman Profile & GPS ---
  static getSalesman(): SalesmanProfile {
    return this.load<SalesmanProfile>(KEYS.SALESMAN, INITIAL_SALESMAN);
  }

  static updateSalesmanLocation(coord: GeoCoordinate, additionalDistanceKm = 0): SalesmanProfile {
    const salesman = this.getSalesman();
    salesman.currentLocation = coord;
    salesman.todayDistanceKm = Number((salesman.todayDistanceKm + additionalDistanceKm).toFixed(2));
    this.save(KEYS.SALESMAN, salesman);
    return salesman;
  }

  // --- Sync Queue ---
  static getSyncQueue(): SyncQueueItem[] {
    return this.load<SyncQueueItem[]>(KEYS.SYNC_QUEUE, []);
  }

  static enqueueSync(type: SyncQueueItem['type'], payload: any): void {
    const queue = this.getSyncQueue();
    const isOnline = this.getIsOnline();
    const item: SyncQueueItem = {
      id: `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
      status: isOnline ? 'synced' : 'pending'
    };
    queue.push(item);
    this.save(KEYS.SYNC_QUEUE, queue);
  }

  static saveSyncQueue(queue: SyncQueueItem[]): void {
    this.save(KEYS.SYNC_QUEUE, queue);
  }

  static async processSyncQueue(onProgress?: (syncedCount: number, total: number) => void): Promise<{ success: boolean; syncedCount: number }> {
    const isOnline = this.getIsOnline();
    if (!isOnline) {
      return { success: false, syncedCount: 0 };
    }

    const queue = this.getSyncQueue();
    const pendingItems = queue.filter(q => q.status === 'pending' || q.status === 'failed');

    if (pendingItems.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    let syncedCount = 0;
    const total = pendingItems.length;

    for (const item of pendingItems) {
      item.status = 'syncing';
      this.save(KEYS.SYNC_QUEUE, queue);

      await new Promise(resolve => setTimeout(resolve, 250));

      item.status = 'synced';
      syncedCount++;

      if (onProgress) {
        onProgress(syncedCount, total);
      }
    }

    this.save(KEYS.SYNC_QUEUE, queue);
    return { success: true, syncedCount };
  }

  // --- Supervisor Daily Call Plan & Route Updating ---
  static updateOutletSchedule(
    outletId: string,
    assignedSalesmanId: string,
    visitDay: VisitDay,
    visitFrequency: VisitFrequency,
    visitWeekCycle: 'W1' | 'W2' | 'W3' | 'W4' | 'Semua'
  ): boolean {
    const outlets = this.getOutlets();
    const users = this.getUsers();
    const targetUser = users.find(u => u.id === assignedSalesmanId);
    const outletIdx = outlets.findIndex(o => o.id === outletId);
    if (outletIdx === -1) return false;

    outlets[outletIdx].assignedSalesmanId = assignedSalesmanId;
    if (targetUser) {
      outlets[outletIdx].assignedSalesmanName = targetUser.name;
    }
    outlets[outletIdx].visitDay = visitDay;
    outlets[outletIdx].visitFrequency = visitFrequency;
    outlets[outletIdx].visitWeekCycle = visitWeekCycle;

    this.saveOutlets(outlets);

    // Refresh call plan if current call plan is for this salesman
    const currentPlan = this.getCallPlan();
    if (currentPlan && currentPlan.salesmanId === assignedSalesmanId) {
      this.generateCallPlan(assignedSalesmanId, currentPlan.dayOfWeek, currentPlan.weekCycle);
    }

    this.pushServerSync();
    return true;
  }

  // --- Real-Time Cross-Device Synchronization ---
  private static isSyncing = false;

  static async pushServerSync(): Promise<boolean> {
    if (this.isSimulatedOffline()) return false;
    try {
      const payload = {
        users: this.getUsers(),
        outlets: this.getOutlets(),
        deletionRequests: this.getDeletionRequests(),
        visits: this.getVisits(),
        orders: this.getOrders(),
        callPlan: this.getCallPlan(),
        patchType: 'DEVICE_UPDATE'
      };

      const res = await fetch('/api/sync/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async fetchServerSync(): Promise<{ hasUpdates: boolean; message?: string }> {
    if (this.isSimulatedOffline() || this.isSyncing) return { hasUpdates: false };
    this.isSyncing = true;
    try {
      const res = await fetch('/api/sync/state');
      if (!res.ok) return { hasUpdates: false };
      const json = await res.json();
      const data = json.data;
      if (!data) return { hasUpdates: false };

      let changed = false;

      // Merge outlets if server has newer or different set
      if (Array.isArray(data.outlets) && data.outlets.length > 0) {
        const local = this.getOutlets();
        if (JSON.stringify(local) !== JSON.stringify(data.outlets)) {
          this.saveOutlets(data.outlets);
          changed = true;
        }
      }

      // Merge deletion requests
      if (Array.isArray(data.deletionRequests)) {
        const localReqs = this.getDeletionRequests();
        if (JSON.stringify(localReqs) !== JSON.stringify(data.deletionRequests)) {
          this.saveDeletionRequests(data.deletionRequests);
          changed = true;
        }
      }

      // Merge visits
      if (Array.isArray(data.visits) && data.visits.length > 0) {
        const localVisits = this.getVisits();
        if (localVisits.length !== data.visits.length) {
          this.save(KEYS.VISITS, data.visits);
          changed = true;
        }
      }

      // Merge orders
      if (Array.isArray(data.orders) && data.orders.length > 0) {
        const localOrders = this.getOrders();
        if (localOrders.length !== data.orders.length) {
          this.saveOrders(data.orders);
          changed = true;
        }
      }

      return { hasUpdates: changed };
    } catch {
      return { hasUpdates: false };
    } finally {
      this.isSyncing = false;
    }
  }

  // Reset to initial demo state
  static resetToDemoData(): void {
    this.save(KEYS.USERS, INITIAL_USERS);
    this.save(KEYS.CURRENT_USER, INITIAL_USERS[2]);
    this.save(KEYS.OUTLETS, INITIAL_OUTLETS);
    this.save(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.save(KEYS.CALL_PLAN, INITIAL_CALL_PLAN);
    this.save(KEYS.ORDERS, INITIAL_ORDERS);
    this.save(KEYS.VISITS, INITIAL_VISITS);
    this.save(KEYS.ACTIVE_VISIT, null);
    this.save(KEYS.DELETION_REQUESTS, INITIAL_DELETION_REQUESTS);
    this.save(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.save(KEYS.SALESMAN, INITIAL_SALESMAN);
    this.save(KEYS.SYNC_QUEUE, []);
    this.save(KEYS.OFFLINE_MODE, false);
  }
}
