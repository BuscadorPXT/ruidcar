import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  validation?: () => boolean | Promise<boolean>;
  isOptional?: boolean;
}

interface MultiStepFormProps {
  steps: FormStep[];
  onComplete: (data: any) => void;
  onStepChange?: (currentStep: number, totalSteps: number) => void;
  allowSkip?: boolean;
  className?: string;
  showProgress?: boolean;
  autoSave?: boolean;
  autoSaveKey?: string;
}

export default function MultiStepForm({
  steps,
  onComplete,
  onStepChange,
  allowSkip = false,
  className = '',
  showProgress = true,
  autoSave = true,
  autoSaveKey = 'multistep-form-data'
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<any>({});
  const [isValidating, setIsValidating] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && Object.keys(formData).length > 0) {
      localStorage.setItem(autoSaveKey, JSON.stringify({
        currentStep,
        formData,
        completedSteps: Array.from(completedSteps)
      }));
    }
  }, [formData, currentStep, completedSteps, autoSave, autoSaveKey]);

  // Restore from auto-save
  useEffect(() => {
    if (autoSave) {
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          const { currentStep: savedStep, formData: savedData, completedSteps: savedCompleted } = JSON.parse(saved);
          setCurrentStep(savedStep || 0);
          setFormData(savedData || {});
          setCompletedSteps(new Set(savedCompleted || []));
        } catch (error) {
          console.warn('Failed to restore form data:', error);
        }
      }
    }
  }, [autoSave, autoSaveKey]);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStep, steps.length);
  }, [currentStep, steps.length, onStepChange]);

  const updateFormData = (stepData: any) => {
    setFormData(prev => ({ ...prev, [steps[currentStep].id]: stepData }));
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const step = steps[currentStep];
    if (!step.validation) return true;

    setIsValidating(true);
    try {
      const isValid = await step.validation();
      return isValid;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const goToNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid && !allowSkip) return;

    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Form completed
      if (autoSave) {
        localStorage.removeItem(autoSaveKey);
      }
      onComplete(formData);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Section */}
      {showProgress && (
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg">
                Etapa {currentStep + 1} de {steps.length}
              </CardTitle>
              <Badge variant="secondary">
                {Math.round(progress)}% concluído
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
        </Card>
      )}

      {/* Steps Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center min-w-0 flex-1"
            >
              <button
                onClick={() => goToStep(index)}
                disabled={index > currentStep && !completedSteps.has(index)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${index === currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : completedSteps.has(index)
                    ? 'border-green-500 bg-green-500 text-white'
                    : index < currentStep
                    ? 'border-primary text-primary hover:bg-primary/10'
                    : 'border-muted text-muted-foreground'
                  }
                  ${index <= currentStep || completedSteps.has(index) ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
                aria-label={`Ir para etapa ${index + 1}: ${step.title}`}
              >
                {completedSteps.has(index) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-all
                    ${completedSteps.has(index) ? 'bg-green-500' : 'bg-muted'}
                  `}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step titles */}
        <div className="flex justify-between mt-2 text-sm">
          {steps.map((step, index) => (
            <div
              key={`title-${step.id}`}
              className={`
                text-center min-w-0 flex-1 px-1
                ${index === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'}
              `}
            >
              <div className="truncate">{step.title}</div>
              {step.isOptional && (
                <Badge variant="outline" className="text-xs mt-1">
                  Opcional
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep]?.title}</CardTitle>
          {steps[currentStep]?.description && (
            <p className="text-muted-foreground">{steps[currentStep].description}</p>
          )}
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[200px]"
            >
              {steps[currentStep]?.component}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={isFirstStep}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {allowSkip && !isLastStep && steps[currentStep]?.isOptional && (
            <Button
              variant="ghost"
              onClick={goToNext}
              className="flex items-center gap-2"
            >
              Pular Etapa
            </Button>
          )}

          <Button
            onClick={goToNext}
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            {isValidating ? (
              'Validando...'
            ) : isLastStep ? (
              'Finalizar'
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Auto-save indicator */}
      {autoSave && Object.keys(formData).length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Progresso salvo automaticamente
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para gerenciar multi-step forms
export function useMultiStepForm(steps: FormStep[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  const updateStepData = (stepId: string, data: any) => {
    setFormData(prev => ({ ...prev, [stepId]: data }));
  };

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setFormData({});
  };

  return {
    currentStep,
    formData,
    updateStepData,
    goToNext,
    goToPrevious,
    goToStep,
    reset,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    progress: ((currentStep + 1) / steps.length) * 100
  };
}