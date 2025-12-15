import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server"; // Assuming same Supabase client setup
import { requireAdmin } from "@/lib/admin/requireAdmin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("early_access_invites")
      .select("*") // Select all columns
      .order("requested_at", { ascending: false }); // Order by most recent requests

    if (error) {
      console.error("Error fetching early access requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch early access requests" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/admin/early-access-requests:",
      error
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
