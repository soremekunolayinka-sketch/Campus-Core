"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { CourseFormState } from "@/lib/data/courses";

interface DepartmentOption {
  id: string;
  name: string;
}

interface CourseFormProps {
  action: (state: CourseFormState, formData: FormData) => Promise<CourseFormState>;
  departments: DepartmentOption[];
  defaultValues?: {
    department_id: string;
    code: string;
    title: string;
    units: number;
    default_status: string;
    lecture_hours: number | null;
    practical_hours: number | null;
  };
}

const initialState: CourseFormState = { error: null };

export function CourseForm({ action, departments, defaultValues }: CourseFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Department">
        <select
          name="department_id"
          required
          defaultValue={defaultValues?.department_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a department
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Course code">
        <input
          name="code"
          required
          placeholder="CEE 214"
          defaultValue={defaultValues?.code}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Course title">
        <input
          name="title"
          required
          placeholder="Elements of Structural Detailing"
          defaultValue={defaultValues?.title}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Units">
          <input
            name="units"
            type="number"
            min={0}
            defaultValue={defaultValues?.units ?? 0}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Lecture hours">
          <input
            name="lecture_hours"
            type="number"
            min={0}
            defaultValue={defaultValues?.lecture_hours ?? 0}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Practical hours">
          <input
            name="practical_hours"
            type="number"
            min={0}
            defaultValue={defaultValues?.practical_hours ?? 0}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="Status">
        <select
          name="default_status"
          defaultValue={defaultValues?.default_status ?? "C"}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="C">Compulsory</option>
          <option value="E">Elective</option>
          <option value="R">Restricted</option>
        </select>
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
      {pending ? "Saving…" : "Save course"}
    </Button>
  );
}
