# Blueprint: Web App Generator CV / Resume

Dibuat 27 Nov 2026

## 1. Ringkasan dan prinsip

Aplikasi web untuk membuat CV/resume pribadi: pengguna memilih template, mengisi data lewat form, melihat preview langsung berukuran A4, lalu mengunduh hasilnya sebagai PDF atau gambar. Dokumen ini adalah landasan yang diberikan ke AI coding (Claude Code, OpenCode, dan sejenisnya) sebelum membangun, jadi semua keputusan penting sudah tertulis di sini.

**Prinsip yang tidak boleh dilanggar:**

1. **Data terpisah dari template.** Seluruh isi CV adalah satu objek JSON (`Resume`). Template hanya membaca objek itu dan tidak menyimpan data sendiri.
2. **Satu sumber tampilan.** Preview di layar dan hasil export memakai komponen template yang sama, jadi hasilnya identik.
3. **Privasi dulu.** Default-nya guest mode: data hanya di browser pengguna. Akun adalah opsi tambahan, bukan syarat.
4. **Template adalah kode.** Menambah template berarti menambah satu komponen React dan satu entri registry. Tidak ada upload template dan tidak ada panel admin di MVP.
5. **Sederhana dulu.** Kerjakan MVP tanpa backend, lalu tambahkan akun di tahap 2.

## 2. Scope dan keputusan

MVP berjalan penuh di browser tanpa database dan tanpa login. Akun, template tambahan lewat konfigurasi, dan fitur AI masuk setelahnya.

| Area | MVP (tahap 1) | Tahap lanjutan |
| --- | --- | --- |
| Template | 3 template: Classic (satu kolom, ramah ATS), Modern (sidebar), Minimal | Varian lewat konfigurasi JSON, lebih banyak template |
| Form | Data diri, ringkasan, pengalaman, pendidikan, skill, proyek, sertifikat, bahasa | Bagian kustom |
| Tampilan | Preview A4 langsung, warna aksen, foto opsional, urutan dan visibilitas section | Pilihan font dan ukuran, jarak |
| Export | PDF dan PNG/JPG | Link publik ke CV |
| Data | Autosave di browser, export/import JSON | Akun opsional, simpan banyak CV, sinkron antar perangkat |
| Bahasa | Antarmuka dan label CV dalam Bahasa Indonesia | Pilihan Indonesia/Inggris untuk label CV |
| Lainnya | Tidak ada admin | Saran isi dengan AI, panel admin hanya jika ada tim pembuat template |

**Keputusan yang sudah diambil:**

- Guest mode adalah default. Login bersifat opsional dan baru dibuat di tahap 2.
- Penyimpanan memakai lapisan adapter (`LocalStorageAdapter` sekarang, `ApiAdapter` nanti) supaya form dan template tidak perlu diubah saat akun ditambahkan.
- Template ditulis sebagai komponen React di dalam kode, bukan file unggahan.
- Export PDF dirender di server dengan Chromium agar teks bisa diseleksi dan ramah ATS.

**Pertanyaan yang masih terbuka:**

- [ ] Target pengguna: umum, atau segmen tertentu seperti fresh graduate?
- [x] Hosting: server sendiri / VPS (diputuskan 27 Nov 2026). Chromium dipasang lewat Playwright.
- [ ] Apakah antarmuka perlu dua bahasa (ID/EN) sejak MVP?

## 3. Tech stack

| Bagian | Pilihan | Alasan |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Satu proyek untuk UI dan route export, mudah di-deploy |
| Styling | Tailwind CSS | Template cepat dibuat dan dikontrol per ukuran cetak |
| Form | react-hook-form + zod | Array dinamis (pengalaman, pendidikan) dan validasi satu skema |
| State | Zustand + middleware `persist` | Autosave ke browser tanpa kode tambahan |
| Drag urutan | dnd-kit | Susun ulang section dan item |
| Export gambar | html-to-image | Berjalan di client, tanpa server |
| Export PDF | Playwright atau Puppeteer di route handler | Teks asli, hasil identik dengan preview |
| Foto | Crop dan kompres di client (canvas) | Ukuran kecil, tidak perlu upload ke server |
| Uji | Vitest (unit), Playwright (e2e dan uji PDF) | Menjaga template tidak rusak saat ditambah |
| Tahap 2 | Auth.js (Google + magic link), Postgres + Prisma | Tanpa password, data minimal |

