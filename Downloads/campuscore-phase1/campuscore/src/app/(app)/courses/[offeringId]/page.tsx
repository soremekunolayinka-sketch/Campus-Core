import { notFound, redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getCourseWorkspaceData } from "@/lib/data/course-workspace";
import { uploadResource } from "@/lib/data/resource-actions";
import { ResourceUploadForm } from "@/components/course/resource-upload-form";
import { isClassGovernorFor, isCourseRepFor, isOrgAdminOrAbove } from "@/lib/auth/permissions";

const CATEGORY_LABELS: Record<string, string> = {
  lecture_note: "Lecture note",
  past_question: "Past question",
  external_link: "External link",
  other: "Other"
};

export default async function CourseWorkspacePage({ params }: { params: { offeringId: string } }) {
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/login");

  const data = await getCourseWorkspaceData(params.offeringId, ctx.userId);

  if (!data.found || !data.offering) notFound();

  if (!data.hasAccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-slate-900">You don&apos;t have access to this course</h1>
        <p className="mt-2 text-sm text-slate-500">
          Course access is controlled by enrollment. If you believe you should have access — including a
          carryover, repeat, or elective — contact an administrator.
        </p>
      </div>
    );
  }

  const canUpload =
    isCourseRepFor(ctx, data.offering.id) ||
    (data.organizationId && isClassGovernorFor(ctx, data.organizationId, data.offering.level)) ||
    (data.organizationId && isOrgAdminOrAbove(ctx, data.organizationId, ctx.universityId ?? undefined));

  const boundUpload = uploadResource.bind(null, data.offering.id);

  const approvedResources = data.resources.filter((r) => r.moderationStatus === "approved");
  const ownPendingResources = data.resources.filter(
    (r) => r.moderationStatus !== "approved" && r.uploadedByUserId === ctx.userId
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {data.offering.level}L · {data.offering.status === "C" ? "Compulsory" : data.offering.status === "E" ? "Elective" : "Restricted"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {data.offering.courseCode} — {data.offering.courseTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{data.offering.units} units</p>
        {data.offering.description && <p className="mt-3 text-sm text-slate-600">{data.offering.description}</p>}
      </header>

      {/* Lecturer information */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Lecturers</h2>
        {data.lecturers.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No lecturer assigned yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.lecturers.map((l) => (
              <li key={l.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <p className="font-medium text-slate-900">
                  {l.title} {l.fullName}
                </p>
                {l.email && <p className="text-slate-500">{l.email}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Learning resources */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Resources</h2>

        <ul className="mt-3 space-y-2">
          {approvedResources.map((r) => (
            <ResourceRow key={r.id} resource={r} />
          ))}
          {approvedResources.length === 0 && (
            <p className="text-sm text-slate-400">No approved resources yet.</p>
          )}
        </ul>

        {ownPendingResources.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Your pending submissions</p>
            <ul className="mt-2 space-y-2">
              {ownPendingResources.map((r) => (
                <ResourceRow key={r.id} resource={r} showStatus />
              ))}
            </ul>
          </div>
        )}

        {canUpload && (
          <div className="mt-4">
            <ResourceUploadForm action={boundUpload} />
          </div>
        )}
      </section>
    </div>
  );
}

function ResourceRow({
  resource,
  showStatus
}: {
  resource: { id: string; title: string; category: string; downloadUrl: string | null; moderationStatus: string };
  showStatus?: boolean;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
      <div>
        <p className="font-medium text-slate-900">{resource.title}</p>
        <p className="text-xs text-slate-400">
          {CATEGORY_LABELS[resource.category] ?? resource.category}
          {showStatus && ` · ${resource.moderationStatus.replace("_", " ")}`}
        </p>
      </div>
      {resource.downloadUrl && (
        <a href={resource.downloadUrl} className="text-sm text-brand hover:underline" target="_blank" rel="noreferrer">
          Download
        </a>
      )}
    </li>
  );
}
