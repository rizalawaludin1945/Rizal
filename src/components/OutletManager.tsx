import React, { useState, useRef } from 'react';
import { Outlet, GeoCoordinate, VisitFrequency, VisitDay, VisitWeekCycle, UserAccount, TradeChannel, DeletionReason } from '../types/sfa';
import { StorageService, calculateDistanceMeters } from '../services/storageService';
import { ExcelExportService } from '../services/excelExportService';
import { INDONESIA_REGIONS, getProvinceNames, getRegenciesByProvince, getDistrictsByRegency } from '../data/indonesiaRegions';
import { Store, Search, Plus, MapPin, Phone, CreditCard, ChevronRight, Check, X, Crosshair, Navigation, AlertCircle, Trash2, Download, Upload, ExternalLink, Calendar, Filter, FileSpreadsheet, ShieldCheck, Clock, Layers } from 'lucide-react';

interface OutletManagerProps {
  outlets: Outlet[];
  currentLocation: GeoCoordinate;
  currentUser: UserAccount;
  users: UserAccount[];
  onSelectOutlet: (outlet: Outlet) => void;
  onOpenOrder: (outlet: Outlet) => void;
  onOutletAdded: (outlet: Outlet) => void;
  onOutletDeleted: (outletId: string) => void;
  onOutletsImported: (count: number) => void;
  onOpenApprovalModal?: () => void;
}

