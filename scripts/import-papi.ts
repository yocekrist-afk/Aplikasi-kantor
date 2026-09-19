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

const statementsData = `Saya seorang pekerja keras.
Saya tidak suka uring-uringan/bukan seorang pemurung.
Saya suka menghasilkan pekerjaan yang lebih baik dari pada orang lain.
Saya akan tetap menangani suatu pekerjaan sampai selesai.
Saya suka menunjukkan pada orang lain cara melakukan sesuatu.
Saya ingin berusaha / bekerja sebaik mungkin.
Saya suka melucu / berkelakar.
Saya senang memberitahu orang lain hal-hal yang harus dikerjakan.
Saya suka bergabung dengan kelompok.
Saya senang diperhatikan oleh kelompok.
Saya suka menjalin hubungan pribadi yang akrab.
Saya suka berteman dengan kelompok.
Saya dapat cepat berubah jika merasa perlu.
Saya berusaha menjalin hubungan pribadi yang akrab.
Saya suka menyerang kembali jika benar-benar disakiti.
Saya suka melakukan hal-hal yang baru dan berbeda.
Saya ingin agar atasan menyukai saya.
Saya suka menegur orang lain jika mereka melakukan kesalahan.
Saya suka mengikuti petunjuk-petunjuk yang diberikan pada saya.
Saya suka menyenangkan orang-orang yang menjadi atasan saya.
Saya berusaha keras sekali/sekuat tenaga.
Saya seorang yang teratur/tertib Saya meletakkan segala sesuatu pada tempatnya.
Saya dapat membuat orang lain melakukan apa yang saya inginkan.
Saya tidak mudah marah 
Saya suka memberitahu kelompok, hal-hal yang harus mereka kerjakan.
Saya selalu bertahan/menekuni pada suatu pekerjaan sampai selesai.
Saya ingin menjadi orang yang penuh gairah dan menarik(semangat).
Saya ingin menjadi orang yang sangat berhasil(sukses).
Saya ingin menjadi bagian dalam kelompok.
Saya suka membantu orang lain mengambil keputusan.
Saya cemas bila seseorang tidak menyukai saya.
Saya ingin agar orang lain memperhatikan saya.
Saya suka mencoba hal-hal baru.
Saya lebih suka bekerja bersama orang lain daripada sendiri.
Kadang-kadang saya menyalahkan orang lain jika ada yang tidak beres.
Saya merasa terganggu jika seseorang tidak menyukai saya.
Saya suka menyenangkan orang yang menjadi atasan saya.
Saya senang mencoba pekerjaan yang baru dan berbeda.
Saya menyukai petunjuk-petunjuk terperinci untuk melaksanakan tugas.
Saya suka memberitahu orang lain apabila mereka menjengkelkan.
Saya selalu berusaha keras/sekuat tenaga.
Saya selalu melaksanakan setiap langkah dengan sangat hati-hati.
Saya seorang pemimpin yang baik.
Saya menata pekerjaan dengan baik.
Saya mudah marah.
Saya lambat dalam membuat keputusan.
Saya suka mengerjakan beberapa tugas pada saat yang bersamaan.
Bila berada dalam satu kelompok, saya suka berdiam diri.
Saya senang sekali bila diundang.
Saya ingin melakukan sesuatu lebih baik dari pada orang lain.
Saya suka menjalin hubungan pribadi yang akrab.
Saya suka memberi nasihat pada orang lain.
Saya suka melakukan hal-hal yang baru dan berbeda.
Saya suka menceritakan bagaimana saya berhasil dalam melakukan sesuatu.
Apabila pendapat saya benar, saya suka mempertahankannya.
Saya ingin menjadi bagian dari suatu kelompok.
Saya tidak mau berbeda dari orang lain.
Saya berusaha akrab dengan orang lain.
Saya senang diberitahu bagaimana melakukan suatu pekerjaan.
Saya mudah bosan.
Saya bekerja keras
Saya banyak berpikir dan membuat rencana.
Saya memimpin kelompok.
Detail (hal-hal kecil) menarik buat saya.
Saya membuat keputusan dengan mudah dan cepat.
Saya menyimpan barang-barang secara rapi dan teratur.
Saya membuat keputusan dengan mudah dan cepat.
Saya jarang marah atau sedih.
Saya ingin menjadi bagian dalam kelompok.
Saya ingin melakukan hanya satu pekerjaan pada satu waktu.
Saya berusaha berteman secara akrab
Saya berusaha sangat keras untuk menjadi yang terbaik.
Saya suka gaya terbaru dalam hal pakaian dan mobil.
Saya suka bertanggung jawab atas orang lain.
Saya senang berdebat.
Saya suka mendapat perhatian.
Saya suka menyenangkan orang yang menjadi atasan saya.
Saya tertarik untuk menjadi bagian dari kelompok.
Saya suka mengikuti peraturan dengan hati-hati.
Saya suka orang lain mengenal saya dengan baik.
Saya berusaha keras sekali/sekuat tenaga.
Saya sangat ramah/menyenangkan.
Orang lain berpendapat bahwa saya pemimpin yang baik.
Saya berpikir hati-hati dan terperinci.
Saya sering memanfaatkan kesempatan.
Saya suka cerewet mengenai hal-hal yang kecil.
Orang lain berpendapat bahwa saya bekerja cepat.
Orang lain berpendapat bahwa saya menyimpan segala sesuatu secara teratur dan rapi
Saya menyukai permainan dan olah raga.
Saya sangat menyenangkan.
Saya senang bila orang lain bersikap akrab dan ramah.
Saya selalu berusaha menyelesaikan sesuatu yang telah saya mulai.
Saya suka bereksperimen dan mencoba hal-hal baru.
Saya suka melaksanakan pekerjaan sulit dengan baik.
Saya suka diperlakukan secara adil.
Saya suka memberitahu orang lain cara mengerjakan sesuatu.
Saya suka melakukan hal-hal yang diharapkan dari saya.
Saya suka mendapat perhatian.
Saya suka petunjuk-petunjuk terperinci untuk melaksanakan suatu tugas.
Saya senang berada bersama orang lain.
Saya selalu berusaha melakukan pekerjaan secara sempurna.
Orang mengatakan bahwa sayqa hamper tidak pernah lelah.
Saya tipe seorang pemimpin.
Saya mudah berteman.
Saya memanfaatkan kesempatan.
Saya banyak sekali berpikir.
Saya bekerja dengan tempo yang cepat dan mantap.
Saya senang menangani pekerjaan detail.
Saya memiliki banyak tenaga untuk permainan dan olah raga.
Saya menyimpan segala sesuatu secara rapi dan teratur.
Saya bergaul dengan semua orang.
Saya berwatak tenang.
Saya ingin bertemu orang-orang baru dan melakukan hal-hal baru.
Saya selalu ingin menyelesaikan pekerjaan yang telah saya mulai.
Saya biasanya suka mempertahankan keyakinan saya.
Saya suka bertanggung jawab terhadap orang lain.
Saya menyukai saran-saran dari orang-orang yang saya kagumi.
Saya suka bertanggung jawab terhadap orang lain.
Saya membiarkan orang lain mempengaruhi diri saya secara kuat.
Saya suka mendapat banyak perhatian.
Saya biasanya bekerja keras sekali.
Saya biasanya bekerja cepat.
Apabila saya berbicara, kelompok menyimak/mendengarkan.
Saya terampil menggunakan peralatan.
Saya lambat dalam berteman.
Saya lambat dalam mengambil keputusan.
Saya biasanya makan dengan cepat.
Saya senang membaca.
Saya menyukai pekerjaan yang membuat saya banyak bergerak.
Saya mmenyukai pekerjaan yang harus saya kerjakan secara hati-hati.
Saya berteman dengan sebanyak mungkin orang
Saya dapat menemukan sesuatu yang telah saya sisihkan.
Saya merencana jauh dimuka.
Saya selalu menyenangkan.
Saya sangat bangga akan nama baik saya.
Saya tetap menangani suatu permasalahan sampai terpecahkan.
Saya suka menyenangkan orang-orang yang saya kagumi.
Saya ingin berhasil.
Saya suka orang-orang lain membuat keputusan-keputusan untuk kelompok.
Saya suka membuat keputusan-keputusan untuk kelompok.
Saya selalu berusaha sangat keras.
Saya membuat keputusan secara mudah dan cepat.
Kelompok biasanya melaksanakan keinginan saya.
Saya biasa tergesa-gesa.
Saya sering merasa lelah.
Saya lambat dalam membuat keputusan.
Saya bekerja cepat.
Saya mudah berteman.
Saya biasanya bersemangat atau bergairah.
Saya menggunakan banyak waktu untuk berpikir.
Saya sangat ramah terhadap orang lain.
Saya menyukai pekerjaan yang menuntut ketelitian.
Saya banyak berpikir dan merencana.
Saya menyimpan segala sesuatu pada tempatnya.
Saya menyukai pekerjaan yang menuntut hal-hal yang mendetail.
Saya tidak cepat marah.
Saya suka mengikuti orang-orang yang saya kagumi.
Saya selalu menyelesaikan pekerjaan yang telah saya mulai.
Saya menyukai petunjuk-petunjuk yang jelas.
Saya suka bekerja keras.
Saya mengejar hal-hal yang menjadi keinginan saya.
Saya seorang pemimpin yang baik.
Saya membuat orang lain bekerja keras.
Saya adalah seorang yang gampangan.
Saya membuat keputusan dengan cepat.
Saya berbicara cepat.
Saya biasanya bekerja secara tergesa-gesa.
Saya berolah raga secara teratur.
Saya tidak suka bertemu orang-orang lain.
Saya cepat lelah.
Saya berteman dengan banyak sekali orang.
Saya mengunakan banyak waktu untuk berpikir.
Saya suka bekerja dengan teori.
Saya suka melaksanakan pekerjaan detail.
Saya suka melaksanakan pekerjaan detail.
Saya suka mengatur pekerjaan saya.
Saya meletakkan segala sesuatu pada tempatnya.
Saya selalu menyenangkan.
Saya senang diberitahu hal-hal yang harus saya kerjakan.
Saya harus menyelesaikan apa yang telah saya mulai.`;

const statementsArray = statementsData.split('\n').map(s => s.trim()).filter(s => s.length > 0);

async function run() {
  const colRef = collection(db, 'soal_papi_kostick');
  console.log('Inserting', statementsArray.length / 2, 'records');
  for (let i = 0; i < statementsArray.length; i += 2) {
    const stmtA = statementsArray[i];
    const stmtB = statementsArray[i + 1];
    
    await addDoc(colRef, {
      soal: 'Pilih pernyataan yang paling menggambarkan diri Anda:',
      pilihan: [stmtA, stmtB],
      jawaban: '-',
      subtest: 'Papi Kostick',
      jenisSoal: 'PG',
      createdAt: new Date().toISOString()
    });
  }
  console.log('Done');
  process.exit(0);
}

run().catch(console.error);
