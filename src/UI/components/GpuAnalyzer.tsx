import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Fan, HardDrive, RefreshCw, Thermometer, Zap } from 'lucide-react';
import { GPUStatus } from '../types';
import { Language, translations } from '../i18n';

interface GpuAnalyzerProps {
  language: Language;
}

export function GpuAnalyzer({ language }: GpuAnalyzerProps) {
  const t = translations[language];
  const [status, setStatus] = useState<GPUStatus | null>(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    fetch('/api/gpu/status')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: GPUStatus[]) => {
        setStatus(Array.isArray(data) && data.length > 0 ? data[0] : null);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  };

  // 进入页面立即读取一次，之后每 3 秒自动刷新
  useEffect(() => {
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barWidth = (value: number | null | undefined) =>
    value == null ? 0 : Math.min(100, Math.max(0, value));

  const gb = (mb: number | null | undefined) =>
    mb == null ? '--' : (mb / 1024).toFixed(1);

  const value = (v: number | null | undefined) => (v == null ? '--' : String(v));

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent text-gray-800">
      {/* Top Bar */}
      <header className="bg-white/80 border-b border-gray-200 p-6 flex items-center justify-between backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.navGPU}</span>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-green-600" />
              <span className="text-gray-900 font-bold text-lg">{status?.name || '--'}</span>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200 mx-2"></div>
          <span className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold tracking-wider uppercase">
            <RefreshCw className="w-3 h-3" /> {t.gpuLive}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.gpuAnalysisTitle}</h2>
            <p className="text-gray-500 text-sm">{t.gpuAnalysisDesc}</p>
          </div>

          {failed && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {t.gpuNoData}
            </div>
          )}

          {!failed && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* GPU 使用率 */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Activity className="w-4 h-4 text-green-600" /> {t.gpuLoad}
                  </span>
                  <span className="font-mono font-bold text-lg">{value(status?.utilizationPct)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-700"
                    style={{ width: `${barWidth(status?.utilizationPct)}%` }}
                  />
                </div>
              </div>

              {/* 显存占用 */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <HardDrive className="w-4 h-4 text-green-600" /> {t.vramUsage}
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {gb(status?.memoryUsedMb)} / {gb(status?.memoryTotalMb)} GB
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${barWidth(
                      status?.memoryUsedMb != null && status?.memoryTotalMb
                        ? (status.memoryUsedMb / status.memoryTotalMb) * 100
                        : 0
                    )}%` }}
                  />
                </div>
              </div>

              {/* 温度 */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Thermometer className="w-4 h-4 text-orange-500" /> {t.gpuTemp}
                </span>
                <span className="font-mono font-bold text-lg">{value(status?.temperatureC)}°C</span>
              </div>

              {/* 功耗 */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Zap className="w-4 h-4 text-yellow-500" /> {t.gpuPower}
                </span>
                <span className="font-mono font-bold text-lg">{value(status?.powerWatts)} W</span>
              </div>

              {/* 核心频率 */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Cpu className="w-4 h-4 text-purple-500" /> {t.gpuClock}
                </span>
                <span className="font-mono font-bold text-lg">{value(status?.coreClockMhz)} MHz</span>
              </div>

              {/* 风扇 */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Fan className="w-4 h-4 text-sky-500" /> {t.gpuFan}
                </span>
                <span className="font-mono font-bold text-lg">{value(status?.fanPct)}%</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