**Catatan hosting untuk PDF:** Chromium tidak berjalan di serverless biasa tanpa paket khusus (`@sparticuz/chromium`). Di server sendiri (home server atau VPS) cukup pasang Chromium lewat Playwright. Putuskan hosting sebelum membangun fase export PDF.

## 4. Struktur folder

```
cv-generator/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                  # landing + galeri template
│  │  ├─ builder/page.tsx          # editor: form + preview
│  │  └─ api/export/pdf/route.ts   # render PDF di server
│  ├─ components/
│  │  ├─ editor/                   # form per section (BasicsForm, ExperienceForm, ...)
│  │  ├─ preview/                  # A4Canvas, PreviewPane, zoom
│  │  └─ ui/                       # tombol, input, modal
│  ├─ templates/
│  │  ├─ classic/                  # index.tsx, styles
│  │  ├─ modern/
│  │  ├─ minimal/
│  │  └─ registry.ts               # daftar template
│  ├─ lib/
│  │  ├─ schema.ts                 # zod + tipe Resume
│  │  ├─ defaults.ts               # data contoh / kosong
│  │  ├─ storage/                  # adapter.ts, local.ts (api.ts nanti)
│  │  ├─ export/                   # image.ts, pdf-client.ts
│  │  └─ image-utils.ts            # crop dan kompres foto
│  ├─ store/resume-store.ts        # Zustand + persist
│  └─ styles/print.css             # @page A4, aturan cetak
├─ public/fonts/                   # font yang di-embed
├─ tests/                          # vitest + playwright
├─ BLUEPRINT.md                    # dokumen ini
└─ CLAUDE.md                       # aturan untuk AI (lihat bagian 11)
```

## 5. Skema data

Satu objek `Resume` menjadi satu-satunya sumber data. Skema zod di `src/lib/schema.ts` adalah acuan; tipe TypeScript diturunkan darinya dengan `z.infer`. Kode lengkapnya ada di file itu; ringkasannya:

```ts
import { z } from "zod";

export const ResumeSchema = z.object({
  version: z.literal(1),                 // untuk migrasi data di masa depan
  templateId: z.string(),
  theme: z.object({
    accent: z.string().default("#2563eb"),
    font: z.string().default("Inter"),
    fontSize: z.number().min(9).max(12).default(10.5),
  }),
  basics: z.object({
    name: z.string(), title: z.string().optional(),
    email: z.string().optional(), phone: z.string().optional(),
    location: z.string().optional(), website: z.string().optional(),
    photo: z.string().optional(),        // data URL hasil crop dan kompres
    summary: z.string().optional(),
  }),
  experience: z.array(z.object({
    id: z.string(), company: z.string(), role: z.string(),
    start: z.string(), end: z.string().optional(), current: z.boolean().default(false),
    location: z.string().optional(), bullets: z.array(z.string()),
  })),
  education: z.array(z.object({
    id: z.string(), school: z.string(), degree: z.string(),
    start: z.string(), end: z.string().optional(), description: z.string().optional(),
  })),
  skills: z.array(z.object({ id: z.string(), group: z.string(), items: z.array(z.string()) })),
  projects: z.array(z.object({ id: z.string(), name: z.string(), link: z.string().optional(), description: z.string().optional() })),
  certificates: z.array(z.object({ id: z.string(), name: z.string(), issuer: z.string().optional(), year: z.string().optional() })),
  languages: z.array(z.object({ id: z.string(), name: z.string(), level: z.string().optional() })),
  sectionOrder: z.array(z.string()),     // urutan tampil
  hiddenSections: z.array(z.string()).default([]),
});

export type Resume = z.infer<typeof ResumeSchema>;
```

