const express = require('express');
const router = express.Router();
// const multer = require('multer');
// const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const sharp = require('sharp');
// const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
// const { log } = require('console');
// const { moveMessagePortToContext } = require('worker_threads');
// const { height } = require('pdfkit/js/page');
const mmToPt = mm => mm * 2.8346456693;

module.exports = async function pdfBuilder(req) {
    const {
        barcodeValue,
        barcodeType = 'code128',
        productName,
        article,
        seller,
        color,
        size,
        amount,
        country,
        brand,
        customText,
        font,
        widthMm,
        heightMm,
        showColor,
        showSize,
        // showExpirationDate,
        showCountry,
        showBrand,
        showArticle,
        showSeller,
        showCustomText,
        showEac,
        showNoReturn,
        logoXPercent,
        logoYPercent,
        logoWidth,
        frame,
        paper

    } = req.body;


    const widthMMNum = (widthMm);
    const heightMMNum = (heightMm);
    const a4WidthPt = mmToPt(210);
    const a4HeightPt = mmToPt(297);
    const marginPt = paper === 'a4' ? 1 : 0;



    const doc = new PDFDocument({ size: [mmToPt(widthMMNum), mmToPt(heightMMNum)], margin: -1 });
    doc.font(path.join(__dirname, '../public',`/fonts/${font}`))
    if (isNaN(widthMMNum) || isNaN(heightMMNum) || widthMMNum <= 0 || heightMMNum <= 0) {
        throw new Error('Invalid page dimensions');
    }
    const lines = [];
    if (showSeller === 'true' && seller) lines.push(seller);
    if (productName) lines.push(productName);
    if (showArticle === 'true' && article) lines.push(`Article: ${article}`);
    if ((showColor === 'true' && color) || (showSize === 'true' && size)) {
        lines.push((color && size) ? `Color: ${color} / Size: ${size}` : (color ? `Color: ${color}` : `Size: ${size}`));
    }
    // if (showExpirationDate === 'true' && expirationDate) lines.push(`Expiration date: ${expirationDate}`);
    if (showCountry === 'true' && country) lines.push(`Country: ${country}`);
    if (showBrand === 'true' && brand) lines.push(`Brand: ${brand}`);

    if (showCustomText === 'true' && customText) lines.push(customText);
    if (showNoReturn === 'true') lines.push('Товар не подлежит обязательной сертификации');

    const lineCount = lines.length;
    const marginTop = Math.min(8, Math.max(2, heightMMNum / (lineCount + 2)));
    const supportedBarcodeTypes = ['code128', 'qrcode', 'ean13'];
    if (!supportedBarcodeTypes.includes(barcodeType)) {
        throw new Error(`Unsupported barcode type: ${barcodeType}`);
    }

    const barcodeBuffer = bwipjs.toSVG({
        bcid: barcodeType,
        text: barcodeValue,
        monochrome: true,
        scale: 20,
        height: 10,
        includetext: true,
        textxalign: 'center',
        textsize: 10,
        backgroundcolor: 'FFFFFF',
        padding: 0,

    });
    fs.writeFileSync('barcode.svg', barcodeBuffer.toString())
    // const barcodeSvg = fs.readFileSync('barcode.svg', 'utf8');
    const barcodeSvg = barcodeBuffer.toString()
    const barcodeDims = heightMMNum < 30 ? { width: 45, height: 18.5 } : { width: 72, height: 29.6 }
    const barcodeY = heightMMNum < 30 ? mmToPt(marginTop) + barcodeDims.height : mmToPt(marginTop) + barcodeDims.height;
    // const barcodeY = heightMMNum < 30 ? mmToPt(heightMMNum) - mmToPt(marginTop) / 2.25 - barcodeDims.height : -mmToPt(heightMMNum)/2+marginTop+barcodeDims.height
    // console.log("Lines", lines.length);
    // console.log(marginTop);

    SVGtoPDF(doc, barcodeSvg, mmToPt(widthMMNum) / 2 - barcodeDims.width / 2, mmToPt(marginTop), { width: barcodeDims.width, height: barcodeDims.height });
    // console.log("Y::", barcodeY);
    if (frame && frame !== 'None') {
        const frameSVG = fs.readFileSync(`./public/frames/${frame}`).toString()
        SVGtoPDF(doc, frameSVG, 0, 0, { width: widthMMNum - 2, height: heightMMNum })
        // await fsPromises.unlink(frameSVG);
    }


    if (showEac === 'true') {
        let eacSVG = fs.readFileSync('./public/eac.svg').toString()
        // .replace(/width="[^"]*"/i, '')
        // .replace(/height="[^"]*"/i, '')
        const widthMatch = eacSVG.match(/width="([\d.]+)"/i);
        const heightMatch = eacSVG.match(/height="([\d.]+)"/i);
        if (widthMatch && heightMatch) {
            const width = parseFloat(widthMatch[1]);
            const height = parseFloat(heightMatch[1]);

            // Удаляем width и height
            eacSVG = eacSVG.replace(/width="[^"]*"/i, '').replace(/height="[^"]*"/i, '');

            // Добавляем viewBox
            eacSVG = eacSVG.replace(
                /<svg/i,
                `<svg viewBox="0 0 ${width} ${height}"`
            );}
            SVGtoPDF(doc, eacSVG, mmToPt(widthMm)/10*7, mmToPt(heightMm)*0.9-13, { width: 14, height:13 })
            // await fsPromises.unlink(eacSVG);
        }


        const availableHeight = mmToPt(heightMm) - barcodeY  // Доступная высота для текста
        console.log("aviable", availableHeight);

        const fontSize = heightMMNum < 30 ? Math.max(5, Math.min(8, availableHeight / (lineCount + 3))) : Math.max(5, Math.min(7, availableHeight / (lineCount + 2))); // Мин 6pt, макс 10pt
        console.log("FontSize:", fontSize);

        doc.fontSize(fontSize)
        let textY = heightMMNum<30?mmToPt(heightMm) - availableHeight :mmToPt(heightMm) - availableHeight + fontSize
        console.log(barcodeY);

        // let textY = 0
        // doc.text(lines[0], mmToPt(widthMMNum / 9.8),-textY)
        
        lines.forEach(line => {
            if (textY<mmToPt(heightMm)-fontSize) {
                doc.text(line, mmToPt(widthMMNum / 9.8), textY,{width:mmToPt(widthMm)/2, lineBreak:false, lineGap:0})
                textY += heightMMNum < 30 ? fontSize : fontSize * 1.2;
            }
            
            

        })

        const addLogo = require('./addLogo');
        if (req.file) await addLogo(doc, req.file.path, logoWidth, widthMMNum, heightMMNum, logoXPercent, logoYPercent)

        const outPath = path.join(__dirname, '../public', 'product.pdf');
        doc.pipe(fs.createWriteStream(outPath));
        doc.end();
    }













