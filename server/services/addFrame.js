const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const sharp = require('sharp');


module.exports = async function addFrame(pdfDoc, page, frame, width,height) {
    const framePath = path.join(__dirname, '../public', 'frames', frame);
    if (!fs.existsSync(framePath)) {
        throw new Error(`Frame file not found: ${frame}`);
    }
    try {
        const fileBuffer = await fsPromises.readFile(framePath);
        const isSvg = frame.endsWith('.svg');
        const pngBuffer = isSvg
            ? await sharp(fileBuffer)
                .resize({
                    width: Math.round(width),
                    height: Math.round(height),
                    fit: 'fill',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toBuffer()
            : fileBuffer; // Если PNG, используем как есть
        const image = await pdfDoc.embedPng(pngBuffer);
        // page.drawImage(image, { x: 0, y: 0, width, height });
        page.drawImage(image, { x: 0, y: 0, width, height });
    } catch (err) {
        console.error('Error processing frame:', err);
        throw new Error(`Failed to process frame: ${err.message}`);
    }
}