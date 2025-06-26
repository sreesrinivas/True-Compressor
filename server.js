const express = require('express');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/compressed', express.static(path.join(__dirname, 'compressed')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure directories exist
['uploads', 'compressed'].forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath);
  }
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const timestamp = Date.now().toString().slice(-6); // Shorten timestamp
    const name = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    cb(null, `${name}-${timestamp}${ext}`);
  }
});

const upload = multer({ storage });

// Upload & compress endpoint
app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    const result = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const mimeType = file.mimetype;
      const originalSize = fs.statSync(file.path).size;

      const compressedName = file.filename;
      const outputPath = path.join(__dirname, 'compressed', compressedName);

      // Image compression
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        await sharp(file.path)
          .resize({ width: 1000 })
          .toFormat('jpeg', { quality: 60 })
          .toFile(outputPath);
      } else {
        fs.copyFileSync(file.path, outputPath); // Copy other formats (e.g., PDF uncompressed)
      }

      const compressedSize = fs.statSync(outputPath).size;
      const base64 = fs.readFileSync(outputPath, { encoding: 'base64' });

      result.push({
        originalName: file.originalname,
        originalSize,
        compressedSize,
        downloadName: compressedName,
        base64,
        mimeType
      });
    }

    res.json({ files: result });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