**Aturan data:**

- Setiap item array punya `id` (misalnya `nanoid`) supaya drag-and-drop dan edit stabil.
- Tanggal disimpan sebagai string `YYYY-MM` dan diformat saat tampil.
- Field kosong tidak boleh membuat template menampilkan label kosong; template wajib melewati bagian yang tidak terisi.
- Data yang diimpor atau dimuat dari storage selalu divalidasi dengan `ResumeSchema.safeParse` sebelum dipakai.
- Skema sengaja longgar (misalnya `email` dan `website` hanya string) supaya data setengah jadi tetap tersimpan dan tidak ditolak saat autosave. Validasi format email/URL dilakukan di form dan ditampilkan sebagai peringatan.

## 6. Arsitektur template

Setiap template adalah satu komponen React yang menerima `Resume` dan tidak mengambil data dari tempat lain. Registry mendaftarkan semuanya sehingga galeri dan builder tahu template apa saja yang ada.

```ts
// src/templates/registry.ts
export type TemplateDef = {
  id: string;
  name: string;
  thumbnail: string;                       // gambar kecil untuk galeri
  component: React.ComponentType<{ data: Resume }>;
  defaultTheme: Resume["theme"];
  supports: { photo: boolean; sidebar: boolean };
};

export const templates: TemplateDef[] = [classic, modern, minimal];
```

**Aturan untuk setiap template:**

- Ukuran kanvas tetap A4: 210 × 297 mm (794 × 1123 px pada 96 dpi). Preview hanya di-scale dengan CSS `transform`, ukuran aslinya tidak berubah.
- Semua ukuran memakai satuan yang sama di layar dan cetak (px atau mm), tanpa `vh`/`vw`.
- Warna aksen dan font dibaca dari `data.theme`, bukan ditulis permanen.
- Section dirender mengikuti `data.sectionOrder` dan melewati yang ada di `hiddenSections` atau yang kosong.
- Item (satu pengalaman, satu pendidikan) memakai `break-inside: avoid` supaya tidak terpotong di batas halaman.
- Teks harus asli (bukan gambar) supaya PDF bisa diseleksi dan dibaca ATS. Ikon dekoratif boleh SVG.
- Template Classic wajib satu kolom tanpa tabel atau elemen mengambang agar ramah ATS.

**Menambah template baru:** buat folder di `src/templates/<nama>/`, tulis komponennya, tambahkan thumbnail, daftarkan di `registry.ts`. Tidak ada file lain yang perlu diubah.

## 7. Halaman dan UX

| Route | Fungsi |
| --- | --- |
| `/` | Landing dan galeri template; klik template membuka builder dengan template itu |
| `/builder` | Editor: form di kiri, preview A4 di kanan |
| `/builder?t=modern` | Langsung memilih template |
| `/api/export/pdf` | Menerima data CV, mengembalikan file PDF, tidak menyimpan apa pun |

**Layout builder:**

- Desktop: dua panel. Form per section dalam accordion (bisa dibuka satu per satu), preview di kanan dengan kontrol zoom dan tombol ganti template.
- HP: dua tab, "Isi" dan "Preview", dengan tombol Export tetap terlihat.
- Bilah atas: ganti template, warna aksen, Export (PDF / PNG / JPG), Import/Export JSON, Reset.
- Section bisa diurutkan dengan drag, disembunyikan dengan toggle, dan item di dalamnya (misalnya beberapa pengalaman) juga bisa diurutkan.
- Preview diperbarui saat mengetik (debounce pendek) dan menampilkan penanda batas halaman jika konten melebihi satu halaman.
- Pengguna baru melihat data contoh yang jelas bisa dihapus lewat tombol "Kosongkan".
- Pesan saat guest: "Data tersimpan di browser ini saja. Export JSON untuk cadangan."

