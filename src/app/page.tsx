import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { TemplateGallery } from "@/components/templates/TemplateGallery";
import { Button } from "@/components/ui/button";

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
      <section aria-labelledby="templates-heading" className="mx-auto max-w-5xl">
        <h2 id="templates-heading" className="mb-6 text-center text-xl font-semibold">
          Pilih template
        </h2>
        <TemplateGallery />
      </section>
    </main>
  );
}
