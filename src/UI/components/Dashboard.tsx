import React from 'react';
import { Game, GPUInfo } from '../types';
import { Cpu, HardDrive, CheckCircle2, AlertCircle, RefreshCw, Archive, Settings2, DownloadCloud, AlertTriangle } from 'lucide-react';
import { Language, translations } from '../i18n';

interface DashboardProps {
  games: Game[];
  gpuInfo: GPUInfo;
  onSelectGame: (game: Game) => void;
  language: Language;
  onScan: () => void;
  scanning: boolean;
  error: string | null;
  driverReminder: boolean;
}

export function Dashboard({
  games,
  gpuInfo,
  onSelectGame,
  language,
  onScan,
  scanning,
  error,
  driverReminder,
}: DashboardProps) {
  const t = translations[language];

  const handleScan = () => onScan();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent text-gray-800">
      {/* Top Bar - GPU Info */}
      <header className="bg-white/80 border-b border-gray-200 p-6 flex items-center justify-between backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.activeGPU}</span>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-green-600" />
              <span className="text-gray-900 font-bold text-lg">{gpuInfo.model}</span>
            </div>
          </div>

          <div className="h-10 w-px bg-gray-200 mx-2"></div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.driver}</span>
              <span className="text-gray-700 font-mono text-sm">{gpuInfo.driverVersion}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.vram}</span>
              <span className="text-gray-700 font-mono text-sm">{gpuInfo.vram}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {gpuInfo.dlssSupported && (
            <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> DLSS
            </span>
          )}
          {gpuInfo.frameGenSupported && (
            <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Frame Gen
            </span>
          )}
          {driverReminder && gpuInfo.driverReady === false && (
            <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> {t.needDriverUpdate}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Section Header */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.detectedGames}</h2>
              <p className="text-gray-500 text-sm">{t.manageDesc}</p>
            </div>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 px-6 py-2.5 rounded-xl transition-all text-sm font-bold disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin text-white' : ''}`} />
              {scanning ? t.scanning : t.quickScan}
            </button>
          </div>

          {/* 后端连接错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>扫描失败：{error}（请确认 C# 后端已启动在 5000 端口）</span>
            </div>
          )}

          {/* 扫描中提示 */}
          {!error && scanning && games.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p>{t.scanning}</p>
            </div>
          )}

          {/* 未检测到游戏 */}
          {!error && !scanning && games.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <HardDrive className="w-8 h-8 mx-auto mb-3" />
              <p>未检测到已安装的游戏，请点击右上角「{t.quickScan}」。</p>
            </div>
          )}

          {/* Game Grid */}
          {games.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
                >
                  {/* Game Header Image (Mock) */}
                  <div
                    className="h-32 bg-gray-100 relative bg-cover bg-center border-b border-gray-100"
                    style={{ backgroundImage: `url(${game.coverImage})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-bold text-white text-lg truncate drop-shadow-md">{game.name}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t.engine}</span>
                      <span className="text-gray-700 font-bold">{game.engine}</span>
                    </div>

                    <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-bold text-gray-500">{t.currentDLSS}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-700">v{game.dlssVersion}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DownloadCloud className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-bold text-green-700">{t.recommended}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-green-700">v{game.recommendedVersion}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => onSelectGame(game)}
                        className="bg-green-50 hover:bg-green-600 text-green-700 hover:text-white font-bold py-2.5 rounded-xl text-sm transition-all border border-green-200 hover:border-transparent"
                      >
                        {t.manageBtn}
                      </button>
                      <button className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-gray-200">
                        <Archive className="w-4 h-4" /> {t.backupBtn}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
