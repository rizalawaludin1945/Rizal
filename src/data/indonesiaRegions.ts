// Master data wilayah Indonesia: Provinsi, Kabupaten/Kota, dan Kecamatan pilihan komprehensif

export interface RegionData {
  province: string;
  regencies: {
    name: string;
    type: 'Kota' | 'Kabupaten';
    districts: string[];
  }[];
}

export const INDONESIA_REGIONS: RegionData[] = [
  {
    province: 'DKI Jakarta',
    regencies: [
      {
        name: 'Jakarta Pusat',
        type: 'Kota',
        districts: ['Gambir', 'Tanah Abang', 'Menteng', 'Senen', 'Cempaka Putih', 'Johar Baru', 'Kemayoran', 'Sawah Besar']
      },
      {
        name: 'Jakarta Timur',
        type: 'Kota',
        districts: ['Matraman', 'Pulo Gadung', 'Jatinegara', 'Duren Sawit', 'Kramat Jati', 'Makasar', 'Pasar Rebo', 'Ciracas', 'Cipayung', 'Cakung']
      },
      {
        name: 'Jakarta Selatan',
        type: 'Kota',
        districts: ['Kebayoran Baru', 'Kebayoran Lama', 'Pesanggrahan', 'Cilandak', 'Pasar Minggu', 'Jagakarsa', 'Mampang Prapatan', 'Pancoran', 'Tebet', 'Setiabudi']
      },
      {
        name: 'Jakarta Barat',
        type: 'Kota',
        districts: ['Cengkareng', 'Grogol Petamburan', 'Kalideres', 'Kebon Jeruk', 'Kembangan', 'Palmerah', 'Taman Sari', 'Tambora']
      },
      {
        name: 'Jakarta Utara',
        type: 'Kota',
        districts: ['Koja', 'Kelapa Gading', 'Tanjung Priok', 'Pademangan', 'Penjaringan', 'Cilincing']
      }
    ]
  },
  {
    province: 'Jawa Barat',
    regencies: [
      {
        name: 'Kota Bandung',
        type: 'Kota',
        districts: ['Coblong', 'Cicendo', 'Andir', 'Sukasari', 'Lengkong', 'Regol', 'Batununggal', 'Kiaracondong', 'Arcamanik', 'Cibeunying Kaler']
      },
      {
        name: 'Kabupaten Bandung',
        type: 'Kabupaten',
        districts: ['Soreang', 'Baleendah', 'Dayeuhkolot', 'Banjaran', 'Ciparay', 'Majalaya', 'Margahayu', 'Katapang']
      },
      {
        name: 'Kota Bekasi',
        type: 'Kota',
        districts: ['Bekasi Barat', 'Bekasi Timur', 'Bekasi Utara', 'Bekasi Selatan', 'Rawalumbu', 'Medansatria', 'Bantar Gebang', 'Pondok Gede']
      },
      {
        name: 'Kabupaten Bekasi',
        type: 'Kabupaten',
        districts: ['Cikarang Pusat', 'Cikarang Barat', 'Cikarang Utara', 'Cikarang Selatan', 'Tambun Selatan', 'Tambun Utara', 'Cibitung']
      },
      {
        name: 'Kota Bogor',
        type: 'Kota',
        districts: ['Bogor Tengah', 'Bogor Barat', 'Bogor Timur', 'Bogor Selatan', 'Bogor Utara', 'Tanah Sareal']
      },
      {
        name: 'Kabupaten Bogor',
        type: 'Kabupaten',
        districts: ['Cibinong', 'Citeureup', 'Babakan Madang', 'Gunung Putri', 'Cileungsi', 'Bojonggede', 'Ciawi', 'Megamendung']
      },
      {
        name: 'Kota Depok',
        type: 'Kota',
        districts: ['Pancoran Mas', 'Sukmajaya', 'Beji', 'Cimanggis', 'Sawangan', 'Limo', 'Cinere', 'Tapos']
      },
      {
        name: 'Kota Cirebon',
        type: 'Kota',
        districts: ['Kejaksan', 'Kesambi', 'Lemahwungkuk', 'Harjamukti', 'Pekalipan']
      },
      {
        name: 'Kabupaten Karawang',
        type: 'Kabupaten',
        districts: ['Karawang Barat', 'Karawang Timur', 'Telukjambe Timur', 'Telukjambe Barat', 'Klari', 'Rengasdengklok']
      }
    ]
  },
  {
    province: 'Banten',
    regencies: [
      {
        name: 'Kota Tangerang',
        type: 'Kota',
        districts: ['Tangerang', 'Cipondoh', 'Ciledug', 'Karawaci', 'Batuceper', 'Benda', 'Pinang', 'Larangan']
      },
      {
        name: 'Kota Tangerang Selatan',
        type: 'Kota',
        districts: ['Serpong', 'Serpong Utara', 'Pondok Aren', 'Ciputat', 'Ciputat Timur', 'Pamulang', 'Setu']
      },
      {
        name: 'Kabupaten Tangerang',
        type: 'Kabupaten',
        districts: ['Tigaraksa', 'Balaraja', 'Cikupa', 'Curug', 'Kelapa Dua', 'Pasar Kemis', 'Legok']
      },
      {
        name: 'Kota Serang',
        type: 'Kota',
        districts: ['Serang', 'Cipocok Jaya', 'Curug', 'Kasemen', 'Taktakan', 'Walantaka']
      },
      {
        name: 'Kota Cilegon',
        type: 'Kota',
        districts: ['Cilegon', 'Cibeber', 'Citangkil', 'Ciwandan', 'Gerogol', 'Jombang', 'Pulomerak', 'Purwakarta']
      }
    ]
  },
  {
    province: 'Jawa Tengah',
    regencies: [
      {
        name: 'Kota Semarang',
        type: 'Kota',
        districts: ['Semarang Tengah', 'Semarang Barat', 'Semarang Timur', 'Semarang Selatan', 'Semarang Utara', 'Banyumanik', 'Candisari', 'Gajahmungkur', 'Pedurungan', 'Tembalang']
      },
      {
        name: 'Kota Surakarta (Solo)',
        type: 'Kota',
        districts: ['Banjarsari', 'Jebres', 'Laweyan', 'Pasar Kliwon', 'Serengan']
      },
      {
        name: 'Kabupaten Banyumas (Purwokerto)',
        type: 'Kabupaten',
        districts: ['Purwokerto Timur', 'Purwokerto Barat', 'Purwokerto Utara', 'Purwokerto Selatan', 'Sokaraja', 'Banyumas', 'Wangon']
      },
      {
        name: 'Kabupaten Kudus',
        type: 'Kabupaten',
        districts: ['Kota Kudus', 'Jati', 'Bae', 'Gebog', 'Kaliwungu', 'Mejobo', 'Jekulo']
      },
      {
        name: 'Kota Magelang',
        type: 'Kota',
        districts: ['Magelang Tengah', 'Magelang Selatan', 'Magelang Utara']
      }
    ]
  },
  {
    province: 'DI Yogyakarta',
    regencies: [
      {
        name: 'Kota Yogyakarta',
        type: 'Kota',
        districts: ['Danurejan', 'Gedongtengen', 'Gondokusuman', 'Gondomanan', 'Jetis', 'Kotagede', 'Kraton', 'Mantrijeron', 'Mergangsan', 'Ngampilan', 'Pakualaman', 'Tegalrejo', 'Umbulharjo', 'Wirobrajan']
      },
      {
        name: 'Kabupaten Sleman',
        type: 'Kabupaten',
        districts: ['Depok', 'Mlati', 'Gamping', 'Ngaglik', 'Kalasan', 'Sleman', 'Berbah']
      },
      {
        name: 'Kabupaten Bantul',
        type: 'Kabupaten',
        districts: ['Bantul', 'Sewon', 'Kasihan', 'Banguntapan', 'Piyungan', 'Imogiri']
      }
    ]
  },
  {
    province: 'Jawa Timur',
    regencies: [
      {
        name: 'Kota Surabaya',
        type: 'Kota',
        districts: ['Tegalsari', 'Genteng', 'Bubutan', 'Simokerto', 'Gubeng', 'Wonokromo', 'Rungkut', 'Sukolilo', 'Kenjeran', 'Sawahan']
      },
      {
        name: 'Kabupaten Sidoarjo',
        type: 'Kabupaten',
        districts: ['Sidoarjo', 'Waru', 'Candi', 'Gedangan', 'Taman', 'Buduran', 'Krian', 'Sukodono']
      },
      {
        name: 'Kota Malang',
        type: 'Kota',
        districts: ['Klojen', 'Blimbing', 'Lowokwaru', 'Sukun', 'Kedungkandang']
      },
      {
        name: 'Kabupaten Gresik',
        type: 'Kabupaten',
        districts: ['Gresik', 'Kebomas', 'Manyar', 'Driyorejo', 'Menganti', 'Cerme']
      },
      {
        name: 'Kota Kediri',
        type: 'Kota',
        districts: ['Kota', 'Mojoroto', 'Pesantren']
      }
    ]
  },
  {
    province: 'Sumatera Utara',
    regencies: [
      {
        name: 'Kota Medan',
        type: 'Kota',
        districts: ['Medan Kota', 'Medan Barat', 'Medan Timur', 'Medan Baru', 'Medan Helvetia', 'Medan Denai', 'Medan Sunggal', 'Medan Petisah']
      },
      {
        name: 'Kabupaten Deli Serdang',
        type: 'Kabupaten',
        districts: ['Lubuk Pakam', 'Percut Sei Tuan', 'Sunggal', 'Tanjung Morawa', 'Hamparan Perak']
      },
      {
        name: 'Kota Pematangsiantar',
        type: 'Kota',
        districts: ['Siantar Barat', 'Siantar Timur', 'Siantar Selatan', 'Siantar Utara', 'Siantar Sitalasari']
      }
    ]
  },
  {
    province: 'Sumatera Barat',
    regencies: [
      {
        name: 'Kota Padang',
        type: 'Kota',
        districts: ['Padang Barat', 'Padang Timur', 'Padang Selatan', 'Padang Utara', 'Koto Tangah', 'Kuranji', 'Lubuk Begalung']
      },
      {
        name: 'Kota Bukittinggi',
        type: 'Kota',
        districts: ['Guguk Panjang', 'Mandiangin Koto Selayan', 'Aur Birugo Tigo Baleh']
      }
    ]
  },
  {
    province: 'Riau',
    regencies: [
      {
        name: 'Kota Pekanbaru',
        type: 'Kota',
        districts: ['Pekanbaru Kota', 'Sukajadi', 'Senapelan', 'Lima Puluh', 'Sail', 'Bukit Raya', 'Marpoyan Damai', 'Tampan', 'Payung Sekaki']
      },
      {
        name: 'Kota Dumai',
        type: 'Kota',
        districts: ['Dumai Kota', 'Dumai Barat', 'Dumai Timur', 'Dumai Selatan', 'Bukit Kapur', 'Medang Kampai', 'Sungai Sembilan']
      }
    ]
  },
  {
    province: 'Kepulauan Riau',
    regencies: [
      {
        name: 'Kota Batam',
        type: 'Kota',
        districts: ['Batam Kota', 'Lubuk Baja', 'Batu Ampar', 'Bengkong', 'Sekupang', 'Nongsa', 'Sagulung', 'Batu Aji']
      },
      {
        name: 'Kota Tanjungpinang',
        type: 'Kota',
        districts: ['Tanjungpinang Kota', 'Tanjungpinang Barat', 'Tanjungpinang Timur', 'Bukit Bestari']
      }
    ]
  },
  {
    province: 'Sumatera Selatan',
    regencies: [
      {
        name: 'Kota Palembang',
        type: 'Kota',
        districts: ['Ilir Barat I', 'Ilir Barat II', 'Ilir Timur I', 'Ilir Timur II', 'Seberang Ulu I', 'Seberang Ulu II', 'Sukarami', 'Alang-Alang Lebar', 'Kalidoni']
      }
    ]
  },
  {
    province: 'Lampung',
    regencies: [
      {
        name: 'Kota Bandar Lampung',
        type: 'Kota',
        districts: ['Tanjung Karang Pusat', 'Tanjung Karang Barat', 'Tanjung Karang Timur', 'Teluk Betung Selatan', 'Teluk Betung Utara', 'Kedaton', 'Way Halim', 'Sukarame']
      }
    ]
  },
  {
    province: 'Bali',
    regencies: [
      {
        name: 'Kota Denpasar',
        type: 'Kota',
        districts: ['Denpasar Barat', 'Denpasar Timur', 'Denpasar Selatan', 'Denpasar Utara']
      },
      {
        name: 'Kabupaten Badung',
        type: 'Kabupaten',
        districts: ['Kuta', 'Kuta Utara', 'Kuta Selatan', 'Mengwi', 'Abiansemal', 'Petang']
      },
      {
        name: 'Kabupaten Gianyar',
        type: 'Kabupaten',
        districts: ['Gianyar', 'Ubud', 'Sukawati', 'Blahbatuh', 'Tegallalang']
      }
    ]
  },
  {
    province: 'Kalimantan Timur',
    regencies: [
      {
        name: 'Kota Samarinda',
        type: 'Kota',
        districts: ['Samarinda Kota', 'Samarinda Ulu', 'Samarinda Ilir', 'Samarinda Seberang', 'Sungai Kunjang', 'Palaran']
      },
      {
        name: 'Kota Balikpapan',
        type: 'Kota',
        districts: ['Balikpapan Kota', 'Balikpapan Selatan', 'Balikpapan Tengah', 'Balikpapan Utara', 'Balikpapan Barat', 'Balikpapan Timur']
      }
    ]
  },
  {
    province: 'Sulawesi Selatan',
    regencies: [
      {
        name: 'Kota Makassar',
        type: 'Kota',
        districts: ['Ujung Pandang', 'Mariso', 'Mamajang', 'Makassar', 'Ujung Tanah', 'Wajo', 'Bontoala', 'Tallo', 'Panakkukang', 'Tamalate', 'Rappocini']
      },
      {
        name: 'Kabupaten Gowa',
        type: 'Kabupaten',
        districts: ['Somba Opu', 'Pallangga', 'Bontomarannu', 'Bajeng', 'Barombong']
      }
    ]
  },
  {
    province: 'Sulawesi Utara',
    regencies: [
      {
        name: 'Kota Manado',
        type: 'Kota',
        districts: ['Wenang', 'Sario', 'Malalayang', 'Wanea', 'Tikala', 'Singkil', 'Mapanget', 'Tuminting']
      }
    ]
  },
  {
    province: 'Papua',
    regencies: [
      {
        name: 'Kota Jayapura',
        type: 'Kota',
        districts: ['Jayapura Utara', 'Jayapura Selatan', 'Abepura', 'Heram', 'Muara Tami']
      }
    ]
  }
];

export function getProvinceNames(): string[] {
  return INDONESIA_REGIONS.map(r => r.province);
}

export function getRegenciesByProvince(provinceName: string): { name: string; type: string }[] {
  const prov = INDONESIA_REGIONS.find(r => r.province.toLowerCase() === provinceName.toLowerCase());
  if (!prov) return [];
  return prov.regencies.map(rg => ({ name: rg.name, type: rg.type }));
}

export function getDistrictsByRegency(provinceName: string, regencyName: string): string[] {
  const prov = INDONESIA_REGIONS.find(r => r.province.toLowerCase() === provinceName.toLowerCase());
  if (!prov) return [];
  const reg = prov.regencies.find(rg => rg.name.toLowerCase() === regencyName.toLowerCase());
  if (!reg) return [];
  return reg.districts;
}
