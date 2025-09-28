"use client";

import { MDXRemote } from 'next-mdx-remote';
import { components } from './MDXComponents';

interface MDXContentProps {
  mdxSource: any;
}

export function MDXContent({ mdxSource }: MDXContentProps) {
  if (!mdxSource) {
    return <div className="text-red-400">Error: MDX content not found</div>;
  }

  return <MDXRemote {...mdxSource} components={components} />;
}
