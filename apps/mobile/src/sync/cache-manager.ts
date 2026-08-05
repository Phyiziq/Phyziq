import * as FileSystem from 'expo-file-system';

const CACHE_DIR = FileSystem.cacheDirectory + 'phyziq_offline_media/';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 27.4 Implement offline cache eviction job
 */
export class CacheManager {
  static async initCacheDir() {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  }

  static async runEvictionJob() {
    await this.initCacheDir();
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    const now = Date.now();

    for (const file of files) {
      const fileUri = CACHE_DIR + file;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (fileInfo.exists && fileInfo.modificationTime) {
        const fileAge = now - (fileInfo.modificationTime * 1000);
        if (fileAge > SEVEN_DAYS_MS) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          console.log(`Evicted stale cache file: ${file}`);
        }
      }
    }
  }

  // Pre-caching strategy (Addresses question from plan)
  static async downloadVideo(url: string, id: string) {
    await this.initCacheDir();
    const dest = CACHE_DIR + `${id}.mp4`;
    const info = await FileSystem.getInfoAsync(dest);
    
    if (!info.exists) {
      await FileSystem.downloadAsync(url, dest);
    }
    return dest;
  }
}
