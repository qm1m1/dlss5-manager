/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { GpuAnalyzer } from './components/GpuAnalyzer';
import { Benchmark } from './components/Benchmark';
import { SettingsPanel } from './components/SettingsPanel';
import { mockGpuInfo } from './data';
import { AppSettings, Game, GPUInfo } from './types';
import { Language, translations } from './i18n';

const SETTINGS_KEY = 'dlss5-settings-v1';
const LANG_KEY = 'dlss5-lang';

const defaultSettings: AppSettings = {
  autoScan: true,
  driverReminder: true,
  autoBackup: true,
  backupKeep: 3,
  dark: false,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    // 忽略损坏的本地存储
  }
  return defaultSettings;
}

function loadLanguage(): Language {
  const raw = localStorage.getItem(LANG_KEY);
  return raw === 'en' ? 'en' : 'zh';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('games');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [language, setLanguageState] = useState<Language>(loadLanguage);
  const [games, setGames] = useState<Game[]>([]);
  // 先用 mock 数据占位，后端返回真实显卡信息后替换，保证界面不会闪空白
  const [gpuInfo, setGpuInfo] = useState<GPUInfo>(mockGpuInfo);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  // 持久化设置
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const t = translations[language];

  // 是否检测到 DLSS（有版本号才算，排除「待检测 / 未检测到」）
  const hasDlss = (game: Game) =>
    game.dlssVersion !== '待检测' && game.dlssVersion !== '未检测到';

  // 调用 C# 后端扫描真实安装的游戏
  const scanGames = () => {
    setLoading(true);
    setError(null);
    fetch('/api/games')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Game[]) => {
        // 有 DLSS 的游戏排前面，没有的排后面，方便浏览
        const sorted = [...data].sort((a, b) => Number(hasDlss(b)) - Number(hasDlss(a)));
        setGames(sorted);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  // 调用 C# 后端读取真实显卡信息（型号 / 显存 / 驱动 / DLSS5 支持）
  const fetchGpu = () => {
    fetch('/api/gpu')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const g = data[0];
        // 把后端返回的字段映射成前端 GPUInfo 认识的形状
        setGpuInfo({
          model: g.name ?? mockGpuInfo.model,
          vram: g.vramGb != null ? `${g.vramGb} GB` : mockGpuInfo.vram,
          driverVersion: g.driverVersion ?? mockGpuInfo.driverVersion,
          dlssSupported: g.supportsDlss5 === true,
          // 后端暂不返回这两项：RTX 显卡普遍支持帧生成与光线重建，按型号推断
          frameGenSupported: String(g.name ?? '').includes('RTX'),
          rayReconSupported: String(g.name ?? '').includes('RTX'),
          // 驱动是否达到 DLSS5 要求（后端返回 driverReadyForDlss5）
          driverReady:
            typeof g.driverReadyForDlss5 === 'boolean' ? g.driverReadyForDlss5 : null,
        });
      })
      .catch(() => {
        // 后端未启动时保留当前显示（mock），不打扰用户
      });
  };

  // 首次进入：按设置决定是否自动扫描游戏，并读取显卡信息
  useEffect(() => {
    if (settingsRef.current.autoScan) scanGames();
    fetchGpu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`flex h-screen font-sans overflow-hidden select-none ${
        settings.dark ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'zh' : 'en')}
      />

      {activeTab === 'games' && (
        <Dashboard
          games={games}
          gpuInfo={gpuInfo}
          onSelectGame={(game) => {
            setSelectedGame(game);
            console.log('Selected game:', game.name);
          }}
          language={language}
          onScan={scanGames}
          scanning={loading}
          error={error}
          driverReminder={settings.driverReminder}
        />
      )}

      {activeTab === 'gpu' && <GpuAnalyzer language={language} />}

      {activeTab === 'benchmark' && <Benchmark language={language} />}

      {activeTab === 'settings' && (
        <SettingsPanel
          language={language}
          setLanguage={setLanguage}
          settings={settings}
          setSettings={setSettings}
        />
      )}

      {activeTab !== 'games' &&
        activeTab !== 'gpu' &&
        activeTab !== 'benchmark' &&
        activeTab !== 'settings' && (
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
