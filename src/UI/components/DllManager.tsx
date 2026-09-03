import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  FileCode2,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { BackupRecord, DllLocationGroup, DllOperationResult, Game } from '../types';
import { Language, translations } from '../i18n';

interface DllManagerProps {
  game: Game;
  onBack: () => void;
  language: Language;
}

// DLSS 组件类型的友好展示名（技术专有名词，中英文通用）
const TYPE_LABELS: Record<string, string> = {
  SuperResolution: 'Super Resolution (DLSS)',
  FrameGeneration: 'Frame Generation',
  RayReconstruction: 'Ray Reconstruction',
  NeuralRendering: 'Neural Rendering',
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

export function DllManager({ game, onBack, language }: DllManagerProps) {
  const t = translations[language];

  const [locations, setLocations] = useState<DllLocationGroup[]>([]);
  const [versions, setVersions] = useState<string[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Record<string, string>>({});

  const showMessage = (ok: boolean, text: string) => {
    setMessage({ ok, text });
    window.setTimeout(() => setMessage(null), 5000);
  };

  const fetchJson = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`请求失败 (HTTP ${res.status})`);
    return res.json();
  };

  const loadData = useCallback(() => {
    setLoading(true);
    const encoded = encodeURIComponent(game.path);
    Promise.all([
      fetchJson(`/api/dll/locations?gamePath=${encoded}`),
      fetchJson('/api/dll/versions'),
      fetchJson(`/api/dll/backups?gamePath=${encoded}`),
    ])
      .then(([loc, ver, bk]) => {
        setLocations(Array.isArray(loc) ? loc : []);
        setVersions(Array.isArray(ver) ? ver : []);
        setBackups(Array.isArray(bk) ? bk : []);
      })
      .catch((err) => showMessage(false, err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [game.path]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const post = async (path: string, body: object): Promise<DllOperationResult> => {
    const res = await fetch(`/api/dll/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const runOperation = async (type: string, action: () => Promise<DllOperationResult>) => {
    setBusy(type);
    try {
      const result = await action();
      showMessage(result.success, result.message);
      if (result.success) loadData();
    } catch (err) {
      showMessage(false, err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const handleBackup = (type: string) =>
    runOperation(type, () => post('backup', { gamePath: game.path, type }));

  const handleReplace = (type: string) => {
    const version = selectedVersion[type];
    if (!version) {
      showMessage(false, t.dllSelectVersion);
      return;
    }
    runOperation(type, () => post('replace', { gamePath: game.path, type, version }));
  };

  const handleRestore = (type: string) =>
    runOperation(type, () => post('restore', { gamePath: game.path, type }));

  // 每个类型恰好一个主 DLL（游戏真正加载的那份），操作针对主 DLL
  const primaryComponents = locations
    .flatMap((group) => group.components)
    .filter((component) => component.isPrimary);

  const typeLabel = (type: string) => TYPE_LABELS[type] ?? type;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent text-gray-800">
      {/* 顶部栏 */}
      <header className="bg-white/80 border-b border-gray-200 p-5 flex items-center justify-between backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.dllBack}
          </button>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{game.name}</h2>
            <p className="text-xs text-gray-400 truncate max-w-md">{game.path}</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading || busy !== null}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.dllRefresh}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 操作结果提示 */}
          {message && (
            <div
              className={`rounded-xl p-4 text-sm flex items-center gap-2 border ${
                message.ok
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {message.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* 检测到的 DLL 位置 */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900">{t.dllDetectedLocations}</h3>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-400">{t.dllDetecting}</div>
            ) : primaryComponents.length === 0 ? (
              <div className="p-10 text-center text-gray-400">{t.dllNoLocations}</div>
            ) : (
              <div className="p-5 space-y-4">
                {primaryComponents.map((component) => (
                  <div
                    key={component.path}
                    className="border border-gray-100 rounded-xl p-4 bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileCode2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900 text-sm truncate">
                              {component.fileName}
                            </span>
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold uppercase shrink-0">
                              {t.dllPrimary}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{component.path}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                          {typeLabel(component.type)}
                        </p>
                        <p className="font-mono text-sm font-bold text-gray-700">
                          v{component.version}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                          {t.dllAvailableVersions}
                        </span>
                        <select
                          value={selectedVersion[component.type] ?? ''}
                          onChange={(e) =>
                            setSelectedVersion((prev) => ({
                              ...prev,
                              [component.type]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        >
                          <option value="">--</option>
                          {versions.map((version) => (
                            <option key={version} value={version}>
                              {version}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleReplace(component.type)}
                        disabled={busy !== null}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
                      >
                        {t.dllReplace}
                      </button>
                      <button
                        onClick={() => handleBackup(component.type)}
                        disabled={busy !== null}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
                      >
                        <ArrowDownCircle className="w-4 h-4" />
                        {t.dllBackup}
                      </button>
                      <button
                        onClick={() => handleRestore(component.type)}
                        disabled={busy !== null}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        {t.dllRestore}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 备份历史 */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900">{t.dllBackupRecords}</h3>
            </div>
            {backups.length === 0 ? (
              <div className="p-10 text-center text-gray-400">{t.dllNoBackups}</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {backups.map((record) => (
                  <div key={record.id} className="px-5 py-4 flex items-center gap-3">
                    <Archive className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-700 truncate">
                          {record.fileName}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {typeLabel(record.type)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        v{record.version} · {formatTime(record.backupTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}