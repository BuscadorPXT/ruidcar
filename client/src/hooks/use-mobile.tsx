import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Cache for device detection to avoid recalculation
let cachedIsMobileDevice: boolean | null = null;

function detectMobileDevice(): boolean {
  if (cachedIsMobileDevice !== null) {
    return cachedIsMobileDevice;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  cachedIsMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
  return cachedIsMobileDevice;
}

export function useIsMobile() {
  // Initialize with SSR-safe value or cached value
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    // Check both screen size and device type
    const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
    const isMobileDevice = detectMobileDevice();

    return isSmallScreen || isMobileDevice;
  });

  React.useEffect(() => {
    // Use matchMedia for better performance
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const isSmallScreen = e.matches;
      const isMobileDevice = detectMobileDevice();
      setIsMobile(isSmallScreen || isMobileDevice);
    };

    // Set initial value
    handleChange(mql);

    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mql.addListener) {
      mql.addListener(handleChange);
      return () => mql.removeListener(handleChange);
    }
  }, []);

  return isMobile;
}

// Export alias for consistency
export const useMobile = useIsMobile;

// Export utility for one-time checks without hook
export const isMobileDevice = detectMobileDevice;
