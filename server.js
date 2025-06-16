const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const pdf2img = require('pdf-img-convert');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    abortOnLimit: true,
  })
);

// Serve the index.html file from the parent directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
});

app.post("/api/convert", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    if (!req.files?.pdf) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const pdfFile = req.files.pdf;

    // Get PDF dimensions
    const pdfDoc = await PDFDocument.load(pdfFile.data);
    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();
    const aspectRatio = width / height;

    // Send upload complete progress
    res.write(JSON.stringify({ type: 'upload', progress: 100 }) + '\n');

    // Convert PDF to images
    const baseWidth = 1200;
    const pngPages = await pdf2img.convert(pdfFile.data, {
      width: baseWidth,
      height: Math.round(baseWidth / aspectRatio),
    });

    const totalPages = pngPages.length;

    // Process each page
    for (let i = 0; i < totalPages; i++) {
      const pageBuffer = pngPages[i];

      // Optimize the PNG using sharp
      const optimizedBuffer = await sharp(pageBuffer)
        .png({ quality: 90 })
        .toBuffer();

      // Convert to base64 and send
      const base64Image = optimizedBuffer.toString('base64');

      // Send conversion progress
      res.write(JSON.stringify({
        type: 'conversion',
        progress: Math.round(((i + 1) / totalPages) * 100)
      }) + '\n');

      // Send the converted image as base64
      res.write(JSON.stringify({
        url: `data:image/png;base64,${base64Image}`
      }) + '\n');
    }

    // End the response
    res.end();

  } catch (error) {
    console.error("Conversion error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "PDF conversion failed" });
    } else {
      res.write(JSON.stringify({ error: "PDF conversion failed" }) + '\n');
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
