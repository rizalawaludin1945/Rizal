export interface GeoCoordinate {
  lat: number;
  lng: number;
  accuracy?: number; // in meters
  timestamp?: string;
  address?: string;
}

export type UserRole = 'general_manager' | 'branch_manager' | 'supervisor' | 'salesman';

export interface BranchOffice {
  id: string; // e.g. 'CBG-JKT'
  code: string; // e.g. 'JKT'
  name: string; // e.g. 'Cabang DKI Jakarta & Banten'
  region: 'DKI & Banten' | 'Jawa Barat' | 'Jawa Tengah & DIY' | 'Jawa Timur' | 'Sumatera Utara' | 'Sumatera Selatan' | 'Bali & Nusa Tenggara' | 'Kalimantan' | 'Sulawesi' | 'Maluku & Papua';
  city: string;
  address: string;
  phone: string;
  managerName: string;
  managerUserId: string;
  managerPhone: string;
  totalOutletsCount: number;
  activeSalesmenCount: number;
  centerLocation: GeoCoordinate;
  isOnlineSynced: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  securityCode: string; // PIN / Security code for authorization
  phone: string;
  nik: string;
  assignedTerritory: string;
  branchId?: string; // ID of the branch (e.g. 'CBG-JKT', or 'ALL' for General Manager)
  branchName?: string;
  vehiclePlate?: string;
  vanType?: string;
  dailyTarget?: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export type TradeChannel = 'General Trade (GT)' | 'Modern Trade (MT)';
export type VisitFrequency = 'F1' | 'F2' | 'F4';
export type VisitDay = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
export type VisitWeekCycle = 'W1' | 'W2' | 'W3' | 'W4' | 'Semua';

export interface Outlet {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  phone: string;
  tradeChannel: TradeChannel; // Specifically for General Trade (GT) vs Modern Trade (MT)
  category: 'Toko Kelontong' | 'Grosir Tradisional' | 'Warung Sembako' | 'Kios Pasar' | 'Minimarket' | 'Supermarket' | 'Hypermarket' | 'Convenience Store';
  address: string;
  district: string; // Kecamatan
  city: string; // Kota / Kabupaten
  province: string; // Provinsi
  postalCode: string;
  branchId?: string; // ID of the branch (e.g. 'CBG-JKT')
  location: GeoCoordinate;
  creditLimit: number;
  outstandingBalance: number;
  termOfPayment: 'COD' | 'TOP 7 Hari' | 'TOP 14 Hari' | 'TOP 30 Hari';
  status: 'active' | 'suspended';
  lastVisitDate?: string;
  photoUrl?: string;

