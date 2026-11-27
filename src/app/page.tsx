import Link from "next/link";
import { A4Canvas } from "@/components/preview/A4Canvas";
import { sampleResume } from "@/lib/defaults";
import { ClassicTemplate } from "@/templates/classic";

/** Temporary page until Phase 3: Classic template with sample data. */
export default function Home() {
  return (
    <main className="a4-stage min-h-screen overflow-x-auto bg-neutral-200 py-8">
      <p className="a4-stage-nav mb-4 text-center">
        <Link href="/builder" className="font-medium text-blue-700 underline">
          Buka editor CV
        </Link>
      </p>
      <A4Canvas>
        <ClassicTemplate data={sampleResume} />
      </A4Canvas>
    </main>
  );
}
