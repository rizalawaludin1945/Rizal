import React from 'react';
import { Order } from '../types/sfa';
import { X, Printer, Share2, CheckCircle2, FileText, Check, Banknote, Calendar, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `
*NOTA PESANAN SFA (DISTRIBUSI GT/MT)*
No. Nota: ${order.orderNumber}
Toko: ${order.outletName}
Salesman: ${order.salesmanName}
Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}
Tipe Pesanan: ${order.orderType}
--------------------------------
*TOTAL PESANAN: Rp ${order.grandTotal.toLocaleString('id-ID')}*
Pembayaran: ${order.paymentMethod} (${order.paymentTerm})
${order.notes ? `Catatan: ${order.notes}\n` : ''}--------------------------------
Geotag GPS: ${order.geotag.lat.toFixed(5)}, ${order.geotag.lng.toFixed(5)} (${order.isWithinRadius ? 'Valid Radius' : 'Luar Radius'})
Penerima: ${order.receiverName || 'Pemilik Toko'}
Status: ${order.status}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-800 text-blue-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Faktur Penjualan (Nota Resmi)</h3>
              <p className="text-[11px] text-blue-200 font-mono">{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-blue-800 text-blue-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable / Viewable Receipt Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans print:p-0">
          
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-300">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status Order</span>
              <span className={`inline-flex items-center gap-1 font-bold text-xs mt-0.5 ${
                order.status === 'Terkirim ke Server' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {order.status}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tipe Layanan</span>
              <span className="font-bold text-slate-900">{order.orderType}</span>
            </div>
          </div>

          {/* Outlet & Sales Info */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-400">Kepada Yth:</p>
              <p className="font-bold text-slate-900 text-xs">{order.outletName}</p>
              <p className="text-slate-500">{order.receiverName || 'Pemilik Toko'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Salesman:</p>
              <p className="font-bold text-slate-900 text-xs">{order.salesmanName}</p>
              <p className="text-slate-500">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {/* TOTAL ORDER SUMMARY CARD (NO SKU LIST) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border-2 border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-blue-600" />
                <span>Total Nilai Pesanan (Order)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Direct Total
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Total Nominal Order Toko</p>
                <p className="text-[10px] text-slate-500">Kunjungan {order.orderType}</p>
              </div>
              <p className="text-xl font-black text-blue-900 font-mono">
                Rp {order.subtotal.toLocaleString('id-ID')}
              </p>
            </div>

            {order.notes && (
              <div className="text-[11px] bg-white/80 p-2 rounded-lg border border-blue-100 text-slate-700">
                <span className="font-bold text-slate-600 block text-[10px]">Catatan / Instruksi:</span>
                <span>{order.notes}</span>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Nilai Pesanan:</span>
              <span className="font-semibold text-slate-800">Rp {order.subtotal.toLocaleString('id-ID')}</span>
            </div>
            {order.ppnAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>PPN (11%):</span>
                <span className="font-semibold text-slate-800">Rp {order.ppnAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-blue-950 pt-2 border-t-2 border-slate-300">
              <span>Grand Total:</span>
              <span className="font-mono text-blue-900">Rp {order.grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Payment Terms & Geotag Proof */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Metode Bayar:</span>
              <span className="font-bold text-slate-800">{order.paymentMethod} - {order.paymentTerm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Geotag Lokasi:</span>
              <span className="font-mono text-slate-700">{order.geotag.lat.toFixed(5)}, {order.geotag.lng.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verifikasi Radius:</span>
              <span className={`font-bold ${order.isWithinRadius ? 'text-emerald-600' : 'text-amber-600'}`}>
                {order.distanceFromOutletMeters}m ({order.isWithinRadius ? 'Valid' : 'Luar Batas'})
              </span>
            </div>
          </div>

          {/* Signature Preview */}
          {order.signatureUrl && (
            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-400 mb-1">Tanda Tangan Pemilik / PIC Toko:</p>
              <img
                src={order.signatureUrl}
                alt="Tanda Tangan Toko"
                className="h-16 mx-auto border border-slate-200 rounded-lg p-1 bg-white"
              />
              <p className="text-[11px] font-semibold text-slate-700 mt-1">{order.receiverName}</p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleCopySummary}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Bagi Nota (WA)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Faktur</span>
          </button>
        </div>

      </div>
    </div>
  );
};
