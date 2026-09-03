import React, { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, Play, Trophy } from 'lucide-react';
import { Language, translations } from '../i18n';

interface BenchmarkProps {
  language: Language;
}

interface BenchResult {
  avg: number;
  min: number;
}

const WIDTH = 512;
const HEIGHT = 512;
const DURATION_MS = 10000;

// 全屏四边形顶点着色器
const VERT_SRC = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// 分形渲染片元着色器：持续对 GPU 施加运算压力
const FRAG_SRC = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_res;
  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
    vec2 c = vec2(-0.8, 0.156);
    vec2 z = uv;
    float it = 0.0;
    for (int i = 0; i < 64; i++) {
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
      if (dot(z, z) > 4.0) { break; }
      it += 1.0;
    }
    float col = it / 64.0;
    float r = 0.5 + 0.5 * sin(col * 10.0 + u_time);
    gl_FragColor = vec4(col * r, col * col * 3.0, (1.0 - col) * r, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function Benchmark({ language }: BenchmarkProps) {
  const t = translations[language];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const [running, setRunning] = useState(false);
  const [liveFps, setLiveFps] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION_MS / 1000);
  const [result, setResult] = useState<BenchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const grade = (avg: number) => {
    if (avg >= 120) return { label: t.benchGreat, color: 'text-green-600' };
    if (avg >= 60) return { label: t.benchGood, color: 'text-green-500' };
    if (avg >= 30) return { label: t.benchOk, color: 'text-yellow-500' };
    return { label: t.benchWeak, color: 'text-red-500' };
  };

  const start = () => {
    const canvas = canvasRef.current;
    if (!canvas || running) return;

    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ??
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) {
      setError('WebGL unavailable');
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) {
      setError('Shader compile failed');
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      setError('Program create failed');
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setError('Program link failed');
      return;
    }

    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    gl.viewport(0, 0, WIDTH, HEIGHT);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_res');
    gl.uniform2f(resLoc, WIDTH, HEIGHT);

    setRunning(true);
    setResult(null);
    setError(null);
    setLiveFps(0);
    setSecondsLeft(DURATION_MS / 1000);

    const startTime = performance.now();
    startTimeRef.current = startTime;
    let frames = 0;
    let sampleFrames = 0;
    let lastSample = startTime;
    let lastSecond = startTime;
    let min = Infinity;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= DURATION_MS) {
        const avg = (frames * 1000) / elapsed;
        setRunning(false);
        setResult({
          avg: Math.round(avg * 10) / 10,
          min: Number.isFinite(min) ? Math.round(min) : 0,
        });
        return;
      }

      frames += 1;
      sampleFrames += 1;
      gl.uniform1f(timeLoc, elapsed / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (now - lastSecond >= 1000) {
        setSecondsLeft(Math.ceil((DURATION_MS - elapsed) / 1000));
        lastSecond = now;
      }
      if (now - lastSample >= 500) {
        const fps = (sampleFrames * 1000) / (now - lastSample);
        if (fps < min) min = fps;
        setLiveFps(Math.round(fps));
        sampleFrames = 0;
        lastSample = now;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const g = result ? grade(result.avg) : null;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent text-gray-800">
      {/* Top Bar */}
      <header className="bg-white/80 border-b border-gray-200 p-6 flex items-center justify-between backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.navBenchmark}</span>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-green-600" />
              <span className="text-gray-900 font-bold text-lg">{t.benchmarkTitle}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.benchmarkTitle}</h2>
            <p className="text-gray-500 text-sm">{t.benchmarkDesc}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
          )}

          {/* Canvas + 操作区 */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-gray-900 flex items-center justify-center">
              <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full max-h-[420px] object-contain" />
            </div>
            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
              <button
                onClick={start}
                disabled={running}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white shadow-lg shadow-green-600/20 px-8 py-3 rounded-xl transition-all text-sm font-bold"
              >
                {running ? <Activity className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                {running ? t.benchRunning : t.benchStart}
              </button>

              <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.benchLiveFps}</div>
                  <div className="font-mono font-bold text-2xl">{running ? liveFps : '--'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.benchAvg}</div>
                  <div className="font-mono font-bold text-2xl">{result ? result.avg : '--'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t.benchMin}</div>
                  <div className="font-mono font-bold text-2xl">{result ? result.min : '--'}</div>
                </div>
              </div>

              <div className="w-32 text-center">
                {running ? (
                  <>
                    <div className="text-3xl font-bold text-green-600">{secondsLeft}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">SEC</div>
                  </>
                ) : g && result ? (
                  <>
                    <Trophy className={`w-8 h-8 mx-auto mb-1 ${g.color}`} />
                    <div className={`font-bold text-lg ${g.color}`}>{g.label}</div>
                  </>
                ) : (
                  <div className="text-xs text-gray-400 py-6">{t.benchNoResult}</div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400">{t.benchNotice}</p>
        </div>
      </main>
    </div>
  );
}
