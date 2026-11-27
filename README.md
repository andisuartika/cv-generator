# CV Generator

Aplikasi web untuk membuat CV/resume: pilih template, isi data, unduh PDF atau gambar.
Data tersimpan di browser (guest mode); akun opsional di tahap 2.

Rencana lengkap ada di [BLUEPRINT.md](./BLUEPRINT.md). Aturan untuk AI coding ada di [CLAUDE.md](./CLAUDE.md).

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # uji unit
npm run build
npm run test:pdf # uji PDF dengan server asli (setelah build)
```

Memakai Node 22 (`nvm use`).

## Penilaian AI (opsional)

Salin `.env.example` ke `.env.local`, lalu isi `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, dan `AI_PROVIDER_NAME`. Selama salah satunya kosong, tombol **Penilaian AI** tidak tampil. Nyalakan ulang server setelah mengubahnya.

- `AI_BASE_URL`: gateway bergaya OpenAI. Di server yang sama dengan 9router: `http://127.0.0.1:20128/v1`.
- `AI_MODEL`: satu model tetap, bukan *combo* yang bisa beralih ke penyedia lain.
- `AI_PROVIDER_NAME`: ditampilkan ke pengguna sebelum CV dikirim, jadi harus menyebut penyedia yang sebenarnya.
- Batas bawaan: 5 penilaian per pengunjung dan 100 per hari untuk seluruh server (`AI_DAILY_LIMIT_PER_CLIENT`, `AI_DAILY_LIMIT_TOTAL`). Hitungan tersimpan di memori dan kembali nol saat server dinyalakan ulang, jadi pasang juga batas belanja di penyedia. Pengunjung dibedakan lewat `X-Forwarded-For` dari reverse proxy.
- Satu penilaian bisa memanggil model dua kali jika jawaban pertama tidak sesuai format.
- Atur timeout reverse proxy minimal 200 detik.
- Jangan mencatat isi request di reverse proxy maupun gateway.

## Deploy (server sendiri, Docker)

Produksi: https://buatcv.ptandi.tech, lewat Cloudflare Tunnel ke `http://localhost:8102`.

```bash
git clone https://github.com/andisuartika/cv-generator.git && cd cv-generator
docker compose up -d --build   # port hanya terbuka di 127.0.0.1:8102
```

- **Perbarui:** `git pull && docker compose up -d --build`
- **Hentikan:** `docker compose down`
- **Log:** `docker compose logs -f app`
- Image sudah memuat Chromium dan font untuk PDF, jadi langkah pemasangan di bawah hanya perlu tanpa Docker.
- Port bisa diganti dengan `APP_PORT`. File `.env` hanya diperlukan untuk Penilaian AI.
- Penilaian AI dengan 9router di Docker pada mesin yang sama: isi `.env`, set `AI_BASE_URL=http://9router:20128/v1`, lalu jalankan `docker compose -f compose.yml -f compose.ai.yml up -d`. Jaringan itu juga membuat aplikasi bisa menjangkau container lain yang tersambung ke sana.
- Cloudflare memutus permintaan yang terlalu lama (sekitar 100 detik). Sesuaikan batas tunggu AI sebelum mengaktifkannya lewat Cloudflare.
- Di dashboard Cloudflare, jangan aktifkan penyisipan skrip analitik: halaman privasi menyatakan aplikasi tidak memakainya.

## PDF di server

Tombol **Unduh PDF** memakai Chromium di server (Playwright). Pasang sekali di mesin yang menjalankan aplikasi:

```bash
npx playwright install chromium               # macOS
npx playwright install --with-deps chromium   # Linux (memasang pustaka sistem, perlu sudo)
```

- `PDF_RENDER_ORIGIN`: alamat yang dipakai server untuk membuka halamannya sendiri. Bawaannya `http://localhost:$PORT`.
- Di belakang reverse proxy, proxy wajib mengisi `X-Forwarded-For` (alamat asli di urutan terakhir). Tanpa itu, semua pengunjung berbagi satu jatah (10 PDF per menit).
- Batas: 5 MB per permintaan, 2 PDF diproses bersamaan, 60 per menit untuk seluruh server. Batas tersimpan di memori, jadi hanya berlaku per proses.
- Isi CV hanya diproses di memori. Pastikan reverse proxy tidak mencatat isi request.
- Karakter di luar huruf Latin (termasuk emoji) memakai font sistem. Di Linux, pasang misalnya `fonts-noto` dan `fonts-noto-color-emoji`.
