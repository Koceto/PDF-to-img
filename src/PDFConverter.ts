import pdf from 'pdf-poppler';
import pdf2pic from 'pdf2pic';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ConversionOptions {
  format: 'png' | 'jpg';
  quality: number;
  scale: number;
  outputDir: string;
}

export interface ConversionResult {
  pages: number;
  files: string[];
  format: string;
  totalSize: number;
}

export class PDFConverter {
  async convert(pdfPath: string, options: ConversionOptions): Promise<ConversionResult> {
    try {
      // Ensure output directory exists
      await fs.mkdir(options.outputDir, { recursive: true });

      // Use pdf2pic for better quality and control
      const convert = pdf2pic.fromPath(pdfPath, {
        density: options.quality,
        saveFilename: 'page',
        savePath: options.outputDir,
        format: options.format,
        width: options.scale > 1 ? Math.floor(2480 * options.scale) : undefined,
        height: options.scale > 1 ? Math.floor(3508 * options.scale) : undefined
      });

      // Get PDF info first
      const pdfInfo = await this.getPDFInfo(pdfPath);
      const pageCount = pdfInfo.pages;

      // Convert all pages
      const results = await convert.bulk(-1, { responseType: 'image' });

      const files: string[] = [];
      let totalSize = 0;

      // Process each converted image
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const filename = `page_${(i + 1).toString().padStart(3, '0')}.${options.format}`;
        const filepath = path.join(options.outputDir, filename);

        // Optimize image with sharp if needed
        if (options.quality < 100 && options.format === 'jpg') {
          await sharp(result.path)
            .jpeg({ quality: options.quality })
            .toFile(filepath);

          // Remove original
          await fs.unlink(result.path);
        } else if (options.format === 'png') {
          await sharp(result.path)
            .png({ compressionLevel: 9 })
            .toFile(filepath);

          // Remove original
          await fs.unlink(result.path);
        } else {
          // Just rename the file
          await fs.rename(result.path, filepath);
        }

        // Get file size
        const stats = await fs.stat(filepath);
        totalSize += stats.size;
        files.push(filepath);
      }

      return {
        pages: pageCount,
        files,
        format: options.format,
        totalSize
      };

    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getPDFInfo(pdfPath: string): Promise<{ pages: number }> {
    try {
      // Use pdf-poppler to get PDF info
      const options = {
        format: 'png' as const,
        out_dir: '/tmp',
        out_prefix: 'temp',
        page: 1 // Just get first page to count
      };

      // This is a workaround to get page count
      const info = await pdf.info(pdfPath);
      return { pages: info.pages };
    } catch (error) {
      // Fallback: try to convert first page and estimate
      console.warn('Could not get PDF info, using fallback method');
      return { pages: 1 };
    }
  }

  async getSupportedFormats(): Promise<string[]> {
    return ['png', 'jpg', 'jpeg'];
  }

  async validatePDF(pdfPath: string): Promise<boolean> {
    try {
      await this.getPDFInfo(pdfPath);
      return true;
    } catch {
      return false;
    }
  }
}