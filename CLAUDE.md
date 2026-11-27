# CV Generator: aturan proyek

@AGENTS.md

Baca BLUEPRINT.md sebelum mengerjakan apa pun. Ikuti urutan fase di bagian 10.

## Status

- Fase 0 (setup): selesai.
- Fase 1 (A4Canvas + template Classic): selesai.
- Fase 2 (form editor, store Zustand + autosave): selesai.
- Fase 3 (preview dua panel, zoom, galeri, ganti template): selesai.
- Fase 4 (export PNG/JPG, cetak, dan PDF server dengan Playwright): selesai. Uji PDF: `npm run build && npm run test:pdf`.
- Fase 5 (template Modern dan Minimal): selesai (dikerjakan sebelum sisa Fase 4 atas persetujuan pengguna).
- Fase 6 (foto, warna aksen, susunan section, impor/ekspor JSON, HP, landing, privasi): selesai; Lighthouse accessibility 96-100. Belum diuji di HP asli.
- Tambahan atas permintaan pengguna (di luar scope MVP): 7 template (Banner, Timeline, Compact, Editorial, Bold, Accent, Executive), total 10. Hindari position: relative pada konten template satu kolom karena mengacak urutan teks PDF.
- Fase berikutnya: Fase 7 (uji dan deploy). Pengguna ingin membahas integrasi AI sebelum deploy.
- Hosting: server sendiri / VPS (diputuskan pengguna, 27 Nov 2026).
- Keputusan terbuka (bagian 2 BLUEPRINT.md): target pengguna, antarmuka dua bahasa.

Perbarui daftar ini di akhir setiap fase.

## Aturan

- TypeScript strict. Tidak memakai `any`.
- Tipe data berasal dari `ResumeSchema` (zod) di src/lib/schema.ts. Jangan membuat tipe duplikat.
- Template hanya menerima props `{ data: Resume }`. Tidak boleh membaca store, localStorage, atau fetch.
- Preview dan export memakai komponen template yang sama.
- Kanvas A4 tetap 794x1123 px. Jangan pakai vh/vw di dalam template.
- Template wajib melewati section kosong dan menghormati sectionOrder/hiddenSections.
- Semua penyimpanan lewat interface ResumeStorage. Jangan memanggil localStorage langsung dari komponen.
- Jangan menyimpan atau mencatat isi CV di server (kecuali tahap 2, dengan login). Route PDF hanya memproses di memori; log hanya boleh berisi jenis error.
- Teks CV harus teks asli (bukan gambar) agar PDF bisa diseleksi.
- Font di-embed lokal (public/fonts), jangan memakai next/font/google (build harus jalan tanpa jaringan).
- Setiap fase selesai hanya jika kriteria di bagian 10 terpenuhi dan `npm run typecheck`, `npm run lint`, `npm test`, serta `npm run build` lolos.
- Bahasa antarmuka: Indonesia. Nama variabel dan komentar kode: Inggris.

## Perintah

- `npm run dev` jalankan server pengembangan
- `npm run build` build produksi
- `npm run typecheck` cek tipe
- `npm run lint` ESLint
- `npm test` Vitest
- `npm run test:pdf` uji PDF dengan server asli dan Chromium (jalankan build dulu)

## Cara kerja

- Kerjakan satu fase per sesi. Di akhir, ringkas apa yang selesai dan apa yang belum.
- Jika ada keputusan di luar blueprint, tanyakan dulu, jangan mengarang.
