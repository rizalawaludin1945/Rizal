import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 is required by the environment for dev server
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// In-Memory Shared State for Real-Time Cross-Device Synchronization
interface SharedServerState {
  users: any[];
  outlets: any[];
  deletionRequests: any[];
  visits: any[];
  orders: any[];
  callPlans: Record<string, any>; // salesmanId -> callPlan
  lastUpdated: string;
}

let sharedState: SharedServerState = {
  users: [],
  outlets: [],
  deletionRequests: [],
  visits: [],
  orders: [],
  callPlans: {},
  lastUpdated: new Date().toISOString()
};

// API: Get Real-Time Shared State across all devices
app.get('/api/sync/state', (_req, res) => {
  res.json({
    success: true,
    data: sharedState
  });
});

// API: Push updates from any device (phone, tablet, PC)
app.post('/api/sync/update', (req, res) => {
  try {
    const { users, outlets, deletionRequests, visits, orders, callPlan, patchType } = req.body;

    if (users && Array.isArray(users) && users.length > 0) {
      sharedState.users = users;
    }

    if (outlets && Array.isArray(outlets) && outlets.length > 0) {
      sharedState.outlets = outlets;
    }

    if (deletionRequests && Array.isArray(deletionRequests)) {
      sharedState.deletionRequests = deletionRequests;
    }

    if (visits && Array.isArray(visits)) {
      sharedState.visits = visits;
    }

    if (orders && Array.isArray(orders)) {
      sharedState.orders = orders;
    }

    if (callPlan && callPlan.salesmanId) {
      sharedState.callPlans[callPlan.salesmanId] = callPlan;
    }

    sharedState.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      lastUpdated: sharedState.lastUpdated,
      patchType: patchType || 'FULL_MERGE'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: AI Auto-Debugger & System Diagnostics
app.post('/api/ai-debug', async (req, res) => {
  try {
    const { report, prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'GEMINI_API_KEY tidak dikonfigurasi, menggunakan diagnosa lokal pintar.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const userPrompt = prompt || `Anda adalah AI System Architect & Senior Debugger untuk Nusantara SFA (Sales Force Automation) distribusi General Trade (GT) dan Modern Trade (MT) di Indonesia.
Analisis data diagnosa berikut dan berikan evaluasi serta langkah perbaikan:
Status: ${report?.status}
Total Masalah: ${report?.totalIssuesFound}
Masalah Terperbaiki: ${report?.fixedCount}
Daftar Masalah:
${JSON.stringify(report?.issues || [])}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt
    });

    return res.status(200).json({
      success: true,
      text: response.text
    });
  } catch (error: any) {
    console.error('Error in /api/ai-debug:', error);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: error.message || 'Gagal memproses diagnosa AI'
    });
  }
});

// API: AI Assistant for Guidance & Operational Instructions
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { message, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        fallback: true,
        text: `Halo! Saya Asisten Pintar Nusantara SFA. 
Berikut panduan cepat operasional:
1. **Kunjungan Toko**: Buka tab 'Call Plan', pilih toko dalam jadwal hari ini, lakukan 'Check-In' berfoto GPS saat berada dalam radius toko (maks. 100m).
2. **Pencatatan Order Cepat**: Klik tombol '+ Order' pada toko yang dikunjungi, ketik nominal total order (tanpa perlu input SKU satu-satu), minta tanda tangan pemilik toko, lalu simpan.
3. **Pengajuan Hapus Toko**: Salesman dapat mengajukan hapus toko di tab 'Outlet' dengan tombol 'Ajukan Hapus'. Supervisor akan memverifikasi dan menyetujui di menu 'Approval'.
4. **Update Kunjungan Harian Salesman**: Supervisor dapat mengupdate jadwal kunjungan harian tiap akun salesman kapan saja melalui tab 'Call Plan'.
5. **Peta Koordinat**: Tab 'Peta' khusus menampilkan koordinat GPS real-time posisi Anda beserta akurasi satelit.
6. **Pasang di HP (Android & iOS)**: Di Android (Chrome), pilih menu titik tiga (⋮) lalu 'Tambahkan ke Layar Utama'. Di iPhone/iPad (Safari), ketuk tombol Share [↑] lalu 'Tambahkan ke Layar Utama'. Aplikasi langsung tampil di layar HP tanpa browser!`
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = `Anda adalah Asisten Pintar Nusantara SFA — asisten operasional resmi untuk tim Salesman dan Supervisor distribusi General Trade (GT) dan Modern Trade (MT) di seluruh Indonesia.
Karakter Anda ramah, profesional, bahasa Indonesia santun dan praktis, to the point.
Konteks pengguna saat ini:
- Nama: ${context?.userName || 'Pengguna SFA'}
- Peran: ${context?.userRole || 'Salesman'}
- Wilayah Cabang: ${context?.branchName || 'Nasional'}
- Toko Terdaftar: ${context?.totalOutlets || 0} Toko

Bantulah pengguna menjawab pertanyaan seputar penggunaan aplikasi SFA, tips rute kunjungan, validasi geotagging, input order total cepat, persetujuan hapus toko oleh supervisor, panduan pasang aplikasi di Android & iOS (iPhone/iPad), serta panduan sinkronisasi real-time antar perangkat.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\nPertanyaan Pengguna: ${message}`
    });

    return res.status(200).json({
      success: true,
      text: response.text
    });
  } catch (error: any) {
    console.error('Error in /api/ai-assistant:', error);
    return res.status(200).json({
      success: true,
      fallback: true,
      text: 'Maaf, terjadi kendala koneksi AI saat ini. Namun Anda dapat membaca panduan lengkap di tab Panduan atau menghubungi Supervisor Anda.'
    });
  }
});

// Mount Vite middleware in development or serve static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { 
      middlewareMode: true, 
      hmr: false 
    },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Nusantara SFA server listening on http://0.0.0.0:${port}`);
});
