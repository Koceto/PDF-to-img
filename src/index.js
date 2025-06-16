const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const { fromPath } = require("pdf2pic");

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

app.post("/api/convert", async (req, res) => {
  try {
    if (!req.files?.pdf) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const pdfFile = req.files.pdf;
    const uploadPath = path.join(__dirname, "../uploads", pdfFile.name);

    await pdfFile.mv(uploadPath);

    const options = {
      density: 300,
      saveFilename: `output-${Date.now()}`,
      savePath: "./uploads",
      format: "png",
      width: 1200,
    };

    const convert = fromPath(uploadPath, options);
    const pages = await convert.bulk(-1);

    res.json({
      success: true,
      images: pages.map((page) => `/uploads/${page.name}`),
    });
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({ error: "PDF conversion failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
