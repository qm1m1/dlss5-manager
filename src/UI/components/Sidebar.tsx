import { Cpu, Gamepad2, Library, Settings, Activity, Globe } from 'lucide-react';
import React from 'react';
import { Language, translations } from '../i18n';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  onToggleLanguage: () => void;
}

export function Sidebar({ activeTab, setActiveTab, language, onToggleLanguage }: SidebarProps) {
  const t = translations[language];

  const navItems = [
    { id: 'games', label: t.navGames, icon: Gamepad2 },
    { id: 'library', label: t.navLibrary, icon: Library },
    { id: 'gpu', label: t.navGPU, icon: Cpu },
    { id: 'benchmark', label: t.navBenchmark, icon: Activity },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen text-gray-600 shadow-sm z-20">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100 mb-4">
        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-bold text-gray-900 text-lg leading-tight tracking-tight">DLSS5</h1>
          <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase font-bold">Manager v1.0</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-3 mt-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 text-sm font-medium ${
                isActive 
                  ? 'bg-green-50 text-green-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 flex flex-col gap-3">
        <button 
          onClick={onToggleLanguage}
          className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {t.langToggle}
        </button>
      </div>
    </div>
  );
}
