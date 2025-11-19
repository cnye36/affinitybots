import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Doc {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  content?: string;
  mdxSource?: any;
}

const contentDirectory = path.join(process.cwd(), 'docs', 'app-documentation');

export async function getAllDocs(): Promise<Doc[]> {
  try {
    if (!fs.existsSync(contentDirectory)) {
      return [];
    }

    const fileNames = fs.readdirSync(contentDirectory);
    const allDocsData = await Promise.all(
      fileNames
        .filter(name => name.endsWith('.mdx'))
        .map(async (fileName) => {
          const slug = fileName.replace(/\.mdx$/, '');
          return await getDocBySlug(slug);
        })
    );

    // Sort docs by date (newest first) or by some order field if we add one
    return allDocsData
      .filter(doc => doc !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error reading docs:', error);
    return [];
  }
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || '',
      excerpt: data.excerpt || '',
      date: data.date || '',
      readTime: data.readTime || '',
      category: data.category || '',
      content,
    };
  } catch (error) {
    console.error(`Error reading doc ${slug}:`, error);
    return null;
  }
}

export async function getDocWithMDX(slug: string): Promise<{
  doc: Doc;
  mdxSource: any;
} | null> {
  try {
    const doc = await getDocBySlug(slug);
    
    if (!doc || !doc.content) {
      return null;
    }

    // Return raw MDX string; render with next-mdx-remote/rsc at usage site
    const mdxSource = doc.content;

    return { doc, mdxSource };
  } catch (error) {
    console.error(`Error processing MDX for ${slug}:`, error);
    return null;
  }
}
