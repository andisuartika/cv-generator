"use client";

import type { ReactNode } from "react";
import { useFieldArray, useFormContext, type FieldArray } from "react-hook-form";
import { SortableItem, SortableList } from "@/components/editor/SortableList";
import { Button } from "@/components/ui/Button";
import type { Resume } from "@/lib/schema";

export type ArrayName =
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certificates"
  | "languages";

type ArraySectionProps<N extends ArrayName> = {
  name: N;
  itemLabel: string;
  createItem: () => FieldArray<Resume, N>;
  renderItem: (index: number) => ReactNode;
};

export function ArraySection<N extends ArrayName>(props: ArraySectionProps<N>) {
  const { name, itemLabel, createItem, renderItem } = props;
  const { control } = useFormContext<Resume>();
  // keyName: the default "id" would replace the item's own id.
  const { fields, append, remove, move } = useFieldArray({ control, name, keyName: "fieldKey" });

  return (
    <div className="flex flex-col gap-3">
      <SortableList ids={fields.map((f) => f.fieldKey)} onMove={move}>
        {fields.map((field, index) => (
          <SortableItem
            key={field.fieldKey}
            id={field.fieldKey}
            name={`${itemLabel} ${index + 1}`}
            onRemove={() => remove(index)}
          >
            {renderItem(index)}
          </SortableItem>
        ))}
      </SortableList>
      <Button className="self-start" onClick={() => append(createItem())}>
        Tambah {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}
