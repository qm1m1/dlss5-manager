import { Game, DLSSVersion, GPUInfo } from './types';

export const mockGpuInfo: GPUInfo = {
  model: 'NVIDIA GeForce RTX 4090',
  vram: '24 GB GDDR6X',
  driverVersion: '551.23',
  dlssSupported: true,
  frameGenSupported: true,
  rayReconSupported: true,
};

export const mockGames: Game[] = [
  {
    id: '1',
    name: 'Cyberpunk 2077',
    path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cyberpunk 2077',
    exe: 'Cyberpunk2077.exe',
    engine: 'REDengine 4',
    api: 'DirectX 12',
    dlssVersion: '3.1.1',
    dlssGVersion: '3.1.1',
    dlssDVersion: '3.5.0',
    compatibilityScore: 98,
    recommendedVersion: '3.7.0',
    coverImage: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=800&h=400',
  },
  {
    id: '2',
    name: 'Alan Wake 2',
    path: 'C:\\Games\\Epic Games\\AlanWake2',
    exe: 'AlanWake2.exe',
    engine: 'Northlight',
    api: 'DirectX 12',
    dlssVersion: '3.5.0',
    dlssGVersion: '3.5.0',
    dlssDVersion: '3.5.0',
    compatibilityScore: 100,
    recommendedVersion: '3.7.0',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800&h=400',
  },
  {
    id: '3',
    name: 'The Witcher 3: Wild Hunt',
    path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\The Witcher 3',
    exe: 'witcher3.exe',
    engine: 'REDengine 3',
    api: 'DirectX 12',
    dlssVersion: '2.4.0',
    compatibilityScore: 85,
    recommendedVersion: '3.7.0',
    coverImage: 'https://images.unsplash.com/photo-1600868291079-5dbd809ceea9?auto=format&fit=crop&q=80&w=800&h=400',
  },
];

export const mockDlssVersions: DLSSVersion[] = [
  { id: 'v3.7.0', version: '3.7.0', releaseDate: '2024-04-12', size: '34.2 MB', type: 'Super Resolution', isDownloaded: true },
  { id: 'v3.5.10', version: '3.5.10', releaseDate: '2023-11-20', size: '32.1 MB', type: 'Super Resolution', isDownloaded: false },
  { id: 'v3.1.30', version: '3.1.30', releaseDate: '2023-08-15', size: '30.5 MB', type: 'Super Resolution', isDownloaded: true },
  { id: 'v2.5.1', version: '2.5.1', releaseDate: '2023-01-10', size: '28.4 MB', type: 'Super Resolution', isDownloaded: true },
  
  { id: 'fg3.7.0', version: '3.7.0', releaseDate: '2024-04-12', size: '18.5 MB', type: 'Frame Generation', isDownloaded: true },
  { id: 'fg3.5.10', version: '3.5.10', releaseDate: '2023-11-20', size: '17.8 MB', type: 'Frame Generation', isDownloaded: false },
  
  { id: 'rr3.5.0', version: '3.5.0', releaseDate: '2023-09-21', size: '22.0 MB', type: 'Ray Reconstruction', isDownloaded: true },
];
