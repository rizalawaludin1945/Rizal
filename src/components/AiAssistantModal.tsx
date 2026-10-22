import React, { useState, useRef, useEffect } from 'react';
import { UserAccount } from '../types/sfa';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Store,
  MapPin,
  RefreshCw
} from 'lucide-react';

interface AiAssistantModalProps {
  currentUser: UserAccount;
  totalOutlets: number;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  currentUser,
  totalOutlets,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Halo ${currentUser.name}! Saya Asisten Pintar Nusantara SFA. 
Ada yang bisa saya bantu terkait alur kunjungan lapangan, pencatatan total order, approval hapus toko oleh supervisor, update jadwal harian salesman, atau sinkronisasi multi-perangkat real-time?`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Cara pasang di HP Android & iPhone?',
    'Cara Check-In & foto watermark GPS?',
    'Cara input total order tanpa SKU?',
    'Alur ajuan hapus toko oleh salesman?',
    'Cara supervisor update kunjungan harian?',
    'Cara kerja sinkronisasi real-time antar HP?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: {
            userName: currentUser.name,
            userRole: currentUser.role,
            branchName: currentUser.branchName || 'Nasional',
            totalOutlets
          }
        })
      });

      const json = await res.json();
      const replyText = json.text || 'Terjadi kesalahan sistem, silakan coba beberapa saat lagi.';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Maaf, terjadi kendala koneksi ke server. Anda tetap dapat membaca petunjuk operasional di panduan utama.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[88vh] max-h-[720px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white">Asisten Pintar Nusantara SFA</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-blue-200">Panduan & Petunjuk Operasional Kunjungan Distribusi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <span className="text-[10px] font-bold text-slate-500 pl-1">Pertanyaan Cepat:</span>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="py-1 px-2.5 rounded-full bg-white border border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-700 text-[11px] font-semibold transition-colors shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-100 text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  msg.sender === 'user' ? 'bg-blue-600' : 'bg-slate-900 border border-slate-700'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-amber-400" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3 shadow-xs space-y-1 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed font-medium">
                  {msg.text}
                </div>
                <div
                  className={`text-[9px] text-right font-mono ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 border border-slate-700">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-xs flex items-center gap-1.5 text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span className="text-[11px] font-semibold">Sedang merumuskan panduan terbaik...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tanyakan panduan atau petunjuk SFA..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold transition-all flex items-center justify-center shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
