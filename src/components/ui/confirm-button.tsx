"use client";

import type { ComponentProps } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmButtonProps = ComponentProps<typeof Button> & {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
};

/** A button that asks for confirmation before a destructive action. */
export function ConfirmButton(props: ConfirmButtonProps) {
  const { title, description, confirmLabel, onConfirm, ...trigger } = props;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button {...trigger} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
