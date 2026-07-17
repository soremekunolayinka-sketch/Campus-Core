"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ResourceUploadState } from "@/lib/data/resource-actions";

const initialState: ResourceUploadState = { error: null, success: false };

export function ResourceUploadForm({
  action
}: {
  action: (state: ResourceUploadState, formData: FormData) => Promise<ResourceUploadState>;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-dashed border-slate-300 p-4">
      <p className="text-sm font-medium text-slate-700">Upload a resource</p>
      <input
        name="title"
        placeholder="Title"
        required
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <select name="category" defaultValue="lecture_note" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="lecture_note">Lecture note</option>
        <option value="past_question">Past question</option>
        <option value="external_link">External link</option>
        <option value="other">Other</option>
      </select>
      <input name="file" type="file" required className="w-full text-sm" />
      <p className="text-xs text-slate-400">
        Submitted resources enter Pending Review until an admin approves them (Blueprint v3 §4) — students won&apos;t
        see it until then.
      </p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Uploaded — awaiting review.</p>}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Uploading…" : "Upload"}
    </Button>
  );
}
