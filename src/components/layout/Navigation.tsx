import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, Calculator, BookOpen, BarChart3, Settings, Clock, FolderOpen } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calculator', icon: Calculator, label: 'Calculadora' },
  { to: '/sessions', icon: Clock, label: 'Sessões' },
  { to: '/trades', icon: FolderOpen, label: 'Negociações' },
  { to: '/diary', icon: BookOpen, label: 'Diário' },
  { to: '/stats', icon: BarChart3, label: 'Estatísticas' },
  { to: '/settings', icon: Settings, label: 'Config.' },
];

export function Navigation() {
  return (
    <nav className="glass-card fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 px-2 py-1.5 md:static md:w-20 md:min-h-screen md:border-r md:border-t-0 md:px-4 md:py-2">
      <ul className="flex justify-around md:flex-col md:items-center md:gap-6 md:pt-6">
        {navItems.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className="flex flex-col items-center gap-0.5 md:gap-1 p-1.5 md:p-2 rounded-lg text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary/50"
              activeClassName="text-primary bg-primary/10 glow-primary"
            >
              <Icon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-[9px] md:text-xs font-medium leading-tight text-center">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
