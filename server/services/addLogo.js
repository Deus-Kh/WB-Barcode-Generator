const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const sharp = require('sharp');
const mmToPt = mm => mm * 2.8346456693;

module.exports = async function addLogo(pdfDoc, page, svgPath,logoWidth,widthMMNum,heightMMNum,logoXPercent,logoYPercent) {
    try {
        const pngBuffer = await sharp(svgPath)
            .resize({ width: Math.round(mmToPt(logoWidth)) }) // 10 мм
            .png()
            .toBuffer();
        const image = await pdfDoc.embedPng(pngBuffer);
        const dims = image.scale(1);
        console.log("logo", widthMMNum / 100 * logoXPercent);


        page.drawImage(image, {
            x: mmToPt(widthMMNum / 100 * logoXPercent),
            y: mmToPt(heightMMNum / 100 * logoYPercent),
            width: dims.width,
            height: dims.height
        });
        await fsPromises.unlink(svgPath);
    } catch (err) {
        console.error('Error processing logo:', err);
        await fsPromises.unlink(svgPath);
        throw new Error(`Failed to process logo: ${err.message}`);
    }
}