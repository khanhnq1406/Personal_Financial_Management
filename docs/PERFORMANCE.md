# Performance Optimization Guide

This document outlines the performance optimization strategies implemented in WealthJourney, including monitoring setup, targets, and best practices.

## Table of Contents

- [Core Web Vitals Targets](#core-web-vitals-targets)
- [Optimization Strategies](#optimization-strategies)
- [Monitoring Setup](#monitoring-setup)
- [Bundle Size Budgets](#bundle-size-budgets)
- [Best Practices](#best-practices)
- [Tools and Resources](#tools-and-resources)

---

## Core Web Vitals Targets

We aim for **90+ scores** across all Core Web Vitals metrics:

| Metric | Target | Threshold (Needs Improvement) | Poor | Measure |
|--------|--------|------------------------------|------|---------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s | Loading performance |
| **FID** (First Input Delay) | < 100ms | 100ms - 300ms | > 300ms | Interactivity |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 | Visual stability |
| **FCP** (First Contentful Paint) | < 1.8s | 1.8s - 3.0s | > 3.0s | Initial paint |
| **TTFB** (Time to First Byte) | < 800ms | 800ms - 1.8s | > 1.8s | Server response |

### Additional Metrics

- **Total Blocking Time (TBT)**: < 300ms
- **Speed Index**: < 3.4s
- **Time to Interactive (TTI)**: < 3.8s

---

## Optimization Strategies

### 1. List Virtualization

**Location**: `/src/wj-client/components/lists/VirtualList.tsx`

We use `react-virtuoso` for efficient rendering of large lists:

```typescript
import { VirtualList } from "@/components/lists/VirtualList";

<VirtualList
  items={transactions}
  renderItem={(item) => <TransactionCard data={item} />}
  keyExtractor={(item) => item.id}
  itemHeight={60}
  height="600px"
  onLoadMore={fetchMore}
  pullToRefresh={refreshData}
/>
```

**Benefits**:
- Only renders visible items + overscan buffer
- Maintains scroll position during updates
- Supports dynamic item heights
- Pull-to-refresh support

### 2. Image Optimization

**Location**: `/src/wj-client/components/OptimizedImage.tsx`

Using Next.js Image component with custom wrapper:

```typescript
import { OptimizedImage, Avatar } from "@/components/OptimizedImage";

<Avatar
  src="/avatar.jpg"
  alt="User avatar"
  size="md"
  priority={false}
  fallback="/default-avatar.png"
/>
```

**Features**:
- Automatic WebP conversion
- Blur placeholders during load
- Responsive sizing
- Lazy loading by default
- Fallback on error

### 3. Code Splitting

**Location**: `/src/wj-client/components/lazy/OptimizedComponents.tsx`

Dynamic imports for heavy components:

```typescript
import {
  TanStackTable,
  InvestmentDetailModal,
  BalanceChart,
} from "@/components/lazy/OptimizedComponents";

// Components are loaded on demand
const LazyInvestmentModal = dynamic(
  () => import("@/components/modals/InvestmentDetailModal"),
  { ssr: false }
);
```

**Split Components**:
- Chart components (Recharts)
- Complex modals (InvestmentDetailModal)
- Data tables (TanStackTable)
- Form components

### 4. React Query Optimization

**Location**: `/src/wj-client/lib/react-query-config.ts`

Configured cache times for different data types:

```typescript
import { createOptimizedQueryClient, CACHE_TIMES } from "@/lib/react-query-config";

const queryClient = createOptimizedQueryClient();
```

**Cache Times**:
| Data Type | Stale Time | GC Time |
|-----------|------------|---------|
| Volatile data | 30s | 5min |
| Transactions | 2min | 30min |
| Wallets | 3min | 30min |
| Investments | 2min | 30min |
| Market data | 1min | 30min |
| Static data | 30min | 1hr |

### 5. Performance Monitoring

**Location**: `/src/wj-client/components/PerformanceMonitor.tsx`

Real-time Web Vitals tracking:

```typescript
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

<PerformanceMonitor
  enabled={process.env.NODE_ENV === "production"}
  logToConsole={process.env.NODE_ENV === "development"}
  showBadge={process.env.NODE_ENV === "development"}
  onMetricsCollected={(metrics) => {
    // Send to analytics
    sendToAnalytics(metrics);
  }}
/>
```

---

## Monitoring Setup

### Local Development

Performance badge shows automatically in development mode:

```typescript
// In your root layout
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <PerformanceMonitor />
      </body>
    </html>
  );
}
```

### Production Analytics

Web Vitals are automatically sent to:

```typescript
// Google Analytics 4
gtag("event", "web_vitals", {
  event_category: "Performance",
  value: metrics.score,
  cls: metrics.cls,
  fid: metrics.fid,
  lcp: metrics.lcp,
});

// Vercel Analytics
va("event", {
  name: "web_vitals",
  data: metrics,
});
```

### Lighthouse CI

Run Lighthouse in CI/CD:

```bash
# Run Lighthouse
npm run lighthouse:ci

# Or use GitHub Actions
# .github/workflows/lighthouse.yml
```

---

## Bundle Size Budgets

### Budget Limits

| Category | Budget (gzip) | Status |
|----------|--------------|--------|
| Initial JS | < 200 KB | ✅ |
| Initial CSS | < 30 KB | ✅ |
| Any chunk | < 244 KB | ✅ |
| Total bundle | < 1 MB | ✅ |

### Analyzing Bundle Size

```bash
# Build with bundle analyzer
ANALYZE=true npm run build

# Or use the built-in Next.js analyzer
npm run build -- --experimental-app-bundle-analyzer
```

### Large Chunks to Monitor

1. **React libraries** (~100 KB)
   - React, React-DOM
   - Mitigation: Use React Server Components

2. **UI Libraries** (~50 KB)
   - Recharts, Tailwind
   - Mitigation: Lazy loading

3. **State Management** (~20 KB)
   - Redux, React Query
   - Mitigation: Code splitting

---

## Best Practices

### 1. Component Optimization

```typescript
// ✅ Good: Memoized expensive computations
const ExpensiveList = React.memo(({ items }) => {
  const sorted = useMemo(() => items.sort(sortFn), [items]);
  return <VirtualList items={sorted} />;
});

// ❌ Bad: Re-sort on every render
const BadList = ({ items }) => {
  return <VirtualList items={items.sort(sortFn)} />;
};
```

### 2. Event Handler Optimization

```typescript
// ✅ Good: Debounced search
const debouncedSearch = useMemo(
  () => debounce((query) => search(query), 300),
  []
);

// ❌ Bad: Search on every keystroke
const handleChange = (e) => {
  search(e.target.value);
};
```

### 3. Image Best Practices

```typescript
// ✅ Good: Optimized image
<Image
  src="/photo.jpg"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, 800px"
  loading="lazy"
/>

// ❌ Bad: Unoptimized
<img src="/photo.jpg" width="800" height="600" />
```

### 4. Data Fetching

```typescript
// ✅ Good: Optimistic updates with rollback
const mutation = useMutation({
  onMutate: async (newData) => {
    await queryClient.cancelQueries();
    const previous = queryClient.getQueryData(["data"]);
    queryClient.setQueryData(["data"], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(["data"], context.previous);
  },
});
```

### 5. Route Transitions

```typescript
// ✅ Good: Prefetch on hover
<Link
  href="/dashboard/portfolio"
  onMouseEnter={() => prefetchInvestments()}
>
  Portfolio
</Link>
```

---

## Tools and Resources

### Performance Testing Tools

| Tool | Purpose | Link |
|------|---------|------|
| Lighthouse | Overall performance | [Google Lighthouse](https://developers.google.com/web/tools/lighthouse) |
| PageSpeed Insights | Mobile/desktop scores | [PageSpeed Insights](https://pagespeed.web.dev/) |
| WebPageTest | Detailed analysis | [WebPageTest](https://www.webpagetest.org/) |
| Chrome DevTools | Real-time monitoring | [DevTools](https://developer.chrome.com/docs/devtools/) |

### Bundle Analysis Tools

| Tool | Purpose | Command |
|------|---------|---------|
| @next/bundle-analyzer | Visualize bundles | `ANALYZE=true npm run build` |
| webpack-bundle-analyzer | Detailed view | `npx webpack-bundle-analyzer` |

### Monitoring Services

| Service | Features | Setup |
|---------|----------|-------|
| Vercel Analytics | Built-in, real-user data | Auto-enabled on Vercel |
| Google Analytics | Custom events | Add gtag script |
| Sentry | Error tracking | Install @sentry/nextjs |

---

## Performance Checklist

### Pre-Deployment

- [ ] Run Lighthouse - All scores > 90
- [ ] Check bundle size - Within budget
- [ ] Test on slow 3G - Acceptable performance
- [ ] Test on mobile devices - Responsive and fast
- [ ] Verify lazy loading - Components load on demand
- [ ] Check image optimization - WebP, proper sizes
- [ ] Review cache strategy - Appropriate stale times
- [ ] Monitor Core Web Vitals - No regressions

### Regular Maintenance

- [ ] Review bundle size monthly
- [ ] Check Lighthouse CI results
- [ ] Monitor real-user metrics
- [ ] Update dependencies for performance
- [ ] Audit unused code
- [ ] Review analytics for slow pages

---

## Troubleshooting

### Common Issues

#### High LCP

**Symptoms**: Largest content element takes > 2.5s to render

**Solutions**:
1. Defer non-critical CSS/JS
2. Preload critical fonts
3. Optimize images (WebP, proper sizes)
4. Use loading="lazy" for below-fold images

#### High CLS

**Symptoms**: Page content shifts as it loads

**Solutions**:
1. Reserve space for images and ads
2. Use font-display: swap
3. Avoid inserting content above existing content
4. Set explicit heights on containers

#### High FID

**Symptoms**: Page is slow to respond to input

**Solutions**:
1. Break up long JavaScript tasks
2. Reduce JavaScript execution time
3. Use web workers for heavy computation
4. Minimize main thread work

---

## Further Reading

- [Web.dev Performance Guides](https://web.dev/fast/)
- [Next.js Performance Documentation](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Last Updated**: 2026-02-04
**Maintainer**: WealthJourney Team
