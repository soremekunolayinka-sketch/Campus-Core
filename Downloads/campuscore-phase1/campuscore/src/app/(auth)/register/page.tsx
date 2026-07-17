"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Phase 1 seeds exactly one organization (CESS/BOUESTI), so it's hardcoded
// here as a starting point. From Phase 2 onward this becomes a dropdown
// populated from the `organizations` table (or an invite-link flow) once
// more than one tenant exists — see Blueprint v3 §3 (Bulk Import) and the
// roadmap note on University Admin onboarding.
const DEFAULT_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000004";
const DEFAULT_UNIVERSITY_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_DEPARTMENT_ID = "00000000-0000-0000-0000-000000000003";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentLevel, setCurrentLevel] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? "Could not create account.");
      setLoading(false);
      return;
    }

    // Profile-completion step (Blueprint v2 §2.3): the auth account exists,
    // now create the matching `users` row. Every default role a student
    // holds is implicit (there's no row needed for the base "student" role
    // — access is granted via Enrollment, not a role grant, per Blueprint v3 §1).
    const { error: profileError } = await supabase.from("users").insert({
      auth_id: signUpData.user.id,
      email,
      full_name: fullName,
      matric_number: matricNumber || null,
      university_id: DEFAULT_UNIVERSITY_ID,
      department_id: DEFAULT_DEPARTMENT_ID,
      organization_id: DEFAULT_ORGANIZATION_ID,
      current_level: Number(currentLevel)
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Create your CampusCore account</h1>
        <p className="mt-1 text-sm text-slate-500">Civil Engineering Scholars&apos; Society — BOUESTI</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label htmlFor="matricNumber" className="block text-sm font-medium text-slate-700">
              Matric number
            </label>
            <input
              id="matricNumber"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label htmlFor="currentLevel" className="block text-sm font-medium text-slate-700">
              Current level
            </label>
            <select
              id="currentLevel"
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {["100", "200", "300", "400", "500"].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl} Level
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Used for dashboard personalization only — course access is controlled by enrollment.
            </p>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a href="/login" className="text-brand hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
