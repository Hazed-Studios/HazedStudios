const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public/images');

async function processImages() {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.JPG')) {
      const filePath = path.join(dir, file);
      const outPath = filePath.replace('.JPG', '.webp');
      
      console.log(`Compressing ${file} with correct orientation...`);
      await sharp(filePath)
        .rotate() // Auto-rotate based on EXIF orientation!
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 })
        .toFile(outPath);
      
      // Remove original file
      try { fs.unlinkSync(filePath); } catch (e) { console.log(e); }
    }
  }
  console.log('All images compressed and correctly oriented!');
}

processImages().catch(console.error);
