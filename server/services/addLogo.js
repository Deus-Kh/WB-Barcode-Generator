
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const sharp = require('sharp');

const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const mmToPt = mm => mm * 2.8346456693;
module.exports = async function addLogo(doc, svgPath, logoWidth, widthMMNum, heightMMNum, logoXPercent, logoYPercent) {
    try {

        let logoSVG = fs.readFileSync(svgPath).toString()
        // .replace(/width="[^"]*"/i, '')
        // .replace(/height="[^"]*"/i, '');
        const hasViewBox = /viewBox="[^"]*"/i.test(logoSVG);

        if(!hasViewBox){
            const widthMatch = logoSVG.match(/width="([\d.]+)([a-z]*)"/i);
            const heightMatch = logoSVG.match(/height="([\d.]+)([a-z]*)"/i);
            
            logoSVG = logoSVG.replace(
                /<svg/i,
                `<svg viewBox="0 0 ${widthMatch} ${heightMatch}"`
                );
        }
        logoSVG = logoSVG.replace(/width="[^"]*"/i, '').replace(/height="[^"]*"/i, '');

        SVGtoPDF(doc, logoSVG, mmToPt(widthMMNum / 100 * logoXPercent), mmToPt(heightMMNum / 100 * (100 - logoYPercent)) - mmToPt(logoWidth), { width: mmToPt(logoWidth), height: mmToPt(logoWidth) })

        await fsPromises.unlink(svgPath);
    } catch (err) {
        console.error('Error processing logo:', err);
        await fsPromises.unlink(svgPath);
        throw new Error(`Failed to process logo: ${err.message}`);
    }
}