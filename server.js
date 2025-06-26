const express = require('express');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Static folders
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/compressed', express.static('compressed'));

// Ensure folders exist
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('compressed')) fs.mkdirSync('compressed');

// Multer config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep original name
  }
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.array('files'), async (req, res) => {
  const files = req.files;
  const result = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const originalSize = fs.statSync(file.path).size;
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext);
    const shortId = Math.floor(10000 + Math.random() * 90000); // 5-digit
    const outputName = `${baseName}-compressed-${shortId}${ext}`;
    const outputPath = `compressed/${outputName}`;

    try {
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        await sharp(file.path)
          .resize({ width: 1000 })
          .jpeg({ quality: 60 })
          .toFile(outputPath);
      } else if (ext === '.pdf') {
        fs.copyFileSync(file.path, outputPath); // No compression
      }

      const compressedSize = fs.statSync(outputPath).size;

      result.push({
        originalName: file.originalname,
        originalSize,
        compressedSize,
        previewUrl: `/compressed/${outputName}`,
        downloadName: outputName
      });

    } catch (err) {
      console.error(`Error processing ${file.originalname}:`, err);
    }
  }

  res.json({ files: result });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
