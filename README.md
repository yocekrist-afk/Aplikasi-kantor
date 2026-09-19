# Panduan Menjalankan Source Code Aplikasi LPP

Jika Anda telah mengunduh file `.zip` (Source Code) dari aplikasi, ikuti panduan berikut untuk menjalankannya kembali di komputer Anda sendiri (di luar lingkungan AI Studio):

## Persiapan Awal
Pastikan Anda sudah menginstal perangkat lunak berikut di komputer atau laptop Anda:
1. **Node.js** (Sangat disarankan versi 20 atau terbaru). Anda bisa mengunduhnya di [nodejs.org](https://nodejs.org).
2. **Visual Studio Code (VS Code)** (Disarankan, sebagai editor kode). Anda bisa mengunduhnya di [code.visualstudio.com](https://code.visualstudio.com).

## Langkah 1: Ekstrak File
1. Ekstrak (Unzip) file `psychist_source_code.zip` yang baru saja Anda unduh.
2. Letakkan foldernya di tempat yang mudah ditemukan (misal: di Desktop atau Documents).

## Langkah 2: Buka Folder di VS Code
1. Buka aplikasi **Visual Studio Code**.
2. Klik menu **File** -> **Open Folder...**
3. Pilih folder yang sudah Anda ekstrak tadi.

## Langkah 3: Buka Terminal
1. Di dalam VS Code, klik menu **Terminal** -> **New Terminal** di bagian atas (atau tekan ``Ctrl + ` ``).
2. Terminal baru akan muncul di bagian bawah layar Anda.

## Langkah 4: Instal Kebutuhan Aplikasi (Dependencies)
Pada terminal yang terbuka, ketikkan perintah berikut lalu tekan **Enter**:
```bash
npm install
```
Tunggu hingga proses pengunduhan perpustakaan (*library*) selesai. Proses ini membutuhkan koneksi internet.

## Langkah 5: Jalankan Aplikasi
Setelah instalasi selesai, ketikkan perintah berikut lalu tekan **Enter**:
```bash
npm run dev
```

Anda akan melihat tulisan seperti ini di terminal:
```text
Server running on http://localhost:3000
```
atau
```text
➜  Local:   http://localhost:5173/
```

## Langkah 6: Buka di Browser
Buka aplikasi browser Anda (Google Chrome, Firefox, dll) dan ketikkan alamat URL yang muncul pada terminal tadi (misal: `http://localhost:3000` atau `http://localhost:5173`) di *Address bar* lalu tekan **Enter**.

Aplikasi Anda kini sudah berjalan secara mandiri (lokal) di komputer Anda sendiri!
