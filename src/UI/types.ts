export interface Game {
  id: string;
  name: string;
  path: string;
  launcher?: string;
  exe: string;
  engine: string;
  api: string;
  dlssVersion: string;
  dlssGVersion?: string;
  dlssDVersion?: string;
  compatibilityScore: number;
  recommendedVersion: string;
  icon?: string;
  coverImage?: string;
}

export interface DLSSVersion {
  id: string;
  version: string;
  releaseDate: string;
  size: string;
  type: 'Super Resolution' | 'Frame Generation' | 'Ray Reconstruction';
  isDownloaded: boolean;
}

export interface GPUInfo {
  model: string;
  vram: string;
  driverVersion: string;
  dlssSupported: boolean;
  frameGenSupported: boolean;
  rayReconSupported: boolean;
}
