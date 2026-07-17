"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { OfferingFormState } from "@/lib/data/course-offerings";

interface CourseOption {
  id: string;
  code: string;
  title: string;
}

interface SemesterOption {
  id: string;
  label: string; // e.g. "2025/2026 — First Semester"
}

interface OfferingFormProps {
  action: (state: OfferingFormState, formData: FormData) => Promise<OfferingFormState>;
  courses: CourseOption[];
  semesters: SemesterOption[];
  defaultValues?: {
    course_id: string;
    semester_id: string;
    level: number;
    status: string;
  };
}

const initialState: OfferingFormState = { error: null };
const LEVELS = [100, 200, 300, 400, 500];

export function OfferingForm({ action, courses, semesters, defaultValues }: OfferingFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Course">
        <select
          name="course_id"
          required
          defaultValue={defaultValues?.course_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a course
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </Field>

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
        <Field label="Level">
          <select
            name="level"
            defaultValue={defaultValues?.level ?? 100}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl} Level
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">Classification only — never gates access (enrollment does).</p>
        </Field>

        <Field label="Status">
          <select
            name="status"
            defaultValue={defaultValues?.status ?? "C"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="C">Compulsory</option>
            <option value="E">Elective</option>
            <option value="R">Restricted</option>
          </select>
        </Field>
      </div>

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
      {pending ? "Saving…" : "Save offering"}
    </Button>
  );
}
