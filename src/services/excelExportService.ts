import * as XLSX from 'xlsx';
import { Outlet, Order, VisitLog, SalesmanProfile, VisitFrequency, VisitDay, VisitWeekCycle } from '../types/sfa';

export class ExcelExportService {
  /**
   * Generates and downloads a multi-sheet .xlsx file optimized for:
   * 1. Rekap Kunjungan Lengkap (Check-In & Check-Out + Bukti Foto)
   * 2. Master Outlet & Frekuensi Kunjungan (F1, F2, F4)
   * 3. Detail Transaksi Pesanan Penjualan
   * 4. 3D Maps Power Map Geotagging
   */
  static exportToExcel(
    outlets: Outlet[],
    orders: Order[],
    visits: VisitLog[],
    salesman: SalesmanProfile,
    dateStr: string = new Date().toISOString().split('T')[0]
  ): void {
    const workbook = XLSX.utils.book_new();

    // ----------------------------------------------------
    // 1. SHEET: Rekap_Kunjungan_Lengkap (Check-In & Check-Out)
    // ----------------------------------------------------
    const visitRows = visits.map(v => {
      const relatedOrder = orders.find(o => o.id === v.orderId);
      return {
        'ID_Kunjungan': v.id,
        'Nama_Salesman': v.salesmanName,
        'Kode_Outlet': v.outletId,
        'Nama_Toko': v.outletName,
        'Status_Kunjungan': v.status === 'completed' ? 'Selesai (Check-Out)' : (v.status === 'checked_in' ? 'Sedang Kunjungan' : 'Dibatalkan'),
        'Waktu_CheckIn': v.checkInTime ? new Date(v.checkInTime).toLocaleString('id-ID') : '-',
        'Waktu_CheckOut': v.checkOutTime ? new Date(v.checkOutTime).toLocaleString('id-ID') : 'Belum Check-Out',
        'Durasi_Menit': v.durationMinutes ? `${v.durationMinutes} Menit` : '-',
        'Tujuan_Kunjungan': v.purpose,
        'Hasil_Kunjungan': v.resultStatus,
        'Jarak_GPS_CheckIn_Meter': v.distanceMeters,
        'Validasi_Radius': v.isWithinRadius ? 'Valid (<=100m)' : 'Luar Radius (>100m)',
        'CheckIn_Lat': v.checkInLocation.lat,
        'CheckIn_Lng': v.checkInLocation.lng,
        'Nilai_Order_Rp': v.orderAmount || (relatedOrder ? relatedOrder.grandTotal : 0),
        'Ada_Foto_CheckIn': v.checkInPhotoUrl ? 'Ya (Tersedia)' : 'Tidak',
        'Ada_Foto_CheckOut': v.checkOutPhotoUrl ? 'Ya (Tersedia)' : 'Tidak',
        'Catatan': v.notes || '-'
      };
    });

    const visitSheet = XLSX.utils.json_to_sheet(visitRows.length > 0 ? visitRows : [{ 'Keterangan': 'Belum ada riwayat kunjungan' }]);
    XLSX.utils.book_append_sheet(workbook, visitSheet, 'Rekap_Kunjungan_Lengkap');

    // ----------------------------------------------------
    // 2. SHEET: Master_Outlet_Frekuensi (F1, F2, F4)
    // ----------------------------------------------------
    const outletRows = outlets.map(o => {
      return {
        'Kode_Outlet': o.code,
        'Nama_Toko': o.name,
        'Saluran_Distribusi': o.tradeChannel || 'General Trade (GT)',
        'Kategori': o.category,
        'Nama_Pemilik': o.ownerName,
        'No_Telepon': o.phone,
        'Frekuensi': o.visitFrequency,
        'Keterangan_Frekuensi': o.visitFrequency === 'F1' ? 'F1 - Setiap Minggu' : (o.visitFrequency === 'F2' ? 'F2 - 2 Minggu Sekali' : 'F4 - 4 Minggu Sekali (Bulanan)'),
        'Hari_Kunjungan': o.visitDay,
        'Siklus_Minggu': o.visitWeekCycle,
        'Salesman_Assign': o.assignedSalesmanName,
        'ID_Salesman': o.assignedSalesmanId,
        'Alamat_Lengkap': o.address,
        'Kecamatan': o.district,
        'Kota_Kabupaten': o.city,
        'Provinsi': o.province,
        'Kode_Pos': o.postalCode,
        'Latitude': o.location.lat,
        'Longitude': o.location.lng,
        'Plafon_Kredit': o.creditLimit,
        'Piutang_Berjalan': o.outstandingBalance,
        'Term_Of_Payment': o.termOfPayment,
        'Google_Maps_Link': `https://www.google.com/maps?q=${o.location.lat},${o.location.lng}`
      };
    });

    const outletSheet = XLSX.utils.json_to_sheet(outletRows);
    XLSX.utils.book_append_sheet(workbook, outletSheet, 'Master_Outlet_Frekuensi');

    // ----------------------------------------------------
    // 3. SHEET: Detail_Transaksi_Pesanan
    // ----------------------------------------------------
    const orderDetailsRows: any[] = [];
    orders.forEach(ord => {
      ord.items.forEach(item => {
        orderDetailsRows.push({
          'No_Faktur': ord.orderNumber,
          'Tanggal': ord.createdAt.split('T')[0],
          'Jam': ord.createdAt.split('T')[1]?.substring(0, 5) || '-',
          'Nama_Salesman': ord.salesmanName,
          'Nama_Toko': ord.outletName,
          'Tipe_Pesanan': ord.orderType,
          'Metode_Bayar': ord.paymentMethod,
          'Term_Pembayaran': ord.paymentTerm,
          'SKU': item.sku,
          'Nama_Produk': item.productName,
          'Satuan': item.unit,
          'Qty': item.quantity,
          'Harga_Satuan': item.unitPrice,
          'Diskon_Rp': item.discountAmount,
          'Subtotal_Item': item.subtotal,
          'Grand_Total_Faktur': ord.grandTotal,
          'Status_Sinkronisasi': ord.status
        });
      });
    });

    const orderSheet = XLSX.utils.json_to_sheet(orderDetailsRows.length > 0 ? orderDetailsRows : [{ 'Keterangan': 'Belum ada pesanan' }]);
    XLSX.utils.book_append_sheet(workbook, orderSheet, 'Detail_Pesanan');

    // ----------------------------------------------------
    // 4. SHEET: 3D_Power_Map_Data
    // ----------------------------------------------------
    const mapRows = outlets.map(out => {
      const outletOrders = orders.filter(o => o.outletId === out.id);
      const totalRevenue = outletOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      const lastVisit = visits.find(v => v.outletId === out.id);

      return {
        'Outlet_Code': out.code,
        'Outlet_Name': out.name,
        'Latitude': out.location.lat,
        'Longitude': out.location.lng,
        'Category': out.category,
        'City': out.city,
        'Province': out.province,
        'Frequency': out.visitFrequency,
        'Day': out.visitDay,
        'Sales_Amount_IDR': totalRevenue,
        'Status_Kunjungan': lastVisit ? (lastVisit.status === 'completed' ? 'Selesai' : 'Sedang Dikunjungi') : 'Belum Dikunjungi',
        'Salesman': out.assignedSalesmanName,
        'Google_Maps_URL': `https://www.google.com/maps?q=${out.location.lat},${out.location.lng}`
      };
    });

    const mapSheet = XLSX.utils.json_to_sheet(mapRows);
    XLSX.utils.book_append_sheet(workbook, mapSheet, '3D_Map_PowerMap');

    // Generate buffer & trigger download
    const filename = `Nusantara_SFA_Rekap_Kunjungan_${salesman.name.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Generates a template Excel file for importing new outlets and visit schedules
   */
  static downloadImportTemplate(): void {
    const workbook = XLSX.utils.book_new();

    const templateRows = [
      {
        'Kode_Outlet': 'TKO-JAT-010',
        'Nama_Toko': 'Toko Berkah Sejahtera',
        'Saluran_Distribusi': 'General Trade (GT)', // Pilihan: General Trade (GT) atau Modern Trade (MT)
        'Kategori': 'Toko Kelontong', // GT: Toko Kelontong, Grosir Tradisional, Warung Sembako | MT: Minimarket, Supermarket
        'Nama_Pemilik': 'Bpk. Ahmad Fauzi',
        'No_Telepon': '0812-9988-7711',
        'Alamat_Lengkap': 'Jl. Matraman Raya No. 100',
        'Kecamatan': 'Matraman',
        'Kota_Kabupaten': 'Jakarta Timur',
        'Provinsi': 'DKI Jakarta',
        'Kode_Pos': '13140',
        'Latitude': -6.2155,
        'Longitude': 106.8465,
        'Frekuensi': 'F1', // Pilihan: F1 (Mingguan), F2 (2 Mingguan), F4 (Bulanan)
        'Hari_Kunjungan': 'Senin', // Pilihan: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
        'Siklus_Minggu': 'Semua', // Pilihan: Semua (untuk F1), W1 atau W2 (untuk F2), W1/W2/W3/W4 (untuk F4)
        'ID_Salesman': 'SLS-JKT-088',
        'Nama_Salesman': 'Budi Santoso',
        'Plafon_Kredit': 10000000,
        'Term_Of_Payment': 'COD' // Pilihan: COD, TOP 7 Hari, TOP 14 Hari, TOP 30 Hari
      },
      {
        'Kode_Outlet': 'TKO-BDG-020',
        'Nama_Toko': 'Minimarket Mitra Sehati',
        'Saluran_Distribusi': 'Modern Trade (MT)',
        'Kategori': 'Minimarket',
        'Nama_Pemilik': 'Ibu Siti Aminah (Store Head)',
        'No_Telepon': '0813-1122-3344',
        'Alamat_Lengkap': 'Jl. Dipati Ukur No. 50',
        'Kecamatan': 'Coblong',
        'Kota_Kabupaten': 'Kota Bandung',
        'Provinsi': 'Jawa Barat',
        'Kode_Pos': '40132',
        'Latitude': -6.8931,
        'Longitude': 107.6172,
        'Frekuensi': 'F2',
        'Hari_Kunjungan': 'Senin',
        'Siklus_Minggu': 'W1',
        'ID_Salesman': 'SLS-BDG-014',
        'Nama_Salesman': 'Agus Priyanto',
        'Plafon_Kredit': 5000000,
        'Term_Of_Payment': 'TOP 7 Hari'
      }
    ];

    const sheet = XLSX.utils.json_to_sheet(templateRows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Template_Import_Outlet_SFA');

    XLSX.writeFile(workbook, 'Template_Import_Kunjungan_SFA_GT_MT.xlsx');
  }

  /**
   * Parses an uploaded Excel or CSV file into Outlet array
   */
  static async parseExcelOrCsvFile(file: File): Promise<Outlet[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const parsedOutlets: Outlet[] = rawRows.map((r, i) => {
            const lat = Number(r['Latitude'] || r['lat'] || -6.2148);
            const lng = Number(r['Longitude'] || r['lng'] || 106.8453);
            const freq = (r['Frekuensi'] || r['frequency'] || 'F1').toUpperCase() as VisitFrequency;
            const validFreq: VisitFrequency = (freq === 'F2' || freq === 'F4') ? freq : 'F1';
            const day = (r['Hari_Kunjungan'] || r['day'] || 'Senin') as VisitDay;
            const week = (r['Siklus_Minggu'] || r['week'] || 'Semua') as VisitWeekCycle;

            const rawChannel = String(r['Saluran_Distribusi'] || r['tradeChannel'] || r['Saluran'] || '').trim();
            const channel: any = rawChannel.includes('Modern') || rawChannel.includes('MT') ? 'Modern Trade (MT)' : 'General Trade (GT)';

            return {
              id: `OUT-IMP-${Date.now()}-${i}`,
              code: String(r['Kode_Outlet'] || r['code'] || `TKO-${Math.floor(100 + Math.random() * 900)}`),
              name: String(r['Nama_Toko'] || r['name'] || `Toko Impor #${i + 1}`),
              ownerName: String(r['Nama_Pemilik'] || r['owner'] || 'Pemilik Toko'),
              phone: String(r['No_Telepon'] || r['phone'] || '0812-0000-0000'),
              tradeChannel: channel,
              category: (r['Kategori'] || (channel === 'Modern Trade (MT)' ? 'Minimarket' : 'Toko Kelontong')) as any,
              address: String(r['Alamat_Lengkap'] || r['address'] || 'Alamat Toko'),
              district: String(r['Kecamatan'] || r['district'] || 'Kecamatan'),
              city: String(r['Kota_Kabupaten'] || r['city'] || 'Kota'),
              province: String(r['Provinsi'] || r['province'] || 'DKI Jakarta'),
              postalCode: String(r['Kode_Pos'] || '10000'),
              location: {
                lat,
                lng,
                accuracy: 5,
                address: `${r['Nama_Toko'] || 'Outlet'} (${lat}, ${lng})`
              },
              creditLimit: Number(r['Plafon_Kredit'] || 5000000),
              outstandingBalance: 0,
              termOfPayment: (r['Term_Of_Payment'] || 'COD') as any,
              status: 'active',
              lastVisitDate: undefined,
              visitFrequency: validFreq,
              visitDay: day,
              visitWeekCycle: week,
              assignedSalesmanId: String(r['ID_Salesman'] || 'SLS-JKT-088'),
              assignedSalesmanName: String(r['Nama_Salesman'] || 'Budi Santoso')
            };
          });

          resolve(parsedOutlets);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  static generateGoogleSheetsCSV(outlets: Outlet[], orders: Order[], salesman: SalesmanProfile): string {
    const headers = ['Kode_Outlet', 'Nama_Toko', 'Kategori', 'Pemilik', 'Frekuensi', 'Hari', 'Salesman', 'Alamat', 'Kecamatan', 'Kota', 'Provinsi', 'Latitude', 'Longitude', 'Total_Pesanan_IDR'];
    const rows = outlets.map(o => {
      const totalOrder = orders.filter(ord => ord.outletId === o.id).reduce((s, ord) => s + ord.grandTotal, 0);
      return [
        `"${o.code}"`,
        `"${o.name}"`,
        `"${o.category}"`,
        `"${o.ownerName}"`,
        `"${o.visitFrequency}"`,
        `"${o.visitDay}"`,
        `"${o.assignedSalesmanName || salesman.name}"`,
        `"${o.address.replace(/"/g, '""')}"`,
        `"${o.district}"`,
        `"${o.city}"`,
        `"${o.province}"`,
        o.location.lat,
        o.location.lng,
        totalOrder
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  static generateGoogleSheetsTSV(outlets: Outlet[], orders: Order[], salesman: SalesmanProfile): string {
    const headers = ['Kode_Outlet', 'Nama_Toko', 'Kategori', 'Pemilik', 'Frekuensi', 'Hari', 'Salesman', 'Alamat', 'Kecamatan', 'Kota', 'Provinsi', 'Latitude', 'Longitude', 'Total_Pesanan_IDR'];
    const rows = outlets.map(o => {
      const totalOrder = orders.filter(ord => ord.outletId === o.id).reduce((s, ord) => s + ord.grandTotal, 0);
      return [
        o.code,
        o.name,
        o.category,
        o.ownerName,
        o.visitFrequency,
        o.visitDay,
        o.assignedSalesmanName || salesman.name,
        o.address,
        o.district,
        o.city,
        o.province,
        o.location.lat,
        o.location.lng,
        totalOrder
      ].join('\t');
    });
    return [headers.join('\t'), ...rows].join('\n');
  }

  static downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
}
