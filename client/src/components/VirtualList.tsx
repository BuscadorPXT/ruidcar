import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => ReactNode;
  containerHeight?: number;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export default function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 600,
  overscan = 3,
  className = '',
  onScroll,
  getItemKey = (_, index) => index
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate item heights and positions
  const getItemOffset = useCallback((index: number): number => {
    if (typeof itemHeight === 'number') {
      return index * itemHeight;
    }

    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeight(i);
    }
    return offset;
  }, [itemHeight]);

  const getItemHeightValue = useCallback((index: number): number => {
    return typeof itemHeight === 'number' ? itemHeight : itemHeight(index);
  }, [itemHeight]);

  // Calculate total height
  const totalHeight = (() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }

    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += itemHeight(i);
    }
    return height;
  })();

  // Calculate visible range
  const getVisibleRange = useCallback((): { start: number; end: number } => {
    const start = Math.max(0,
      Math.floor(scrollTop / (typeof itemHeight === 'number' ? itemHeight : 100)) - overscan
    );

    let accHeight = 0;
    let end = start;

    for (let i = start; i < items.length; i++) {
      if (accHeight > containerHeight + scrollTop) {
        break;
      }
      accHeight += getItemHeightValue(i);
      end = i;
    }

    return {
      start: Math.max(0, start),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan, getItemHeightValue]);

  const { start, end } = getVisibleRange();

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Render visible items
  const visibleItems = [];
  for (let i = start; i <= end; i++) {
    const item = items[i];
    if (!item) continue;

    const offset = getItemOffset(i);
    const height = getItemHeightValue(i);

    visibleItems.push(
      <div
        key={getItemKey(item, i)}
        style={{
          position: 'absolute',
          top: offset,
          left: 0,
          right: 0,
          height
        }}
      >
        {renderItem(item, i)}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          position: 'relative',
          height: totalHeight,
          width: '100%'
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

// Hook for easier usage
export function useVirtualList<T>(
  items: T[],
  options: Omit<VirtualListProps<T>, 'items'>
) {
  const [scrollTop, setScrollTop] = useState(0);

  const virtualListProps: VirtualListProps<T> = {
    items,
    ...options,
    onScroll: (top) => {
      setScrollTop(top);
      options.onScroll?.(top);
    }
  };

  return {
    virtualListProps,
    scrollTop,
    scrollToIndex: (index: number) => {
      const offset = typeof options.itemHeight === 'number'
        ? index * options.itemHeight
        : Array.from({ length: index }, (_, i) =>
            typeof options.itemHeight === 'function' ? options.itemHeight(i) : 0
          ).reduce((a, b) => a + b, 0);

      setScrollTop(offset);
    }
  };
}