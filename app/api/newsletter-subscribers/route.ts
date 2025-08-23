import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all newsletter subscribers
    const { data: subscribers, error } = await supabase
      .from("early_access_invites")
      .select("email, name, organization, requested_at")
      .eq("newsletter", true)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Error fetching newsletter subscribers:", error);
      return NextResponse.json(
        { error: "Failed to fetch newsletter subscribers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscribers,
      count: subscribers?.length || 0,
    });
  } catch (error) {
    console.error("Error in newsletter subscribers API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
