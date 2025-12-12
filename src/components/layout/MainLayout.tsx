import { Header } from './Header';
import { Navigation } from './Navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Navigation />
        <div className="flex-1 pb-20 md:pb-0">
          <Header />
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
