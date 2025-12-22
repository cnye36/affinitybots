import { BlogPostEditor } from "@/components/admin/blog/BlogPostEditor"

export default function NewBlogPostPage() {
  return (
    <div className="container mx-auto py-8">
      <BlogPostEditor mode="create" />
    </div>
  )
}
