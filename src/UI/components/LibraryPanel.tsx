import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCode2,
  Library,
  RefreshCw,
} from 'lucide-react';
import { LibraryCollectResult, LibraryVersion } from '../types';
import { Language, translations } from '../i18n';

interface LibraryPanelProps {
  language: Language;
}

// DLSS 组件类型的友好展示名（技术专有名词，中英文通用）
const TYPE_LABELS: Record<string, string> = {
  SuperResolution: 'Super Resolution (DLSS)',
  FrameGeneration: 'Frame Generation',
  RayReconstruction: 'Ray Reconstruction',
  NeuralRendering: 'Neural Rendering',
};

const formatSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export function LibraryPanel({ language }: LibraryPanelProps) {
  const t = translations[language];

  const [versions, setVersions] = useState<LibraryVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [result, setResult] = useState<LibraryCollectResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJson = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`请求失败 (HTTP ${res.status})`);
    return res.json();
  };

  const loadLibrary = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchJson('/api/library')
      .then((data: LibraryVersion[]) => setVersions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const collect = () => {
    setCollecting(true);
    setError(null);
    setResult(null);
    fetch('/api/library/collect', { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: LibraryCollectResult) => {
        setResult(data);
        loadLibrary();
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setCollecting(false));
  };

  const totalFiles = versions.reduce((sum, version) => sum + version.files.length, 0);
  const typeLabel = (type: string) => TYPE_LABELS[type] ?? type;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent text-gray-800">
      {/* 顶部栏 */}
      <header className="bg-white/80 border-b border-gray-200 p-5 flex items-center justify-between backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
            <Library className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{t.navLibrary}</h2>
            <p className="text-xs text-gray-400 truncate max-w-md">{t.libraryDesc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={collect}
            disabled={collecting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {collecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {collecting ? t.libraryCollecting : t.libraryCollect}
          </button>
          <button
            onClick={loadLibrary}
            disabled={loading || collecting}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t.libraryRefresh}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="rounded-xl p-4 text-sm flex items-center gap-2 border bg-red-50 border-red-200 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 收集结果汇总 */}
          {result && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900">{t.libraryResultTitle}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="px-3 py-1.5 bg-white border border-green-200 rounded-lg text-green-700 font-bold">
                  {t.libraryResultAdded}: {result.added}
                </span>
                <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 font-bold">
                  {t.libraryResultExisting}: {result.existing}
                </span>
                <span className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-amber-600 font-bold">
                  {t.libraryResultSkipped}: {result.skipped}
                </span>
              </div>
              {result.items.length > 0 && (
                <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
                  {result.items.map((item, index) => (
                    <div
                      key={`${item.fileName}-${index}`}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          item.status === 'Added'
                            ? 'bg-green-500'
                            : item.status === 'Existing'
                              ? 'bg-gray-400'
                              : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-mono font-bold">{item.fileName}</span>
                      <span className="text-gray-400">v{item.version}</span>
                      <span className="text-gray-400 truncate">· {item.source}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 统计概览 */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
              <span className="text-gray-400 mr-1">{t.libraryTotalVersions}</span>
              <span className="font-bold text-gray-900">{versions.length}</span>
            </div>
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
              <span className="text-gray-400 mr-1">{t.libraryTotalFiles}</span>
              <span className="font-bold text-gray-900">{totalFiles}</span>
            </div>
          </div>

          {/* 版本列表 */}
          {loading ? (
            <div className="p-10 text-center text-gray-400">{t.dllDetecting}</div>
          ) : versions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center text-gray-400">
              {t.libraryEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <section
                  key={version.version}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-gray-900">
                        v{version.version}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">
                        {version.files.length}
                      </span>
                    </div>
                  </div>
                  {version.files.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">{t.libraryNoFiles}</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {version.files.map((file) => (
                        <div key={file.fileName} className="px-5 py-4 flex items-center gap-4">
                          <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <FileCode2 className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-bold text-gray-800 text-sm truncate">
                              {file.fileName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {t.libraryType}: {typeLabel(file.type)}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {t.librarySize}: {formatSize(file.size)}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] text-gray-300 shrink-0">
                            {file.sha256.slice(0, 12)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
