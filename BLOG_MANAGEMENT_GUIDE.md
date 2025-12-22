# Blog Management System - User Guide

## Overview

Your blog now supports two ways to create and publish content:

1. **Admin Dashboard** (NEW) - Web-based interface at `/admin/blog`
2. **MDX Files** (LEGACY) - Traditional file-based approach in `content/blog/`

Both methods work seamlessly together!

---

## Getting Started

### 1. Run the Database Migration

First, apply the new database schema:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration file in Supabase Studio
```

The migration file is located at:
`supabase/migrations/20251221000002_create_blog_posts_table.sql`

### 2. (Optional) Migrate Existing MDX Posts

To import your existing 16 MDX blog posts into the database:

```bash
npx tsx scripts/migrate-blog-to-db.ts
```

**Note:** This is optional! Your existing MDX files will continue to work even without migration. However, migrating them allows you to edit them in the admin interface.

---

## Using the Admin Interface

### Creating a New Post

1. Go to `/admin/blog` in your dashboard
2. Click "**New Post**"
3. Fill in the form:
   - **Title** - Your blog post title (slug auto-generates)
   - **Excerpt** - Short description (shown in post cards)
   - **Author** - Your name
   - **Cover Image** - Upload an image or paste a URL
   - **Categories** - Add categories (e.g., "AI Agents", "Tutorials")
   - **Tags** - Add searchable tags
   - **Content** - Write your MDX content

4. Use the tabs to switch between:
   - **Edit** - Write your content
   - **Preview** - See how it will look

5. Choose an action:
   - **Save Draft** - Save without publishing
   - **Publish** - Make it live immediately

### Editing an Existing Post

1. Go to `/admin/blog`
2. Find your post in the table
3. Click the **⋮** menu → **Edit**
4. Make your changes
5. Click **Save Draft** or **Publish**

### Managing Posts

From the `/admin/blog` page, you can:

- **Search** posts by title or excerpt
- **Filter** by status (Draft, Published, Archived)
- **Filter** by category
- **Preview** posts before publishing
- **Publish/Unpublish** with one click
- **Delete** posts

---

## Writing MDX Content

The editor supports full MDX syntax, including:

### Basic Markdown
```markdown
# Heading 1
## Heading 2

**Bold text**
*Italic text*

- Bullet list
1. Numbered list

[Link text](https://example.com)

![Alt text](/images/example.png)
```

### Code Blocks
\`\`\`typescript
const greeting = "Hello, world!"
console.log(greeting)
\`\`\`

### Custom Components

Your blog already supports these custom components:

```mdx
<Callout type="info" title="Important">
This is an info callout
</Callout>

<Alert type="success">
Operation completed successfully!
</Alert>

<Image
  src="/blog-images/example.png"
  alt="Description"
  width={1200}
  height={600}
/>
```

---

## Image Uploads

### Uploading Cover Images

1. Click the **Upload** area in the "Cover Image" card
2. Select an image (max 5MB, JPEG/PNG/GIF/WebP)
3. Image automatically uploads to Supabase Storage
4. URL is saved with your post

### Using Images in Content

You can reference uploaded images in your MDX content:

```mdx
![My screenshot](/blog-images/my-screenshot.png)
```

---

## URL Structure

Posts are accessible at:
```
https://yourdomain.com/blog/{slug}
```

The slug is auto-generated from your title, but you can customize it in the editor.

**Examples:**
- Title: "Building Your First AI Agent"
- Slug: `building-your-first-ai-agent`
- URL: `/blog/building-your-first-ai-agent`

---

## Draft vs. Published

### Draft
- Visible only in admin interface
- NOT shown on public blog
- Can be edited freely
- Shows "Draft" badge

### Published
- Visible on public blog at `/blog`
- Sets `published_at` timestamp
- Shows "Published" badge
- Can be unpublished anytime

### Archived
- Hidden from public blog
- Preserved in database
- Can be restored to published later

---

## Categories & Tags

### Categories
- Used for main topic organization
- Shown as filter options on blog page
- First category used as primary badge
- Examples: "AI Agents", "Tutorials", "Case Studies"

### Tags
- Used for searchability
- Shown below post content
- Examples: "automation", "productivity", "getting-started"

---

## Best Practices

1. **Always add an excerpt** - It appears in search results and post cards
2. **Use cover images** - Posts with images get more clicks
3. **Add multiple categories** - Helps with discoverability
4. **Use descriptive slugs** - Good for SEO
5. **Preview before publishing** - Check formatting
6. **Save drafts frequently** - Auto-save every 30 seconds (coming soon)

---

## API Endpoints

If you want to integrate programmatically:

```
GET    /api/admin/blog                 # List all posts
GET    /api/admin/blog/{id}            # Get single post
POST   /api/admin/blog                 # Create post
PATCH  /api/admin/blog/{id}            # Update post
DELETE /api/admin/blog/{id}            # Delete post
POST   /api/admin/blog/upload-image    # Upload image
```

All endpoints require authentication.

---

## Migration Notes

### Database Takes Precedence
- If a post exists in both database and MDX file with the same slug, the database version is shown
- Your existing MDX files remain untouched
- You can keep using MDX files if you prefer

### Backward Compatibility
- All existing blog URLs continue to work
- `/blog` page shows posts from both sources
- No breaking changes to your current setup

---

## Troubleshooting

### "Post not found" error
- Check the slug is correct
- Ensure post status is "published"
- Verify post exists in database or MDX file

### Images not displaying
- Check image URL is accessible
- Ensure proper file permissions in Supabase Storage
- Verify bucket is public

### Can't see new post on blog
- Confirm status is set to "published"
- Check `published_at` date is not in the future
- Try refreshing the page

---

## Next Steps

### Optional Enhancements (Not Yet Implemented)

1. **Auto-save** - Drafts save every 30 seconds
2. **Revision history** - Track changes over time
3. **Scheduled publishing** - Set future publish dates
4. **Bulk actions** - Publish multiple drafts at once
5. **SEO preview** - See Google search preview
6. **Analytics** - View counts and engagement

Let me know if you'd like any of these features!

---

## Support

For issues or questions:
- Check this guide first
- Review error messages in browser console
- Check Supabase logs for database errors

Happy blogging! 🎉
