"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerForCourse, dropCourse } from "@/lib/data/registration-actions";

export function RegisterButton({ offeringId, disabled, disabledReason }: { offeringId: string; disabled?: boolean; disabledReason?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await registerForCourse(offeringId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="text-right">
      <button
        onClick={handleClick}
        disabled={disabled || isPending}
        title={disabled ? disabledReason : undefined}
        className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-40"
      >
        {isPending ? "Registering…" : "Register"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function DropButton({ enrollmentId }: { enrollmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await dropCourse(enrollmentId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="text-right">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
      >
        {isPending ? "Dropping…" : "Drop"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