**Aksesibilitas dan bahasa:** semua input berlabel, navigasi keyboard berfungsi, antarmuka dan label CV dalam Bahasa Indonesia di MVP.

## 8. Export PDF dan gambar

**PDF (server).** Route `POST /api/export/pdf` menerima objek `Resume`, memvalidasinya dengan zod, lalu membuka halaman render khusus (`/render?...` atau HTML yang dibangun di server) di Chromium headless dan memanggil `page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true })`. File dikembalikan sebagai respons dan tidak disimpan.

- Font yang dipakai template harus tersedia di server (dimuat dari `public/fonts`), kalau tidak PDF dan preview berbeda.
- Tunggu `document.fonts.ready` dan semua gambar selesai dimuat sebelum membuat PDF.
- Batasi ukuran request (misalnya 5 MB, karena ada foto) dan beri rate limit sederhana.
- Jangan mencatat isi CV di log.
- Pembuatan nama file: `CV-<Nama>-<tanggal>.pdf`, dibersihkan dari karakter yang tidak aman.

**Gambar (client).** `html-to-image` mengubah node `A4Canvas` menjadi PNG atau JPG dengan `pixelRatio: 2` atau lebih untuk hasil tajam. Tidak ada data yang dikirim ke server.

**Cadangan bila Chromium belum siap:** tombol "Cetak / Simpan PDF" memakai `window.print()` dengan `print.css` (`@page { size: A4; margin: 0 }`). Hasilnya bergantung browser, jadi hanya dijadikan alternatif.

**Kriteria berhasil:** PDF satu halaman dan multi-halaman tidak memotong item di tengah, teks bisa diseleksi dan disalin, ukuran file di bawah 1 MB untuk CV tanpa foto.

## 9. Penyimpanan data dan privasi

Data CV adalah data pribadi, jadi aplikasi dibuat supaya tidak wajib menyimpannya di server.

**Lapisan penyimpanan (adapter):**

```ts
// src/lib/storage/adapter.ts
export interface ResumeStorage {
  load(): Promise<Resume | null>;
  save(data: Resume): Promise<void>;
  clear(): Promise<void>;
}
// MVP: LocalStorageAdapter (atau IndexedDB bila ada foto besar)
// Tahap 2: ApiAdapter (login), form dan template tidak berubah
```

| | Guest (default) | Login (tahap 2, opsional) |
| --- | --- | --- |
| Lokasi data | Browser pengguna | Database server |
| Perangkat | Satu browser | Banyak perangkat |
| Jumlah CV | Satu aktif | Banyak |
| Cadangan | Export/Import JSON manual | Otomatis |
| Risiko | Hilang jika browser dibersihkan | Perlu pengamanan server |

**Aturan privasi (berlaku sejak MVP):**

- Server tidak menyimpan isi CV pada mode guest. Route PDF memproses lalu membuang data, dan log tidak berisi isi CV.
- Minimalkan field: jangan menambah kolom seperti NIK, nomor KK, atau data keluarga.
- Foto dikompres dan di-crop di client; ukuran dibatasi.
- Sertakan halaman Kebijakan Privasi singkat yang menjelaskan apa yang disimpan dan apa yang tidak.
- Tanpa pelacak pihak ketiga yang membaca isi form. Analitik, jika ada, hanya hitungan kunjungan.

**Tambahan di tahap 2 (login):**

- Masuk dengan Google atau magic link, tanpa menyimpan password.
- HTTPS wajib, database tidak terbuka ke publik, enkripsi saat disimpan.
- Tombol "Hapus akun dan semua data" yang benar-benar menghapus.
- Saat mendaftar, tawarkan memindahkan CV dari mode guest ke akun satu kali.

## 10. Roadmap per fase

Kerjakan berurutan. Satu fase baru dimulai setelah kriteria selesai fase sebelumnya terpenuhi. Estimasi untuk satu orang dengan bantuan AI: sekitar 8–11 hari kerja untuk MVP.

