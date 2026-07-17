/**
 * Placeholder types file. Once your Supabase project exists and the
 * migrations in supabase/migrations/ have been applied, replace this file
 * by running:
 *
 *   npm run db:types
 *
 * (requires SUPABASE_PROJECT_ID in your environment — see .env.example).
 * That command introspects your live schema and generates full, accurate
 * types — this hand-written stub only covers enough of the `users` and
 * `user_roles` shape for src/lib/auth/session.ts to type-check before then.
 */
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          email: string;
          full_name: string;
          matric_number: string | null;
          university_id: string | null;
          department_id: string | null;
          organization_id: string | null;
          admission_session_id: string | null;
          current_session_id: string | null;
          current_level: number | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> &
          Pick<Database["public"]["Tables"]["users"]["Row"], "auth_id" | "email" | "full_name">;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          scope_json: Json;
          granted_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_roles"]["Row"]> &
          Pick<Database["public"]["Tables"]["user_roles"]["Row"], "user_id" | "role_id">;
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: string;
        };
        Insert: Partial<Database["public"]["Tables"]["roles"]["Row"]> &
          Pick<Database["public"]["Tables"]["roles"]["Row"], "name">;
        Update: Partial<Database["public"]["Tables"]["roles"]["Row"]>;
        Relationships: [];
      };
      // Minimal stubs for the tables the Phase 1 dashboard reads, so the
      // app type-checks before real generated types exist. Full column
      // sets live in supabase/migrations/0001_init_schema.sql — this file
      // only covers what the current UI touches. Replace entirely with
      // `npm run db:types` once your Supabase project is live.
      courses: {
        Row: {
          id: string;
          department_id: string;
          code: string;
          title: string;
          units: number;
          default_status: "C" | "E" | "R";
          lecture_hours: number | null;
          practical_hours: number | null;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> &
          Pick<Database["public"]["Tables"]["courses"]["Row"], "department_id" | "code" | "title">;
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
        Relationships: [];
      };
      departments: {
        Row: { id: string; faculty_id: string; university_id: string; name: string; slug: string };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      organizations: {
        Row: { id: string; department_id: string; university_id: string; name: string; short_name: string };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      lecturers: {
        Row: {
          id: string;
          department_id: string;
          full_name: string;
          title: string | null;
          email: string | null;
          bio: string | null;
          avatar_url: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          course_offering_id: string;
          title: string;
          description: string | null;
          category: "lecture_note" | "past_question" | "external_link" | "other";
          file_url: string | null;
          file_type: string | null;
          file_size_bytes: number | null;
          uploaded_by_user_id: string;
          moderation_status: "pending_review" | "approved" | "rejected" | "archived";
          moderated_by_user_id: string | null;
          moderated_at: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resources"]["Row"]> &
          Pick<Database["public"]["Tables"]["resources"]["Row"], "course_offering_id" | "title" | "uploaded_by_user_id">;
        Update: Partial<Database["public"]["Tables"]["resources"]["Row"]>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          scope: "university" | "faculty" | "department" | "organization" | "course_offering";
          scope_id: string;
          title: string;
          body: string;
          priority: "low" | "normal" | "high";
          created_by_user_id: string;
          created_at: string;
          expires_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["announcements"]["Row"]> &
          Pick<Database["public"]["Tables"]["announcements"]["Row"], "scope" | "scope_id" | "title" | "body">;
        Update: Partial<Database["public"]["Tables"]["announcements"]["Row"]>;
        Relationships: [];
      };
      announcement_reads: {
        Row: { id: string; user_id: string; announcement_id: string; read_at: string };
        Insert: Pick<Database["public"]["Tables"]["announcement_reads"]["Row"], "user_id" | "announcement_id">;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      course_offerings: {
        Row: {
          id: string;
          course_id: string;
          semester_id: string;
          level: number;
          status: "C" | "E" | "R";
          lecturer_ids: string[] | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["course_offerings"]["Row"]> &
          Pick<Database["public"]["Tables"]["course_offerings"]["Row"], "course_id" | "semester_id" | "level">;
        Update: Partial<Database["public"]["Tables"]["course_offerings"]["Row"]>;
        Relationships: [];
      };
      semesters: {
        Row: { id: string; academic_session_id: string; name: string; is_active: boolean };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      academic_sessions: {
        Row: { id: string; organization_id: string; name: string; is_active: boolean };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_offering_id: string;
          academic_session_id: string;
          semester_id: string;
          enrollment_type: "normal" | "carryover" | "repeat" | "elective" | "special_approval";
          status: "active" | "completed" | "withdrawn" | "pending_approval" | "rejected";
          approved_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enrollments"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["enrollments"]["Row"],
            "student_id" | "course_offering_id" | "semester_id" | "academic_session_id"
          >;
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Row"]>;
        Relationships: [];
      };
      registration_windows: {
        Row: {
          id: string;
          semester_id: string;
          opens_at: string;
          closes_at: string;
          requires_approval: boolean;
          max_units_per_student: number | null;
          created_by_user_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["registration_windows"]["Row"]> &
          Pick<Database["public"]["Tables"]["registration_windows"]["Row"], "semester_id" | "opens_at" | "closes_at">;
        Update: Partial<Database["public"]["Tables"]["registration_windows"]["Row"]>;
        Relationships: [];
      };
      timetable_slots: {
        Row: {
          id: string;
          course_offering_id: string;
          lecturer_id: string | null;
          venue: string | null;
          day_of_week: number | null;
          start_time: string;
          end_time: string;
          session_type: "lecture" | "practical" | "exam";
          exam_date: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["timetable_slots"]["Row"]> &
          Pick<Database["public"]["Tables"]["timetable_slots"]["Row"], "course_offering_id" | "start_time" | "end_time">;
        Update: Partial<Database["public"]["Tables"]["timetable_slots"]["Row"]>;
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          type: "registration" | "test" | "exam" | "holiday" | "milestone" | "add_drop_deadline";
          start_date: string;
          end_date: string | null;
          description: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["calendar_events"]["Row"]> &
          Pick<Database["public"]["Tables"]["calendar_events"]["Row"], "organization_id" | "title" | "type" | "start_date">;
        Update: Partial<Database["public"]["Tables"]["calendar_events"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      enroll_student: {
        Args: {
          p_student_id: string;
          p_course_offering_id: string;
          p_enrollment_type?: "normal" | "carryover" | "repeat" | "elective" | "special_approval";
        };
        Returns: Database["public"]["Tables"]["enrollments"]["Row"];
      };
      register_for_course: {
        Args: { p_course_offering_id: string };
        Returns: Database["public"]["Tables"]["enrollments"]["Row"];
      };
      drop_course: {
        Args: { p_enrollment_id: string };
        Returns: Database["public"]["Tables"]["enrollments"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
