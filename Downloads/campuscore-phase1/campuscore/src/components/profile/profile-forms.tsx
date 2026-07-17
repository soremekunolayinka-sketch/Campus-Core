"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ProfileActionState } from "@/lib/data/profile-actions";

const initialState: ProfileActionState = { error: null, success: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mt-2">
      {pending ? "Saving…" : label}
    </Button>
  );
}

function StatusMessage({ state }: { state: ProfileActionState }) {
  if (state.error) return <p className="mt-2 text-sm text-red-600">{state.error}</p>;
  if (state.success) return <p className="mt-2 text-sm text-green-600">Saved.</p>;
  return null;
}

export function EditNameForm({
  action,
  currentName
}: {
  action: (state: ProfileActionState, formData: FormData) => Promise<ProfileActionState>;
  currentName: string;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction}>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Full name</span>
        <input
          name="full_name"
          defaultValue={currentName}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <StatusMessage state={state} />
      <SubmitButton label="Update name" />
    </form>
  );
}

export function AvatarUploadForm({
  action
}: {
  action: (state: ProfileActionState, formData: FormData) => Promise<ProfileActionState>;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction}>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Avatar</span>
        <input name="avatar" type="file" accept="image/*" required className="mt-1 w-full text-sm" />
      </label>
      <StatusMessage state={state} />
      <SubmitButton label="Upload avatar" />
    </form>
  );
}

export function ChangePasswordForm({
  action
}: {
  action: (state: ProfileActionState, formData: FormData) => Promise<ProfileActionState>;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">New password</span>
        <input
          name="new_password"
          type="password"
          required
          minLength={6}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Confirm new password</span>
        <input
          name="confirm_password"
          type="password"
          required
          minLength={6}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <StatusMessage state={state} />
      <SubmitButton label="Change password" />
    </form>
  );
}
