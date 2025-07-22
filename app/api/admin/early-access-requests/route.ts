import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server"; // Assuming same Supabase client setup
import logger from "@/lib/logger";

export async function GET(request: Request) {
  // TODO: Implement robust admin authentication/authorization here
  // For example, check if the user has an 'admin' role or specific permissions.
  // If not authorized, return a 401 or 403 error.
  // const { user } = await validateUser(request); // Hypothetical auth function
  // if (!user || user.role !== 'admin') {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("early_access_invites")
      .select("*") // Select all columns
      .order("requested_at", { ascending: false }); // Order by most recent requests

    if (error) {
      logger.error("Error fetching early access requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch early access requests" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error(
      "Unexpected error in GET /api/admin/early-access-requests:",
      error
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
