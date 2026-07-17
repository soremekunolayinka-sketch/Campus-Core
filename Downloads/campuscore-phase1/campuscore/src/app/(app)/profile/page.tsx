import Image from "next/image";
import { getCurrentUserContext } from "@/lib/auth/session";
import { highestRoleLabel } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateProfileName, updateAvatar, changePassword } from "@/lib/data/profile-actions";
import { EditNameForm, AvatarUploadForm, ChangePasswordForm } from "@/components/profile/profile-forms";

export default async function ProfilePage() {
  const ctx = await getCurrentUserContext();
  if (!ctx) return null; // layout already redirects; satisfies TS

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("matric_number, current_level, avatar_url")
    .eq("id", ctx.userId)
    .single();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>

      <div className="mt-6 flex items-center gap-4">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={ctx.fullName}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-500">
            {ctx.fullName.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-medium text-slate-900">{ctx.fullName}</p>
          <p className="text-sm text-slate-500">{highestRoleLabel(ctx)}</p>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        <Row label="Email" value={ctx.email} />
        <Row label="Matric number" value={profile?.matric_number ?? "—"} />
        <Row label="Current level" value={profile?.current_level ? `${profile.current_level} Level` : "—"} />
      </dl>
      <p className="mt-2 text-xs text-slate-400">
        Matric number and level are administrative fields and aren&apos;t self-editable here.
      </p>

      <div className="mt-8 space-y-6">
        <Panel title="Edit name">
          <EditNameForm action={updateProfileName} currentName={ctx.fullName} />
        </Panel>

        <Panel title="Change avatar">
          <AvatarUploadForm action={updateAvatar} />
        </Panel>

        <Panel title="Change password">
          <ChangePasswordForm action={changePassword} />
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-medium text-slate-700">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
