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
  dlssNrVersion?: string;
  dlssComponents?: DLSSComponent[];
  compatibilityScore: number;
  recommendedVersion: string;
  icon?: string;
  coverImage?: string;
}

export interface DLSSComponent {
  type: 'SuperResolution' | 'FrameGeneration' | 'RayReconstruction' | 'NeuralRendering';
  fileName: string;
  path: string;
  version: string;
  sha256: string;
  size: number;
  isPrimary: boolean;
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
