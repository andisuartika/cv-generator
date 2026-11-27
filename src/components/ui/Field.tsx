import { cn } from "cn";
import { useId, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Filled controls that turn white with a colored border on focus.
const control =
  "border-transparent bg-muted focus-visible:border-primary focus-visible:bg-background focus-visible:ring-primary/20 read-only:opacity-60";

// Amber rather than red: format problems are warnings and do not block saving.
const warningBorder = "border-amber-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/30";

type FieldProps = { label: string; hint?: string; warning?: string };

function useDescription(hint?: string, warning?: string) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, warning && `${id}-warning`].filter(Boolean).join(" ");
  const messages = (
    <>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {warning && (
        <p id={`${id}-warning`} className="text-xs text-amber-700 dark:text-amber-400">
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
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[0.8rem] text-muted-foreground">
        {label}
      </Label>
      <Input
        type="text"
        {...input}
        id={id}
        aria-describedby={describedBy}
        className={cn("h-11 px-3 md:text-[0.95rem]", control, warning && warningBorder)}
      />
      {messages}
    </div>
  );
}

export function TextArea(props: FieldProps & ComponentProps<"textarea">) {
  const { label, hint, warning, ...textarea } = props;
  const { id, describedBy, messages } = useDescription(hint, warning);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[0.8rem] text-muted-foreground">
        {label}
      </Label>
      <Textarea
        rows={4}
        {...textarea}
        id={id}
        aria-describedby={describedBy}
        className={cn(
          "min-h-28 px-3 py-2.5 leading-relaxed md:text-[0.95rem]",
          control,
          warning && warningBorder,
        )}
      />
      {messages}
    </div>
  );
}
