import type { Metadata } from "next";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = { title: "Editor CV · CV Generator" };

/** Form and live preview: side by side on wide screens, tabs on narrow ones. */
export default function BuilderPage() {
  return <Editor />;
}
