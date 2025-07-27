const express = require('express');
const router = express.Router();
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

// Проверка и создание папки frames
const fontsDir = path.join(__dirname, '../public','/fonts');
if (!fs.existsSync(fontsDir)) {
  throw new Error('Failed to load fonts');
}

router.get('/', async (req,res)=>{
    try {
    const files = await fsPromises.readdir(fontsDir);
    const fonts = files
      .filter(file => file.endsWith('.ttf'))
      .map(file => ({
        value: file,
        label: file.replace('.ttf', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }));
    res.json([ ...fonts]);
  } catch (err) {
    console.error('Error reading frames directory:', err);
    res.status(500).send('Failed to load frames');
  }
})

module.exports = router;