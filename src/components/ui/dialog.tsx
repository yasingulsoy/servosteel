"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/** shadcn tarzı Dialog primitifleri — Servosteel tema token'larıyla */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className = "",
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm data-[state=closed]:animate-[fadeOut_150ms_ease] data-[state=open]:animate-[fadeIn_150ms_ease]" />
      <DialogPrimitive.Content
        className={`fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-card p-6 shadow-2xl shadow-black/25 outline-none data-[state=open]:animate-[popIn_180ms_cubic-bezier(0.2,0.7,0.2,1)] ${className}`}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-alt hover:text-ink"
          aria-label="Kapat"
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className = "", ...props }: React.ComponentProps<"div">) {
  return <div className={`mb-5 pr-8 ${className}`} {...props} />;
}

export function DialogTitle({
  className = "",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={`font-display text-xl font-bold uppercase tracking-tight text-ink ${className}`}
      {...props}
    />
  );
}

export function DialogDescription({
  className = "",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={`mt-1.5 text-sm text-muted ${className}`}
      {...props}
    />
  );
}
