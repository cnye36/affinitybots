import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { components } from './MDXComponents';

interface MDXContentProps {
  mdxSource: any;
}

export function MDXContent({ mdxSource }: MDXContentProps) {
  if (!mdxSource) {
    return <div className="text-red-400">Error: MDX content not found</div>;
  }

  return (
    <MDXRemote 
      source={mdxSource}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm, remarkFrontmatter], rehypePlugins: [] } }}
      components={components}
    />
  );
}
