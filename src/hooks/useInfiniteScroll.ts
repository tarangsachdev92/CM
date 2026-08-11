import { useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
    threshold?: number;
    hasMoreItems: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
}

/**
 * Hook for handling infinite scroll behavior in flyouts and lists
 * @param options - Configuration for infinite scroll
 * @returns scrollRef - ref to attach to scrollable container, handleScroll - scroll event handler
 */
export const useInfiniteScroll = ({
    threshold = 50,
    hasMoreItems,
    isLoadingMore,
    onLoadMore,
}: UseInfiniteScrollOptions) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || !hasMoreItems || isLoadingMore) return;

        if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
            onLoadMore();
        }
    }, [hasMoreItems, isLoadingMore, onLoadMore, threshold]);

    return { scrollRef, handleScroll };
};
