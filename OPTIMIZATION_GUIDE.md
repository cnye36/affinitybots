# Optimization Guide

This guide provides strategies and tools to optimize the AffinityBots application for better build performance and smaller bundle sizes.

## Quick Start

Run the analysis tools to understand the current state:

```bash
# Analyze file sizes and large components
pnpm analyze:files

# Find potentially unused dependencies
pnpm analyze:deps

# Analyze bundle sizes (requires build first)
pnpm build
pnpm analyze:bundle

# Run all analyses
pnpm analyze:all
```

## Current Optimizations Applied

### 1. Next.js Configuration (`next.config.mjs`)

✅ **Package Import Optimization**
- Tree-shaking enabled for: `@radix-ui/*`, `lucide-react`, `react-icons`, `date-fns`, `framer-motion`
- Reduces bundle size by only including used exports

✅ **Server Components External Packages**
- Large server-side packages marked as external: `@langchain/*`, `bullmq`, `ioredis`, `pg`
- Prevents bundling server-only code in client bundles

✅ **Webpack Code Splitting**
- Separate chunks for: `reactflow`, `framer-motion`, `@langchain/*`, `@radix-ui/*`
- Improves caching and parallel loading

✅ **Memory Optimizations**
- Reduced page buffer length (2 pages)
- Shorter inactive age (25s)
- Optimized watch options in development

### 2. Build Configuration

✅ **Increased Memory Limit**
- Build script uses `NODE_OPTIONS=--max-old-space-size=4096` (4GB)
- Prevents out-of-memory errors during builds

## Optimization Opportunities

### High Priority

#### 1. Remove Duplicate Dependencies

**Issue**: Multiple Supabase packages
- `supabase` (v2.70.5) - **Likely unused**
- `@supabase/supabase-js` (v2.79.0) - **Active**
- `@supabase/ssr` (v0.5.2) - **Active**

**Action**: Remove `supabase` package if not used:
```bash
pnpm remove supabase
```

#### 2. Dynamic Imports for Heavy Components

**Target Components**:
- `WorkflowBuilder` (1442 lines) - Only loaded on `/workflows/[id]`
- `WorkflowCanvas` - Heavy ReactFlow component
- `PlaygroundContainer` - Large playground UI
- `AnalyticsDashboard` - Complex analytics components

**Implementation**:
```tsx
// Instead of:
import { WorkflowBuilder } from "@/components/workflows/v2/WorkflowBuilder"

// Use:
const WorkflowBuilder = dynamic(() => import("@/components/workflows/v2/WorkflowBuilder").then(mod => ({ default: mod.WorkflowBuilder })), {
  loading: () => <WorkflowBuilderSkeleton />,
  ssr: false
})
```

#### 3. Lazy Load Heavy Libraries

**ReactFlow** - Only needed in workflow pages:
```tsx
const ReactFlow = dynamic(() => import('reactflow'), { ssr: false })
```

**Framer Motion** - Many components use it, but can be lazy loaded:
```tsx
const motion = dynamic(() => import('framer-motion'), { ssr: false })
```

#### 4. Split Large Files

**Large Files to Split**:
- `lib/mcp/officialMcpServers.ts` (717 lines) - Split by category
- `components/workflows/v2/WorkflowBuilder.tsx` (1442 lines) - Extract hooks and sub-components
- `lib/agent/reactAgent.ts` (933 lines) - Split into smaller modules

### Medium Priority

#### 5. Remove Unused Packages

Run `pnpm analyze:deps` to find potentially unused packages. Common candidates:
- `react-burger-menu` - Check if still used
- `python-shell` - Verify if needed
- `swr` - Check if TanStack Query replaced it
- `react-toastify` - Check if `sonner` replaced it
- `react-syntax-highlighter` - Check if `react-shiki` replaced it

#### 6. Optimize Icon Imports

**Current**: Many components import entire icon sets
```tsx
import { Clock, Bot, Play } from "lucide-react"
```

**Optimized**: Already handled by `optimizePackageImports`, but verify tree-shaking works.

#### 7. Reduce MCP Server Data

**Issue**: `officialMcpServers.ts` contains large logo URLs and metadata

**Solution**:
- Move logo URLs to CDN or public folder
- Lazy load server metadata
- Split into separate files by category

#### 8. Optimize Images

**Check**:
- Are all images in `public/` optimized?
- Are remote images using Next.js Image component?
- Consider using WebP format

### Low Priority

#### 9. TypeScript Optimization

- Enable `skipLibCheck: true` (already enabled)
- Consider stricter `tsconfig.json` exclusions

#### 10. CSS Optimization

- Review Tailwind CSS purge configuration
- Check for unused CSS classes
- Consider CSS-in-JS optimization if applicable

## Performance Metrics

### Target Metrics

- **Build Time**: < 2 minutes (currently ~1+ minute)
- **First Load JS**: < 200KB per route
- **Bundle Size**: < 5MB total
- **Node Modules**: < 500MB

### Monitoring

Run these commands regularly:
```bash
# Check bundle sizes
pnpm build && pnpm analyze:bundle

# Check dependency sizes
du -sh node_modules

# Check file sizes
pnpm analyze:files
```

## Implementation Checklist

- [ ] Run `pnpm analyze:all` to get baseline
- [ ] Remove duplicate `supabase` package
- [ ] Add dynamic imports for `WorkflowBuilder`
- [ ] Add dynamic imports for `WorkflowCanvas`
- [ ] Split `officialMcpServers.ts` by category
- [ ] Remove unused packages identified by analyzer
- [ ] Verify all images use Next.js Image component
- [ ] Test build time improvements
- [ ] Monitor bundle sizes after changes

## Server-Side Optimizations

### Database Queries

- Review Supabase queries for N+1 problems
- Add database indexes where needed
- Use connection pooling

### API Routes

- Implement response caching where appropriate
- Use streaming for long-running operations
- Optimize middleware execution

### Memory Usage

- Review large in-memory stores (e.g., `sessionStore.ts`)
- Consider Redis for session storage
- Monitor memory usage in production

## Build Performance Tips

1. **Use Turbopack in Development**:
   ```bash
   pnpm dev:turbo
   ```

2. **Incremental Builds**:
   - TypeScript incremental compilation enabled
   - Next.js build cache enabled

3. **Parallel Processing**:
   - Ensure sufficient CPU cores
   - Consider CI/CD with more resources

## Troubleshooting

### Build Fails with Out of Memory

Increase memory limit:
```bash
NODE_OPTIONS=--max-old-space-size=8192 pnpm build
```

### Slow Development Server

1. Use Turbopack: `pnpm dev:turbo`
2. Reduce watch file count
3. Check for large files being watched

### Large Bundle Sizes

1. Run `pnpm analyze:bundle`
2. Check for duplicate dependencies
3. Verify dynamic imports are working
4. Review code splitting configuration

## Additional Resources

- [Next.js Optimization Guide](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Webpack Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) - Consider adding
- [Next.js Bundle Analyzer Setup](https://nextjs.org/docs/app/api-reference/next-config-js/bundleAnalyzer)
