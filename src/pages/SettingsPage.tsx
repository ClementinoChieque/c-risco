import { MainLayout } from '@/components/layout/MainLayout';
import { RiskSettings } from '@/components/settings/RiskSettings';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold mb-1">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seus limites de risco</p>
        </div>

        <RiskSettings />
      </div>
    </MainLayout>
  );
}
