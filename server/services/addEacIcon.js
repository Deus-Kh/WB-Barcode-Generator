const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const sharp = require('sharp');
const mmToPt = mm => mm * 2.8346456693;

module.exports = async function addEacIcon(pdfDoc, page, widthMMNum, heightMMNum) {
    const eacPath = path.join(__dirname, '../public', 'eac.svg');
    if (!fs.existsSync(eacPath)) {
        throw new Error('EAC file not found');
    }
    try {
        const svgBuffer = await fsPromises.readFile(eacPath);
        const pngBuffer = await sharp(svgBuffer)
            .resize({ width: Math.round(mmToPt(10)) }) // 10 мм
            .png()
            .toBuffer();
        const image = await pdfDoc.embedPng(pngBuffer);
        const dims = image.scale(0.5);
        page.drawImage(image, {
            x: mmToPt(widthMMNum / 100 * 70),
            y: mmToPt(heightMMNum / 10),
            width: dims.width,
            height: dims.height
        });
    } catch (err) {
        console.error('Error processing EAC:', err);
        throw new Error(`Failed to process EAC: ${err.message}`);
    }
}