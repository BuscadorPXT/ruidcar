import { useEffect, useState } from 'react';

export interface ABTestVariant {
  name: string;
  weight: number; // Percentage (0-100)
  component?: React.ComponentType<any>;
  props?: any;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  variants: ABTestVariant[];
  trafficAllocation: number; // Percentage of users to include in test (0-100)
  startDate?: Date;
  endDate?: Date;
}

export interface ABTestResult {
  testId: string;
  variantName: string;
  userId: string;
  timestamp: number;
  event: string;
  metadata?: any;
}

class ABTestingEngine {
  private tests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map();
  private results: ABTestResult[] = [];

  constructor() {
    this.loadPersistedData();
  }

  // Load persisted assignments from localStorage
  private loadPersistedData() {
    try {
      const savedAssignments = localStorage.getItem('ab-test-assignments');
      if (savedAssignments) {
        const parsed = JSON.parse(savedAssignments);
        this.userAssignments = new Map(
          Object.entries(parsed).map(([userId, tests]) => [
            userId,
            new Map(Object.entries(tests as any))
          ])
        );
      }
    } catch (error) {
      console.warn('Failed to load AB test assignments:', error);
    }
  }

  // Persist assignments to localStorage
  private persistAssignments() {
    try {
      const serializable = Object.fromEntries(
        Array.from(this.userAssignments.entries()).map(([userId, tests]) => [
          userId,
          Object.fromEntries(tests)
        ])
      );
      localStorage.setItem('ab-test-assignments', JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to persist AB test assignments:', error);
    }
  }

  // Register a new AB test
  public registerTest(test: ABTest): void {
    // Validate test configuration
    if (!test.id || !test.name || !test.variants.length) {
      throw new Error('Invalid AB test configuration');
    }

    // Ensure weights sum to 100
    const totalWeight = test.variants.reduce((sum, variant) => sum + variant.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`);
    }

    this.tests.set(test.id, test);
  }

  // Get user ID (simple hash based on user agent and timestamp for demo)
  private getUserId(): string {
    let userId = localStorage.getItem('ab-test-user-id');
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('ab-test-user-id', userId);
    }
    return userId;
  }

  private generateUserId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Check if user should be included in test
  private shouldIncludeUser(test: ABTest): boolean {
    if (!test.isActive) return false;

    // Check date range
    const now = new Date();
    if (test.startDate && now < test.startDate) return false;
    if (test.endDate && now > test.endDate) return false;

    // Check traffic allocation
    const userId = this.getUserId();
    const hash = this.hashString(userId + test.id);
    const allocation = (hash % 100) / 100;

    return allocation < (test.trafficAllocation / 100);
  }

  // Simple hash function for consistent assignment
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get assigned variant for a test
  public getVariant(testId: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test) {
      console.warn(`AB test '${testId}' not found`);
      return null;
    }

    if (!this.shouldIncludeUser(test)) {
      return null; // User not in test
    }

    const userId = this.getUserId();
    let userTests = this.userAssignments.get(userId);

    if (!userTests) {
      userTests = new Map();
      this.userAssignments.set(userId, userTests);
    }

    // Check if user already has assignment for this test
    let assignedVariant = userTests.get(testId);

    if (!assignedVariant) {
      // Assign variant based on weighted distribution
      assignedVariant = this.assignVariant(test, userId);
      userTests.set(testId, assignedVariant);
      this.persistAssignments();

      // Track assignment event
      this.trackEvent(testId, assignedVariant, 'assigned');
    }

    return test.variants.find(v => v.name === assignedVariant) || null;
  }

  private assignVariant(test: ABTest, userId: string): string {
    const hash = this.hashString(userId + test.id + 'variant');
    const random = (hash % 10000) / 100; // Get percentage 0-100

    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random < cumulative) {
        return variant.name;
      }
    }

    // Fallback to first variant
    return test.variants[0].name;
  }

  // Track an event for AB testing
  public trackEvent(testId: string, variantName: string, event: string, metadata?: any): void {
    const userId = this.getUserId();
    const result: ABTestResult = {
      testId,
      variantName,
      userId,
      timestamp: Date.now(),
      event,
      metadata
    };

    this.results.push(result);

    // Send to analytics
    this.sendToAnalytics(result);

    console.log('[AB Test Event]', result);
  }

  private sendToAnalytics(result: ABTestResult): void {
    // Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'ab_test_event', {
        event_category: 'AB Testing',
        event_label: `${result.testId}:${result.variantName}`,
        custom_parameter_1: result.event,
        custom_parameter_2: result.testId,
        custom_parameter_3: result.variantName
      });
    }

    // Custom analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/ab-test-events', JSON.stringify(result));
    }
  }

  // Get test results for analysis
  public getResults(testId?: string): ABTestResult[] {
    if (testId) {
      return this.results.filter(r => r.testId === testId);
    }
    return [...this.results];
  }

  // Get all registered tests
  public getTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  // Remove user from test (for GDPR compliance)
  public removeUser(userId?: string): void {
    const targetUserId = userId || this.getUserId();
    this.userAssignments.delete(targetUserId);
    this.persistAssignments();
  }
}

// Singleton instance
const abTestingEngine = new ABTestingEngine();

// React hook for AB testing
export function useABTest(testId: string) {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const assignedVariant = abTestingEngine.getVariant(testId);
    setVariant(assignedVariant);
    setIsLoading(false);
  }, [testId]);

  const trackEvent = (event: string, metadata?: any) => {
    if (variant) {
      abTestingEngine.trackEvent(testId, variant.name, event, metadata);
    }
  };

  return {
    variant,
    isLoading,
    isInTest: variant !== null,
    trackEvent
  };
}

// Component wrapper for AB testing
export function ABTestProvider({ testId, children }: { testId: string; children: React.ReactNode }) {
  const { variant, isInTest } = useABTest(testId);

  if (!isInTest || !variant) {
    return <>{children}</>;
  }

  if (variant.component) {
    const VariantComponent = variant.component;
    return <VariantComponent {...variant.props} />;
  }

  return <>{children}</>;
}

// Export the engine for manual control
export { abTestingEngine };

// Helper functions
export function registerABTest(test: ABTest) {
  abTestingEngine.registerTest(test);
}

export function trackABTestEvent(testId: string, variantName: string, event: string, metadata?: any) {
  abTestingEngine.trackEvent(testId, variantName, event, metadata);
}

export function getABTestVariant(testId: string): ABTestVariant | null {
  return abTestingEngine.getVariant(testId);
}

// Example test configurations
export const EXAMPLE_TESTS: ABTest[] = [
  {
    id: 'landing-page-cta',
    name: 'Landing Page CTA Button',
    description: 'Test different CTA button colors and text',
    isActive: true,
    trafficAllocation: 50, // 50% of users
    variants: [
      { name: 'control', weight: 50 },
      { name: 'variant-a', weight: 25 },
      { name: 'variant-b', weight: 25 }
    ]
  },
  {
    id: 'onboarding-flow',
    name: 'Onboarding Flow',
    description: 'Test different onboarding sequences',
    isActive: true,
    trafficAllocation: 100,
    variants: [
      { name: 'current', weight: 70 },
      { name: 'simplified', weight: 30 }
    ]
  }
];