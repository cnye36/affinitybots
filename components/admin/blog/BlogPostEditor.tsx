"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Save,
  Eye,
  Upload,
  X,
  Plus,
  ArrowLeft,
  FileUp,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MDXPreview } from "./MDXPreview"

interface BlogPostEditorProps {
  mode: "create" | "edit"
  postId?: string
}

export function BlogPostEditor({ mode, postId }: BlogPostEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form fields
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [author, setAuthor] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [featured, setFeatured] = useState(false)

  // UI state
  const [categoryInput, setCategoryInput] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [activeTab, setActiveTab] = useState("edit")
  const [detailsTab, setDetailsTab] = useState("fields")
  const [frontmatterText, setFrontmatterText] = useState("")
  const [featuredImageInfo, setFeaturedImageInfo] = useState<{
		src?: string
		alt?: string
		width?: number
		height?: number
	} | null>(null)

  // Fetch post data if editing
  useEffect(() => {
    if (mode === "edit" && postId) {
      fetchPost()
    }
  }, [mode, postId])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/blog/${postId}`)
      const data = await response.json()

      if (data.post) {
        const post = data.post
        setTitle(post.title)
        setSlug(post.slug)
        setExcerpt(post.excerpt || "")
        setContent(post.content || "")
        setAuthor(post.author)
        setCoverImage(post.cover_image || "")
        setCategories(post.categories || [])
        setTags(post.tags || [])
        setStatus(post.status)
        setFeatured(post.featured || false)
      }
    } catch (error) {
      console.error("Error fetching post:", error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate slug from title
  useEffect(() => {
    if (mode === "create" && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setSlug(generatedSlug)
    }
  }, [title, slug, mode])

  const handleSave = async (newStatus?: "draft" | "published") => {
    try {
      setSaving(true)

      const postData = {
        title,
        slug,
        excerpt,
        content,
        author,
        cover_image: coverImage,
        categories,
        tags,
        status: newStatus || status,
        featured,
      }

      const url = mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${postId}`
      const method = mode === "create" ? "POST" : "PATCH"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      })

      const data = await response.json()

      if (response.ok) {
        if (mode === "create") {
          router.push("/admin/blog")
        } else {
          alert("Post saved successfully")
        }
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error saving post:", error)
      alert("Failed to save post")
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/blog/upload-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setCoverImage(data.url)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const addCategory = () => {
    if (categoryInput && !categories.includes(categoryInput)) {
      setCategories([...categories, categoryInput])
      setCategoryInput("")
    }
  }

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category))
  }

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleParseFrontmatter = async () => {
    if (!frontmatterText.trim()) {
      alert("Please paste frontmatter YAML content")
      return
    }

    try {
      const response = await fetch("/api/admin/blog/parse-frontmatter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontmatterText }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(`Error: ${data.error || "Failed to parse frontmatter"}`)
        return
      }

      const data = await response.json()
      const parsed = data.parsed

      // Populate all fields from parsed frontmatter
      if (parsed.title) setTitle(parsed.title)
      if (parsed.slug) setSlug(parsed.slug)
      if (parsed.excerpt) setExcerpt(parsed.excerpt)
      if (parsed.author) setAuthor(parsed.author)
      if (parsed.categories && parsed.categories.length > 0) {
        setCategories(parsed.categories)
      }
      if (parsed.tags && parsed.tags.length > 0) {
        setTags(parsed.tags)
      }
      if (parsed.featured !== undefined) setFeatured(parsed.featured)

      // Store featuredImage info for reference (user still needs to upload the actual image)
      if (parsed.featuredImageInfo) {
        setFeaturedImageInfo(parsed.featuredImageInfo)
      } else if (parsed.coverImage) {
        // If coverImage is a string, store it as reference info
        setFeaturedImageInfo({ src: parsed.coverImage })
      } else {
        setFeaturedImageInfo(null)
      }

      // Switch back to fields tab to see populated values
      setDetailsTab("fields")
      alert("Frontmatter parsed successfully! Fields have been populated.")
    } catch (error) {
      console.error("Error parsing frontmatter:", error)
      alert("Failed to parse frontmatter. Please check the YAML syntax.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "create" ? "Create New Post" : "Edit Post"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === "create" ? "Write and publish your blog post" : "Update your blog post"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={saving || !title || !content}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave("published")}
            disabled={saving || !title || !content}
          >
            {saving ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={detailsTab} onValueChange={setDetailsTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fields">Fields</TabsTrigger>
                  <TabsTrigger value="frontmatter">Frontmatter</TabsTrigger>
                </TabsList>

                <TabsContent value="fields" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter post title..."
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="post-url-slug"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL: /blog/{slug || "post-slug"}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Brief description of the post..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Author name"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="frontmatter" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="frontmatter">Paste Frontmatter YAML</Label>
                    <Textarea
                      id="frontmatter"
                      value={frontmatterText}
                      onChange={(e) => setFrontmatterText(e.target.value)}
                      placeholder={`---\ntitle: "Your Post Title"\ndescription: "Post description"\nauthor: "Author Name"\ncategories:\n  - Category 1\n  - Category 2\ntags:\n  - Tag 1\n  - Tag 2\nfeaturedImage:\n  src: "/blog-images/image.png"\n  alt: "Image description"\n---`}
                      rows={15}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Paste your frontmatter YAML here. Click "Parse & Fill Fields" to automatically populate all fields.
                    </p>
                  </div>
                  <Button
                    onClick={handleParseFrontmatter}
                    className="w-full"
                    type="button"
                  >
                    Parse & Fill Fields
                  </Button>
                  {featuredImageInfo && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-semibold mb-2">Featured Image Reference:</p>
                      <p><strong>Path:</strong> {featuredImageInfo.src || "N/A"}</p>
                      {featuredImageInfo.alt && (
                        <p><strong>Alt Text:</strong> {featuredImageInfo.alt}</p>
                      )}
                      {(featuredImageInfo.width || featuredImageInfo.height) && (
                        <p>
                          <strong>Dimensions:</strong>{" "}
                          {featuredImageInfo.width || "?"} × {featuredImageInfo.height || "?"}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Please upload the cover image using the upload button in the sidebar.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="mt-4">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your MDX content here..."
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports MDX formatting, custom components, and markdown syntax
                  </p>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div className="prose prose-lg dark:prose-invert max-w-none min-h-[500px] border rounded-lg p-6">
                    <MDXPreview content={content} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coverImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setCoverImage("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload cover image
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="max-w-full"
                  />
                </div>
              )}

              {featuredImageInfo && !coverImage && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <p className="font-semibold mb-1 text-blue-900 dark:text-blue-100">
                    Reference from frontmatter:
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    <strong>Expected path:</strong> {featuredImageInfo.src}
                  </p>
                  {featuredImageInfo.alt && (
                    <p className="text-blue-800 dark:text-blue-200 mt-1">
                      <strong>Alt text:</strong> {featuredImageInfo.alt}
                    </p>
                  )}
                </div>
              )}

              {uploading && (
                <p className="text-sm text-muted-foreground text-center">
                  Uploading...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                  placeholder="Add category..."
                />
                <Button onClick={addCategory} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                    <button
                      onClick={() => removeCategory(category)}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Post</Label>
                <Switch
                  id="featured"
                  checked={featured}
                  onCheckedChange={setFeatured}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
