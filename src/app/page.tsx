import { ArrowRight, Download, Eye, FileText, LayoutTemplate, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { TemplateGallery } from "@/components/templates/TemplateGallery";
import { Button } from "@/components/ui/button";
import { templates } from "@/templates/registry";

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: `${templates.length} template`,
    text: "Ganti kapan saja tanpa mengetik ulang.",
  },
  { icon: Eye, title: "Preview langsung", text: "Lihat hasil ukuran A4 saat Anda mengetik." },
  { icon: Download, title: "Unduh", text: "Simpan sebagai PDF, PNG, atau JPG." },
];

/** Landing page with the template gallery. */
export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-primary/10 to-background to-40% px-4 py-12">
      <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FileText aria-hidden="true" className="size-6" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">CV Generator</h1>
        <p className="text-balance text-muted-foreground">
          Isi data, lihat hasilnya langsung dalam ukuran A4.
        </p>
        <Button asChild size="lg" className="h-11 px-5 text-base">
          <Link href="/builder">
            Buka editor CV
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Tanpa akun. Data tersimpan di browser Anda.
        </p>
      </div>
      <ul className="mx-auto mb-12 grid max-w-3xl gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
            <Icon aria-hidden="true" className="size-5 text-primary" />
            <span className="font-semibold">{title}</span>
            <span className="text-sm text-muted-foreground">{text}</span>
          </li>
        ))}
      </ul>
      <section aria-labelledby="templates-heading" className="mx-auto max-w-5xl">
        <h2 id="templates-heading" className="mb-6 text-center text-xl font-semibold">
          Pilih template
        </h2>
        <TemplateGallery />
      </section>
      <footer className="mt-12 text-center text-sm">
        <Link href="/privasi" className="underline underline-offset-2">
          Kebijakan privasi
        </Link>
      </footer>
    </main>
  );
}
