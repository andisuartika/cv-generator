import type { Metadata } from "next";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = { title: "Editor CV · CV Generator" };

/** Form and live preview: side by side on wide screens, tabs on narrow ones. */
export default function BuilderPage() {
  return (
    <main className="mx-auto flex w-full max-w-[100rem] flex-col gap-4 p-4 lg:px-8">
      <h1 className="text-2xl font-semibold">Editor CV</h1>
      <Editor />
    </main>
  );
}
