import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { A4Canvas } from "@/components/preview/A4Canvas";
import { Button } from "@/components/ui/button";
import { sampleResume } from "@/lib/defaults";
import { ClassicTemplate } from "@/templates/classic";

/** Temporary landing page until the template gallery is built (Phase 3). */
export default function Home() {
  return (
    <main className="a4-stage min-h-screen bg-linear-to-b from-primary/10 to-background to-40% px-4 py-12">
      <div className="a4-stage-nav mx-auto mb-10 flex max-w-2xl flex-col items-center gap-4 text-center">
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
      {/* Shrinks the 794 px sheet on small screens; printing keeps full size. */}
      <div className="overflow-x-auto pb-4 max-[860px]:[zoom:0.75] max-[640px]:[zoom:0.43] print:[zoom:1]">
        <A4Canvas>
          <ClassicTemplate data={sampleResume} />
        </A4Canvas>
      </div>
    </main>
  );
}
