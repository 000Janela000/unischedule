'use client';

import { AlertCircle, Calendar, Search, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'no-emis-no-group' | 'no-lectures' | 'search-no-results' | 'weekend';
  onSetup?: () => void;
}

export function EmptyState({ type, onSetup }: EmptyStateProps) {
  const configs = {
    'no-emis-no-group': {
      icon: AlertCircle,
      title: 'არ აღმოჩენილა მონაცემები',
      description: 'გაიარეთ EMIS-თან დაკავშირების ნაბიჯები ან დააკონფიგურირეთ თქვენი ჯგუფი',
      action: { label: 'EMIS-თან დაკავშირება', onClick: onSetup },
    },
    'no-lectures': {
      icon: Calendar,
      title: 'დღეს მოწვევები არ არის',
      description: 'თქვენი ცხრილი ამ კვირაში ცარიელია',
      action: null,
    },
    'search-no-results': {
      icon: Search,
      title: 'ძებნაში შედეგი არ იპოვა',
      description: 'სცადეთ სხვა საკვანძო სიტყვები ან აირჩიეთ სხვა ჯგუფი',
      action: null,
    },
    weekend: {
      icon: Info,
      title: 'დღე არის შვებული',
      description: 'კვირის ცხრილი მხოლოდ ორშაბათი-პარასკევი ნაჩვენებია',
      action: null,
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-secondary/30 p-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
      {config.action && (
        <Button
          onClick={config.action.onClick}
          className="mt-4"
          size="sm"
        >
          {config.action.label}
        </Button>
      )}
    </div>
  );
}
