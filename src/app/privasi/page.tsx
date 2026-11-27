import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi · CV Generator",
  description: "Data apa yang disimpan CV Generator dan di mana.",
};

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: "Yang disimpan",
    points: [
      "Isi CV, termasuk foto, pilihan template, warna, dan susunan section disimpan di penyimpanan browser Anda (local storage), di perangkat ini saja.",
      "Jika data tersimpan ternyata rusak, aplikasi membuat salinan cadangannya di penyimpanan browser yang sama.",
    ],
  },
  {
    title: "Yang tidak dilakukan",
    points: [
      "Isi CV tidak dikirim ke server aplikasi dan tidak disimpan di sana.",
      "Tidak ada akun, iklan, analitik, atau pelacak pihak ketiga.",
      "Aplikasi tidak meminta NIK, nomor kartu keluarga, atau data keluarga.",
    ],
  },
  {
    title: "Foto dan unduhan",
    points: [
      "Foto dipotong dan dikompres di browser. Foto tidak diunggah.",
      "Gambar PNG dan JPG serta cadangan JSON dibuat di browser.",
      "PDF dibuat lewat dialog cetak browser Anda.",
      "File yang Anda unduh berisi data pribadi. Simpan dan bagikan dengan hati-hati.",
    ],
  },
  {
    title: "Menghapus data",
    points: [
      "Tombol Kosongkan menghapus isi CV yang sedang dipakai, tetapi tidak menghapus salinan cadangan data rusak.",
      "Untuk menghapus semuanya, hapus data situs ini lewat pengaturan browser.",
      "Siapa pun yang bisa memakai browser ini dapat melihat CV Anda. Di komputer bersama, hapus data situs setelah selesai.",
    ],
  },
  {
    title: "Server",
    points: [
      "Server hanya mengirimkan halaman aplikasi. Penyedia hosting dapat mencatat data akses standar, seperti alamat IP dan waktu kunjungan.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10">
      <Link href="/" className="flex items-center gap-1.5 self-start text-sm font-medium underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Beranda
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Kebijakan Privasi</h1>
        <p className="text-muted-foreground">
          Ringkasnya: CV Anda tetap berada di browser Anda.
        </p>
      </header>
      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed">
            {section.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
