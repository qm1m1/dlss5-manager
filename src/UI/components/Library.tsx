import React from 'react';
import { BookOpen, Boxes, Download, ExternalLink, Sparkles } from 'lucide-react';
import { dlssLibrary } from '../dlssLibrary';
import { Language, translations } from '../i18n';

interface LibraryProps {
  language: Language;
}

export function Library({ language }: LibraryProps) {
  const t = translations[language];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent text-gray-800">
      {/* Top Bar */}
      <header className="bg-white/80 border-b border-gray-200 p-6 flex items-center justify-between backdrop-blur-xl sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.navLibrary}</span>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <span className="text-gray-900 font-bold text-lg">{t.libraryTitle}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.libraryTitle}</h2>
            <p className="text-gray-500 text-sm">{t.libraryDesc}</p>
          </div>

          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-xs leading-relaxed">
            {t.libraryNotice}
          </div>

          <div className="space-y-4">
            {dlssLibrary.map((item, index) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Boxes className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                    {index === 0 && (
                      <span className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {t.libraryLatest}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {item.downloadUrl && (
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors duration-200"
                      >
                        <Download className="w-3.5 h-3.5" /> {t.libraryDownload}
                      </a>
                    )}
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:underline"
                      >
                        {t.librarySource} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.libraryType}</div>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">{item.type}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.libraryVersion}</div>
                    <span className="font-mono font-bold text-gray-900">{item.version}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.libraryDate}</div>
                    <span className="font-mono text-gray-700">{item.releaseDate}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.librarySize}</div>
                    <span className="font-mono text-gray-700">{item.size}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.libraryNote}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
