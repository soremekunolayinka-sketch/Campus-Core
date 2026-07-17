"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { RegistrationWindowFormState } from "@/lib/data/registration-windows";

interface SemesterOption {
  id: string;
  label: string;
}

interface WindowFormProps {
  action: (state: RegistrationWindowFormState, formData: FormData) => Promise<RegistrationWindowFormState>;
  semesters: SemesterOption[];
  defaultValues?: {
    semester_id: string;
    opens_at: string;
    closes_at: string;
    requires_approval: boolean;
    max_units_per_student: number | null;
  };
}

const initialState: RegistrationWindowFormState = { error: null };

// datetime-local inputs need "YYYY-MM-DDTHH:mm", not a full ISO timestamp.
function toLocalInputValue(iso: string | undefined) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function RegistrationWindowForm({ action, semesters, defaultValues }: WindowFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Semester">
        <select
          name="semester_id"
          required
          defaultValue={defaultValues?.semester_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a semester
          </option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Opens at">
          <input
            name="opens_at"
            type="datetime-local"
            required
            defaultValue={toLocalInputValue(defaultValues?.opens_at)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Closes at">
          <input
            name="closes_at"
            type="datetime-local"
            required
            defaultValue={toLocalInputValue(defaultValues?.closes_at)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="Max units per student (optional)">
        <input
          name="max_units_per_student"
          type="number"
          min={1}
          defaultValue={defaultValues?.max_units_per_student ?? ""}
          placeholder="No limit"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="requires_approval" defaultChecked={defaultValues?.requires_approval} />
        Require admin approval after registration (students see &quot;Pending&quot; until approved)
      </label>

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
      {pending ? "Saving…" : "Save window"}
    </Button>
  );
}
