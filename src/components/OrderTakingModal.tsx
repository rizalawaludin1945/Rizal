import React, { useState, useRef } from 'react';
import { Outlet, Product, Order, GeoCoordinate } from '../types/sfa';
import { StorageService, calculateDistanceMeters } from '../services/storageService';
import {
  X,
  Check,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  Sparkles,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle2,
  FileText,
  MapPin,
  Calendar,
  PenTool
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderTakingModalProps {
  outlet: Outlet;
  products?: Product[];
  currentLocation: GeoCoordinate;
  salesmanId: string;
  salesmanName: string;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

export const OrderTakingModal: React.FC<OrderTakingModalProps> = ({
  outlet,
  currentLocation,
  salesmanId,
  salesmanName,
  onClose,
  onOrderCreated
}) => {
  const [orderType, setOrderType] = useState<'Taking Order (TO)' | 'Direct Sales (Canvas)'>('Taking Order (TO)');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [rawInputValue, setRawInputValue] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Kredit TOP' | 'Tunai / COD' | 'Transfer Bank' | 'QRIS'>('Kredit TOP');
  const [paymentTerm, setPaymentTerm] = useState<string>(outlet.termOfPayment || '14 Hari');
  const [receiverName, setReceiverName] = useState<string>(outlet.ownerName || '');
  const [notes, setNotes] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [includePpn, setIncludePpn] = useState<boolean>(false);
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Distance to outlet calculation
  const distanceMeters = calculateDistanceMeters(
    currentLocation.lat,
    currentLocation.lng,
    outlet.location.lat,
    outlet.location.lng
  );
  const isWithinRadius = distanceMeters <= 100;

  // Handle direct text/numeric input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setTotalAmount(num);
    setRawInputValue(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  // Quick addition chips
  const handleAddAmount = (delta: number) => {
    const next = Math.max(0, totalAmount + delta);
    setTotalAmount(next);
    setRawInputValue(next > 0 ? next.toLocaleString('id-ID') : '');
  };

  // Preset setter
  const handleSetPreset = (val: number) => {
    setTotalAmount(val);
    setRawInputValue(val > 0 ? val.toLocaleString('id-ID') : '');
  };

  const handleResetAmount = () => {
    setTotalAmount(0);
    setRawInputValue('');
  };

  // Calculated totals
  const ppnAmount = includePpn ? Math.round(totalAmount * 0.11) : 0;
  const grandTotal = totalAmount + ppnAmount;

  // Credit limit check
  const creditLimitExceeded = (outlet.outstandingBalance + grandTotal) > outlet.creditLimit;
  const remainingCredit = Math.max(0, outlet.creditLimit - outlet.outstandingBalance);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit Order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) return;

    let signatureUrl = '';
    if (canvasRef.current && hasSignature) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    const orderNotes = [
      poNumber ? `No. PO: ${poNumber}` : '',
      notes ? notes : ''
    ].filter(Boolean).join(' | ');

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      orderNumber: `SO/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`,
      outletId: outlet.id,
      outletName: outlet.name,
      salesmanId,
      salesmanName,
      orderType,
      items: [
        {
          productId: 'ORDER-TOTAL',
          productName: `Total Pesanan ${outlet.tradeChannel || 'GT/MT'}`,
          sku: 'TOTAL',
          unit: 'Lot',
          quantity: 1,
          unitPrice: totalAmount,
          discountPercent: 0,
          discountAmount: 0,
          subtotal: totalAmount
        }
      ],
      subtotal: totalAmount,
      discountTotal: 0,
      ppnAmount,
      grandTotal,
      paymentMethod,
      paymentTerm,
      notes: orderNotes.trim() || undefined,
      receiverName: receiverName.trim() || outlet.ownerName,
      signatureUrl,
      geotag: {
        ...currentLocation,
        timestamp: new Date().toISOString()
      },
      isWithinRadius,
      distanceFromOutletMeters: distanceMeters,
      status: 'Tersimpan (Offline)',
      createdAt: new Date().toISOString()
    };

    const savedOrder = StorageService.createOrder(newOrder);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }

    onOrderCreated(savedOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white tracking-wide uppercase">
                {outlet.code}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-800 text-indigo-100">
                {outlet.tradeChannel || 'General Trade (GT)'}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isWithinRadius ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                📍 {distanceMeters}m {isWithinRadius ? '(Valid GPS)' : '(Luar Radius)'}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-1 line-clamp-1">{outlet.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-slate-200 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credit Limit Alert if high outstanding */}
        {creditLimitExceeded && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center gap-2 text-rose-800 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Peringatan: Pesanan ini melebihi sisa plafon kredit outlet (Limit: Rp {outlet.creditLimit.toLocaleString('id-ID')}).</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-800">
          
          {/* Order Type Toggle */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Tipe Pesanan Distribusi
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setOrderType('Taking Order (TO)')}
                className={`py-2 rounded-lg transition-all ${
                  orderType === 'Taking Order (TO)' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Taking Order (TO)
              </button>
              <button
                type="button"
                onClick={() => setOrderType('Direct Sales (Canvas)')}
                className={`py-2 rounded-lg transition-all ${
                  orderType === 'Direct Sales (Canvas)' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Canvas (Van Sales)
              </button>
            </div>
          </div>

          {/* MAIN FEATURE: INPUT TOTAL ORDER NOMINAL */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 rounded-2xl border-2 border-blue-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="totalOrderInput" className="text-xs font-black text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-blue-600" />
                <span>Nominal Total Order (Rp) *</span>
              </label>
              {totalAmount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAmount}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Currency Input Field */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-blue-900 select-none">
                Rp
              </span>
              <input
                id="totalOrderInput"
                type="text"
                inputMode="numeric"
                required
                autoFocus
                placeholder="0"
                value={rawInputValue}
                onChange={handleAmountChange}
                className="w-full pl-12 pr-4 py-3 text-2xl font-black text-blue-950 bg-white rounded-xl border-2 border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-right font-mono placeholder-slate-300 shadow-inner"
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tambah Cepat Nominal:
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleAddAmount(250000)}
                  className="py-1.5 px-2 bg-white hover:bg-blue-100/70 border border-blue-200 rounded-lg font-bold text-blue-900 transition-colors shadow-xs active:scale-95"
                >
                  +250rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(500000)}
                  className="py-1.5 px-2 bg-white hover:bg-blue-100/70 border border-blue-200 rounded-lg font-bold text-blue-900 transition-colors shadow-xs active:scale-95"
                >
                  +500rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(1000000)}
                  className="py-1.5 px-2 bg-white hover:bg-blue-100/70 border border-blue-200 rounded-lg font-bold text-blue-900 transition-colors shadow-xs active:scale-95"
                >
                  +1 Juta
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAmount(2500000)}
                  className="py-1.5 px-2 bg-white hover:bg-blue-100/70 border border-blue-200 rounded-lg font-bold text-blue-900 transition-colors shadow-xs active:scale-95"
                >
                  +2.5 Juta
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1 pt-1 overflow-x-auto text-[10px]">
                <span className="text-slate-400 shrink-0">Preset:</span>
                {[500000, 1000000, 2000000, 3500000, 5000000, 10000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSetPreset(val)}
                    className={`px-2 py-0.5 rounded-full border shrink-0 transition-colors ${
                      totalAmount === val
                        ? 'bg-blue-600 text-white font-bold border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    Rp {(val / 1000).toLocaleString('id-ID')}rb
                  </button>
                ))}
              </div>
            </div>

            {/* PPN 11% Toggle */}
            <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between">
              <label htmlFor="ppnToggle" className="text-xs text-slate-700 font-semibold cursor-pointer flex items-center gap-2">
                <input
                  id="ppnToggle"
                  type="checkbox"
                  checked={includePpn}
                  onChange={(e) => setIncludePpn(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Tambahkan Faktur Pajak PPN (11%)</span>
              </label>

              {includePpn && (
                <span className="text-xs font-bold text-blue-900 font-mono">
                  +Rp {ppnAmount.toLocaleString('id-ID')}
                </span>
              )}
            </div>

            {/* Grand Total Summary Display */}
            <div className="p-2.5 bg-blue-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-200 font-medium block">Total Tagihan Final</span>
                <span className="text-xs text-blue-300 font-semibold">{outlet.tradeChannel}</span>
              </div>
              <span className="text-lg font-black text-amber-300 font-mono">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Sisa Plafon Outlet Info */}
            <div className="text-[11px] text-slate-600 flex items-center justify-between px-1">
              <span>Sisa Plafon Kredit Outlet:</span>
              <span className="font-bold font-mono text-slate-800">
                Rp {remainingCredit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['Kredit TOP', 'Tunai / COD', 'Transfer Bank', 'QRIS'] as const).map(met => (
                <button
                  key={met}
                  type="button"
                  onClick={() => setPaymentMethod(met)}
                  className={`py-2 px-3 rounded-xl border font-bold text-left transition-all flex items-center gap-2 ${
                    paymentMethod === met
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className={`w-3.5 h-3.5 ${paymentMethod === met ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{met}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Terms (TOP) & Receiver Name */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Jatuh Tempo (TOP)
              </label>
              <select
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="Cash / COD">Cash / COD</option>
                <option value="7 Hari">7 Hari (1 Minggu)</option>
                <option value="14 Hari">14 Hari (2 Minggu)</option>
                <option value="21 Hari">21 Hari (3 Minggu)</option>
                <option value="30 Hari">30 Hari (1 Bulan)</option>
                <option value="45 Hari">45 Hari</option>
                <option value="60 Hari">60 Hari</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Penerima / PIC Toko
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Nama Pemilik Toko"
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* PO Number & Additional Notes */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                No. PO Fisik Toko (Opsional)
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Contoh: PO-9921"
                className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Catatan Pengiriman / Toko
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Kirim sebelum jam 11..."
                className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Digital Signature Toggle & Canvas */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-blue-600" />
                <span>Tanda Tangan Digital Pemilik Toko</span>
              </label>
              <button
                type="button"
                onClick={() => setShowSignaturePad(!showSignaturePad)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
              >
                {showSignaturePad ? 'Sembunyikan Pad' : (hasSignature ? '✓ Ditandatangani' : '+ Buka Pad TTD')}
              </button>
            </div>

            {showSignaturePad && (
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-300 space-y-2">
                <div className="border-2 border-dashed border-slate-300 bg-white rounded-xl overflow-hidden relative touch-none">
                  <canvas
                    ref={canvasRef}
                    width={360}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 cursor-crosshair block"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                      Sentuh / Usap layar di sini untuk tanda tangan
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    Otentikasi PIC: <strong>{receiverName || outlet.ownerName}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-0.5"
                  >
                    Hapus Tanda Tangan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={totalAmount <= 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-98 transition-all"
            >
              <Check className="w-5 h-5" />
              <span>
                {totalAmount > 0
                  ? `Simpan & Buat Pesanan (Rp ${grandTotal.toLocaleString('id-ID')})`
                  : 'Masukkan Nominal Total Order Dulu'}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