| Fase | Hasil | Kriteria selesai | Estimasi |
| --- | --- | --- | --- |
| 0. Setup | Proyek Next.js + TypeScript + Tailwind, ESLint, folder sesuai bagian 4, `schema.ts`, `defaults.ts` | `npm run dev` dan `npm run build` lolos; data contoh lolos validasi zod | 0,5 hari |
| 1. Kanvas dan template Classic | `A4Canvas`, template Classic membaca data contoh, `print.css` | Tampilan A4 benar di layar; semua section tampil; section kosong dilewati | 1 hari |
| 2. Form editor | Form semua section, array dinamis, validasi, store Zustand + autosave | Mengetik langsung mengubah state; reload tidak menghilangkan data | 2 hari |
| 3. Preview dan ganti template | Layout dua panel, zoom, galeri, `registry.ts` | Ganti template tidak mengubah data; preview mengikuti input | 1 hari |
| 4. Export gambar lalu PDF | PNG/JPG di client, route PDF di server | PDF multi-halaman tidak memotong item; teks bisa diseleksi | 1–2 hari |
| 5. Template Modern dan Minimal | Dua template tambahan dengan thumbnail | Semua template lolos uji data kosong, data panjang, dan tanpa foto | 1–2 hari |
| 6. Polish | Foto crop, warna aksen, urutan dan visibilitas section, Import/Export JSON, responsif HP, landing, kebijakan privasi | Bisa dipakai penuh dari HP; Lighthouse accessibility di atas 90 | 1–2 hari |
| 7. Uji dan deploy | Uji e2e, uji PDF di beberapa browser, deploy | Checklist bagian 12 hijau; MVP online | 0,5–1 hari |
| Tahap 2 | Auth opsional, `ApiAdapter`, simpan banyak CV, varian template via konfigurasi | Pengguna guest tidak terpengaruh; alur pindah guest ke akun berjalan | Terpisah |

## 11. Aturan untuk AI coding dan contoh prompt

Aturan lengkap untuk AI ada di `CLAUDE.md` di root proyek ini (salin ke file aturan alat AI lain bila perlu). Dokumen ini dipakai sebagai `BLUEPRINT.md`.

**Contoh prompt per fase:**

1. *Fase 0:* "Baca BLUEPRINT.md. Kerjakan Fase 0: setup proyek Next.js App Router + TypeScript + Tailwind, buat struktur folder bagian 4, tulis `schema.ts` sesuai bagian 5 dan `defaults.ts` berisi data contoh lengkap. Pastikan build lolos." (Sudah dikerjakan.)
2. *Fase 1:* "Kerjakan Fase 1: buat `A4Canvas` dan template Classic sesuai aturan bagian 6, dirender dari data contoh di halaman sementara. Section kosong harus dilewati."
3. *Fase 2:* "Kerjakan Fase 2: form editor untuk semua section memakai react-hook-form dan zod, array dinamis dengan tambah/hapus/urut, store Zustand dengan persist lewat `LocalStorageAdapter`."
4. *Fase 4:* "Kerjakan Fase 4: export PNG/JPG dengan html-to-image, lalu route `/api/export/pdf` dengan Playwright sesuai bagian 8. Tambahkan uji yang membuat PDF dari data panjang dan memastikan tidak ada item terpotong."
5. *Fase 5:* "Tambahkan template Modern dan Minimal lewat `registry.ts` saja, tanpa mengubah form atau store. Uji dengan data kosong, data panjang, dan tanpa foto."

## 12. Checklist QA dan risiko

**Checklist sebelum rilis MVP:**

