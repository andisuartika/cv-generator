"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { useId, type ReactNode } from "react";
import { ConfirmButton } from "@/components/ui/confirm-button";

type SortableListProps = {
  ids: string[];
  onMove: (from: number, to: number) => void;
  children: ReactNode;
};

export function SortableList({ ids, onMove, children }: SortableListProps) {
  const contextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const position = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Item di posisi ${position(active.id)} diangkat.`,
    onDragOver: ({ over }) => (over ? `Item berada di posisi ${position(over.id)}.` : undefined),
    onDragEnd: ({ over }) =>
      over ? `Item diletakkan di posisi ${position(over.id)}.` : "Item diletakkan.",
    onDragCancel: () => "Pemindahan dibatalkan.",
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  }

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Tekan spasi untuk mengangkat item, pindahkan dengan tombol panah, lalu tekan spasi lagi untuk meletakkan. Tekan Escape untuk batal.",
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-3">{children}</ol>
      </SortableContext>
    </DndContext>
  );
}

type SortableItemProps = {
  id: string;
  name: string;
  onRemove: () => void;
  children: ReactNode;
};

export function SortableItem({ id, name, onRemove, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, attributes: { roleDescription: "item yang bisa diurutkan" } });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex flex-col gap-4 rounded-xl border bg-muted/40 p-3 sm:p-4 ${
        isDragging ? "relative z-10 bg-card shadow-lg ring-2 ring-ring/40" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Pindahkan ${name}`}
          className="-ml-1 flex cursor-grab touch-none items-center gap-1.5 rounded-md px-1 py-1 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        >
          <GripVertical aria-hidden="true" className="size-4 text-muted-foreground" />
          {name}
        </button>
        <ConfirmButton
          variant="ghost"
          size="icon"
          aria-label={`Hapus ${name}`}
          className="text-muted-foreground hover:text-destructive"
          title={`Hapus ${name}?`}
          description="Isian pada item ini akan dihapus dan tidak bisa dikembalikan."
          confirmLabel={`Ya, hapus ${name}`}
          onConfirm={onRemove}
        >
          <Trash2 aria-hidden="true" />
        </ConfirmButton>
      </div>
      {children}
    </li>
  );
}
