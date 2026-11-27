import { createPdfHandler } from "@/lib/pdf/handler";
import { renderResumePdf } from "@/lib/pdf/render";

export const POST = createPdfHandler({ render: renderResumePdf });
