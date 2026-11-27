# CV Generator: aturan proyek

@AGENTS.md

Baca BLUEPRINT.md sebelum mengerjakan apa pun. Ikuti urutan fase di bagian 10.

## Status

- Fase 0 (setup): selesai.
- Fase 1 (A4Canvas + template Classic): selesai.
- Fase berikutnya: Fase 2 (form editor, store Zustand + autosave).
- Keputusan terbuka (bagian 2 BLUEPRINT.md): target pengguna, hosting, antarmuka dua bahasa.

Perbarui daftar ini di akhir setiap fase.

## Aturan

- TypeScript strict. Tidak memakai `any`.
- Tipe data berasal dari `ResumeSchema` (zod) di src/lib/schema.ts. Jangan membuat tipe duplikat.
- Template hanya menerima props `{ data: Resume }`. Tidak boleh membaca store, localStorage, atau fetch.
- Preview dan export memakai komponen template yang sama.
- Kanvas A4 tetap 794x1123 px. Jangan pakai vh/vw di dalam template.
- Template wajib melewati section kosong dan menghormati sectionOrder/hiddenSections.
- Semua penyimpanan lewat interface ResumeStorage. Jangan memanggil localStorage langsung dari komponen.
- Jangan menyimpan atau mencatat isi CV di server (kecuali tahap 2, dengan login).
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

## Cara kerja

- Kerjakan satu fase per sesi. Di akhir, ringkas apa yang selesai dan apa yang belum.
- Jika ada keputusan di luar blueprint, tanyakan dulu, jangan mengarang.
