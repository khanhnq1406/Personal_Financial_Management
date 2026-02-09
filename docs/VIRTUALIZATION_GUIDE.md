# List Virtualization Guide

> **Last Updated**: 2026-02-04
> **Context**: UI/UX Optimization Plan - Section 3.5 (Performance Enhancements)

---

## Table of Contents

1. [When to Use Virtualization](#when-to-use-virtualization)
2. [Library Recommendations](#library-recommendations)
3. [Implementation Guide](#implementation-guide)
4. [Performance Considerations](#performance-considerations)
5. [Trade-offs and Best Practices](#trade-offs-and-best-practices)
6. [Example Implementations](#example-implementations)

---

## When to Use Virtualization

### Problem Statement

Rendering large lists of items (100+) can cause significant performance issues:

- **DOM Overhead**: Each DOM node consumes memory and impacts rendering performance
- **Initial Render Time**: Rendering 1000+ items at once can block the main thread for seconds
- **Scroll Performance**: Browsers struggle to paint and composite large DOM trees
- **Memory Usage**: Each rendered element consumes memory, even if not visible

### Recommended Thresholds

Use virtualization when:

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| **List Length** | > 100 items | Performance degradation becomes noticeable |
| **Complex Items** | > 50 items | Each item has nested components/images |
| **Mobile Devices** | > 30 items | Limited memory and processing power |
| **Infinite Scroll** | Any length | Only render visible items as user scrolls |

### WealthJourney Use Cases

✅ **Should virtualize:**
- Transaction list (potentially 1000+ transactions)
- Investment holdings list (if > 50 holdings)
- Category list (if > 100 custom categories)
- Notification history

❌ **No need to virtualize:**
- Wallet list (typically < 20 wallets)
- Dashboard summary cards (< 10 items)
- Budget items per budget (typically < 50 items)
- Recent transactions widget (< 10 items)

---

## Library Recommendations

### Option 1: @tanstack/react-virtual (Recommended)

**Why TanStack Virtual:**
- ✅ **Minimal Bundle Size**: ~3KB gzipped (smallest option)
- ✅ **Already Using TanStack**: Project uses @tanstack/react-table, consistent ecosystem
- ✅ **Framework Agnostic**: Core is vanilla JS, React wrapper is lightweight
- ✅ **TypeScript First**: Excellent TypeScript support
- ✅ **Modern API**: Hooks-based, follows React best practices
- ✅ **Active Maintenance**: Part of TanStack ecosystem (Tanner Linsley)
- ✅ **Flexible**: Supports vertical, horizontal, and grid virtualization

**Installation:**
```bash
npm install @tanstack/react-virtual
# or
pnpm add @tanstack/react-virtual
```

**Best For:**
- Projects already using TanStack libraries
- Modern React applications
- When bundle size matters
- TypeScript projects

---

### Option 2: react-window

**Why react-window:**
- ✅ **Proven**: Battle-tested, used by major companies
- ✅ **Simple API**: Easy to learn and implement
- ✅ **Good Performance**: Optimized for large lists
- ✅ **Community**: Large community, lots of examples
- ⚠️ **Larger Bundle**: ~6KB gzipped (still small)
- ⚠️ **Less Active**: Not as actively maintained as TanStack

**Installation:**
```bash
npm install react-window
```

**Best For:**
- Teams familiar with react-window
- Simple vertical/horizontal lists
- When you need battle-tested solutions

---

### Option 3: react-virtuoso

**Why react-virtuoso:**
- ✅ **Feature Rich**: Auto-sizing, infinite scroll, grouping
- ✅ **Easy API**: Minimal configuration needed
- ✅ **Good DX**: Developer-friendly API
- ⚠️ **Larger Bundle**: ~15KB gzipped
- ⚠️ **Overkill**: More features than most projects need

**Installation:**
```bash
npm install react-virtuoso
```

**Best For:**
- Complex use cases (grouped lists, chat interfaces)
- When bundle size is not a concern
- When you need advanced features out of the box

---

### Comparison Table

| Feature | @tanstack/react-virtual | react-window | react-virtuoso |
|---------|-------------------------|--------------|----------------|
| **Bundle Size** | ~3KB | ~6KB | ~15KB |
| **TypeScript** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Maintenance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Learning Curve** | Medium | Easy | Easy |
| **Flexibility** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation for WealthJourney**: Use **@tanstack/react-virtual** for consistency with existing TanStack ecosystem and minimal bundle size.

---

## Implementation Guide

### Basic Implementation with @tanstack/react-virtual

#### Step 1: Setup Virtualizer

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualizedTransactionList({ transactions }: { transactions: Transaction[] }) {
  // Ref to the scrollable container
  const parentRef = useRef<HTMLDivElement>(null);

  // Create virtualizer instance
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height in pixels
    overscan: 5, // Number of items to render outside viewport (buffer)
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto" // Fixed height container
    >
      {/* Total height to enable scrollbar */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {/* Render only visible items */}
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const transaction = transactions[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TransactionCard transaction={transaction} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### Step 2: Dynamic Item Heights

For items with dynamic heights (content-dependent):

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function DynamicVirtualizedList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Initial estimate
    measureElement: (element) => element.getBoundingClientRect().height, // Measure actual height
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement} // Measure this element
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {/* Your dynamic content here */}
            <div className="p-4 border-b">
              {items[virtualItem.index].content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Step 3: Integration with Existing Components

For WealthJourney's transaction table:

```tsx
// src/wj-client/components/table/VirtualizedTransactionTable.tsx

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { BaseCard } from '@/components/BaseCard';

interface VirtualizedTransactionTableProps {
  transactions: Transaction[];
  getCategoryName: (id: number) => string;
  getWalletName: (id: number) => string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  className?: string;
}

export function VirtualizedTransactionTable({
  transactions,
  getCategoryName,
  getWalletName,
  onEdit,
  onDelete,
  className,
}: VirtualizedTransactionTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize virtualizer configuration
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Transaction row height
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  // Memoize virtual items to avoid recalculation
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={className}>
      {/* Header (not virtualized) */}
      <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-10">
        <div className="flex py-3 px-4 font-bold text-gray-900 text-base">
          <div className="flex-1">Category</div>
          <div className="flex-1">Amount</div>
          <div className="flex-1">Date</div>
          <div className="w-24">Actions</div>
        </div>
      </div>

      {/* Virtualized Rows */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: 'calc(100vh - 400px)' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const transaction = transactions[virtualItem.index];

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-center py-3 px-4 text-gray-900 text-base">
                  <div className="flex-1">
                    {getCategoryName(transaction.categoryId)}
                  </div>
                  <div className="flex-1">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </div>
                  <div className="flex-1">
                    {formatDate(transaction.date)}
                  </div>
                  <div className="w-24 flex gap-2">
                    <button
                      onClick={() => onEdit(transaction.id)}
                      className="p-2 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="p-2 hover:bg-red-50 rounded text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

---

## Performance Considerations

### 1. Overscan (Buffer Rendering)

**What is overscan?**
Overscan renders extra items outside the visible viewport to prevent "white flashes" during fast scrolling.

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
  overscan: 5, // Render 5 items above and below viewport
});
```

**Guidelines:**
- **Desktop**: 5-10 items (faster devices, larger viewports)
- **Mobile**: 3-5 items (limited resources, smaller viewports)
- **Slow Connections**: 2-3 items (reduce memory pressure)
- **Complex Items**: Lower overscan (each item is expensive to render)

### 2. Accurate Size Estimation

**Why it matters:**
Inaccurate size estimates cause scroll jumps and repositioning as items are measured.

**Best practices:**
```tsx
// Good: Accurate estimate based on actual content
const virtualizer = useVirtualizer({
  estimateSize: () => {
    // Calculate average height from rendered items
    return averageItemHeight || 80;
  },
});

// Better: Use actual measurements
const virtualizer = useVirtualizer({
  estimateSize: (index) => {
    // Use cached measurements or estimates based on content type
    return itemHeightCache.get(index) || 80;
  },
  measureElement: (element) => element.getBoundingClientRect().height,
});
```

### 3. Memoization

**Critical for performance:**

```tsx
// ❌ BAD: Creates new functions on every render
function BadVirtualList({ items }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize: () => 80, // New function every render!
  });
}

// ✅ GOOD: Stable references
function GoodVirtualList({ items }) {
  const estimateSize = useCallback(() => 80, []);

  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize,
  });
}

// ✅ BETTER: Memoize row renderers
const RowComponent = memo(({ item, onEdit, onDelete }) => {
  return (
    <div className="row">
      {item.name}
      <button onClick={() => onEdit(item.id)}>Edit</button>
    </div>
  );
});
```

### 4. Scroll Restoration

Preserve scroll position when data changes:

```tsx
function VirtualListWithScrollRestoration({ items }) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    initialOffset: scrollOffset, // Restore scroll position
  });

  // Save scroll position before data changes
  useEffect(() => {
    const element = parentRef.current;
    if (element) {
      const handleScroll = () => setScrollOffset(element.scrollTop);
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      {/* ... */}
    </div>
  );
}
```

### 5. Performance Metrics

**Expected improvements:**

| Metric | Without Virtualization | With Virtualization | Improvement |
|--------|------------------------|---------------------|-------------|
| **Initial Render** | 2000ms (1000 items) | 50ms | **40x faster** |
| **Memory Usage** | 50MB (1000 DOM nodes) | 2MB (20 visible nodes) | **25x less** |
| **Scroll FPS** | 15-30 FPS | 60 FPS | **2-4x smoother** |
| **Time to Interactive** | 3-5s | 200-500ms | **6-10x faster** |

---

## Trade-offs and Best Practices

### Trade-offs

| Aspect | Without Virtualization | With Virtualization |
|--------|------------------------|---------------------|
| **Simplicity** | ✅ Simple, straightforward | ⚠️ More complex setup |
| **Accessibility** | ✅ All items in DOM (screenreaders) | ⚠️ Only visible items in DOM |
| **Browser Search** | ✅ Ctrl+F finds all items | ❌ Only finds visible items |
| **Print** | ✅ Prints entire list | ❌ Only prints visible portion |
| **Performance** | ❌ Slow with many items | ✅ Constant performance |
| **Memory** | ❌ High memory usage | ✅ Constant memory |
| **Scroll** | ❌ Choppy with many items | ✅ Smooth 60fps |

### Best Practices

#### 1. Progressive Enhancement

Start without virtualization, add it when needed:

```tsx
function TransactionList({ transactions }) {
  // Use virtualization only for large lists
  const shouldVirtualize = transactions.length > 100;

  if (shouldVirtualize) {
    return <VirtualizedTransactionList transactions={transactions} />;
  }

  // Simple implementation for small lists
  return (
    <div>
      {transactions.map((t) => (
        <TransactionCard key={t.id} transaction={t} />
      ))}
    </div>
  );
}
```

#### 2. Accessibility Considerations

```tsx
function AccessibleVirtualList({ items }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return (
    <div
      ref={parentRef}
      role="list"
      aria-label={`List of ${items.length} items`}
      aria-rowcount={items.length} // Total count for screenreaders
    >
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            role="listitem"
            aria-rowindex={virtualItem.index + 1}
            aria-posinset={virtualItem.index + 1}
            aria-setsize={items.length}
            style={{ /* positioning */ }}
          >
            {/* Item content */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3. Infinite Scroll Integration

```tsx
function InfiniteVirtualList({ fetchMore }) {
  const [items, setItems] = useState<Item[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  // Detect when scrolled near bottom
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    // Load more when within 5 items of the end
    if (
      lastItem.index >= items.length - 5 &&
      hasMore
    ) {
      fetchMore().then((newItems) => {
        if (newItems.length === 0) {
          setHasMore(false);
        } else {
          setItems((prev) => [...prev, ...newItems]);
        }
      });
    }
  }, [virtualizer.getVirtualItems(), items.length, hasMore, fetchMore]);

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      {/* Virtualized list */}
    </div>
  );
}
```

#### 4. Testing Virtualized Lists

```tsx
// tests/VirtualizedList.test.tsx

import { render, screen } from '@testing-library/react';
import { VirtualizedList } from './VirtualizedList';

describe('VirtualizedList', () => {
  it('renders visible items', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    render(<VirtualizedList items={items} />);

    // Only visible items are rendered
    expect(screen.queryByText('Item 0')).toBeInTheDocument();
    expect(screen.queryByText('Item 500')).not.toBeInTheDocument();
  });

  it('renders items as you scroll', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    const { container } = render(<VirtualizedList items={items} />);
    const scrollContainer = container.querySelector('[data-testid="scroll-container"]');

    // Scroll to middle
    scrollContainer.scrollTop = 10000;

    // Wait for items to render
    await waitFor(() => {
      expect(screen.getByText('Item 500')).toBeInTheDocument();
    });
  });
});
```

#### 5. Mobile Considerations

```tsx
function MobileOptimizedVirtualList({ items }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? 120 : 80, // Larger items on mobile
    overscan: isMobile ? 3 : 10, // Less overscan on mobile (memory constraint)
  });

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{
        height: isMobile ? '100vh' : '600px',
        // Enable momentum scrolling on iOS
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Virtualized items */}
    </div>
  );
}
```

---

## Example Implementations

### Example 1: Simple Transaction List (Fixed Height)

See: `/src/wj-client/components/table/VirtualizedList.example.tsx`

This example shows:
- Fixed-height items (simplest case)
- Integration with WealthJourney's transaction data
- Mobile-responsive card layout
- Action buttons (edit/delete)

### Example 2: Dynamic Height Items

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function DynamicHeightVirtualList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Initial estimate
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto bg-neutral-50"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="p-4 bg-white border-b"
            >
              {/* Dynamic content with variable height */}
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
              {item.tags && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {item.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Example 3: Horizontal Scrolling (Investment Holdings)

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function HorizontalVirtualList({ holdings }: { holdings: Investment[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    horizontal: true, // Enable horizontal virtualization
    count: holdings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Card width
    overscan: 2,
  });

  return (
    <div
      ref={parentRef}
      className="overflow-x-auto"
      style={{ height: '400px' }}
    >
      <div
        style={{
          width: `${virtualizer.getTotalSize()}px`,
          height: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const holding = holdings[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${virtualItem.size}px`,
                transform: `translateX(${virtualItem.start}px)`,
              }}
              className="p-2"
            >
              <div className="bg-white rounded-lg shadow p-4 h-full">
                <h3 className="font-bold">{holding.symbol}</h3>
                <p className="text-sm text-gray-600">{holding.name}</p>
                <p className="text-lg font-semibold mt-2">
                  {formatCurrency(holding.currentValue, holding.currency)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Migration Checklist

When adding virtualization to existing lists:

- [ ] Measure current performance (Lighthouse, React DevTools Profiler)
- [ ] Confirm list has 100+ items (or complex items > 50)
- [ ] Choose library (@tanstack/react-virtual recommended)
- [ ] Install dependency
- [ ] Create virtualized version alongside existing component
- [ ] Test with real data (1000+ items)
- [ ] Verify scroll behavior (smooth, no jumps)
- [ ] Test accessibility (screenreaders, keyboard navigation)
- [ ] Measure performance improvement
- [ ] Replace existing implementation
- [ ] Update tests
- [ ] Document in component README

---

## Troubleshooting

### Common Issues

#### 1. Scroll Jumps / Flickering

**Cause**: Inaccurate size estimates

**Solution**:
```tsx
const virtualizer = useVirtualizer({
  estimateSize: () => 80, // Make this as accurate as possible
  measureElement: (element) => element.getBoundingClientRect().height,
});
```

#### 2. Blank Space at Bottom

**Cause**: Total size calculation is incorrect

**Solution**: Ensure all items are measured correctly and overscan is sufficient.

#### 3. Performance Still Poor

**Causes**:
- Overscan too high (rendering too many items)
- Heavy components not memoized
- Size estimates wildly inaccurate

**Solution**:
```tsx
// Memoize row components
const Row = memo(({ item }) => <div>{item.name}</div>);

// Reduce overscan
const virtualizer = useVirtualizer({
  overscan: 3, // Lower value
});

// Use simpler item designs
// Avoid images, heavy calculations in row components
```

#### 4. Mobile Performance Issues

**Causes**:
- Overscan too high for limited mobile resources
- Items too complex for mobile CPUs

**Solution**:
```tsx
const isMobile = useMediaQuery('(max-width: 768px)');

const virtualizer = useVirtualizer({
  overscan: isMobile ? 2 : 10,
  estimateSize: () => isMobile ? 120 : 80,
});
```

---

## Resources

### Documentation

- [@tanstack/react-virtual Docs](https://tanstack.com/virtual/latest/docs/introduction)
- [react-window Docs](https://react-window.vercel.app/)
- [Web.dev: Virtualize Long Lists](https://web.dev/virtualize-long-lists-react-window/)

### Performance Tools

- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse Performance Audit](https://developer.chrome.com/docs/lighthouse/performance/)

### Related WealthJourney Docs

- [UI/UX Optimization Plan](/docs/UI_UX_OPTIMIZATION_PLAN.md) - Section 3.5
- [Component Architecture](/src/wj-client/components/README.md)
- [Performance Best Practices](/docs/PERFORMANCE.md)

---

## Conclusion

List virtualization is a powerful technique for improving performance with large datasets. For WealthJourney:

1. **Use @tanstack/react-virtual** for consistency with existing TanStack ecosystem
2. **Apply to transaction lists** when users have 100+ transactions
3. **Keep it simple** - start with fixed heights, add complexity only if needed
4. **Test on mobile devices** - performance gains are most noticeable there
5. **Measure before and after** - ensure the added complexity is worth it

See `VirtualizedList.example.tsx` for a complete, production-ready implementation specific to WealthJourney's transaction list.

---

**Next Steps:**

1. Review this guide with the team
2. Try the example implementation with real transaction data
3. Measure performance improvements
4. Roll out to production when transaction count justifies it

Good luck optimizing! 🚀
