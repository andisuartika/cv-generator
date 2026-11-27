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
import { useId, type ReactNode } from "react";
import { ConfirmButton } from "@/components/ui/Button";

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
      className={`flex flex-col gap-3 rounded-lg border border-neutral-300 bg-background p-3 ${
        isDragging ? "relative z-10 shadow-lg" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Pindahkan ${name}`}
          className="cursor-grab touch-none rounded-md px-2 py-1 text-sm font-semibold"
        >
          <span aria-hidden="true">⠿ </span>
          {name}
        </button>
        <ConfirmButton label="Hapus" confirmLabel={`Ya, hapus ${name}`} onConfirm={onRemove} />
      </div>
      {children}
    </li>
  );
}