export const OutletManager: React.FC<OutletManagerProps> = ({
  outlets,
  currentLocation,
  currentUser,
  users,
  onSelectOutlet,
  onOpenOrder,
  onOutletAdded,
  onOutletDeleted,
  onOutletsImported,
  onOpenApprovalModal
}) => {
  const [search, setSearch] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<'Semua' | 'GT' | 'MT'>('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSalesmanFilter, setSelectedSalesmanFilter] = useState('Semua');
  const [selectedFrequencyFilter, setSelectedFrequencyFilter] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Salesman Deletion Request Modal State
  const [requestingDeleteOutlet, setRequestingDeleteOutlet] = useState<Outlet | null>(null);
  const [deleteReason, setDeleteReason] = useState<DeletionReason>('Toko Tutup Permanen');
  const [deleteNotes, setDeleteNotes] = useState('');

  // New Outlet (NOO) Form State
  const [newTradeChannel, setNewTradeChannel] = useState<TradeChannel>('General Trade (GT)');
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState<Outlet['category']>('Toko Kelontong');
  const [newAddress, setNewAddress] = useState('');
  
  // Indonesian Regional Cascade Selector
  const provinceList = getProvinceNames();
  const [selectedProvince, setSelectedProvince] = useState<string>('DKI Jakarta');
  const [selectedRegency, setSelectedRegency] = useState<string>('Jakarta Timur');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Matraman');
  const [newPostalCode, setNewPostalCode] = useState('13140');

  // Frequency & Schedule
  const [newFrequency, setNewFrequency] = useState<VisitFrequency>('F1');
  const [newVisitDay, setNewVisitDay] = useState<VisitDay>('Senin');
  const [newWeekCycle, setNewWeekCycle] = useState<VisitWeekCycle>('Semua');

  // Salesman Assignment
  const salesmenUsers = users.filter(u => u.role === 'salesman');
  const [assignedSalesmanId, setAssignedSalesmanId] = useState<string>(currentUser.role === 'salesman' ? currentUser.id : (salesmenUsers[0]?.id || 'SLS-JKT-088'));

  const [newCreditLimit, setNewCreditLimit] = useState(5000000);
  const [newTOP, setNewTOP] = useState<Outlet['termOfPayment']>('COD');
  const [lockedGps, setLockedGps] = useState<GeoCoordinate>(currentLocation);
  const [isLockingGps, setIsLockingGps] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const isSupervisor = currentUser.role === 'supervisor' || currentUser.role === 'general_manager' || currentUser.role === 'branch_manager';
  const pendingApprovalCount = StorageService.getDeletionRequests().filter(r => r.status === 'pending').length;

  const gtCategories = ['Toko Kelontong', 'Grosir Tradisional', 'Warung Sembako', 'Kios Pasar'];
  const mtCategories = ['Minimarket', 'Supermarket', 'Hypermarket', 'Convenience Store'];

  const handleProvinceChange = (prov: string) => {
    setSelectedProvince(prov);
    const regList = getRegenciesByProvince(prov);
    if (regList.length > 0) {
      setSelectedRegency(regList[0].name);
      const distList = getDistrictsByRegency(prov, regList[0].name);
      setSelectedDistrict(distList[0] || 'Kecamatan');
    } else {
      setSelectedRegency('');
      setSelectedDistrict('');
    }
  };

  const handleRegencyChange = (reg: string) => {
    setSelectedRegency(reg);
    const distList = getDistrictsByRegency(selectedProvince, reg);
    setSelectedDistrict(distList[0] || 'Kecamatan');
  };

  const handleLockLiveGPS = () => {
    setIsLockingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLockedGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: new Date().toISOString(),
            address: `GPS Terkunci (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`
          });
          setIsLockingGps(false);
        },
        () => {
          setLockedGps({ ...currentLocation, timestamp: new Date().toISOString() });
          setIsLockingGps(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLockedGps({ ...currentLocation, timestamp: new Date().toISOString() });
      setIsLockingGps(false);
    }
  };

  const handleCreateOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAddress.trim()) return;

    const assignedSalesman = users.find(u => u.id === assignedSalesmanId) || currentUser;

    const newOutlet: Outlet = {
      id: `OUT-${Date.now()}`,
      code: `NOO-${Math.floor(100 + Math.random() * 900)}`,
      name: newName.trim(),
      ownerName: newOwner.trim() || 'Pemilik Toko',
      phone: newPhone.trim() || '0812-0000-0000',
      tradeChannel: newTradeChannel,
      category: newCategory,
      address: newAddress.trim(),
      district: selectedDistrict,
      city: selectedRegency,
      province: selectedProvince,
      postalCode: newPostalCode.trim() || '10000',
      location: lockedGps,
      creditLimit: Number(newCreditLimit),
      outstandingBalance: 0,
      termOfPayment: newTOP,
      status: 'active',
      lastVisitDate: new Date().toISOString().split('T')[0],
      photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80',
      visitFrequency: newFrequency,
      visitDay: newVisitDay,
      visitWeekCycle: newFrequency === 'F1' ? 'Semua' : newWeekCycle,
      assignedSalesmanId: assignedSalesman.id,
      assignedSalesmanName: assignedSalesman.name
    };

    StorageService.addOutlet(newOutlet);
    onOutletAdded(newOutlet);
    setIsAddModalOpen(false);

    setNewName('');
    setNewOwner('');
    setNewPhone('');
    setNewAddress('');
  };

  const [directDeletingOutlet, setDirectDeletingOutlet] = useState<Outlet | null>(null);

  // Delete Action Router: Supervisor direct delete modal vs Salesman request deletion modal
  const handleDeleteButtonClick = (outlet: Outlet) => {
    if (isSupervisor) {
      setDirectDeletingOutlet(outlet);
    } else {
      // Salesman flow: opens Deletion Request Modal
      setRequestingDeleteOutlet(outlet);
      setDeleteReason('Toko Tutup Permanen');
      setDeleteNotes('');
    }
  };

  const handleConfirmDirectDelete = () => {
    if (!directDeletingOutlet) return;
    StorageService.deleteOutletDirect(directDeletingOutlet.id);
    onOutletDeleted(directDeletingOutlet.id);
    setNotification(`Toko "${directDeletingOutlet.name}" (${directDeletingOutlet.code}) berhasil dihapus permanen.`);
    setDirectDeletingOutlet(null);
  };

  // Submit Salesman Deletion Request
  const handleSubmitDeletionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingDeleteOutlet) return;

    StorageService.requestOutletDeletion({
      outletId: requestingDeleteOutlet.id,
      outletCode: requestingDeleteOutlet.code,
      outletName: requestingDeleteOutlet.name,
      tradeChannel: requestingDeleteOutlet.tradeChannel,
      district: requestingDeleteOutlet.district,
      city: requestingDeleteOutlet.city,
      assignedSalesmanId: requestingDeleteOutlet.assignedSalesmanId,
      assignedSalesmanName: requestingDeleteOutlet.assignedSalesmanName,
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      requestedByUserRole: currentUser.role,
      reason: deleteReason,
      notes: deleteNotes.trim()
    });

    setRequestingDeleteOutlet(null);
    setNotification(`Pengajuan hapus toko "${requestingDeleteOutlet.name}" telah dikirimkan ke Supervisor untuk persetujuan.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await ExcelExportService.parseExcelOrCsvFile(file);
      if (parsed.length === 0) {
        setNotification('Tidak ada data toko yang dapat dibaca dari file Excel / CSV ini.');
        return;
      }

      const res = StorageService.importOutlets(parsed);
      onOutletsImported(res.added + res.updated);
      setNotification(`Berhasil impor ${res.added + res.updated} toko dari Excel (${res.added} baru, ${res.updated} diperbarui)`);
    } catch (err: any) {
      setNotification(`Gagal membaca file Excel / CSV: ${err.message || 'Format tidak sesuai'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  // Filter Outlets
  const filteredOutlets = outlets.filter(o => {
    const matchChannel = selectedChannelFilter === 'Semua' || 
      (selectedChannelFilter === 'GT' && o.tradeChannel === 'General Trade (GT)') ||
      (selectedChannelFilter === 'MT' && o.tradeChannel === 'Modern Trade (MT)');
    const matchCat = selectedCategory === 'Semua' || o.category === selectedCategory;
    const matchSalesman = selectedSalesmanFilter === 'Semua' || o.assignedSalesmanId === selectedSalesmanFilter;
    const matchFreq = selectedFrequencyFilter === 'Semua' || o.visitFrequency === selectedFrequencyFilter;
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) ||
                        o.code.toLowerCase().includes(search.toLowerCase()) ||
                        o.ownerName.toLowerCase().includes(search.toLowerCase()) ||
                        o.address.toLowerCase().includes(search.toLowerCase()) ||
                        o.district.toLowerCase().includes(search.toLowerCase()) ||
                        o.city.toLowerCase().includes(search.toLowerCase()) ||
                        o.assignedSalesmanName.toLowerCase().includes(search.toLowerCase());
    return matchChannel && matchCat && matchSalesman && matchFreq && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 shrink-0 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-blue-300 font-bold">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Distribusi General Trade & Modern Trade</span>
            </div>
            <h2 className="text-lg font-black text-white mt-0.5">Database Master Outlet</h2>
            <p className="text-xs text-blue-200">
              Total {outlets.length} Toko Terverifikasi di Seluruh Wilayah Indonesia
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Approval Button for Supervisor */}
            {isSupervisor && onOpenApprovalModal && (
              <button
                type="button"
                onClick={onOpenApprovalModal}
                className="py-2 px-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors relative"
                title="Persetujuan Hapus Toko dari Salesman"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Approval Hapus</span>
                {pendingApprovalCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
                    {pendingApprovalCount}
                  </span>
                )}
              </button>
            )}

            {/* NOO Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Toko Baru (NOO)</span>
            </button>
          </div>
        </div>

        {/* Excel Import / Export & Template Action Bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-blue-800/60 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => ExcelExportService.downloadImportTemplate()}
            className="py-1.5 px-2.5 rounded-xl bg-blue-800/80 hover:bg-blue-800 text-blue-100 font-bold flex items-center gap-1.5 shrink-0 border border-blue-700/60 transition-colors text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-blue-300" />
            <span>Download Template Excel GT/MT</span>
          </button>

          <label className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer transition-colors text-[11px]">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel / CSV</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => ExcelExportService.exportToExcel(outlets, [], [], StorageService.getSalesman())}
            className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shrink-0 transition-colors text-[11px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Ekspor Data Excel</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama toko, kode, pemilik, kecamatan, kota, salesman..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-blue-950/80 text-white placeholder-blue-300/70 border border-blue-700/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <Search className="w-4 h-4 text-blue-300 absolute left-3 top-2.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-blue-300 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Rows (Channel GT/MT, Salesman, Frequency) */}
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          {/* Channel Filter */}
          <select
            value={selectedChannelFilter}
            onChange={(e) => setSelectedChannelFilter(e.target.value as any)}
            className="bg-blue-950 text-blue-100 rounded-lg p-1.5 border border-blue-800 text-[10px] font-semibold"
          >
            <option value="Semua">Semua Saluran (GT & MT)</option>
            <option value="GT">Hanya General Trade (GT)</option>
            <option value="MT">Hanya Modern Trade (MT)</option>
          </select>

          {/* Salesman Filter */}
          <select
            value={selectedSalesmanFilter}
            onChange={(e) => setSelectedSalesmanFilter(e.target.value)}
            className="bg-blue-950 text-blue-100 rounded-lg p-1.5 border border-blue-800 text-[10px] font-semibold"
          >
            <option value="Semua">Semua Salesman</option>
            {salesmenUsers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Frequency Filter */}
          <select
            value={selectedFrequencyFilter}
            onChange={(e) => setSelectedFrequencyFilter(e.target.value)}
            className="bg-blue-950 text-blue-100 rounded-lg p-1.5 border border-blue-800 text-[10px] font-semibold"
          >
            <option value="Semua">Semua Frekuensi</option>
            <option value="F1">F1 (Mingguan)</option>
            <option value="F2">F2 (2 Mingguan)</option>
            <option value="F4">F4 (Bulanan)</option>
          </select>
        </div>

      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <span>✓ {notification}</span>
          <button onClick={() => setNotification(null)} className="text-white text-xs font-bold">✕</button>
        </div>
      )}

      {/* Outlets List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredOutlets.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200 mt-2 space-y-2">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Toko Sesuai Filter</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Coba sesuaikan filter saluran GT/MT, kata kunci pencarian, atau frekuensi kunjungan.
            </p>
          </div>
        ) : (
          filteredOutlets.map(outlet => {
            const dist = calculateDistanceMeters(
              currentLocation.lat,
              currentLocation.lng,
              outlet.location.lat,
              outlet.location.lng
            );

            const isGT = outlet.tradeChannel === 'General Trade (GT)';
            const pendingRequests = StorageService.getDeletionRequests().filter(r => r.status === 'pending');
            const pendingReq = pendingRequests.find(r => r.outletId === outlet.id);

            return (
                <div
                  key={outlet.id}
                  className={`bg-white rounded-2xl p-3.5 shadow-sm border transition-all space-y-2.5 ${
                    pendingReq ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {outlet.code}
                        </span>

                        {/* Trade Channel Badge */}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                          isGT ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {isGT ? 'General Trade (GT)' : 'Modern Trade (MT)'}
                        </span>

                        {/* Frequency Badge */}
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                          {outlet.visitFrequency} • {outlet.visitDay}
                        </span>

                        {/* Pending Deletion Request Badge */}
                        {pendingReq && (
                          <button
                            type="button"
                            onClick={() => onOpenApprovalModal && onOpenApprovalModal()}
                            className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:bg-amber-200"
                            title="Klik untuk melihat detail pengajuan di menu Persetujuan"
                          >
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            <span>Menunggu Persetujuan ({pendingReq.reason})</span>
                          </button>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">{outlet.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{outlet.address}</p>
                      
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 flex-wrap">
                        <span className="font-semibold text-slate-800">{outlet.district}, {outlet.city}</span>
                        <span>•</span>
                        <span className="text-slate-500">{outlet.province}</span>
                        <span>•</span>
                        <span>Sales: <strong className="text-blue-700">{outlet.assignedSalesmanName}</strong></span>
                      </div>
                    </div>

                    {/* Actions & Distance */}
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        <Navigation className="w-3 h-3 fill-current text-blue-600" />
                        {dist}m
                      </span>

                      {/* Delete / Request Delete Button */}
                      {pendingReq ? (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1.5 block">
                          Pending
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteButtonClick(outlet)}
                          title={isSupervisor ? 'Hapus Toko Permanen (Supervisor)' : 'Ajukan Hapus Toko ke Supervisor'}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all mt-1.5 ${
                            isSupervisor
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
                          }`}
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>{isSupervisor ? 'Hapus' : 'Ajukan Hapus'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                {/* Terms of Payment & Credit Limits */}
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Plafon Kredit:</span>
                    <span className="font-bold text-slate-800">
                      Rp {outlet.creditLimit.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Piutang Berjalan:</span>
                    <span className={`font-bold ${outlet.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                      Rp {outlet.outstandingBalance.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Metode TOP:</span>
                    <span className="font-bold text-indigo-700">{outlet.termOfPayment}</span>
                  </div>
                </div>

                {/* Buttons Row */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => openGoogleMaps(outlet.location.lat, outlet.location.lng)}
                    className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1 transition-colors text-[11px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Maps</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectOutlet(outlet)}
                    className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1 transition-colors text-[11px]"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Peta SFA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenOrder(outlet)}
                    className="py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1 transition-colors shadow-sm text-[11px]"
                  >
                    <span>+ Order</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SUPERVISOR / GM DIRECT OUTLET DELETION CONFIRMATION MODAL */}
      {directDeletingOutlet && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">Hapus Toko Permanen</h4>
                <p className="text-[11px] text-slate-500">Izin Khusus Supervisor & Manajemen</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Konfirmasi Penghapusan:</span>
              <p className="font-extrabold text-slate-900 text-sm">{directDeletingOutlet.name}</p>
              <p className="text-slate-600 font-mono text-[11px]">{directDeletingOutlet.code} • {directDeletingOutlet.tradeChannel}</p>
              <p className="text-[10px] text-rose-700 pt-1">
                Toko ini akan langsung dihapus dari master data distribusi, rute kunjungan salesman, dan disinkronkan ke seluruh perangkat cabang.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDirectDeletingOutlet(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDirectDelete}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Toko</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALESMAN OUTLET DELETION REQUEST MODAL */}
      {requestingDeleteOutlet && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
          <form onSubmit={handleSubmitDeletionRequest} className="bg-white rounded-3xl w-full max-w-sm p-4 shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Pengajuan Hapus Toko</h4>
                  <p className="text-[10px] text-slate-500">Memerlukan Persetujuan Supervisor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestingDeleteOutlet(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-500 block">Toko yang Diajukan:</span>
              <p className="font-bold text-slate-900">{requestingDeleteOutlet.name}</p>
              <p className="text-[11px] text-slate-500">{requestingDeleteOutlet.code} • {requestingDeleteOutlet.tradeChannel}</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-800 block mb-1">Alasan Penghapusan Toko *</label>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value as any)}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="Toko Tutup Permanen">Toko Tutup Permanen</option>
                <option value="Pindah Alamat ke Luar Rute">Pindah Alamat ke Luar Rute</option>
                <option value="Bangkrut / Pailit">Bangkrut / Pailit</option>
                <option value="Duplikat Data Toko">Duplikat Data Toko</option>
                <option value="Blacklist / Tidak Layak">Blacklist / Piutang Macet / Tidak Layak</option>
                <option value="Permintaan Pemilik Toko">Permintaan Pemilik Toko</option>
                <option value="Lainnya">Alasan Lainnya</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-800 block mb-1">Catatan Tambahan untuk Supervisor</label>
              <textarea
                rows={2}
                value={deleteNotes}
                onChange={(e) => setDeleteNotes(e.target.value)}
                placeholder="Jelaskan kondisi toko di lapangan secara detail..."
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white resize-none"
              />
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setRequestingDeleteOutlet(null)}
                className="w-1/3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 bg-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Kirim ke Supervisor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NOO (NEW OUTLET OPENING) MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 shrink-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">New Outlet Opening (NOO)</span>
                <h3 className="font-extrabold text-base text-white">Pendaftaran Toko Baru (GT & MT)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-blue-950 text-blue-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateOutlet} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              
              {/* Saluran Distribusi (Trade Channel) Selection */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider block">
                  Pilih Saluran Distribusi (Trade Channel) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTradeChannel('General Trade (GT)');
                      setNewCategory('Toko Kelontong');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      newTradeChannel === 'General Trade (GT)'
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>General Trade (GT)</span>
                    <span className="block text-[9px] font-normal mt-0.5 opacity-80">Toko Kelontong, Grosir, Warung</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewTradeChannel('Modern Trade (MT)');
                      setNewCategory('Minimarket');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      newTradeChannel === 'Modern Trade (MT)'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>Modern Trade (MT)</span>
                    <span className="block text-[9px] font-normal mt-0.5 opacity-80">Minimarket, Supermarket</span>
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Nama Toko / Outlet *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={newTradeChannel === 'General Trade (GT)' ? 'Contoh: Toko Berkah 88' : 'Contoh: Minimarket Prima Mart'}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Kategori Spesifik *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    {(newTradeChannel === 'General Trade (GT)' ? gtCategories : mtCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Nama Pemilik / PIC Toko *</label>
                  <input
                    type="text"
                    required
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="Nama PIC / Owner"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">No. Handphone / WhatsApp</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* INDONESIA REGIONAL CASCADE SELECTOR */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
                  Wilayah Indonesia (Provinsi, Kota/Kabupaten, Kecamatan)
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Provinsi *</label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      {provinceList.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Kota / Kab *</label>
                    <select
                      value={selectedRegency}
                      onChange={(e) => handleRegencyChange(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      {getRegenciesByProvince(selectedProvince).map(rg => (
                        <option key={rg.name} value={rg.name}>{rg.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Kecamatan *</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      {getDistrictsByRegency(selectedProvince, selectedRegency).map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Alamat Jalan / Patokan *</label>
                    <input
                      type="text"
                      required
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Nama Jalan, No, RT/RW..."
                      className="w-full text-[11px] p-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Kode Pos</label>
                    <input
                      type="text"
                      value={newPostalCode}
                      onChange={(e) => setNewPostalCode(e.target.value)}
                      placeholder="13140"
                      className="w-full text-[11px] p-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* FREKUENSI KUNJUNGAN LENGKAP (F1, F2, F4) & HARI */}
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-2.5">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
                  Pengaturan Frekuensi Kunjungan (F1 / F2 / F4)
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Frekuensi *</label>
                    <select
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(e.target.value as any)}
                      className="w-full text-[11px] p-2 rounded-xl border border-slate-300 bg-white font-bold text-blue-900"
                    >
                      <option value="F1">F1 (1x Seminggu)</option>
                      <option value="F2">F2 (2 Minggu Sekali)</option>
                      <option value="F4">F4 (1x Sebulan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Hari Kunjungan *</label>
                    <select
                      value={newVisitDay}
                      onChange={(e) => setNewVisitDay(e.target.value as any)}
                      className="w-full text-[11px] p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      <option value="Senin">Senin</option>
                      <option value="Selasa">Selasa</option>
                      <option value="Rabu">Rabu</option>
                      <option value="Kamis">Kamis</option>
                      <option value="Jumat">Jumat</option>
                      <option value="Sabtu">Sabtu</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Siklus Minggu</label>
                    <select
                      disabled={newFrequency === 'F1'}
                      value={newWeekCycle}
                      onChange={(e) => setNewWeekCycle(e.target.value as any)}
                      className={`w-full text-[11px] p-2 rounded-xl border border-slate-300 bg-white font-semibold ${
                        newFrequency === 'F1' ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
                      }`}
                    >
                      <option value="Semua">Semua Minggu</option>
                      <option value="W1">Minggu ke-1 (W1)</option>
                      <option value="W2">Minggu ke-2 (W2)</option>
                      <option value="W3">Minggu ke-3 (W3)</option>
                      <option value="W4">Minggu ke-4 (W4)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-600 block mb-0.5">Tugaskan ke Salesman *</label>
                  <select
                    value={assignedSalesmanId}
                    onChange={(e) => setAssignedSalesmanId(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                  >
                    {salesmenUsers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.assignedTerritory})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GPS Geotag Lock */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-800 block">Koordinat GPS Toko</span>
                    <span className="font-mono text-xs text-slate-600 font-bold">
                      {lockedGps.lat.toFixed(5)}, {lockedGps.lng.toFixed(5)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLockLiveGPS}
                    disabled={isLockingGps}
                    className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>{isLockingGps ? 'Mengunci GPS...' : 'Kunci GPS Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Plafon Kredit & TOP */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Plafon Kredit (Rp)</label>
                  <input
                    type="number"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Term of Payment (TOP)</label>
                  <select
                    value={newTOP}
                    onChange={(e) => setNewTOP(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="COD">COD (Tunai di Tempat)</option>
                    <option value="TOP 7 Hari">TOP 7 Hari</option>
                    <option value="TOP 14 Hari">TOP 14 Hari</option>
                    <option value="TOP 30 Hari">TOP 30 Hari</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Daftarkan Toko Baru (NOO)</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
