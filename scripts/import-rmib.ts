import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const firebaseConfig = {
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  measurementId: config.measurementId,
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

const rmibData = {
    A: {
        L: ["Petani", "Insinyur Sipil", "Akuntan", "Ilmuwan", "Manajer penjualan", "Seniman", "Wartawan", "Pianis konser", "Guru Sekolah Dasar", "Manajer Bank", "Tukang kayu", "Dokter"],
        W: ["Pekerjaan pertanian", "Pengemudi kendaraan militer", "Akuntan", "Ilmuwan", "Penjual hasil-hasil mode", "Seniwati", "Wratawati", "Pianis konser", "Guru Sekolah Dasar", "Sekretaris pribadi", "Perancang busana", "Dokter"]
    },
    B: {
        L: ["Akhli pembuat alat-alat", "Akhi statistik", "Insinyur Kimia Industri", "Penyiar radio", "Aktor professional", "Pengarang", "Dirigen orkestra", "Psikolog pendidikan", "Staf Administrasi", "Akhli bangunan", "Akhli bedah", "Akhli kehutanan"],
        W: ["Petugas perakitan alat", "Pegawai urusan gaji", "Insinyur Kimia Industri", "Penyiar radio", "Artis professional", "Pengarang", "Pemain musik orkestra", "Psikolog pendidikan", "Juru tik", "Pembuat pot keramik", "Akhli bedah", "Guru Pendidikan Olahraga"]
    },
    C: {
        L: ["Auditor", "Akhli Meteorologi", "Salesman", "Arsitek", "Penulis drama", "Komponis", "Kepala Sekolah", "Pegawai Kotapraja (Pemda)", "Akhli meubel/furniture", "Dokter Hewan", "Juru ukur tanah", "Tukang bubut"],
        W: ["Auditor", "Akhli Meteorologi", "Salesgirl", "Guru kesenian", "Penulis drama", "Komponis", "Kepala Yayasan Sosial", "Recepsionis", "Penata rambut", "Doter Hewan", "Pramugari", "Operator mesin rajut"]
    },
    D: {
        L: ["Akhli biologi", "Agen biro periklanan", "Dekorator interior", "Akhli sejarah", "Kritikus musik", "Pekerja social", "Pegawai asuransi", "Tukang cat", "Apoteker", "Penjelajah", "Tukang listrik", "Penilai pajak pendapatan"],
        W: ["Akhli biologi", "Agen biro periklanan", "Dekorator interior", "Akhli sejarah", "Kritikus musik", "Pekerja social", "Penulis steno", "Penjilid buku", "Apoteker", "Akhli pertamanan", "Petugas pompa bensin", "Petugas mesin hitung/kasir"]
    },
    E: {
        L: ["Petugas wawancara", "Perancang perhiasan", "Akhli perustakaan", "Guru musik", "Pembina rohani", "Petugas arsip", "Tukang batu", "Dokter gigi", "Prospektor", "Montir", "Guru Ilmu Pasti", "Akhli pertanian"],
        W: ["Petugas wawancara", "Perancang perhiasan", "Akhli perustakaan", "Guru musik", "Penyebar agama", "Petugas arsip", "Tukang bungkus coklat", "Pelatih rehabilitasi pasien", "Pembina keolahragaan", "Akhli reparasi jam", "Guru Ilmu Pasti", "Akhli pertanian"]
    },
    F: {
        L: ["Pemotret", "Penulis majalah", "Pemain orgel (organ)", "Organisator Pramuka", "Petugas pengiriman barang", "Petugas mesin perkayuan", "Akhli kacamata", "Akhli sortir kulit", "Instalator", "Pembantu kasir bank", "Akhli botani", "Pedagang keliling"],
        W: ["Pemotret", "Penulis majalah", "Pemain orgel (organ)", "Petugas Palang Merah", "Pegawai Bank", "Pengurus kerumahtanggaan", "Perawat", "Peternak", "Akhli gosok lensa", "Kasir", "Akhli botani", "Pedagang keliling"]
    },
    G: {
        L: ["Kritikus buku", "Akhli perpustakaan musik", "Pejamat klub remaja", "Pegawai kantor", "Tukang plester tembok", "Akhli Rongent", "Nelayan", "Pembuat arloji", "Kasir", "Akhli Astronomi", "Juru lelang", "Penata panggung"],
        W: ["Kritikus buku", "Akhli perpustakaan musik", "Pejamat klub remaja", "Pegawai kantor", "Tukang Binatu", "Akhli Rongent", "Petani Bunga", "Operator mesin sulam", "Akhli tata buku", "Akhli Astronomi", "Peraga alat kosmetika", "Penata panggung"]
    },
    H: {
        L: ["Pemain musik band", "Akhli penyuluh jabatan", "Pegawai pos", "Tukang leiding", "Akhli fisioterapi", "Sopir angkutan", "Montir radio", "Juru bayar", "Akhli Geologi", "Petugas Hubungan Masyarakat", "Penata etalase", "Penulis sandiwara radio"],
        W: ["Pemain musik band", "Akhli penyuluh jabatan", "Pegawai Kantor Pos", "Penjahit", "Akhli fisioterapi", "Peternak ayam", "Akhli reparasi permata", "Juru bayar", "Akhli Geologi", "Petugas Hubungan Masyarakat", "Penata etalase", "Penulis sandiwara radio"]
    },
    I: {
        L: ["Petugas Kesejahteraan Sosial", "Petugas ekspedisi surat", "Tukang sepatu", "Paramedik/mantri kesehatan", "Petani tanaman hias", "Tukang las", "Petugas pajak", "Asisten labiratorium", "Saleman asuransi", "Perancang motif tekstil", "Penyair", "Pramuniaga toko musik"],
        W: ["Petugas Kesejahteraan Sosial", "Penyusun arsip", "Juru masak", "Perawat orang-orang tua", "Tukang kebun", "Operator mesin kaos kaki", "Pegawai pajak", "Asisten labiratorium", "Peraga barang-barang/bahan", "Perancang motif tekstil", "Penyair", "Pramuniaga toko musik"]
    }
};

async function run() {
  const colRef = collection(db, 'soal_rmib');
  let count = 0;
  for (const groupKey of Object.keys(rmibData)) {
    const groupL = rmibData[groupKey as keyof typeof rmibData].L;
    const groupW = rmibData[groupKey as keyof typeof rmibData].W;
    
    await addDoc(colRef, {
      soal: `Urutkan kelompok pekerjaan berikut (Kelompok ${groupKey}) dari yang paling disukai (1) hingga paling tidak disukai (12)`,
      pilihanLaki: groupL,
      pilihanWanita: groupW,
      jawaban: 'Ranking',
      subtest: `Kelompok ${groupKey}`,
      jenisSoal: 'Ranking',
      createdAt: new Date().toISOString()
    });
    count++;
  }
  console.log(`Inserting ${count} records (Groups A-I)`);
  console.log('Done');
  process.exit(0);
}

run().catch(console.error);
