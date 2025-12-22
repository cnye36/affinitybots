import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { createClient } from "@/supabase/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - Fetch a single blog post by ID
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching blog post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in GET /api/admin/blog/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update a blog post
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
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

    const supabaseAdmin = getSupabaseAdmin()

    // Calculate read time if content changed
    let readTime
    if (content) {
      const { data: readTimeData } = await supabaseAdmin
        .rpc("calculate_read_time", { content_text: content } as any)
      readTime = readTimeData || "1 min read"
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (author !== undefined) updateData.author = author
    if (cover_image !== undefined) updateData.cover_image = cover_image
    if (categories !== undefined) updateData.categories = categories
    if (tags !== undefined) updateData.tags = tags
    if (status !== undefined) {
      updateData.status = status
      // Set published_at when changing to published
      if (status === "published") {
        const { data: currentPost } = await supabaseAdmin
          .from("blog_posts")
          .select("published_at")
          .eq("id", id)
          .single() as { data: { published_at: string | null } | null }

        if (!currentPost?.published_at) {
          updateData.published_at = new Date().toISOString()
        }
      }
    }
    if (featured !== undefined) updateData.featured = featured
    if (meta_description !== undefined) updateData.meta_description = meta_description
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords
    if (readTime) updateData.read_time = readTime

    const { data: post, error } = await (supabaseAdmin
      .from("blog_posts") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating blog post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in PATCH /api/admin/blog/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a blog post
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting blog post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/blog/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
