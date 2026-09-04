export interface DLSSLibraryItem {
  id: string;
  name: string;
  type: string;
  version: string;
  releaseDate: string;
  size: string;
  note: string;
  source: string;
  sourceUrl?: string;
  downloadUrl?: string;
}

// 版本信息来自公开渠道整理，更新时间 2026-09-04；
// 正式版本号请以 NVIDIA 官方 / NVIDIA App 发布为准。
export const dlssLibrary: DLSSLibraryItem[] = [
  {
    id: 'dlss5-nr',
    name: 'DLSS 5',
    type: 'Neural Rendering',
    version: '310.8.0.0',
    releaseDate: '2026-09-04',
    size: '约 158 MB',
    note: '3D 引导神经网络渲染，随《NBA 2K27》上线；仅支持 GeForce RTX 50 系列，需 2026-09-04 版 Game Ready 驱动。组件版本号来自驱动/泄露包分析，正式版本请通过 NVIDIA App 获取。',
    source: 'NVIDIA / TechPowerUp',
    sourceUrl: 'https://www.nvidia.cn/geforce/news/dlss-5-3d-guided-neural-rendering/',
    downloadUrl: 'https://www.nvidia.cn/software/nvidia-app/',
  },
  {
    id: 'dlss-sr',
    name: 'DLSS Super Resolution',
    type: 'Super Resolution',
    version: '310.7.129',
    releaseDate: '2026-08-26',
    size: '约 43 MB',
    note: 'TechPowerUp 最新收录的 DLSS 超分辨率组件（nvngx_dlss.dll），向下兼容 RTX 20/30/40/50 系列。下载解压后可手动替换游戏目录中的原版 dll，也可通过 NVIDIA App 自动更新。',
    source: 'TechPowerUp',
    sourceUrl: 'https://www.techpowerup.com/download/nvidia-dlss-dll/',
    downloadUrl: 'https://www.techpowerup.com/download/nvidia-dlss-dll/',
  },
];