- [ ] Data kosong: semua template tampil rapi tanpa label atau garis kosong.
- [ ] Data sangat panjang (10 pengalaman, banyak poin): tidak ada item terpotong antar halaman.
- [ ] Tanpa foto dan dengan foto besar: tata letak tetap benar, foto terkompres.
- [ ] Karakter khusus dan huruf non-Latin (aksen, emoji) tampil benar di PDF.
- [ ] PDF: teks bisa diseleksi dan disalin; ukuran file wajar; tampilan sama dengan preview.
- [ ] Gambar PNG/JPG tajam dan ukurannya A4.
- [ ] Reload dan tutup tab tidak menghilangkan data; Reset dan Kosongkan bekerja.
- [ ] Import JSON yang rusak ditolak dengan pesan jelas, data lama tidak tertimpa.
- [ ] Berfungsi di Chrome, Firefox, Safari (termasuk iOS), dan layar HP.
- [ ] CV dari template Classic lolos pemeriksaan ATS (teks terbaca berurutan).
- [ ] Tidak ada isi CV di log server atau request ke pihak ketiga.

**Risiko dan penanganannya:**

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Item terpotong di batas halaman | CV terlihat rusak | `break-inside: avoid`, uji dengan data panjang sejak Fase 1 |
| Font berbeda antara preview dan PDF server | Tata letak bergeser | Embed font di `public/fonts`, tunggu `document.fonts.ready` |
| Chromium tidak jalan di hosting pilihan | PDF gagal | Putuskan hosting sebelum Fase 4; siapkan `window.print()` sebagai cadangan |
| Foto besar memperlambat dan membengkakkan data | UI lambat, storage penuh | Crop dan kompres di client, batasi ukuran, pertimbangkan IndexedDB |
| Pengguna kehilangan data saat browser dibersihkan | Kehilangan CV | Peringatan di UI, Export JSON yang mudah ditemukan |
| Route PDF disalahgunakan | Beban server | Batas ukuran request, rate limit, validasi zod |
| Template menjadi sulit dirawat | Perubahan satu template merusak yang lain | Template terisolasi per folder, uji otomatis untuk semua template di registry |

## 13. Integrasi AI (disepakati 27 Nov 2026, dikerjakan sebelum deploy)

**Tahapan**, dikerjakan berurutan:

| Tahap | Fitur | Memakai AI |
| --- | --- | --- |
| 1 | Cek CV otomatis: kelengkapan, format, dan kebiasaan penulisan, dengan aturan kode di browser | Tidak |
| 2 | Penilaian AI: 3–5 saran terpenting yang menunjuk bagian CV, bukan angka skor | Ya |
| 3 | Perbaiki kalimat: sebelum dan sesudah, diterapkan hanya jika pengguna setuju | Ya |
| 4 | Cocokkan CV dengan teks lowongan, setelah tahap 2 dan 3 terbukti bagus | Ya |

**Keputusan teknis:**

- AI diakses lewat 9router di server yang sama: browser → server aplikasi → 9router → penyedia model. Hermes Agent tidak dipakai, karena API-nya memberi akses ke seluruh alat agent, termasuk terminal, padahal teks CV berasal dari pengunjung.
- Konfigurasi hanya di server: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` (API bergaya OpenAI). Kunci tidak pernah dikirim ke browser atau disimpan di git.
- Model gratis OpenCode tidak dipakai: dokumentasinya membatasi model itu untuk dipakai dari OpenCode. Penyedia dan model **belum dipilih**; pilih yang mengizinkan pemanggilan dari aplikasi sendiri dan yang kebijakan datanya bisa diterima, lalu matikan fallback ke penyedia lain.
- Pengerasan 9router: wajib API key, sandi dashboard diganti, port tidak terbuka ke internet, log permintaan dan Headroom mati.

**Aturan:**

- Minta persetujuan sebelum mengirim; buang foto, nama, email, telepon, alamat, dan tautan.
- AI tidak boleh mengarang pengalaman atau angka; gunakan tempat kosong seperti `[persentase]`.
- Hasil AI divalidasi dengan zod; jika tidak valid, coba ulang sekali lalu tampilkan pesan gagal.
- Hasilnya panduan, bukan skor ATS atau jaminan lolos.
- Batasi pemakaian per pengunjung dan per hari, dan pasang batas belanja.
- Editor dan export harus tetap berjalan saat AI mati.
- Perbarui halaman privasi sebelum fitur AI dirilis.
