'use client';

import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div
            key={step}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              isActive
                ? 'w-8 bg-primary'
                : isCompleted
                  ? 'w-4 bg-primary/60'
                  : 'w-4 bg-muted-foreground/20'
            )}
          />
        );
      })}
    </div>
  );
}
