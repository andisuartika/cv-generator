import { A4Canvas } from "@/components/preview/A4Canvas";
import { sampleResume } from "@/lib/defaults";
import { ClassicTemplate } from "@/templates/classic";

/** Temporary page for Phase 1: Classic template with sample data. */
export default function Home() {
  return (
    <main className="a4-stage min-h-screen overflow-x-auto bg-neutral-200 py-8">
      <A4Canvas>
        <ClassicTemplate data={sampleResume} />
      </A4Canvas>
    </main>
  );
}
