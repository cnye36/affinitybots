const nextConfig = {
  // Memory and performance optimizations
  experimental: {
    // Optimize bundle size - tree-shake unused exports
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
      'date-fns',
      'framer-motion',
    ],
    // Enable MDX support
    mdxRs: true,
  },
  
  // Server external packages (moved from experimental.serverComponentsExternalPackages)
  // These packages are marked as external to prevent bundling in server components
  serverExternalPackages: [
    '@langchain/core',
    '@langchain/langgraph',
    '@modelcontextprotocol/sdk',
    'bullmq',
    'ioredis',
    'pg',
  ],
  
  // Support MDX files as pages
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Webpack optimizations - simplified to avoid module issues
  webpack: (config, { dev, isServer }) => {
    // Reduce memory usage in development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    
    // Note: The "big strings" webpack warning is informational and expected in large apps.
    // It occurs when webpack caches large source files (>125KB). This is normal for complex
    // applications and doesn't affect build correctness, only cache deserialization performance.
    
    // Suppress Edge Runtime warnings for Supabase packages
    // These warnings occur because Supabase checks for Node.js APIs (process.versions, process.version)
    // for feature detection, but the code still works correctly in Edge Runtime.
    // The @supabase/ssr package is designed to work in Edge Runtime - these are just informational warnings.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@supabase\/(realtime-js|supabase-js)/,
        message: /A Node\.js API is used.*which is not supported in the Edge Runtime/,
      },
    ];
    
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Large vendor chunks
            reactflow: {
              name: 'reactflow',
              test: /[\\/]node_modules[\\/]reactflow[\\/]/,
              priority: 40,
            },
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 30,
            },
            langchain: {
              name: 'langchain',
              test: /[\\/]node_modules[\\/]@langchain[\\/]/,
              priority: 20,
            },
            radix: {
              name: 'radix-ui',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 10,
            },
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 5,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Reduce memory usage
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        source: "/((?!.*\\.pdf$).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://api.AffinityBots.click" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "github.githubassets.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.notion.so",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.hubspot.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.make.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "huggingface.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "asana.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "legal.hubspot.com",
        port: "",
        pathname: "/**",
        },
      {
        protocol: "https",
        hostname: "supabase.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ssl.gstatic.com",
        port: "",
        pathname: "/**",
      },
      
      {
        protocol: "https",
        hostname: "cdn.zapier.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.firecrawl.dev",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.browserbase.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.prisma.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.snowflake.com",
        port: "",
        pathname: "/**",
      },
      
      {
        protocol: "https",
        hostname: "dt-cdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a0.awsstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "brave.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
