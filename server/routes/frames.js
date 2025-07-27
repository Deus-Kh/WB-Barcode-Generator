const express = require('express');
const router = express.Router();
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

// Проверка и создание папки frames
const framesDir = path.join(__dirname, '../public', 'frames');
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}
// console.log(path.join(__dirname, '../public', 'frames'));

router.get('/', async (req,res)=>{
    try {
    const files = await fsPromises.readdir(framesDir);
    const svgFiles = files
      .filter(file => file.endsWith('.svg'))
      .map(file => ({
        value: file,
        label: file.replace('.svg', '').replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }));
    res.json([{ value: 'None', label: 'No Frame' }, ...svgFiles]);
  } catch (err) {
    console.error('Error reading frames directory:', err);
    res.status(500).send('Failed to load frames');
  }
})

module.exports = router;