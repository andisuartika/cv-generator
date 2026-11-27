import type { Metadata } from "next";
import { RenderTarget } from "@/components/export/RenderTarget";

export const metadata: Metadata = {
  title: "Render PDF",
  robots: { index: false, follow: false },
};

/** Used by the PDF route only. It is empty when opened by a person. */
export default function RenderPage() {
  return <RenderTarget />;
}
