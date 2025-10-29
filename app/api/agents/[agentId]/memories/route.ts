import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
type StoreRow = {
  prefix: string;
  key: string;
  value: any;
  created_at: string | null;
  updated_at: string | null;
};

export async function GET(request: NextRequest, props: { params: Promise<{ agentId: string }> }) {
  const params = await props.params;
  try {
    // Create a Supabase client
    const supabase = await createClient();

    // Verify user session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assistantId = params.agentId;

    // Verify user has access to this assistant
    const { data: userAssistant, error: accessError } = await supabase
      .from("user_assistants")
      .select("*")
      .eq("user_id", user.id)
      .eq("assistant_id", assistantId)
      .single();

    if (accessError || !userAssistant) {
      console.error("Access denied or assistant not found:", accessError);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Read memories from platform store table
    const prefixDot = `user_profile.${assistantId}`;
    const prefixJson = JSON.stringify(["user_profile", assistantId]);

    const { data: rows, error: storeError } = await supabase
      .from("store")
      .select("prefix,key,value,created_at,updated_at")
      .in("prefix", [prefixDot, prefixJson])
      .order("updated_at", { ascending: true });
    if (storeError) throw storeError;

    // Format memories for the frontend
    const formattedMemories = (rows as StoreRow[]).map((row) => {
      const { attribute, value, extracted_at, source_message } =
        (row.value || {}) as {
          attribute: string;
          value: unknown;
          extracted_at: string;
          source_message?: string;
        };

      return {
        id: row.key,
        attribute,
        value,
        extracted_at,
        source_message,
      };
    });

    return NextResponse.json(formattedMemories);
  } catch (error) {
    console.error("Error fetching memories:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}
