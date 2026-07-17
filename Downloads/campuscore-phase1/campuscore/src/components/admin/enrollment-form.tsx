"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { EnrollmentFormState } from "@/lib/data/enrollments";

interface StudentOption {
  id: string;
  full_name: string;
  matric_number: string | null;
  current_level: number | null;
}

interface OfferingOption {
  id: string;
  label: string; // "CEE 214 — Elements of Structural Detailing (100L, First Semester 2025/2026)"
}

const ENROLLMENT_TYPES = [
  { value: "normal", label: "Normal" },
  { value: "carryover", label: "Carryover" },
  { value: "repeat", label: "Repeat" },
  { value: "elective", label: "Elective" },
  { value: "special_approval", label: "Special approval" }
];

const initialState: EnrollmentFormState = { error: null };

export function EnrollmentForm({
  action,
  students,
  offerings
}: {
  action: (state: EnrollmentFormState, formData: FormData) => Promise<EnrollmentFormState>;
  students: StudentOption[];
  offerings: OfferingOption[];
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    if (!query.trim()) return students.slice(0, 8);
    const q = query.toLowerCase();
    return students
      .filter((s) => s.full_name.toLowerCase().includes(q) || (s.matric_number ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, students]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <span className="text-sm font-medium text-slate-700">Student</span>

        {selectedStudent ? (
          <div className="mt-1 flex items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-sm">
            <span>
              {selectedStudent.full_name}{" "}
              <span className="text-slate-400">
                {selectedStudent.matric_number ?? "—"} · {selectedStudent.current_level ?? "—"}L
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedStudentId(null)}
              className="text-xs text-brand hover:underline"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or matric number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {query && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-sm">
                {filteredStudents.length === 0 && (
                  <li className="px-3 py-2 text-sm text-slate-400">No matching students.</li>
                )}
                {filteredStudents.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setQuery("");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {s.full_name} <span className="text-slate-400">{s.matric_number ?? "—"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <input type="hidden" name="student_id" value={selectedStudentId ?? ""} />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Course offering</span>
        <select
          name="course_offering_id"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          defaultValue=""
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
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Enrollment type</span>
        <select
          name="enrollment_type"
          defaultValue="normal"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {ENROLLMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          A carryover/repeat/elective/special-approval enrollment grants the same full course access as a
          normal one — it&apos;s a label, not a restriction.
        </p>
      </label>

      {!selectedStudentId && (
        <p className="text-xs text-amber-600">Select a student above before submitting.</p>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton disabled={!selectedStudentId} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Enrolling…" : "Enroll student"}
    </Button>
  );
}
