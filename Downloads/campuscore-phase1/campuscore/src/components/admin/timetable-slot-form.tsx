"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { TimetableFormState } from "@/lib/data/timetable-admin";

interface OfferingOption {
  id: string;
  label: string;
}
interface LecturerOption {
  id: string;
  full_name: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const initialState: TimetableFormState = { error: null };

export function TimetableSlotForm({
  action,
  offerings,
  lecturers,
  defaultValues
}: {
  action: (state: TimetableFormState, formData: FormData) => Promise<TimetableFormState>;
  offerings: OfferingOption[];
  lecturers: LecturerOption[];
  defaultValues?: {
    course_offering_id: string;
    lecturer_id: string | null;
    venue: string | null;
    session_type: string;
    day_of_week: number | null;
    exam_date: string | null;
    start_time: string;
    end_time: string;
  };
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [sessionType, setSessionType] = useState(defaultValues?.session_type ?? "lecture");

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Course offering">
        <select
          name="course_offering_id"
          required
          defaultValue={defaultValues?.course_offering_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a course offering
          </option>
          {offerings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Lecturer (optional)">
        <select
          name="lecturer_id"
          defaultValue={defaultValues?.lecturer_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">None</option>
          {lecturers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.full_name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Venue">
        <input
          name="venue"
          defaultValue={defaultValues?.venue ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Session type">
        <select
          name="session_type"
          value={sessionType}
          onChange={(e) => setSessionType(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="lecture">Lecture (weekly)</option>
          <option value="practical">Practical (weekly)</option>
          <option value="exam">Examination (dated)</option>
        </select>
      </Field>

      {sessionType === "exam" ? (
        <Field label="Exam date">
          <input
            name="exam_date"
            type="date"
            required
            defaultValue={defaultValues?.exam_date ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
      ) : (
        <Field label="Day of week">
          <select
            name="day_of_week"
            defaultValue={defaultValues?.day_of_week ?? 1}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time">
          <input
            name="start_time"
            type="time"
            required
            defaultValue={defaultValues?.start_time ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="End time">
          <input
            name="end_time"
            type="time"
            required
            defaultValue={defaultValues?.end_time ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
      {pending ? "Saving…" : "Save timetable entry"}
    </Button>
  );
}
