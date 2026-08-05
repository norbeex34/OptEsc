import React, { useEffect, useState } from 'react';
import { Scissors, LayoutGrid, Sun, Moon } from 'lucide-react';
import PipeOptimizer from './components/PipeOptimizer';
import SheetOptimizer from './components/SheetOptimizer';

const SECTIONS = {
  pipes: {
    label: 'Optimizador de Caños',
    icon: Scissors,
    title: 'Optimizador de Corte de Caños',
    subtitle: 'Minimiza el desperdicio en cortes lineales (1D)'
  },
  sheets: {
    label: 'Optimizador de Hojas',
    icon: LayoutGrid,
    title: 'Optimizador de Corte de Hojas',
    subtitle: 'Anida piezas DXF sobre planchas para minimizar desperdicio (2D)'
  }
};

const App = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [activeSection, setActiveSection] = useState('pipes');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const section = SECTIONS[activeSection];

  return (
    <div data-theme={theme} className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 bg-[var(--page-bg)]/95 backdrop-blur border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs mono text-[var(--text-muted)]">MSH</div>
            <div className="text-[1.65rem] font-bold truncate heading-font">{section.title}</div>
          </div>
          <button
            onClick={toggleTheme}
            className="theme-toggle px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-[var(--accent)]" />
                Modo Claro
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[var(--accent)]" />
                Modo Oscuro
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        <p className="text-sm mono text-[var(--text-muted)] -mt-4">{section.subtitle}</p>

        {/* Section Selector */}
        <div className="card rounded-xl p-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {Object.entries(SECTIONS).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`tab flex items-center gap-2 ${activeSection === key ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeSection === 'pipes' && <PipeOptimizer />}
        {activeSection === 'sheets' && <SheetOptimizer />}

        <div className="text-center py-6">
          <p className="text-xs mono text-[var(--text-muted)]">
            Creado por Norberto Echevarría
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
