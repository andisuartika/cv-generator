import { useId, type ComponentProps } from "react";

const control =
  "w-full rounded-md border border-neutral-400 bg-transparent px-3 py-2 text-base disabled:opacity-50";

type FieldProps = { label: string; hint?: string; warning?: string };

function useDescription(hint?: string, warning?: string) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, warning && `${id}-warning`].filter(Boolean).join(" ");
  const messages = (
    <>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-neutral-600 dark:text-neutral-400">
          {hint}
        </p>
      )}
      {warning && (
        <p id={`${id}-warning`} className="text-sm text-amber-700 dark:text-amber-400">
          {warning}
        </p>
      )}
    </>
  );
  return { id, describedBy: describedBy || undefined, messages };
}

export function TextField(props: FieldProps & ComponentProps<"input">) {
  const { label, hint, warning, ...input } = props;
  const { id, describedBy, messages } = useDescription(hint, warning);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input type="text" {...input} id={id} aria-describedby={describedBy} className={control} />
      {messages}
    </div>
  );
}

export function TextArea(props: FieldProps & ComponentProps<"textarea">) {
  const { label, hint, warning, ...textarea } = props;
  const { id, describedBy, messages } = useDescription(hint, warning);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea rows={4} {...textarea} id={id} aria-describedby={describedBy} className={control} />
      {messages}
    </div>
  );
}
