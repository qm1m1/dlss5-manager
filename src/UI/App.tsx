/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { mockGpuInfo } from './data';
import { Game } from './types';
import { Language, translations } from './i18n';

export default function App() {
  const [activeTab, setActiveTab] = useState('games');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [language, setLanguage] = useState<Language>('zh');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  // 调用 C# 后端扫描真实安装的游戏
  const scanGames = () => {
    setLoading(true);
    setError(null);
    fetch('/api/games')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Game[]) => setGames(data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  // 首次进入页面自动扫描一次
  useEffect(() => {
    scanGames();
  }, []);

  return (
    <div className="flex h-screen font-sans bg-gray-50 text-gray-900 overflow-hidden select-none">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        language={language}
        onToggleLanguage={() => setLanguage(lang => lang === 'en' ? 'zh' : 'en')}
      />
      
      {activeTab === 'games' && (
        <Dashboard 
          games={games} 
          gpuInfo={mockGpuInfo} 
          onSelectGame={(game) => {
            setSelectedGame(game);
            console.log('Selected game:', game.name);
          }}
          language={language}
          onScan={scanGames}
          scanning={loading}
          error={error}
        />
      )}
      
      {activeTab !== 'games' && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">{t.comingSoon}</h2>
            <p>{t.comingSoonDesc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
