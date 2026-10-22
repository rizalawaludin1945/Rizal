import React, { useState } from 'react';
import { OutletDeletionRequest, UserAccount } from '../types/sfa';
import { StorageService } from '../services/storageService';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Store,
  User,
  AlertCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface DeletionApprovalModalProps {
  currentUser: UserAccount;
  onClose: () => void;
  onRequestHandled: () => void;
}

export const DeletionApprovalModal: React.FC<DeletionApprovalModalProps> = ({
  currentUser,
  onClose,
  onRequestHandled
}) => {
  const [requests, setRequests] = useState<OutletDeletionRequest[]>(() => StorageService.getDeletionRequests());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [confirmingApproveReq, setConfirmingApproveReq] = useState<OutletDeletionRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const isSupervisor = currentUser.role === 'supervisor' || currentUser.role === 'general_manager' || currentUser.role === 'branch_manager';

  const filteredRequests = requests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    // Salesman can only see their own requests; supervisor sees all
    if (!isSupervisor && r.requestedByUserId !== currentUser.id) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleExecuteApprove = async () => {
    if (!confirmingApproveReq || !isSupervisor) return;

    StorageService.approveDeletionRequest(confirmingApproveReq.id, currentUser);
    await StorageService.pushServerSync();
    setRequests(StorageService.getDeletionRequests());
    setConfirmingApproveReq(null);
    onRequestHandled();
  };

  const handleConfirmReject = async (reqId: string) => {
    if (!isSupervisor) return;
    if (!rejectReason.trim()) {
      setRejectError('Mohon cantumkan alasan penolakan.');
      return;
    }

    StorageService.rejectDeletionRequest(reqId, currentUser, rejectReason.trim());
    await StorageService.pushServerSync();
    setRequests(StorageService.getDeletionRequests());
    setRejectingId(null);
    setRejectReason('');
    setRejectError('');
    onRequestHandled();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Persetujuan Hapus Toko (Approval)</h3>
                {pendingCount > 0 && isSupervisor && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full">
                    {pendingCount} Baru
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200">
                {isSupervisor
                  ? 'Verifikasi & Otorisasi Pengajuan Hapus Toko dari Salesman'
                  : 'Status Pengajuan Hapus Toko Anda ke Supervisor'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-blue-950 text-blue-200 flex items-center justify-center text-xs font-bold hover:bg-blue-900 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
              }`}
            >
              Menunggu ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Disetujui ({requests.filter(r => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Ditolak ({requests.filter(r => r.status === 'rejected').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Pengajuan Hapus</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {statusFilter === 'pending'
                  ? 'Semua pengajuan penghapusan outlet telah diverifikasi.'
                  : 'Belum ada data pengajuan dalam status ini.'}
              </p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl p-4 border transition-all space-y-2.5 ${
                    isPending
                      ? 'border-amber-300 shadow-sm'
                      : isApproved
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {req.outletCode}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          req.tradeChannel === 'General Trade (GT)'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {req.tradeChannel}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPending ? '● Menunggu Approval' : isApproved ? '✓ Disetujui Hapus' : '✕ Ditolak'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">{req.outletName}</h4>
                      <p className="text-xs text-slate-500">{req.district}, {req.city}</p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(req.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Reason & Notes Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className="font-bold text-slate-900">Alasan Hapus:</span>
                      <span className="font-semibold text-rose-700">{req.reason}</span>
                    </div>
                    {req.notes && (
                      <p className="text-slate-600 text-[11px] italic">"{req.notes}"</p>
                    )}
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 border-t border-slate-200/60">
                      <span>Diajukan oleh: <strong>{req.requestedByUserName}</strong></span>
                      <span>•</span>
                      <span>Salesman Rute: <strong>{req.assignedSalesmanName}</strong></span>
                    </div>
                  </div>

                  {/* Supervisor Review Outcome */}
                  {!isPending && (
                    <div className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                      isApproved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      <div>
                        <span className="font-bold text-[10px] block">
                          Diverifikasi oleh: {req.reviewedBySupervisorName}
                        </span>
                        <span className="text-[11px]">{req.reviewNotes}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">
                        {req.reviewedAt && new Date(req.reviewedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Supervisor Action Buttons */}
                  {isSupervisor && isPending && (
                    <div className="pt-1 flex items-center justify-end gap-2 border-t border-slate-100">
                      {rejectingId === req.id ? (
                        <div className="w-full space-y-2 pt-1 animate-in fade-in duration-150">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Alasan Penolakan ke Salesman:
                          </label>
                          <input
                            type="text"
                            required
                            autoFocus
                            value={rejectReason}
                            onChange={(e) => {
                              setRejectReason(e.target.value);
                              setRejectError('');
                            }}
                            placeholder="Contoh: Toko masih ada piutang Rp 500rb..."
                            className="w-full text-xs p-2 rounded-xl border border-rose-300 bg-white"
                          />
                          {rejectError && (
                            <p className="text-[10px] text-rose-600 font-bold">{rejectError}</p>
                          )}
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                                setRejectError('');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmReject(req.id)}
                              className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                            >
                              Kirim Penolakan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(req.id);
                              setRejectReason('');
                            }}
                            className="py-1.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                          >
                            Tolak
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmingApproveReq(req)}
                            className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui Hapus Toko</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* INLINE MODAL CONFIRMATION DIALOG (No window.confirm!) */}
        {confirmingApproveReq && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Konfirmasi Persetujuan</h4>
                  <p className="text-[10px] text-slate-500">Otorisasi Hapus Toko oleh Supervisor</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="text-slate-500 text-[10px]">Toko yang akan dihapus:</p>
                <p className="font-black text-slate-900 text-sm">{confirmingApproveReq.outletName}</p>
                <p className="text-slate-600 font-mono text-[11px]">{confirmingApproveReq.outletCode} • {confirmingApproveReq.tradeChannel}</p>
                <p className="text-rose-700 font-semibold text-[11px] pt-1">Alasan: {confirmingApproveReq.reason}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Toko ini akan langsung dihapus dari master data distribusi dan rute kunjungan salesman terkait.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmingApproveReq(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteApprove}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ya, Setujui Hapus</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
