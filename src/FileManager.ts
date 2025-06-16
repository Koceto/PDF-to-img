import fs from "fs/promises";
import path from "path";

export class FileManager {
  constructor(private outputDir: string) {}

  async cleanupOldFiles(maxAge: number): Promise<void> {
    try {
      const dirs = await fs.readdir(this.outputDir);
      const now = Date.now();

      for (const dir of dirs) {
        const dirPath = path.join(this.outputDir, dir);

        try {
          const stats = await fs.stat(dirPath);

          if (stats.isDirectory() && now - stats.mtime.getTime() > maxAge) {
            console.log(`Cleaning up old directory: ${dir}`);
            await this.removeDirectory(dirPath);
          }
        } catch (error) {
          console.error(`Error checking directory ${dir}:`, error);
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  private async removeDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          await this.removeDirectory(filePath);
        } else {
          await fs.unlink(filePath);
        }
      }

      await fs.rmdir(dirPath);
    } catch (error) {
      console.error(`Error removing directory ${dirPath}:`, error);
    }
  }

  async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const files = await fs.readdir(dirPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error(`Error getting directory size for ${dirPath}:`, error);
      return 0;
    }
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }
}
