"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListOrdered } from "lucide-react";
import { useId } from "react";
import { SortableList } from "@/components/editor/SortableList";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { SectionKey } from "@/lib/schema";
import { normalizeSectionOrder } from "@/lib/section-order";
import { SECTION_LABELS } from "@/lib/sections";
import { resumeStore } from "@/store/resume-store";

type RowProps = {
  section: SectionKey;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

function SectionRow({ section, visible, onVisibleChange }: RowProps) {
  const checkboxId = useId();
  const label = SECTION_LABELS[section];
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: section, attributes: { roleDescription: "section yang bisa diurutkan" } });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border bg-card py-1 pr-3 pl-1 ${
        isDragging ? "relative z-10 shadow-lg ring-2 ring-ring/40" : ""
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Pindahkan section ${label}`}
        className="flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      <span className={`flex-1 font-medium ${visible ? "" : "text-muted-foreground line-through"}`}>
        {label}
      </span>
      <Checkbox
        id={checkboxId}
        checked={visible}
        onCheckedChange={(checked) => onVisibleChange(checked === true)}
      />
      <Label htmlFor={checkboxId} className="font-normal">
        Tampil<span className="sr-only">kan {label}</span>
      </Label>
    </li>
  );
}

/** Orders and hides the sections of the CV. */
export function SectionManager() {
  const sectionOrder = resumeStore.useResume((s) => s.resume.sectionOrder);
  const hidden = resumeStore.useResume((s) => s.resume.hiddenSections);
  const order = normalizeSectionOrder(sectionOrder);

  function move(from: number, to: number) {
    const next = [...order];
    next.splice(to, 0, ...next.splice(from, 1));
    resumeStore.useResume.getState().setSectionOrder(next);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <ListOrdered aria-hidden="true" />
          Atur section
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atur section CV</DialogTitle>
          <DialogDescription>
            Tarik untuk mengubah urutan. Section yang kosong tidak muncul di CV. Pada template
            berkolom, urutan berlaku di tiap kolom.
          </DialogDescription>
        </DialogHeader>
        <SortableList ids={order} onMove={move}>
          {order.map((section) => (
            <SectionRow
              key={section}
              section={section}
              visible={!hidden.includes(section)}
              onVisibleChange={(visible) =>
                resumeStore.useResume.getState().setSectionHidden(section, !visible)
              }
            />
          ))}
        </SortableList>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Selesai</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
