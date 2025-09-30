import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Target, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TourStep, OnboardingTourProps } from '@/types/onboarding';
import '../styles/onboarding.css';

export default function OnboardingTour({ steps, isOpen, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Safari-compatible scroll control
  useEffect(() => {
    if (!isOpen) return;

    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      // Store original body style
      const originalStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top
      };

      // Get current scroll position
      const scrollY = window.scrollY;

      // Apply scroll lock (Safari-compatible way)
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
      document.body.style.top = `-${scrollY}px`;

      return () => {
        // Restore original styles
        document.body.style.overflow = originalStyle.overflow;
        document.body.style.position = originalStyle.position;
        document.body.style.top = originalStyle.top;

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;

    const updateTargetPosition = () => {
      // Remove previous active class
      const prevTarget = document.querySelector('.onboarding-target-active');
      if (prevTarget) {
        prevTarget.classList.remove('onboarding-target-active');
      }

      const target = document.querySelector(steps[currentStep].target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Add active class to current target
        target.classList.add('onboarding-target-active');

        // Scroll target into view if needed, with better mobile handling
        const isMobile = window.innerWidth < 640;
        const scrollOptions: ScrollIntoViewOptions = {
          behavior: 'smooth',
          block: isMobile ? 'start' : 'center',
          inline: 'center'
        };

        // Add delay for smoother animation on mobile
        if (isMobile) {
          setTimeout(() => {
            target.scrollIntoView(scrollOptions);
          }, 100);
        } else {
          target.scrollIntoView(scrollOptions);
        }
      }
    };

    // Initial positioning with delay for page load
    setTimeout(updateTargetPosition, 300);

    // Update on resize or scroll
    const handleUpdate = () => updateTargetPosition();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, { passive: true });

    return () => {
      // Clean up active class
      const activeTarget = document.querySelector('.onboarding-target-active');
      if (activeTarget) {
        activeTarget.classList.remove('onboarding-target-active');
      }
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [isOpen, currentStep, steps]);

  const handleNext = () => {
    if (steps[currentStep]?.action) {
      steps[currentStep].action!();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const getTooltipPosition = useCallback(() => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const position = steps[currentStep]?.position || 'bottom';
    const offset = 16;
    const tooltipWidth = 384; // max-w-sm = 24rem = 384px
    const tooltipHeight = 400; // Approximate height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 640;

    // On mobile, always show at bottom with proper spacing
    if (isMobile) {
      return {
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100vw - 40px)',
        maxWidth: '384px'
      };
    }

    let tooltipTop = 0;
    let tooltipLeft = 0;
    let transform = '';

    switch (position) {
      case 'top':
        tooltipTop = targetRect.top - offset - tooltipHeight;
        tooltipLeft = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        // If tooltip goes above viewport, show below instead
        if (tooltipTop < 10) {
          tooltipTop = targetRect.bottom + offset;
        }
        break;
      case 'bottom':
        tooltipTop = targetRect.bottom + offset;
        tooltipLeft = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        // If tooltip goes below viewport, show above instead
        if (tooltipTop + tooltipHeight > viewportHeight - 10) {
          tooltipTop = targetRect.top - offset - tooltipHeight;
          if (tooltipTop < 10) {
            // If still doesn't fit, center in viewport
            tooltipTop = Math.max(10, (viewportHeight - tooltipHeight) / 2);
          }
        }
        break;
      case 'left':
        tooltipTop = targetRect.top + targetRect.height / 2;
        tooltipLeft = targetRect.left - offset - tooltipWidth;
        transform = 'translateY(-50%)';
        // If tooltip goes off left edge, show on right instead
        if (tooltipLeft < 10) {
          tooltipLeft = targetRect.right + offset;
        }
        break;
      case 'right':
        tooltipTop = targetRect.top + targetRect.height / 2;
        tooltipLeft = targetRect.right + offset;
        transform = 'translateY(-50%)';
        // If tooltip goes off right edge, show on left instead
        if (tooltipLeft + tooltipWidth > viewportWidth - 10) {
          tooltipLeft = targetRect.left - offset - tooltipWidth;
          if (tooltipLeft < 10) {
            // If still doesn't fit, center horizontally
            tooltipLeft = Math.max(10, (viewportWidth - tooltipWidth) / 2);
          }
        }
        break;
      default:
        tooltipTop = targetRect.bottom + offset;
        tooltipLeft = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        break;
    }

    // Ensure tooltip stays within viewport bounds
    tooltipTop = Math.max(10, Math.min(tooltipTop, viewportHeight - tooltipHeight - 10));

    // Adjust horizontal position to keep tooltip in viewport
    if (transform.includes('translateX(-50%)')) {
      const halfTooltipWidth = tooltipWidth / 2;
      if (tooltipLeft - halfTooltipWidth < 10) {
        tooltipLeft = halfTooltipWidth + 10;
      } else if (tooltipLeft + halfTooltipWidth > viewportWidth - 10) {
        tooltipLeft = viewportWidth - halfTooltipWidth - 10;
      }
    }

    return {
      top: `${tooltipTop}px`,
      left: `${tooltipLeft}px`,
      transform
    };
  }, [targetRect, steps, currentStep]);

  if (!isOpen || !steps[currentStep]) return null;

  return (
    <AnimatePresence>
      <div
        ref={overlayRef}
        className="fixed inset-0 pointer-events-none onboarding-tour-overlay"
        style={{ zIndex: 9999 }}
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        {/* Overlay with spotlight effect */}
        <div className="absolute inset-0 pointer-events-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {targetRect && (
            <>
              {/* Spotlight highlight */}
              <div
                className="absolute bg-transparent border-2 sm:border-4 border-primary rounded-lg transition-all duration-300 onboarding-spotlight"
                style={{
                  top: Math.max(0, targetRect.top - 8),
                  left: Math.max(0, targetRect.left - 8),
                  width: Math.min(window.innerWidth, targetRect.width + 16),
                  height: targetRect.height + 16,
                  boxShadow: `0 0 0 4px rgba(255, 102, 0, 0.3)`,
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />
              {/* Make the target area clickable */}
              <div
                className="absolute"
                style={{
                  top: targetRect.top,
                  left: targetRect.left,
                  width: targetRect.width,
                  height: targetRect.height,
                  pointerEvents: 'auto',
                  zIndex: 2
                }}
              />
            </>
          )}
        </div>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed pointer-events-auto onboarding-tour-tooltip onboarding-tooltip-animate"
          style={{
            ...getTooltipPosition(),
            zIndex: 10000,
            WebkitTransform: getTooltipPosition().transform,
            msTransform: getTooltipPosition().transform
          }}
        >
          <Card className="w-full max-w-sm shadow-2xl border-primary/20 bg-background onboarding-tour-card">
            <CardContent className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary flex-shrink-0" />
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    {currentStep + 1} de {steps.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-8 w-8 p-0"
                  aria-label="Fechar tour"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3
                  id="onboarding-title"
                  className="text-lg font-semibold text-foreground"
                >
                  {steps[currentStep].title}
                </h3>
                <p
                  id="onboarding-description"
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {steps[currentStep].description}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-4 mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Progresso</span>
                  <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkip}
                    className="flex-1 sm:flex-initial"
                  >
                    Pular
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <Check className="h-4 w-4" />
                        Finalizar
                      </>
                    ) : (
                      <>
                        Próximo
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Hook para gerenciar o onboarding
export function useOnboarding() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('ruidcar-onboarding-completed');

    // Detect Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (!hasSeenTour) {
      setIsFirstVisit(true);

      // Don't auto-start tour on Safari mobile
      if (isSafari || isIOS) {
        // For Safari/iOS, only enable manual tour start
        console.log('Safari/iOS detected - onboarding tour disabled by default');
        return;
      }

      // Wait for page to load and check if all critical elements are present
      const initTour = () => {
        // Check if the document is ready and key elements exist
        if (document.readyState === 'complete') {
          // Additional delay to ensure animations are complete
          setTimeout(() => {
            // Check if at least one tour target exists before showing
            const firstTarget = document.querySelector('[data-tour="hero-section"]');
            if (firstTarget) {
              setShowTour(true);
            }
          }, 2000); // Increased delay for better stability
        } else {
          // If document not ready, wait for load event
          window.addEventListener('load', () => {
            setTimeout(() => {
              const firstTarget = document.querySelector('[data-tour="hero-section"]');
              if (firstTarget) {
                setShowTour(true);
              }
            }, 2000);
          });
        }
      };

      initTour();
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem('ruidcar-onboarding-completed', 'true');
    setShowTour(false);
  };

  const skipTour = () => {
    localStorage.setItem('ruidcar-onboarding-completed', 'true');
    setShowTour(false);
  };

  const startTour = () => {
    setShowTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem('ruidcar-onboarding-completed');
    setIsFirstVisit(true);
    setTimeout(() => setShowTour(true), 500);
  };

  return {
    isFirstVisit,
    showTour,
    completeTour,
    skipTour,
    startTour,
    resetTour
  };
}