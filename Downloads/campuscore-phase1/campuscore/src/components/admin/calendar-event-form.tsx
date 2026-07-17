"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { CalendarEventFormState } from "@/lib/data/calendar-admin";

const EVENT_TYPE_LABELS: Record<string, string> = {
  registration: "Registration period",
  test: "Test",
  exam: "Examination",
  holiday: "Holiday",
  milestone: "Milestone (e.g. semester start/end)",
  add_drop_deadline: "Add/Drop deadline"
};

const initialState: CalendarEventFormState = { error: null };

export function CalendarEventForm({
  action,
  defaultValues
}: {
  action: (state: CalendarEventFormState, formData: FormData) => Promise<CalendarEventFormState>;
  defaultValues?: {
    title: string;
    type: string;
    start_date: string;
    end_date: string | null;
    description: string | null;
  };
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Title">
        <input
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Type">
        <select
          name="type"
          defaultValue={defaultValues?.type ?? "milestone"}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date">
          <input
            name="start_date"
            type="date"
            required
            defaultValue={defaultValues?.start_date}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="End date (optional)">
          <input
            name="end_date"
            type="date"
            defaultValue={defaultValues?.end_date ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="Description (optional)">
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save event"}
    </Button>
  );
}
