import express from "express";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import archiver from "archiver";
import { PDFConverter } from "./services/PDFConverter";
import { FileManager } from "./services/FileManager";

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./output";

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Initialize services
const pdfConverter = new PDFConverter();
const fileManager = new FileManager(OUTPUT_DIR);

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use("/output", express.static(OUTPUT_DIR));

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Convert PDF to images
app.post("/api/convert", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file provided" });
    }

    const { format = "png", quality = 150, scale = 1.0 } = req.body;
    const jobId = uuidv4();

    console.log(`Starting conversion job ${jobId} for file: ${req.file.filename}`);

    const options = {
      format: format as "png" | "jpg",
      quality: parseInt(quality),
      scale: parseFloat(scale),
      outputDir: path.join(OUTPUT_DIR, jobId),
    };

    const result = await pdfConverter.convert(req.file.path, options);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      jobId,
      success: true,
      pages: result.pages,
      outputPath: `/output/${jobId}`,
      downloadUrl: `/api/download/${jobId}`,
      images: result.files.map((file) => `/output/${jobId}/${path.basename(file)}`),
    });
  } catch (error) {
    console.error("Conversion error:", error);

    // Clean up on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error("Error cleaning up file:", e);
      }
    }

    res.status(500).json({
      error: "Conversion failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Download converted images as ZIP
app.get("/api/download/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobDir = path.join(OUTPUT_DIR, jobId);

    // Check if job directory exists
    try {
      await fs.access(jobDir);
    } catch {
      return res.status(404).json({ error: "Job not found" });
    }

    const files = await fs.readdir(jobDir);

    if (files.length === 0) {
      return res.status(404).json({ error: "No files found for this job" });
    }

    // Create ZIP archive
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="converted-images-${jobId}.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      res.status(500).json({ error: "Failed to create archive" });
    });

    archive.pipe(res);

    // Add files to archive
    for (const file of files) {
      const filePath = path.join(jobDir, file);
      archive.file(filePath, { name: file });
    }

    await archive.finalize();
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Download failed" });
  }
});

// Get job status
app.get("/api/status/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobDir = path.join(OUTPUT_DIR, jobId);

    try {
      const files = await fs.readdir(jobDir);
      res.json({
        jobId,
        status: "completed",
        fileCount: files.length,
        files: files.map((file) => `/output/${jobId}/${file}`),
      });
    } catch {
      res.json({
        jobId,
        status: "not_found",
      });
    }
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Status check failed" });
  }
});

// Cleanup old files (run every hour)
setInterval(async () => {
  try {
    await fileManager.cleanupOldFiles(24 * 60 * 60 * 1000); // 24 hours
    console.log("Cleanup completed");
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}, 60 * 60 * 1000);

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PDF Converter Service running on port ${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
});
