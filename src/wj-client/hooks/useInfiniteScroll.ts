"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseInfiniteScrollOptions {
  /**
   * Distance from bottom (in pixels) to trigger load more
   * @default 200
   */
  threshold?: number;
  /**
   * Whether infinite scroll is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether there's more data to load
   * @default true
   */
  hasMore?: boolean;
}

export interface UseInfiniteScrollReturn {
  /**
   * Ref to attach to the scrollable container
   */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Whether currently loading more data
   */
  isLoadingMore: boolean;
  /**
   * Manually trigger load more
   */
  loadMore: () => void;
  /**
   * Set loading more state
   */
  setIsLoadingMore: (loading: boolean) => void;
}

/**
 * Hook for implementing infinite scroll functionality.
 * Automatically triggers load more when scrolling near the bottom.
 *
 * @example
 * ```tsx
 * const { containerRef, isLoadingMore, loadMore } = useInfiniteScroll({
 *   threshold: 200,
 *   hasMore: hasMoreData,
 *   enabled: !isLoading,
 * });
 *
 * useEffect(() => {
 *   if (isLoadingMore) {
 *     fetchMoreData().then(() => setIsLoadingMore(false));
 *   }
 * }, [isLoadingMore]);
 *
 * return <div ref={containerRef}>{items}</div>;
 * ```
 */
export function useInfiniteScroll({
  threshold = 200,
  enabled = true,
  hasMore = true,
}: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(() => {
    if (enabled && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
    }
  }, [enabled, hasMore, isLoadingMore]);

  // Intersection Observer for sentinel element
  useEffect(() => {
    if (!enabled || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: containerRef.current,
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, isLoadingMore, loadMore, threshold]);

  // Scroll event handler as fallback
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || !hasMore) return;

    const handleScroll = () => {
      if (isLoadingMore) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom <= threshold) {
        loadMore();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [enabled, hasMore, isLoadingMore, loadMore, threshold]);

  return {
    containerRef,
    isLoadingMore,
    loadMore,
    setIsLoadingMore,
  };
}
