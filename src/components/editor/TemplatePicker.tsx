"use client";

import { LayoutTemplate } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTemplate, templates } from "@/templates/registry";

type TemplatePickerProps = {
  value: string;
  onChange: (templateId: string) => void;
};

export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  // An unknown stored id falls back to the first template, like the preview does.
  const current = getTemplate(value) ?? templates[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label={`Ganti template. Saat ini: ${current.name}`}>
          <LayoutTemplate aria-hidden="true" />
          {current.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuRadioGroup
          value={current.id}
          onValueChange={onChange}
          className="grid grid-cols-2 gap-1"
        >
          {templates.map((template) => (
            <DropdownMenuRadioItem key={template.id} value={template.id} className="gap-2 py-2">
              <Image
                src={template.thumbnail}
                alt=""
                width={40}
                height={57}
                unoptimized
                className="rounded-sm border"
              />
              {template.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
