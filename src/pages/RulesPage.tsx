import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MentalAlgorithm } from '@/components/rules/MentalAlgorithm';
import { Button } from '@/components/ui/button';
import { Brain, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'mental' | null;

export default function RulesPage() {
  const [section, setSection] = useState<Section>('mental');

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">Regras de Execução</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Defina os critérios que devem ser cumpridos antes de cada negociação
          </p>
        </div>

        <div className="grid gap-2">
          <Button
            variant="ghost"
            onClick={() => setSection(section === 'mental' ? null : 'mental')}
            className={cn(
              'glass-card justify-between h-auto py-3 px-4',
              section === 'mental' && 'border-primary/40',
            )}
          >
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="font-medium">Algoritmo Mental</span>
            </span>
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                section === 'mental' && 'rotate-90',
              )}
            />
          </Button>
        </div>

        {section === 'mental' && <MentalAlgorithm />}
      </div>
    </MainLayout>
  );
}
