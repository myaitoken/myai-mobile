/**
 * Model Manager — download and manage on-device LLM models
 */

import * as FileSystem from 'expo-file-system';
import { AvailableModel } from '../types/compute';

export const AVAILABLE_MODELS: AvailableModel[] = [
  {
    id: 'llama3.2:1b',
    name: 'Llama 3.2 1B',
    description: 'Fast, lightweight. Best for most phones.',
    sizeMb: 800,
    tier: 'mobile_base',
    chip_min: 'A14',
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 3B',
    description: 'More capable. Recommended for A17 Pro / A18.',
    sizeMb: 1900,
    tier: 'mobile_pro',
    chip_min: 'A17 Pro',
  },
  {
    id: 'phi3:mini',
    name: 'Phi-3 Mini',
    description: 'Microsoft\'s compact model. Great balance of speed and quality.',
    sizeMb: 2200,
    tier: 'mobile_pro',
    chip_min: 'A16',
  },
  {
    id: 'llama3.1:7b',
    name: 'Llama 3.1 7B',
    description: 'Full-size model. M-chip iPads and high-end iPhones only.',
    sizeMb: 4700,
    tier: 'mobile_pro',
    chip_min: 'M1',
  },
];

const MODEL_DIR = `${FileSystem.cacheDirectory}myai-models/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
}

export function getModelPath(modelId: string): string {
  const safe = modelId.replace(':', '-');
  return `${MODEL_DIR}${safe}.gguf`;
}

export async function isModelDownloaded(modelId: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(getModelPath(modelId));
    return info.exists && (info as any).size > 0;
  } catch {
    return false;
  }
}

export async function downloadModel(
  modelId: string,
  onProgress: (pct: number) => void
): Promise<string> {
  await ensureDir();
  const path = getModelPath(modelId);

  // Already downloaded
  if (await isModelDownloaded(modelId)) {
    onProgress(100);
    return path;
  }

  // Model download URLs — in production these come from api.myaitoken.io/models
  const MODEL_URLS: Record<string, string> = {
    'llama3.2:1b':  'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    'llama3.2:3b':  'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    'phi3:mini':    'https://huggingface.co/bartowski/Phi-3-mini-4k-instruct-GGUF/resolve/main/Phi-3-mini-4k-instruct-Q4_K_M.gguf',
    'llama3.1:7b':  'https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
  };

  const url = MODEL_URLS[modelId];
  if (!url) throw new Error(`Unknown model: ${modelId}`);

  const dl = FileSystem.createDownloadResumable(
    url,
    path,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (totalBytesExpectedToWrite > 0) {
        onProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100));
      }
    }
  );

  const result = await dl.downloadAsync();
  if (!result || result.status !== 200) {
    throw new Error('Download failed');
  }

  return path;
}

export async function deleteModel(modelId: string): Promise<void> {
  const path = getModelPath(modelId);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path);
  }
}

export async function getDownloadedModels(): Promise<string[]> {
  const downloaded: string[] = [];
  for (const m of AVAILABLE_MODELS) {
    if (await isModelDownloaded(m.id)) {
      downloaded.push(m.id);
    }
  }
  return downloaded;
}
