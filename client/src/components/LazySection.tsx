import { lazy, Suspense, useRef, useEffect, useState } from 'react';

interface LazySectionProps {
  component: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  props?: any;
  className?: string;
}

// Component for lazy loading sections based on intersection observer
export default function LazySection({
  component,
  fallback,
  rootMargin = '100px',
  threshold = 0.01,
  props = {},
  className
}: LazySectionProps) {
  const [isInView, setIsInView] = useState(false);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (isInView && !Component) {
      // Load component when in view
      const LazyComponent = lazy(component);
      setComponent(() => LazyComponent);
    }
  }, [isInView, component, Component]);

  const defaultFallback = (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="animate-pulse bg-gray-200 h-32 w-full max-w-4xl mx-auto rounded-lg" />
    </div>
  );

  return (
    <div ref={containerRef} className={className}>
      {isInView && Component ? (
        <Suspense fallback={fallback || defaultFallback}>
          <Component {...props} />
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
}