import { BlogPostEditor } from "@/components/admin/blog/BlogPostEditor"
import { notFound } from "next/navigation"

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <BlogPostEditor mode="edit" postId={id} />
    </div>
  )
}
