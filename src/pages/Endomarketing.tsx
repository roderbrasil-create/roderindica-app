import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/card';
import { 
  HeartHandshake, 
  LayoutDashboard, 
  Table as TableIcon, 
  Calendar as CalendarIcon, 
  FilePieChart,
  Target,
  Users,
  Settings,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import ActionsList from '../components/endomarketing/ActionsList';
import EndoDashboard from '../components/endomarketing/EndoDashboard';
import CalendarView from '../components/endomarketing/CalendarView';
import EndoReports from '../components/endomarketing/EndoReports';
import { cn } from '../lib/utils';

type Section = 'actions' | 'dashboard' | 'calendar' | 'reports';

export default function Endomarketing() {
  const [activeSection, setActiveSection] = useState<Section>('actions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'actions', label: 'Gestão de Ações', icon: TableIcon, color: 'text-orange-600', description: 'Lista e cadastro de eventos' },
    { id: 'calendar', label: 'Cronograma', icon: CalendarIcon, color: 'text-blue-600', description: 'Visualização temporal' },
    { id: 'dashboard', label: 'Indicadores', icon: LayoutDashboard, color: 'text-green-600', description: 'Gráficos e performance' },
    { id: 'reports', label: 'Relatórios', icon: FilePieChart, color: 'text-purple-600', description: 'Exportação de dados' },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'actions': return <ActionsList />;
      case 'dashboard': return <EndoDashboard />;
      case 'calendar': return <CalendarView />;
      case 'reports': return <EndoReports />;
      default: return <ActionsList />;
    }
  };

  const getSectionTitle = () => {
    return menuItems.find(i => i.id === activeSection)?.label || '';
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mini Sidebar Menu */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-white flex flex-col p-4 gap-4 overflow-y-auto transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-0 lg:bg-slate-50/50",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col gap-1 mb-4 px-2">
            <div className="flex items-center justify-between lg:justify-start gap-2 text-orange-600">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-6 w-6" />
                <h1 className="text-lg font-bold tracking-tight">Endomarketing</h1>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden" 
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Painel Administrativo</p>
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id as Section);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all text-left group w-full",
                  activeSection === item.id 
                    ? "bg-white shadow-sm border border-orange-100 text-orange-950" 
                    : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  activeSection === item.id ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-[10px] opacity-70 leading-none">{item.description}</span>
                </div>
                {activeSection === item.id && (
                  <ChevronRight className="h-4 w-4 ml-auto text-orange-400" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t space-y-4">
            <div className="bg-slate-200/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Target className="h-4 w-4" />
                <span className="text-xs font-bold font-mono">META ANUAL</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                  <span>Ações</span>
                  <span>15/24</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 w-[62%]" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2">
              <div className="bg-orange-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold">Time Gestor</span>
                <span className="text-[10px] text-muted-foreground">RH e Marketing</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/20">
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden -ml-2" 
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-orange-600" />
              </Button>
              <div className="h-8 w-1 bg-orange-600 rounded-full hidden sm:block" />
              <h2 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900">{getSectionTitle()}</h2>
            </div>
          </header>

          <div className="p-4 lg:p-8">
            {renderSection()}
          </div>
        </main>
      </div>
    </Layout>
  );
}
