import React, { useState } from 'react';
import { VisitLog, Outlet, UserAccount } from '../types/sfa';
import { Clock, MapPin, Calendar, Camera, CheckCircle2, FileText, ExternalLink, ShieldCheck, Filter, Search, User, Store } from 'lucide-react';

interface VisitHistoryViewProps {
  visits: VisitLog[];
  outlets: Outlet[];
  currentUser: UserAccount;
  salesmen: UserAccount[];
}

export const VisitHistoryView: React.FC<VisitHistoryViewProps> = ({
  visits,
  outlets,
  currentUser,
  salesmen
}) => {
  const [selectedSalesman, setSelectedSalesman] = useState<string>(currentUser.role === 'supervisor' ? 'Semua' : currentUser.id);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'checked_in'>('all');
  const [search, setSearch] = useState('');
  const [selectedVisitPhoto, setSelectedVisitPhoto] = useState<{ url: string; title: string } | null>(null);

  const filteredVisits = visits.filter(v => {
    const matchSalesman = selectedSalesman === 'Semua' || v.salesmanId === selectedSalesman;
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchSearch = v.outletName.toLowerCase().includes(search.toLowerCase()) ||
                        v.salesmanName.toLowerCase().includes(search.toLowerCase()) ||
                        (v.notes && v.notes.toLowerCase().includes(search.toLowerCase()));
    return matchSalesman && matchStatus && matchSearch;
  });

  const completedCount = filteredVisits.filter(v => v.status === 'completed').length;
  const inProgressCount = filteredVisits.filter(v => v.status === 'checked_in').length;
  const totalOrderFromVisits = filteredVisits.reduce((sum, v) => sum + (v.orderAmount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 shrink-0 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Riwayat Kunjungan Salesman</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Monitoring Aktivitas Check-In, Check-Out & Bukti Dokumen Foto
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-blue-300 font-bold uppercase block">Total Nilai Order</span>
            <span className="text-sm font-extrabold text-amber-300 font-mono">
              Rp {totalOrderFromVisits.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-800/60 text-xs">
          <div className="bg-blue-950/70 p-2 rounded-xl border border-blue-800/80 flex items-center justify-between">
            <span className="text-blue-200">Kunjungan Selesai:</span>
            <span className="font-extrabold text-emerald-300 text-sm">{completedCount} Toko</span>
          </div>
          <div className="bg-blue-950/70 p-2 rounded-xl border border-blue-800/80 flex items-center justify-between">
            <span className="text-blue-200">Sedang Kunjungan:</span>
            <span className="font-extrabold text-amber-300 text-sm">{inProgressCount} Toko</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 pt-1">
          {currentUser.role === 'supervisor' && (
            <select
              value={selectedSalesman}
              onChange={(e) => setSelectedSalesman(e.target.value)}
              className="bg-blue-950 text-blue-100 rounded-xl p-2 border border-blue-800 text-xs font-semibold flex-1"
            >
              <option value="Semua">Semua Salesman</option>
              {salesmen.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.nik})</option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-blue-950 text-blue-100 rounded-xl p-2 border border-blue-800 text-xs font-semibold"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Selesai (Check-Out)</option>
            <option value="checked_in">Sedang Berlangsung</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari toko, salesman, atau catatan..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-blue-950/80 text-white placeholder-blue-300/70 border border-blue-700/60"
          />
          <Search className="w-3.5 h-3.5 text-blue-300 absolute left-2.5 top-2" />
        </div>

      </div>

      {/* Visits List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200 mt-2 space-y-2">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">Belum Ada Riwayat Kunjungan</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Salesman belum melakukan check-in pada kriteria filter ini.
            </p>
          </div>
        ) : (
          filteredVisits.map(visit => {
            const isCompleted = visit.status === 'completed';
            const checkInDate = new Date(visit.checkInTime);
            const checkOutDate = visit.checkOutTime ? new Date(visit.checkOutTime) : null;

            return (
              <div
                key={visit.id}
                className={`bg-white rounded-2xl p-3.5 shadow-sm border transition-all space-y-2.5 ${
                  isCompleted ? 'border-slate-200 hover:border-slate-300' : 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                      }`}>
                        {isCompleted ? '✓ Selesai Check-Out' : '● Sedang Dikunjungi'}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">{visit.outletName}</h4>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 flex-wrap">
                      <span>Salesman: <strong className="text-blue-900">{visit.salesmanName}</strong></span>
                      <span>•</span>
                      <span>Aktivitas: <strong>{visit.purpose}</strong></span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-700">{visit.resultStatus}</span>
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {visit.durationMinutes ? `${visit.durationMinutes} Menit` : 'Aktif'}
                    </span>
                    {visit.orderAmount ? (
                      <span className="block text-xs font-mono font-extrabold text-emerald-700 mt-1">
                        Rp {visit.orderAmount.toLocaleString('id-ID')}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Check In & Check Out Timestamps and GPS Geostamp */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Waktu Check-In:</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {checkInDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      GPS: ±{visit.distanceMeters}m dari toko ({visit.isWithinRadius ? 'Valid' : 'Luar Radius'})
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Waktu Check-Out:</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {checkOutDate ? `${checkOutDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : 'Belum Check-Out'}
                    </span>
                    {visit.checkOutLocation && (
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        Terkunci pada {visit.checkOutLocation.lat.toFixed(4)}, {visit.checkOutLocation.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photo Proof Gallery (Check-In & Check-Out Photos) */}
                <div>
                  <span className="text-[10px] font-bold text-slate-700 block mb-1">
                    Bukti Dokumen & Foto Kunjungan:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Check In Photo */}
                    <div
                      onClick={() => visit.checkInPhotoUrl && setSelectedVisitPhoto({ url: visit.checkInPhotoUrl, title: `Foto Kedatangan: ${visit.outletName}` })}
                      className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-24 cursor-pointer group hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={visit.checkInPhotoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=60'}
                        alt="Foto Kedatangan"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Foto Check-In
                      </div>
                      <div className="absolute bottom-1 right-1 bg-blue-600 text-white text-[8px] font-mono px-1 rounded">
                        Geotagged
                      </div>
                    </div>

                    {/* Check Out Photo (Nota / Document) */}
                    <div
                      onClick={() => visit.checkOutPhotoUrl && setSelectedVisitPhoto({ url: visit.checkOutPhotoUrl, title: `Foto Dokumen/Nota: ${visit.outletName}` })}
                      className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-24 cursor-pointer group hover:opacity-90 transition-opacity"
                    >
                      {visit.checkOutPhotoUrl ? (
                        <>
                          <img
                            src={visit.checkOutPhotoUrl}
                            alt="Bukti Nota Check-Out"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-emerald-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Foto Dokumen/Nota
                          </div>
                          <div className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[8px] font-mono px-1 rounded">
                            Check-Out
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <Camera className="w-5 h-5 mb-1 text-slate-300" />
                          <span className="text-[10px]">Menunggu Check-Out</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visit Notes */}
                {visit.notes && (
                  <div className="p-2 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-slate-700">
                    <span className="font-bold text-amber-900 text-[10px] block">Catatan Salesman:</span>
                    <p className="italic mt-0.5">{visit.notes}</p>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Fullscreen Photo Viewer Modal */}
      {selectedVisitPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3">
          <div className="bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden border border-slate-800 shadow-2xl space-y-3">
            <div className="p-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold truncate">{selectedVisitPhoto.title}</span>
              <button
                onClick={() => setSelectedVisitPhoto(null)}
                className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-3">
              <img
                src={selectedVisitPhoto.url}
                alt="Bukti Dokumen"
                className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