  // SFA Distribution & Frequency Fields
  visitFrequency: VisitFrequency; // F1 (Setiap Minggu), F2 (2 Minggu Sekali), F4 (4 Minggu Sekali / 1x Sebulan)
  visitDay: VisitDay; // Hari Kunjungan Tetap
  visitWeekCycle: VisitWeekCycle; // Siklus Minggu: F1 = 'Semua', F2 = 'W1' (W1&W3) atau 'W2' (W2&W4), F4 = W1/W2/W3/W4
  assignedSalesmanId: string;
  assignedSalesmanName: string;
}

export type DeletionReason = 
  | 'Toko Tutup Permanen'
  | 'Pindah Alamat ke Luar Rute'
  | 'Bangkrut / Pailit'
  | 'Duplikat Data Toko'
  | 'Blacklist / Tidak Layak'
  | 'Permintaan Pemilik Toko'
  | 'Lainnya';

export interface OutletDeletionRequest {
  id: string;
  outletId: string;
  outletCode: string;
  outletName: string;
  tradeChannel: TradeChannel;
  district: string;
  city: string;
  assignedSalesmanId: string;
  assignedSalesmanName: string;
  requestedByUserId: string;
  requestedByUserName: string;
  requestedByUserRole: UserRole;
  reason: DeletionReason;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBySupervisorId?: string;
  reviewedBySupervisorName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AppNotification {
  id: string;
  type: 'DELETION_REQUEST' | 'DELETION_APPROVED' | 'DELETION_REJECTED' | 'AI_DEBUG' | 'SYSTEM';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  relatedId?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'Minuman' | 'Makanan Ringan' | 'Personal Care' | 'Sembako' | 'Dairy & Susu';
  barcode: string;
  unit: 'Karton' | 'Lusin' | 'Pcs' | 'Pack';
  conversionPcs: number;
  priceRetail: number;
  priceGrosir: number;
  minGrosirQty: number;
  stockVan: number;
  stockWarehouse: number;
  promoBadge?: string;
  taxable: boolean;
  image: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  outletId: string;
  outletName: string;
  salesmanId: string;
  salesmanName: string;
  orderType: 'Taking Order (TO)' | 'Direct Sales (Canvas)';
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  ppnAmount: number;
  grandTotal: number;
  paymentMethod: 'Tunai / COD' | 'Kredit TOP' | 'Transfer Bank' | 'QRIS';
  paymentTerm: string;
  notes?: string;
  signatureUrl?: string;
  receiverName?: string;
  geotag: GeoCoordinate;
  isWithinRadius: boolean;
  distanceFromOutletMeters: number;
  status: 'Draft' | 'Tersimpan (Offline)' | 'Terkirim ke Server' | 'Disetujui Gudang' | 'Terkirim';
  createdAt: string;
  syncedAt?: string;
}

export type VisitPurpose = 'Taking Order' | 'Penagihan' | 'Cek Stok Display' | 'Kunjungan Rutin' | 'Audit Planogram MT' | 'Retur Barang';
export type VisitResultStatus = 'Berhasil Order' | 'Audit Pajangan Selesai' | 'Toko Tutup' | 'Owner Tidak di Tempat' | 'Stok Masih Cukup' | 'Hanya Penagihan' | 'Lainnya';
export type VisitState = 'checked_in' | 'completed' | 'cancelled';

export interface VisitLog {
  id: string;
  outletId: string;
  outletName: string;
  tradeChannel?: TradeChannel;
  salesmanId: string;
  salesmanName: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  checkInLocation: GeoCoordinate;
  checkOutLocation?: GeoCoordinate;
  distanceMeters: number;
  isWithinRadius: boolean;
  purpose: VisitPurpose;
  resultStatus: VisitResultStatus;
  notes?: string;
  photoProofUrl?: string; // Foto bukti toko / kunjungan
  checkInPhotoUrl?: string; // Foto bukti check-in
  checkOutPhotoUrl?: string; // Foto bukti dokumen nota / rak check-out
  orderId?: string;
  orderAmount?: number;
  synced: boolean;
  status: VisitState;
}

export interface DailyCallPlanItem {
  outletId: string;
  outletCode: string;
  outletName: string;
  tradeChannel: TradeChannel;
  address: string;
  location: GeoCoordinate;
  sequence: number;
  status: 'pending' | 'in_progress' | 'visited' | 'skipped';
  visitFrequency: VisitFrequency;
  visitDay: VisitDay;
  visitId?: string;
  orderTotal?: number;
}

export interface DailyCallPlan {
  id: string;
  date: string;
  dayOfWeek: VisitDay;
  weekCycle: 'W1' | 'W2' | 'W3' | 'W4';
  salesmanId: string;
  salesmanName: string;
  beatRouteName: string;
  outlets: DailyCallPlanItem[];
}

export interface SalesmanProfile {
  id: string;
  nik: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vanType: string;
  currentLocation: GeoCoordinate;
  batteryLevel: number;
  dailyTarget: number;
  status: 'active' | 'break' | 'offline';
  todayDistanceKm: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'ORDER' | 'VISIT' | 'NEW_OUTLET' | 'DELETE_OUTLET' | 'DELETE_REQUEST' | 'GPS_PING';
  payload: any;
  createdAt: string;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  error?: string;
}

// Visit Activity Analytics (Strictly focusing on visits, calls, GT/MT, durations, geofence, and frequency - NO omzet, NO tagihan, NO SKU)
export interface VisitActivityAnalytics {
  date: string;
  totalPlannedCalls: number;
  totalVisitedCalls: number;
  callRatePercentage: number;
  effectiveCalls: number;
  effectiveCallPercentage: number;
  failedCalls: number; // Tutup / Owner tidak di tempat
  averageDurationMinutes: number;
  geofenceComplianceRate: number; // % check in <= 100m
  totalDistanceKm: number;
  channelPerformance: {
    gt: { planned: number; visited: number; rate: number };
    mt: { planned: number; visited: number; rate: number };
  };
  frequencyPerformance: {
    f1: { planned: number; visited: number; rate: number };
    f2: { planned: number; visited: number; rate: number };
    f4: { planned: number; visited: number; rate: number };
  };
  hourlyVisitVelocity: { hour: string; count: number }[];
  resultBreakdown: { label: string; count: number; percentage: number }[];
  salesmanRankings: {
    salesmanId: string;
    salesmanName: string;
    planned: number;
    visited: number;
    callRate: number;
    avgDurationMinutes: number;
    geofenceComplianceRate: number;
  }[];
}
