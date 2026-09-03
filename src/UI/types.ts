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
  driverReady?: boolean | null;
}

export interface GPUStatus {
  name: string;
  utilizationPct: number | null;
  memoryUsedMb: number | null;
  memoryTotalMb: number | null;
  temperatureC: number | null;
  powerWatts: number | null;
  coreClockMhz: number | null;
  fanPct: number | null;
}

export interface AppSettings {
  autoScan: boolean;
  driverReminder: boolean;
  autoBackup: boolean;
  backupKeep: number;
  dark: boolean;
}

export interface DllLocationGroup {
  folderPath: string;
  isPrimary: boolean;
  components: DLSSComponent[];
}

export interface DllOperationResult {
  success: boolean;
  message: string;
  sha256?: string | null;
}

export interface BackupRecord {
  id: string;
  gamePath: string;
  type: string;
  fileName: string;
  originalPath: string;
  version: string;
  sha256: string;
  backupPath: string;
  backupTime: string;
}

export interface LibraryDllInfo {
  type: string;
  fileName: string;
  version: string;
  size: number;
  sha256: string;
}

export interface LibraryVersion {
  version: string;
  files: LibraryDllInfo[];
}

export interface LibraryCollectItem {
  version: string;
  fileName: string;
  type: string;
  source: string;
  status: 'Added' | 'Existing' | 'Skipped';
}

export interface LibraryCollectResult {
  added: number;
  existing: number;
  skipped: number;
  items: LibraryCollectItem[];
}
