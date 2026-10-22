import React, { useState, useEffect } from 'react';
import { VisitLog, Outlet, GeoCoordinate } from '../types/sfa';
import { stampPhotoWithWatermark } from '../utils/photoWatermark';
import { Camera, CheckCircle2, Clock, MapPin, FileText, Upload, ShieldCheck, AlertTriangle } from 'lucide-react';

interface CheckOutModalProps {
  visit: VisitLog;
  outlet: Outlet;
  currentLocation: GeoCoordinate;
  salesmanName: string;
  onClose: () => void;
  onCheckOutSubmitted: (checkOutData: {
    checkOutTime: string;
    checkOutLocation: GeoCoordinate;
    durationMinutes: number;
    resultStatus: VisitLog['resultStatus'];
    purpose: VisitLog['purpose'];
    notes?: string;
    checkOutPhotoUrl?: string;
    orderId?: string;
    orderAmount?: number;
  }) => void;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  visit,
  outlet,
  currentLocation,
  salesmanName,
  onClose,
  onCheckOutSubmitted
}) => {
  const [resultStatus, setResultStatus] = useState<VisitLog['resultStatus']>(visit.resultStatus || 'Berhasil Order');
  const [purpose, setPurpose] = useState<VisitLog['purpose']>(visit.purpose || 'Taking Order');
  const [notes, setNotes] = useState(visit.notes || '');
  const [photoUrl, setPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1554415707-9e4c018a482d?w=600&auto=format&fit=crop&q=80');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(1);

  // Calculate elapsed time from checkInTime
  useEffect(() => {
    const checkInMs = new Date(visit.checkInTime).getTime();
    const nowMs = Date.now();
    const diffMins = Math.max(1, Math.round((nowMs - checkInMs) / (1000 * 60)));
    setDurationMinutes(diffMins);
  }, [visit.checkInTime]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const stamped = await stampPhotoWithWatermark(file, {
        outletName: outlet.name,
        salesmanName,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        type: 'CHECK_OUT'
      });
      setPhotoUrl(stamped);
    } catch {
      // fallback
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckOutSubmitted({
      checkOutTime: new Date().toISOString(),
      checkOutLocation: currentLocation,
      durationMinutes,
      resultStatus,
      purpose,
      notes: notes.trim(),
      checkOutPhotoUrl: photoUrl,
      orderId: visit.orderId,
      orderAmount: visit.orderAmount
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Selesai Kunjungan</span>
              <h3 className="font-extrabold text-sm text-white">{outlet.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-200 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Duration & Order Summary Bar */}
        <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Durasi: <strong>{durationMinutes} Menit</strong></span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-emerald-700 block">Total Nilai Order:</span>
            <span className="font-bold text-slate-900 text-xs">
              Rp {(visit.orderAmount || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          
          {/* Photo Proof of Check-Out (Nota / Display / Toko) */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 block mb-1 flex items-center justify-between">
              <span>Foto Bukti Dokumen Nota / Rak Toko *</span>
              <span className="text-[10px] text-emerald-700 font-normal">Otomatis Ter-watermark GPS</span>
            </label>

            <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 h-32 group">
              <img
                src={photoUrl}
                alt="Bukti Check-Out"
                className="w-full h-full object-cover"
              />

              {isProcessingPhoto && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-semibold">
                  Memproses geotag...
                </div>
              )}

              {/* Watermark overlay preview */}
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white p-1.5 text-[9px] font-mono flex items-center justify-between">
                <span>CHECK-OUT: {salesmanName}</span>
                <span className="text-emerald-400 font-bold">{new Date().toLocaleTimeString('id-ID')}</span>
              </div>

              {/* Upload trigger overlay */}
              <label className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-md transition-colors">
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

          {/* Visit Result Status */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 block mb-1">Hasil Kunjungan *</label>
            <select
              value={resultStatus}
              onChange={(e) => setResultStatus(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="Berhasil Order">✓ Berhasil Order (Taking Order / Canvas)</option>
              <option value="Hanya Penagihan">✓ Hanya Penagihan Piutang</option>
              <option value="Stok Masih Cukup">○ Stok Masih Cukup (Tidak Order)</option>
              <option value="Owner Tidak di Tempat">○ Owner / Penanggung Jawab Tidak di Tempat</option>
              <option value="Toko Tutup">✕ Toko Tutup / Libur</option>
              <option value="Lainnya">○ Alasan Lainnya</option>
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 block mb-1">Aktivitas Utama</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="Taking Order">Taking Order (Pesanan Baru)</option>
              <option value="Cek Stok Display">Cek Stok Display & Merchandising</option>
              <option value="Penagihan">Penagihan Faktur Jatuh Tempo</option>
              <option value="Kunjungan Rutin">Kunjungan Rutin & Penjagaan Hubungan</option>
              <option value="Retur Barang">Retur Barang Rusak / Kadaluarsa</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 block mb-1">Catatan Kunjungan Salesman</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catat kondisi display, tanggapan pemilik, permintaan promo, atau tanggal janji bayar..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 bg-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Check-Out Selesai</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
