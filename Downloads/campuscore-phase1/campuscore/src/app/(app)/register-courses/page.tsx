import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getRegistrationPageData, type RegistrationOffering } from "@/lib/data/registration";
import { RegisterButton, DropButton } from "@/components/registration/registration-buttons";

const STATUS_LABELS: Record<string, string> = {
  active: "Approved",
  pending_approval: "Pending",
  completed: "Completed",
  rejected: "Rejected",
  withdrawn: "Withdrawn"
};

export default async function RegisterCoursesPage() {
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/login");

  const data = await getRegistrationPageData(ctx.userId, ctx.currentLevel);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Course Registration</h1>
      <p className="mt-1 text-sm text-slate-500">
        Register for {ctx.currentLevel ?? "your"} Level courses this semester. Carryover, repeat, elective
        overrides, or courses outside your level are handled by an administrator.
      </p>

      <WindowBanner data={data} />

      {/* Already registered */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Registered courses</h2>
          <span className="text-sm text-slate-500">
            {data.totalRegisteredUnits} unit{data.totalRegisteredUnits === 1 ? "" : "s"}
            {data.window?.maxUnits ? ` / ${data.window.maxUnits} max` : ""}
          </span>
        </div>
        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {data.registeredCourses.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No courses registered yet.</p>
          )}
          {data.registeredCourses.map((c) => (
            <div key={c.enrollmentId} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">
                  {c.courseCode} <span className="font-normal text-slate-500">{c.courseTitle}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {c.units} units ·{" "}
                  <span
                    className={
                      c.status === "pending_approval"
                        ? "text-amber-600"
                        : c.status === "rejected"
                          ? "text-red-600"
                          : "text-green-600"
                    }
                  >
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </p>
              </div>
              {(c.status === "active" || c.status === "pending_approval") && data.windowState === "open" && (
                <DropButton enrollmentId={c.enrollmentId} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Available to register */}
      {data.windowState === "open" && (
        <>
          <OfferingSection title="Compulsory courses" offerings={data.compulsoryOfferings} data={data} />
          <OfferingSection title="Elective courses" offerings={data.electiveOfferings} data={data} />
        </>
      )}
    </div>
  );
}

function WindowBanner({ data }: { data: Awaited<ReturnType<typeof getRegistrationPageData>> }) {
  if (data.windowState === "none") {
    return (
      <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        No registration period has been scheduled yet for the current semester.
      </p>
    );
  }
  if (data.windowState === "upcoming") {
    return (
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Registration opens {new Date(data.window!.opensAt).toLocaleString()}.
      </p>
    );
  }
  if (data.windowState === "closed") {
    return (
      <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Registration closed {new Date(data.window!.closesAt).toLocaleString()}. Contact an administrator for
        late registration or corrections.
      </p>
    );
  }
  return (
    <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      Registration is open until {new Date(data.window!.closesAt).toLocaleString()}
      {data.window?.requiresApproval && " — submitted courses require admin approval before they're active."}
    </p>
  );
}

function OfferingSection({
  title,
  offerings,
  data
}: {
  title: string;
  offerings: RegistrationOffering[];
  data: Awaited<ReturnType<typeof getRegistrationPageData>>;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-slate-700">{title}</h2>
      <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {offerings.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">None available for your level this semester.</p>
        )}
        {offerings.map((o) => {
          const wouldExceed = !!data.window?.maxUnits && data.totalRegisteredUnits + o.units > data.window.maxUnits;
          return (
            <div key={o.offeringId} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">
                  {o.courseCode} <span className="font-normal text-slate-500">{o.courseTitle}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{o.units} units</p>
              </div>
              <RegisterButton
                offeringId={o.offeringId}
                disabled={wouldExceed}
                disabledReason={wouldExceed ? `Would exceed the ${data.window?.maxUnits}-unit limit` : undefined}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
