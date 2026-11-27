import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { templates } from "@/templates/registry";

/** One card per registry entry; choosing one opens the editor with it. */
export function TemplateGallery() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
      {templates.map((template) => (
        <li key={template.id}>
          <Link
            href={`/builder?t=${template.id}`}
            className="group block overflow-hidden rounded-2xl border bg-card outline-none transition hover:border-primary hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="block bg-muted p-3">
              {/* Decorative: the template name below is the link text. */}
              <Image
                src={template.thumbnail}
                alt=""
                width={210}
                height={297}
                unoptimized
                loading="eager"
                className="h-auto w-full shadow-sm"
              />
            </span>
            <span className="flex items-center justify-between gap-2 border-t px-3 py-2.5 text-sm font-semibold">
              {template.name}
              <span className="flex items-center gap-1 text-xs font-medium text-primary">
                <span className="max-sm:sr-only">Pakai</span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
