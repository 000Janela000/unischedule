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
import { AGRUNI_FACULTIES } from '@/lib/group-decoder';
import { useLanguage } from '@/i18n';
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
  const { lang } = useLanguage();
  const faculties = university === 'agruni' ? AGRUNI_FACULTIES : [];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {faculties.map((faculty) => {
        const isSelected = value === faculty.id;
        const Icon = iconMap[faculty.icon] || GraduationCap;
        const name = lang === 'ka' ? faculty.nameKa : faculty.nameEn;

        return (
          <button
            key={faculty.id}
            type="button"
            onClick={() => onChange(faculty.id)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all duration-200 hover:-translate-y-0.5 min-h-[80px]',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                : 'border-border/50 bg-card hover:border-muted-foreground/30 hover:shadow-md'
            )}
          >
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-2.5 w-2.5" />
              </div>
            )}
            <Icon
              className={cn(
                'h-5 w-5 shrink-0 transition-colors duration-200',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium leading-tight transition-colors duration-200 line-clamp-2',
                isSelected ? 'text-primary' : 'text-foreground'
              )}
            >
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
