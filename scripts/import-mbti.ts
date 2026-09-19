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

const questions = [
  ["Lebih memilih berkomunikasi dengan berbicara", "Lebih memilih berkomunikasi dengan menulis"],
  ["Bergerak dari detail ke gambaran umum sebagai kesimpulan akhir", "Bergerak dari gambaran umum baru ke detail"],
  ["Obyektif", "Subyektif"],
  ["Terencana dan memilki deadline jelas", "Spontan, Fleksibel, tidak diikat waktu"],
  ["Menemukan dan mengembangkan ide dengan mendiskusikannya", "Menemukan dan mengembangkan ide dengan merenungkannya"],
  ["Berbicara mengenai masalah yang dihadapi hari ini dan langkah-langkah praktis mengatasinya", "Berbicara mengenai visi masa depan dan konsep-konsep mengenai visi tersebut"],
  ["Diyakinkan dengan penjelasan yang menyentuh perasaan", "Diyakinkan dengan penjelasan yang masuk akal"],
  ["Tidak menyukai hal-hal yang bersifat mendadak dan di luar perencanaan", "Perubahan mendadak tidak jadi masalah"],
  ["Berorientasi pada dunia eksternal (kegiatan,orang)", "Berorientasi pada dunia internal (memori, pemikiran, ide)"],
  ["Menggunakan pengalaman sebagai pedoman", "Menggunakan imajinasi dan perenungan sebagai pedoman"],
  ["Berorientasi tugas dan job description", "Berorientasi pada manusia dan hubungan"],
  ["Aturan, jadwal dan target akan sangat membantu dan memperjelas tindakan", "Aturan, jadwal dan target sangat mengikat dan membebani"],
  ["Fokus pada banyak hobi secara luas dan umum", "Fokus pada sedikit hobi namun mendalam"],
  ["SOP sangat membantu", "SOP sangat membosankan"],
  ["Mengambil keputusan berdasar logika dan aturan main", "Mengambil keputusan berdasar perasaan pribadi dan kondisi orang lain"],
  ["Berorientasi pada hasil", "Berorientasi pada proses"],
  ["Sosial dan ekspresif", "Tertutup dan mandiri"],
  ["Prosedural dan tradisional", "Bebas dan dinamis"],
  ["Mengemukakan tujuan dan sasaran lebih dahulu", "Mengemukakan kesepakatan terlebih dahulu"],
  ["Mengatur orang lain dengan tata tertib agar tujuan tercapai", "Membiarkan orang lain bertindak bebas asalkan tujuan tercapai"],
  ["Bertemu orang dan aktivitas sosial membuat bersemangat", "Pertemuan dengan orang lain dan aktivitas sosial melelahkan"],
  ["Memilih fakta lebih penting daripada ide inspiratif", "Memilih ide inspiratif lebih penting dari pada fakta"],
  ["Menganalisa", "Berempati"],
  ["Fokus pada target dan mengabaikan hal-hal baru", "Memperhatikan hal-hal dan siap menyesuaikan diri serta mengubah target"],
  ["Beraktifitas sendirian di rumah membosankan", "Beraktifitas sendirian di rumah menyenangkan"],
  ["Kontinuitas dan stabilitas lebih diutamakan", "Perubahan dan variasi lebih diutamakan"],
  ["Menghargai seseorang karena skill dan faktor teknis", "Menghargai seseorang karena sifat dan perilakunya"],
  ["Berpegang teguh pada pendirian", "Pendirian masih bisa berubah tergantung situasi nantinya"],
  ["Berinisiatif tinggi hampir dalam berbagai hal meskipun tidak berhubungan dengan dirinya", "Berinisiatif bila situasi memaksa atau berhubungan dengan kepentingan sendiri"],
  ["Bertindak step by step dengan timeframe yang jelas", "Bertindak dengan semangat tanpa menggunakan timeframe"],
  ["Melibatkan perasaan itu tidak professional", "Terlalu kaku pada peraturan dan pekerjaan itu kejam"],
  ["Merasa tenang bila semua sudah diputuskan", "Merasa nyaman bila situasi tetap terbuka terhadap pilihan-pilihan lain"],
  ["Lebih memilih tempat yang ramai dan banyak interaksi/aktifitas", "Lebih memilih tempat yang tenang dan pribadi untuk berkonsentrasi"],
  ["Menarik kesimpulan dengan lama dan hati-hati", "Menarik kesimpulan dengan cepat sesuai naluri"],
  ["Yang penting tujuan tercapai", "Yang penting situasi harmonis terjaga"],
  ["Ketidakpastian membuat bingung dan meresahkan", "Ketidakpastian itu seru menegangkan dan membuat hati lebih senang"],
  ["Berani bertindak tanpa terlalu lama berfikir", "Berpikir secara matang sebelum bertindak"],
  ["Mengklarifikasi ide dan teori sebelum dipraktekkan", "Memahami ide dan teori saat mempraktekkannya langsung"],
  ["Mempertanyakan", "Mengakomodasi"],
  ["Situasi last minute sangat menyiksa, membuat stress dan merupakan kesalahan", "Situasi last minute membuat bersemangat dan memunculkan potensi"],
  ["Mengekspresikan semangat", "Menyimpan semangat dalam hati"],
  ["Berfokus pada masa kini (apa yang bisa diperbaiki sekarang)", "Berfokus pada masa depan (apa yang mungkin dicapai di masa depan)"],
  ["Sering dianggap keras kepala", "Sering dianggap terlalu memihak"],
  ["Perubahaan adalah musuh", "Perubahaan adalah semangat hidup"],
  ["Memilih berkomunikasi pada sekelompok orang", "Mencari kesempatan untuk berkomunikasi secara perorangan"],
  ["Secara konsisten mengamati dan mengingat detail", "Mengamati dan mengingat detail hanya bila berhubungan dengan pola"],
  ["Bersemangat saat mengkritik dan menemukan kesalahan", "Bersemangat saat menolong orang keluar dari kesalahan dan meluruskan"],
  ["Bertindak sesuai apa yang sudah direncanakan", "Bertindak sesuai situasi dan kondisi yang terjadi saat itu"],
  ["Lebih suka komunikasi langsung (tatap muka)", "Lebih suka komunikasi tidak langsung (telp, surat, e-mail)"],
  ["Praktis", "Konseptual"],
  ["Standar harus ditegakkan di atas segala nya (itu menunjukkan kehormatan dan harga diri)", "Perasaan manusia lebih penting dari sekedar standar (yang adalah benda mati)"],
  ["Hidup harus sudah diatur dari awal", "Hidup seharusnya mengalir sesuai kondisi"],
  ["Membangun ide pada saat berbicara", "Membangun ide dengan matang baru membicarakannya"],
  ["Menggunakan keterampilan yang sudah dikuasai", "Menyukai tantangan untuk menguasai keterampilan"],
  ["Menuntut perlakuan yang adil dan sama pada orang", "Menuntut perlakuan khusus sesuai karakteristik masing-masing orang"],
  ["Daftar dan checklist adalah panduan penting", "Daftar dan checklist adalah tugas dan beban"],
  ["Spontan, Easy Going, fleksibel", "Berhati-hati, penuh pertimbangan, kaku"],
  ["Memilih cara yang sudah ada dan sudah terbukti", "Memilih cara yang unik dan belum dipraktekkan"],
  ["Mementingkan sebab-akibat", "Mementingkan nilai-nilai personal"],
  ["Puas ketika mampu menjalankan semuanya sesuai rencana", "Puas ketika mampu beradaptasi dengan momentum yang terjadi"]
];

async function run() {
  const colRef = collection(db, 'soal_mbti');
  console.log('Inserting', questions.length, 'records');
  for (const [idx, q] of questions.entries()) {
    await addDoc(colRef, {
      soal: 'Apakah Anda .......?',
      pilihan: q,
      jawaban: '-',
      subtest: 'MBTI',
      jenisSoal: 'PG',
      createdAt: new Date().toISOString()
    });
  }
  console.log('Done');
  process.exit(0);
}

run().catch(console.error);
