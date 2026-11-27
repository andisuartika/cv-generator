"use client";

import { useState, type ComponentProps } from "react";

const base = "rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-medium";

export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return <button type="button" {...props} className={`${base} ${className}`} />;
}

type ConfirmButtonProps = {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
};

/** Two-step button for destructive actions, without a blocking browser dialog. */
export function ConfirmButton({ label, confirmLabel, onConfirm }: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return <Button onClick={() => setConfirming(true)}>{label}</Button>;
  }
  return (
    <span className="flex flex-wrap gap-2">
      <Button
        autoFocus
        className="text-red-700 dark:text-red-400"
        onClick={() => {
          setConfirming(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </Button>
      <Button onClick={() => setConfirming(false)}>Batal</Button>
    </span>
  );
}
