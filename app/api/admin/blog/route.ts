import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { createClient } from "@/supabase/server"

// GET - List all blog posts with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const supabaseAdmin = getSupabaseAdmin()
    let query = supabaseAdmin
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Filter by category
    if (category) {
      query = query.contains("categories", [category])
    }

    // Search in title and excerpt
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching blog posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Error in GET /api/admin/blog:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      cover_image,
      categories,
      tags,
      status,
      featured,
      meta_description,
      meta_keywords,
    } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Calculate read time from content
    const { data: readTimeData } = await supabaseAdmin
      .rpc("calculate_read_time", { content_text: content } as any)

    const postData = {
      title,
      slug: slug || null, // Will be auto-generated if null
      excerpt: excerpt || "",
      content,
      author: author || user.email || "Anonymous",
      cover_image: cover_image || null,
      categories: categories || [],
      tags: tags || [],
      status: status || "draft",
      featured: featured || false,
      user_id: user.id,
      read_time: readTimeData || "1 min read",
      meta_description: meta_description || excerpt,
      meta_keywords: meta_keywords || tags || [],
      published_at: status === "published" ? new Date().toISOString() : null,
    }

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .insert([postData] as any)
      .select()
      .single()

    if (error) {
      console.error("Error creating blog post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/admin/blog:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
