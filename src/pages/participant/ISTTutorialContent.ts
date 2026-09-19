export interface ISTExample {
  q: string;
  opts: string[];
  a: string;
  exp: string;
  img?: string;
}

export interface ISTSubtestTutorial {
  title: string;
  intro: string;
  examples: ISTExample[];
}

export const getISTTutorialContent = (subtestName: string): ISTSubtestTutorial | null => {
  const name = (subtestName || '').toLowerCase().replace(/subtest/g, 'subtes');
  
  if (name.includes('trial') || name.includes('pemanasan') || name.includes('simulasi')) {
    return {
      title: "INSTRUKSI SIMULASI",
      intro: "Ini adalah simulasi pengerjaan tes. Hasil dari soal ini tidak akan dinilai. Silakan coba menjawab untuk membiasakan diri dengan sistem dan memastikan perangkat Anda berfungsi dengan baik.",
      examples: [
        {
          q: "01. Burung memiliki...",
          opts: ["a. Sayap", "b. Rumah", "c. Ban", "d. Buku", "e. Air"],
          a: "a",
          exp: "Tentu saja burung memiliki sayap. Jawaban yang benar adalah a. Sayap."
        }
      ]
    };
  }

  if (name.toLowerCase().includes('papi kostick') || name.toLowerCase().includes('papi')) {
    return {
      title: "INSTRUKSI PAPI KOSTICK",
      intro: "Dihadapan saudara ada buku persoalan yang didalamnya terdapat 90 nomor soal, dimana pada masing-masing nomor terdapat 2 pasang pernyataan. Tugas anda adalah memilih salah satu dari setiap pasangan pernyataan tersebut yang anda anggap paling dekat menggambarkan kepribadian atau diri anda. Apabila kedua pernyataan tersebut memiliki kesesuaian dengan diri anda saat ini ataupun keduanya tidak satupun menggambarkan diri anda, maka cobalah pertimbangkan kembali secara teliti hingga anda dapat menemukan pernyataan yang paling tepat serta yang paling dapat mencerminkan diri anda.\n\nSilahkan tuliskan pilihan-pilihan anda pada lembar jawaban yang telah disediakan, dengan cara melingkari tanda panah pada setiap pernyataan yang saudara pilih pada lembar jawaban yang tersedia.",
      examples: [
        {
          q: "Contoh:",
          opts: ["a. Saya adalah pekerja keras", "b. Saya tidak mudah murung"],
          a: "a",
          exp: "Dalam hal ini, Anda melingkari tanda anak panah \"a\" (Horizontal), karena pernyataan \"a\" merupakan gambaran diri Anda. Tetapi jika pernyataan \"b\" (diagonal) lebih sesuai dengan diri anda, maka lingkarilah tanda anak panah pada pernyataan \"b\".\n\nPeriksalah kembali pekerjaan anda hingga anda merasa yakin bahwa tidak ada satu nomor pernyataan pun yang terlewat."
        }
      ]
    };
  }

  if (name.includes('gaya belajar')) {
    return {
      title: "INSTRUKSI TES GAYA BELAJAR",
      intro: "Pada tes ini, tidak ada jawaban benar atau salah. Tes ini bertujuan untuk mengetahui kecenderungan gaya belajar Anda. Pilihlah salah satu jawaban yang paling sesuai dengan kebiasaan atau preferensi Anda sehari-hari.",
      examples: [
        {
          q: "01. Saat mempelajari hal baru, saya lebih suka...",
          opts: ["a. Membaca petunjuk atau melihat diagram", "b. Mendengarkan penjelasan orang lain", "c. Langsung mempraktikkan dan mencoba sendiri"],
          a: "a",
          exp: "Pilihlah salah satu yang paling mendekati kebiasaan Anda. (Pilih 'a' untuk contoh ini)."
        }
      ]
    };
  }

  if (name.includes('subtes 1') || name.includes('ist_1') || name.includes('ist 1') || name.includes('se)') || name.includes('(se)')) {
    return {
      title: "INSTRUKSI SUBTES 1 (SE: Melengkapi Kalimat)",
      intro: "Soal nomor 1 hingga 20 terdiri dari kalimat-kalimat. Pada setiap kalimat, ada satu kata hilang dan disediakan 5 (lima) kata pilihan sebagai penggantinya. Pilihlah kata yang tepat untuk melengkapi kalimat tersebut!",
      examples: [
        {
          q: "01. Seekor kuda mempunyai kesamaan terbanyak dengan seekor ......",
          opts: ["a. kucing", "b. bajing", "c. keledai", "d. lembu", "e. anjing"],
          a: "c",
          exp: "Kunci Jawaban: c (keledai)\n\nSeekor keledai mempunyai kesamaan terbanyak dengan seekor kuda (keduanya hewan berkuku ganjil sejenis). Oleh karena itu, jawaban yang benar adalah: c. keledai."
        },
        {
          q: "02. Lawannya \"harapan\" ialah ......",
          opts: ["a. duka", "b. putus asa", "c. sengsara", "d. cinta", "e. benci"],
          a: "b",
          exp: "Kunci Jawaban: b (putus asa)\n\nLawan kata (antonim) yang tepat dari kata \"harapan\" adalah putus asa. Oleh karena itu, jawaban yang benar adalah: b. putus asa."
        }
      ]
    };
  }

  if (name.includes('subtes 2') || name.includes('ist_2') || name.includes('ist 2') || name.includes('wa)') || name.includes('(wa)')) {
    return {
      title: "INSTRUKSI SUBTES 2 (WA: Persamaan Kata)",
      intro: "Ditentukan 5 kata. Pada 4 dari 5 kata itu terdapat suatu kesamaan. Carilah 1 kata yang tidak memiliki kesamaan dengan keempat kata itu.",
      examples: [
        {
          q: "01.",
          opts: ["a. meja", "b. kursi", "c. burung", "d. lemari", "e. tempat tidur"],
          a: "c",
          exp: "a, b, d, dan e termasuk perabot rumah (mebel). c. burung, bukan perabot rumah atau tidak memiliki kesamaan dengan keempat kata lain. Jadi jawaban yang benar adalah: c. Burung."
        },
        {
          q: "02.",
          opts: ["a. duduk", "b. berbaring", "c. berdiri", "d. berjalan", "e. berjongkok"],
          a: "d",
          exp: "Pada a, b, c, dan e orang berada dalam keadaan tidak bergerak, sedangkan d. berjalan, orang dalam keadaan bergerak. Jawaban yang benar adalah: d. berjalan."
        }
      ]
    };
  }

  if (name.includes('subtes 3') || name.includes('ist_3') || name.includes('ist 3') || name.includes('an)') || name.includes('(an)')) {
    return {
      title: "INSTRUKSI SUBTES 3 (AN: Analogi Verbal)",
      intro: "Ditentukan 3 (tiga) kata. Antara kata pertama dan kata kedua terdapat suatu hubungan tertentu. Antara kata ketiga dan salah satu diantara lima kata pilihan harus pula terdapat hubungan yang sama. Carilah kata itu.",
      examples: [
        {
          q: "01. Hutan : pohon = tembok : ......",
          opts: ["a. batu bata", "b. rumah", "c. semen", "d. putih", "e. dinding"],
          a: "a",
          exp: "Hubungan antara hutan dan pohon ialah bahwa hutan terdiri atas pohon-pohon, maka hubungan antara tembok dan salah satu kata pilihan ialah bahwa tembok terdiri atas batu bata. Jadi, jawabannya adalah: a. Batu bata."
        },
        {
          q: "02. Gelap : terang = basah : ......",
          opts: ["a. hujan", "b. hari", "c. lembab", "d. angin", "e. kering"],
          a: "e",
          exp: "Gelap ialah lawannya terang, maka untuk basah lawannya kering. Maka jawaban yang benar adalah: e. kering."
        }
      ]
    };
  }

  if (name.includes('subtes 4') || name.includes('ist_4') || name.includes('ist 4') || name.includes('ge)') || name.includes('(ge)')) {
    return {
      title: "INSTRUKSI SUBTES 4 (GE: Sifat yang Sama)",
      intro: "Ditentukan dua kata. Carilah satu kata yang dapat meliputi pengertian dari kedua kata tadi. Ketikkan kata itu pada kolom jawaban yang tersedia.",
      examples: [
        {
          q: "01. Ayam - itik",
          opts: [],
          a: "unggas",
          exp: "Perkataan \"unggas\" dapat meliputi pengertian kedua kata itu. Maka jawaban untuk contoh 01 ialah \"unggas\"."
        },
        {
          q: "02. Gaun - celana",
          opts: [],
          a: "pakaian",
          exp: "Pada contoh ini jawabannya ialah \"pakaian\", maka \"pakaian\" yang seharusnya ditulis. Carilah selalu 1 kata yang tepat yang dapat meliputi pengertian kedua kata itu."
        }
      ]
    };
  }

  if (name.includes('subtes 5') || name.includes('ist_5') || name.includes('ist 5') || name.includes('ra)') || name.includes('(ra)')) {
    return {
      title: "INSTRUKSI SUBTES 5 (RA: Berhitung)",
      intro: "Pada bagian ini diberikan pertanyaan yang harus dijawab dengan melakukan perhitungan. Pilihlah angka yang menyusun jawaban Anda menggunakan tombol angka yang tersedia. Setiap angka hanya dapat dipilih satu kali.",
      examples: [
        {
          q: "01. Sebatang pensil harganya 25 rupiah. Berapakah harga 3 batang?",
          opts: [],
          a: "75",
          exp: "Kunci Jawaban: 75\n\nCara perhitungan: 25 rupiah x 3 batang = 75 rupiah.\nMaka pilihlah angka 7 dan 5 pada papan tombol angka."
        },
        {
          q: "02. Dengan sepeda Husin dapat mencapai 15 km dalam waktu 1 jam. Berapa km-kah yang dapat ia capai dalam waktu 4 jam?",
          opts: [],
          a: "60",
          exp: "Kunci Jawaban: 60\n\nCara perhitungan: 15 km/jam x 4 jam = 60 km.\nMaka pilihlah angka 6 dan 0 pada papan tombol angka."
        }
      ]
    };
  }

  if (name.includes('subtes 6') || name.includes('ist_6') || name.includes('ist 6') || name.includes('zr)') || name.includes('(zr)')) {
    return {
      title: "INSTRUKSI SUBTES 6 (ZR: Deret Angka)",
      intro: "Pada persoalan berikut akan diberikan rangkaian atau deretan angka. Setiap deret tersusun menurut suatu aturan yang tertentu dan dapat dilanjutkan menurut aturan itu. Untuk setiap deret, carilah angka berikutnya dan pilih angka penyusunnya pada tombol angka. Setiap angka hanya dapat dipilih satu kali.",
      examples: [
        {
          q: "01.  2   4   6   8   10   12   14   ......",
          opts: [],
          a: "16",
          exp: "Kunci Jawaban: 16\n\nAturan/Pola: Angka berikutnya selalu didapat dengan menambah 2 pada angka sebelumnya (+2).\n2 (+2) -> 4 (+2) -> 6 (+2) -> 8 (+2) -> 10 (+2) -> 12 (+2) -> 14 (+2) -> 16.\nMaka pilihlah angka 1 dan 6 pada tombol angka."
        },
        {
          q: "02.  9   7   10   8   11   9   12   ......",
          opts: [],
          a: "10",
          exp: "Kunci Jawaban: 10\n\nAturan/Pola: Bergantian dikurangi 2 (-2), lalu ditambah 3 (+3).\n9 (-2) = 7 (+3) = 10 (-2) = 8 (+3) = 11 (-2) = 9 (+3) = 12 (-2) = 10.\nMaka pilihlah angka 1 dan 0 pada tombol angka."
        }
      ]
    };
  }

  if (name.includes('subtes 7') || name.includes('ist_7') || name.includes('ist 7') || name.includes('fa)') || name.includes('(fa)') || name.includes('potongan')) {
    return {
      title: "INSTRUKSI SUBTES 7 (FA: Memilih Gambar)",
      intro: "Pada persoalan berikut ini, setiap soal memperlihatkan sesuatu bentuk tertentu yang terpotong menjadi beberapa bagian. Susunlah potongan-potongan itu sedemikian rupa menjadi suatu bentuk, sehingga tidak ada kelebihan sudut atau ruang diantaranya. Carilah bentuk itu pada salah satu dari 5 bentuk pada pilihan di atasnya lalu pilihlah huruf yang menunjukkan bentuk tadi di lembar jawaban.\n\nPerhatikan contoh-contoh berikut ini:",
      examples: [
        {
          q: "01. Jika potongan-potongan pada contoh 01 di atas disusun, maka akan menghasilkan bentuk ....",
          opts: ["a", "b", "c", "d", "e"],
          a: "a",
          exp: "Potongan-potongan pada contoh 01 setelah disusun/digabungkan menghasilkan bentuk a (lingkaran penuh). Oleh karena itu, pilihlah huruf a.",
          img: "/assets/ist/subtes7_tut_ex_01.webp"
        },
        {
          q: "02. Jika potongan-potongan pada contoh 02 di atas disusun, maka akan menghasilkan bentuk ....",
          opts: ["a", "b", "c", "d", "e"],
          a: "e",
          exp: "Potongan-potongan pada contoh 02 setelah disusun/digabungkan menghasilkan bentuk e (juring bundar melengkung). Oleh karena itu, pilihlah huruf e.",
          img: "/assets/ist/subtes7_tut_ex_02.webp"
        },
        {
          q: "03. Jika potongan-potongan pada contoh 03 di atas disusun, maka akan menghasilkan bentuk ....",
          opts: ["a", "b", "c", "d", "e"],
          a: "b",
          exp: "Potongan-potongan pada contoh 03 setelah disusun/digabungkan menghasilkan bentuk b (setengah lingkaran). Bentuk yang tepat ialah: b.",
          img: "/assets/ist/subtes7_tut_ex_03.webp"
        },
        {
          q: "04. Jika potongan-potongan pada contoh 04 di atas disusun, maka akan menghasilkan bentuk ....",
          opts: ["a", "b", "c", "d", "e"],
          a: "d",
          exp: "Potongan-potongan pada contoh 04 setelah disusun/digabungkan menghasilkan bentuk d (segitiga siku-siku). Bentuk yang tepat ialah: d.",
          img: "/assets/ist/subtes7_tut_ex_04.webp"
        }
      ]
    };
  }

  if (name.includes('subtes 8') || name.includes('ist_8') || name.includes('ist 8') || name.includes('wu') || name.includes('kubus')) {
    return {
      title: "B. INSTRUKSI SUBTES 8 (WU: Kubus)",
      intro: "Ditentukan 5 (lima) buah kubus a, b, c, d, e. Pada tiap-tiap kubus terdapat 6 (enam) tanda yang berlainan pada setiap sisinya. Tiga dari tanda itu dapat dilihat.\n\nKubus-kubus yang ditentukan itu (a, b, c, d, e) ialah kubus-kubus yang berbeda, artinya kubus-kubus itu dapat mempunyai tanda-tanda yang sama, tetapi susunannya berlainan. Setiap soal memperlihatkan salah satu kubus yang ditentukan di dalam kedudukan yang berbeda.\n\nCarilah kubus yang dimaksudkan itu dan tentukanlah jawaban saudara pada pilihan (a, b, c, d, atau e) di bawah.\n\nKubus itu dapat diputar, dapat digulingkan atau dapat diputar dan digulingkan dalam pikiran saudara. Oleh karena itu mungkin akan terlihat suatu tanda yang baru.",
      examples: [
        {
          q: "Contoh 01 memperlihatkan salah satu kubus yang ditentukan di dalam kedudukan yang berbeda. Kubus manakah yang dimaksudkan?",
          opts: ["a", "b", "c", "d", "e"],
          a: "a",
          exp: "Kunci Jawaban: a (Kubus A)\n\nCara mendapatkannya adalah dengan menggulingkan lebih dahulu kubus itu ke kiri satu kali dan kemudian diputar ke kiri satu kali, sehingga sisi kubus yang bertanda dua segi empat hitam terletak di depan, persis seperti kubus a.\n\nOleh karena itu pilihan a (Kubus A) adalah jawaban yang tepat.",
          img: "/assets/ist/subtes8_tut_ex_01.webp"
        },
        {
          q: "Contoh 02 memperlihatkan salah satu kubus yang ditentukan di dalam kedudukan yang berbeda. Kubus manakah yang dimaksudkan?",
          opts: ["a", "b", "c", "d", "e"],
          a: "e",
          exp: "Kunci Jawaban: e (Kubus E)\n\nCara mendapatkannya adalah dengan digulingkan ke kiri satu kali dan diputar ke kiri satu kali, sehingga sisi kubus yang bertanda garis silang terletak di depan, persis seperti kubus e.\n\nOleh karena itu pilihan e (Kubus E) adalah jawaban yang tepat.",
          img: "/assets/ist/subtes8_tut_ex_02.webp"
        },
        {
          q: "Contoh 03 memperlihatkan salah satu kubus yang ditentukan di dalam kedudukan yang berbeda. Kubus manakah yang dimaksudkan?",
          opts: ["a", "b", "c", "d", "e"],
          a: "b",
          exp: "Kunci Jawaban: b (Kubus B)\n\nCara mendapatkannya adalah dengan menggulingkannya ke kiri satu kali, sehingga dasar kubus yang tadinya tidak terlihat memunculkan tanda baru (dua segi empat hitam) dan tanda silang pada sisi atas kubus itu menjadi tidak terlihat lagi.\n\nOleh karena itu pilihan b (Kubus B) adalah jawaban yang tepat.",
          img: "/assets/ist/subtes8_tut_ex_03.webp"
        }
      ]
    };
  }

  if (name.includes('subtes 9') || name.includes('ist_9') || name.includes('ist 9') || name.includes('me)') || name.includes('(me)') || name.includes('mengingat')) {
    return {
      title: "INSTRUKSI SUBTES 9 (ME: Ingatan)",
      intro: "Pada bagian ini, terdapat sejumlah pertanyaan mengenai kata-kata yang telah saudara hafalkan tadi. Pilihlah salah satu kategori (Kesenian, Binatang, Perkakas, Burung, Bunga) yang sesuai dengan huruf permulaan dari kata tersebut.",
      examples: [
        {
          q: "01. Kata yang mempunyai huruf permulaan — Q — adalah suatu ...",
          opts: ["a. kesenian", "b. binatang", "c. perkakas", "d. burung", "e. bunga"],
          a: "a",
          exp: "Quintet adalah termasuk dalam jenis kesenian. Sehingga jawaban yang benar adalah a."
        },
        {
          q: "02. Kata yang mempunyai huruf permulaan — Z — adalah suatu ...",
          opts: ["a. kesenian", "b. binatang", "c. perkakas", "d. burung", "e. bunga"],
          a: "b",
          exp: "Jawabannya adalah b, karena Zebra termasuk dalam jenis binatang."
        }
      ]
    };
  }
  
  return null;
};
