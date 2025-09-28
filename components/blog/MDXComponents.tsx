
import React from 'react';
// MDX components mapping used by next-mdx-remote/rsc
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Lightbulb, 
  ExternalLink,
  Code,
  Quote
} from 'lucide-react';

// Custom components for MDX content
const components = {
  // Headings with custom styling
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 
      className="text-3xl font-bold text-foreground mb-5 mt-8 first:mt-0 border-b border-gray-300 dark:border-gray-700 pb-3" 
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 
      className="text-2xl font-bold text-blue-600 dark:text-blue-300 mb-3 mt-8 first:mt-0" 
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 
      className="text-xl font-semibold text-blue-600 dark:text-blue-300 mb-2.5 mt-6 first:mt-0" 
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 
      className="text-lg font-semibold text-blue-600 dark:text-blue-300 mb-2 mt-4 first:mt-0" 
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 
      className="text-base font-semibold text-blue-600 dark:text-blue-300 mb-2 mt-4 first:mt-0" 
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 
      className="text-sm font-semibold text-blue-600 dark:text-blue-300 mb-2 mt-4 first:mt-0" 
      {...props}
    >
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Links
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a 
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline decoration-blue-600/50 dark:decoration-blue-400/50 hover:decoration-blue-500 dark:hover:decoration-blue-300 transition-colors duration-200 inline-flex items-center gap-1"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
      {href?.startsWith('http') && <ExternalLink className="h-3 w-3" />}
    </a>
  ),

  // Lists
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Code blocks
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <Card className="bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 mb-6 overflow-hidden">
      <CardContent className="p-0">
        <pre 
          className="p-4 overflow-x-auto text-sm text-gray-800 dark:text-gray-100 font-mono leading-relaxed" 
          {...props}
        >
          {children}
        </pre>
      </CardContent>
    </Card>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code 
      className="bg-gray-200 dark:bg-gray-800 text-blue-600 dark:text-blue-300 px-2 py-1 rounded text-sm font-mono" 
      {...props}
    >
      {children}
    </code>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <Quote className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
          <blockquote className="text-gray-700 dark:text-gray-300 italic leading-relaxed" {...props}>
            {children}
          </blockquote>
        </div>
      </CardContent>
    </Card>
  ),

  // Tables
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-700" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-gray-300 dark:border-gray-700" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th 
      className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-gray-800 dark:text-gray-200 font-semibold" 
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td 
      className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300" 
      {...props}
    >
      {children}
    </td>
  ),

  // Horizontal rule
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="border-gray-300 dark:border-gray-700 my-8" {...props} />
  ),

  // Custom alert components
  Alert: ({ children, type = 'info', ...props }: { 
    children: React.ReactNode; 
    type?: 'info' | 'warning' | 'error' | 'success' | 'tip';
    [key: string]: any;
  }) => {
    const alertConfig = {
      info: { 
        icon: Info, 
        className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-300' 
      },
      warning: { 
        icon: AlertCircle, 
        className: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50 text-yellow-600 dark:text-yellow-300' 
      },
      error: { 
        icon: AlertCircle, 
        className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-300' 
      },
      success: { 
        icon: CheckCircle, 
        className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50 text-green-600 dark:text-green-300' 
      },
      tip: { 
        icon: Lightbulb, 
        className: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/50 text-purple-600 dark:text-purple-300' 
      },
    };

    const config = alertConfig[type];
    const Icon = config.icon;

    return (
      <Alert className={`${config.className} mb-6`} {...props}>
        <Icon className="h-4 w-4" />
        <AlertDescription className="text-gray-700 dark:text-gray-300">
          {children}
        </AlertDescription>
      </Alert>
    );
  },

  // Code block with language
  CodeBlock: ({ children, language, ...props }: { 
    children: React.ReactNode; 
    language?: string;
    [key: string]: any;
  }) => (
    <Card className="bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 mb-6 overflow-hidden" {...props}>
      <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-700 flex items-center gap-2">
        <Code className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        {language && (
          <Badge variant="secondary" className="text-xs">
            {language}
          </Badge>
        )}
      </div>
      <CardContent className="p-0">
        <pre className="p-4 overflow-x-auto text-sm text-gray-800 dark:text-gray-100 font-mono leading-relaxed">
          {children}
        </pre>
      </CardContent>
    </Card>
  ),

  // Callout component
  Callout: ({ children, type = 'info', title, ...props }: { 
    children: React.ReactNode; 
    type?: 'info' | 'warning' | 'error' | 'success' | 'tip';
    title?: string;
    [key: string]: any;
  }) => {
    const alertConfig = {
      info: { 
        icon: Info, 
        className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50' 
      },
      warning: { 
        icon: AlertCircle, 
        className: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50' 
      },
      error: { 
        icon: AlertCircle, 
        className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50' 
      },
      success: { 
        icon: CheckCircle, 
        className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50' 
      },
      tip: { 
        icon: Lightbulb, 
        className: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/50' 
      },
    };

    const config = alertConfig[type];
    const Icon = config.icon;

    return (
      <Card className={`${config.className} mb-6`} {...props}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 mt-1 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              {title && (
                <h4 className="font-semibold text-foreground mb-2">{title}</h4>
              )}
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {children}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },

  // Next.js Image component
  Image: ({ src, alt, width, height, className, priority, sizes, ...props }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    sizes?: string;
    [key: string]: any;
  }) => (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
      {...props}
    />
  ),
};

// Export components for direct use
export { components };
