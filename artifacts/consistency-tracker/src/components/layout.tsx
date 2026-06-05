import React from 'react';
import { View } from '../App';
import { Home, CheckSquare, BarChart3, Trophy, Settings as SettingsIcon, Zap, Target, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout({ children, currentView, onViewChange }: { children: React.ReactNode, currentView: View, onViewChange: (v: View) => void }) {
  const navItems: { view: View; icon: any; label: string }[] = [
    { view: 'home', icon: Home, label: 'Home' },
    { view: 'check-in', icon: CheckSquare, label: 'Check In' },
    { view: 'daily', icon: Target, label: 'Today' },
    { view: 'todo', icon: ClipboardList, label: 'Todo' },
    { view: 'progress', icon: BarChart3, label: 'Progress' },
    { view: 'rewards', icon: Trophy, label: 'Rewards' },
    { view: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <div className="flex-1 pb-20 md:pb-0 md:ml-[72px] overflow-y-auto">
        <main className="max-w-3xl mx-auto w-full p-4 md:p-8 pt-6">
          {children}
        </main>
      </div>

      {/* Bottom Nav (Mobile) / Sidebar (Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-card/95 backdrop-blur border-t border-border flex items-center justify-around md:top-0 md:bottom-0 md:right-auto md:w-[72px] md:h-full md:flex-col md:border-t-0 md:border-r md:justify-start md:pt-5 md:pb-8 md:gap-1 z-50">

        {/* Logo — desktop only */}
        <div className="hidden md:flex flex-col items-center justify-center mb-6 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
        </div>

        {navItems.map((item) => {
          const isActive = currentView === item.view || (item.view === 'home' && currentView === 'create');
          return (
            <button
              key={item.view}
              data-testid={`nav-${item.view}`}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-150",
                "md:w-full md:py-3 md:px-2 md:rounded-none",
                "w-14 h-14 rounded-xl",
                isActive
                  ? "text-primary md:bg-primary/10 md:border-r-2 md:border-r-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <item.icon
                className={cn("w-5 h-5 transition-all", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={cn("text-[9px] font-semibold tracking-wide uppercase", isActive ? "text-primary" : "text-muted-foreground/70")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
