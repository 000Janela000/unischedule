'use client';

import {
  Wheat,
  FlaskConical,
  Dna,
  Utensils,
  Grape,
  Stethoscope,
  TreePine,
  Mountain,
  Cpu,
  HardHat,
  Cog,
  GraduationCap,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { AGRUNI_FACULTIES, FIRST_YEAR_FACULTY } from '@/lib/group-decoder';
import { cn } from '@/lib/utils';

interface FacultyGridProps {
  university: 'agruni' | 'freeuni';
  value: string | null;
  onChange: (facultyId: string) => void;
}

const iconMap: Record<string, LucideIcon> = {
  wheat: Wheat,
  'flask-conical': FlaskConical,
  dna: Dna,
  utensils: Utensils,
  grape: Grape,
  stethoscope: Stethoscope,
  'tree-pine': TreePine,
  mountain: Mountain,
  cpu: Cpu,
  'hard-hat': HardHat,
  cog: Cog,
  'graduation-cap': GraduationCap,
};

export function FacultyGrid({ university, value, onChange }: FacultyGridProps) {
  const faculties = university === 'agruni' ? AGRUNI_FACULTIES : [];

  return (
    <div className="space-y-4">
      {/* Faculty Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {faculties.map((faculty) => {
          const isSelected = value === faculty.id;
          const Icon = iconMap[faculty.icon] || GraduationCap;

          return (
            <button
              key={faculty.id}
              type="button"
              onClick={() => onChange(faculty.id)}
              className={cn(
                'relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all duration-200 hover:-translate-y-0.5',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-border/50 bg-card hover:border-muted-foreground/30 hover:shadow-md'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" />
                </div>
              )}
              <Icon
                className={cn(
                  'h-7 w-7 transition-colors duration-200',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <div className="text-center">
                <div
                  className={cn(
                    'text-xs font-semibold leading-tight transition-colors duration-200',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {faculty.nameKa}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {faculty.nameEn}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
