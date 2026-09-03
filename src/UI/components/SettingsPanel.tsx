import React from 'react';
import { BookOpen, Check, ChevronDown, Languages, Moon, Palette, Save, Settings as SettingsIcon, Shield, Sun } from 'lucide-react';
import { Language, translations } from '../i18n';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 py-3 text-left group"
    >
      <span>
        <span className="block text-sm font-bold text-gray-800">{label}</span>
        {desc && <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>}
      </span>
      <span
        className={`relative inline-flex shrink-0 h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-green-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 bg-white rounded-full shadow transform transition-transform translate-y-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

interface SelectOption {
  value: string | number;
  label: string;
}

function Select({
  value,
  onChange,
  options,
  widthClass = 'w-44',
}: {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  widthClass?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <div className={`relative ${widthClass}`}>
      {/* 点击外部关闭：透明遮罩放在下拉面板下层 */}
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-2 text-sm font-bold cursor-pointer focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-green-400 transition-colors"
      >
        <span className="truncate">{current?.label ?? ''}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 w-full bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(String(option.value));
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                  selected
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {option.label}
                {selected && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SettingsPanel({
  language,
  setLanguage,
  settings,
  setSettings,
}: SettingsPanelProps) {
  const t = translations[language];

  const update = (patch: Partial<AppSettings>) => setSettings({ ...settings, ...patch });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent text-gray-800">
      {/* Top Bar */}
      <header className="bg-white/80 border-b border-gray-200 p-6 flex items-center gap-6 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.navSettings}</span>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-green-600" />
            <span className="text-gray-900 font-bold text-lg">{t.settingsTitle}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.settingsTitle}</h2>
            <p className="text-gray-500 text-sm">{t.settingsDesc}</p>
          </div>

          {/* 通用 */}
          <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Palette className="w-4 h-4 text-green-600" /> {t.secGeneral}
            </h3>

            <div className="flex items-center justify-between gap-4 py-2">
              <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Languages className="w-4 h-4 text-gray-400" /> {t.language}
              </span>
              <Select
                value={language}
                onChange={(v) => setLanguage(v as Language)}
                options={[
                  { value: 'zh', label: '简体中文' },
                  { value: 'en', label: 'English' },
                ]}
              />
            </div>

            <div className="border-t border-gray-100 pt-2">
              <Toggle
                checked={settings.dark}
                onChange={(v) => update({ dark: v })}
                label={
                  <span className="flex items-center gap-2">
                    {settings.dark ? (
                      <Moon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-gray-400" />
                    )}
                    {t.darkMode}
                  </span>
                }
              />
            </div>
          </section>

          {/* 扫描与提醒 */}
          <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 pb-2">
              <Save className="w-4 h-4 text-green-600" /> {t.secScan}
            </h3>
            <Toggle
              checked={settings.autoScan}
              onChange={(v) => update({ autoScan: v })}
              label={t.autoScanOnStart}
            />
            <div className="border-t border-gray-100">
              <Toggle
                checked={settings.driverReminder}
                onChange={(v) => update({ driverReminder: v })}
                label={t.driverReminderOn}
              />
            </div>
          </section>

          {/* 备份策略 */}
          <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 pb-2">
              <Shield className="w-4 h-4 text-green-600" /> {t.secBackup}
            </h3>
            <Toggle
              checked={settings.autoBackup}
              onChange={(v) => update({ autoBackup: v })}
              label={t.autoBackupOn}
            />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-bold text-gray-800">{t.backupKeepCount}</span>
              <Select
                value={settings.backupKeep}
                onChange={(v) => update({ backupKeep: Number(v) })}
                options={[
                  { value: 1, label: '1 份' },
                  { value: 3, label: '3 份' },
                  { value: 5, label: '5 份' },
                ]}
              />
            </div>
          </section>

          {/* 关于 */}
          <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 pb-1">
              <BookOpen className="w-4 h-4 text-green-600" /> {t.secAbout}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t.version}</span>
              <span className="font-mono font-bold text-gray-800">v1.0</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t.license}</span>
              <span className="font-mono font-bold text-gray-800">GPL-3.0</span>
            </div>
            <a
              href="https://github.com/qm1m1/dlss5-manager"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-sm group"
            >
              <span className="text-gray-500">{t.github}</span>
              <span className="flex items-center gap-1.5 text-green-600 font-bold group-hover:underline">
                {t.openGithub} <Check className="w-3 h-3 hidden" />
              </span>
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
