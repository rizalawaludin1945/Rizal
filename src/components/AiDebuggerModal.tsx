import React, { useState } from 'react';
import { AiDebuggerService, DiagnosticReport, DiagnosticIssue } from '../services/aiDebuggerService';
import { Sparkles, ShieldAlert, CheckCircle, RefreshCw, Wrench, AlertTriangle, Cpu, Terminal, Check, ArrowRight } from 'lucide-react';

interface AiDebuggerModalProps {
  onClose: () => void;
  onSystemRepaired: () => void;
}

export const AiDebuggerModal: React.FC<AiDebuggerModalProps> = ({ onClose, onSystemRepaired }) => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);

  const handleStartScan = async () => {
    setIsScanning(true);
    setAiText(null);
    try {
      const rep = await AiDebuggerService.runSystemDiagnostics();
      setReport(rep);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAutoFix = async () => {
    if (!report) return;
    setIsFixing(true);
    try {
      const { fixedCount, updatedReport } = await AiDebuggerService.autoFixAllIssues(report);
      setReport(updatedReport);
      onSystemRepaired();

      // Trigger AI Analysis automatically after fix
      setIsGeneratingAi(true);
      const analysis = await AiDebuggerService.generateAiDiagnosis(updatedReport);
      setAiText(analysis);
    } finally {
      setIsFixing(false);
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white">AI Auto-Debugger & System Fixer</h3>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-400/30">
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Diagnosis & Perbaikan Error Otomatis SFA GT & MT</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status Diagnosa:</span>
            {!report ? (
              <span className="font-bold text-slate-300">Belum dipindai</span>
            ) : report.status === 'HEALTHY' ? (
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Normal & Sehat
              </span>
            ) : (
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Ditemukan {report.totalIssuesFound} Isu
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Memindai...' : 'Pindai Sistem'}</span>
            </button>

            {report && report.issues.length > 0 && (
              <button
                onClick={handleAutoFix}
                disabled={isFixing}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Wrench className={`w-3.5 h-3.5 ${isFixing ? 'animate-spin' : ''}`} />
                <span>{isFixing ? 'Memperbaiki...' : 'Perbaiki Otomatis'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          
          {/* Welcome Card if not yet scanned */}
          {!report && (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-800 text-blue-400 flex items-center justify-center mx-auto border border-slate-700">
                <Cpu className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-white">Inspeksi Mandiri Kesehatan Aplikasi</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Fitur ini memeriksa integritas database outlet, validasi segmen General Trade & Modern Trade, antrean sinkronisasi, dan status siklus kunjungan salesman.
                </p>
              </div>
              <button
                onClick={handleStartScan}
                className="py-2.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mulai Pindai & Diagnosa Sekarang</span>
              </button>
            </div>
          )}

          {/* Report Issues List */}
          {report && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Daftar Parameter Sistem yang Dianalisis:</span>
                <span>{report.issues.length} Temuan</span>
              </div>

              {report.issues.length === 0 ? (
                <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h5 className="font-bold text-white text-sm">Semua Parameter Sistem Berfungsi Normal</h5>
                    <p className="text-[11px] text-emerald-200/80 mt-0.5">
                      Penyimpanan lokal, koordinat wilayah Indonesia, segmen GT/MT, dan akun supervisor dalam kondisi optimal.
                    </p>
                  </div>
                </div>
              ) : (
                report.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      issue.fixed
                        ? 'bg-emerald-950/30 border-emerald-800/80'
                        : issue.severity === 'CRITICAL'
                        ? 'bg-rose-950/40 border-rose-800/80'
                        : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            issue.severity === 'CRITICAL' ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.2 rounded">
                            {issue.category}
                          </span>
                          {issue.fixed && (
                            <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded border border-emerald-500/30 flex items-center gap-1">
                              ✓ Telah Diperbaiki
                            </span>
                          )}
                        </div>

                        <h5 className="font-bold text-xs text-white">{issue.title}</h5>
                        <p className="text-[11px] text-slate-400">{issue.description}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        {issue.fixed ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : issue.fixableAutomatically ? (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
                            Auto-Fixable
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AI Diagnosis Result */}
          {aiText && (
            <div className="p-3.5 bg-blue-950/40 rounded-2xl border border-blue-800/70 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Analisis AI & Rekomendasi Arsitektur SFA:</span>
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line font-sans pl-6 border-l-2 border-blue-500/50">
                {aiText}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-[10px]">Runtime: Browser PWA Offline-First</span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
