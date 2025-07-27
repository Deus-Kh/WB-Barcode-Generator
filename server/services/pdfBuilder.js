const express = require('express');
const router = express.Router();
// const multer = require('multer');
// const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const sharp = require('sharp');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const bwipjs = require('bwip-js');
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
        font ,
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
        
    } = req.body;

    // Валидация входных данных
    const widthMMNum = parseFloat(widthMm);
    const heightMMNum = parseFloat(heightMm);
    // const logoXNum = parseFloat(logoXPercent) || 0;
    // const logoYNum = parseFloat(logoYPercent) || 0;
    if (isNaN(widthMMNum) || isNaN(heightMMNum) || widthMMNum <= 0 || heightMMNum <= 0) {
        throw new Error('Invalid page dimensions');
    }

    const pdfDoc = await PDFDocument.create();
    
    const page = pdfDoc.addPage([mmToPt(widthMMNum), mmToPt(heightMMNum)]);
    const { width, height } = page.getSize();

    // Используем стандартный шрифт Helvetica
    // const fontRef = await pdfDoc.embedFont(StandardFonts.Helvetica);
    pdfDoc.registerFontkit(fontkit);
    const fontBytes =  fs.readFileSync(`./fonts/${font}`);
    const fontRef = await pdfDoc.embedFont(fontBytes);


    //Calculating data
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
    if (showCustomText==='true'&&customText) lines.push(customText);
    if (showNoReturn === 'true') lines.push('Товар не подлежит возврату');

    const lineCount = lines.length;
    const marginTop = Math.min(10, Math.max(2, heightMMNum / (lineCount + 1)));
    // console.log("Top:", marginTop);



    // Штрихкод с динамической высотой, сохраняя пропорции
    const supportedBarcodeTypes = ['code128', 'qrcode', 'ean13'];
    if (!supportedBarcodeTypes.includes(barcodeType)) {
        throw new Error(`Unsupported barcode type: ${barcodeType}`);
    }

    const barcodeScale = heightMMNum < 30 ? 0.25 : 0.4; // 0.3 при heightMm < 30, иначе 0.4
    // console.log("height",heightMMNum);
    
    const barcodeBuffer = await bwipjs.toBuffer({
        bcid: barcodeType,
        text: barcodeValue,
        monochrome:true,
        scale: 20,
        height: 10,
        includetext: true,
        textxalign: 'center',
        textsize: 10,
        // render:'svg'
    });

    const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
    // console.log("Barcode Image",barcodeImage);
    
    // const barcodeDims = barcodeImage.scale(barcodeScale);
    const barcodeDims =  heightMMNum < 30 ? { width: 45, height: 18.5 }:{ width: 72, height: 29.6 }
    // console.log("Barcode Image 2",barcodeDims);

    const barcodeY = heightMMNum < 30 ? height - mmToPt(marginTop) / 2.25 - barcodeDims.height : height - mmToPt(marginTop) - barcodeDims.height;
    // console.log("barcodeY:",(height));

    page.drawImage(barcodeImage, {
        x: width / 2 - barcodeDims.width / 2,
        y: barcodeY,
        width: barcodeDims.width,
        height: barcodeDims.height
    });



    // Текст (только латинские символы)

    const availableHeight = height - barcodeY -mmToPt(marginTop); // Доступная высота для текста
    const fontSize = heightMMNum < 30 ? Math.max(5, Math.min(10, availableHeight / (lineCount))) : Math.max(5,Math.min(8, availableHeight / (lineCount) * 1.2)); // Мин 6pt, макс 10pt
    console.log("fontSize", fontSize);
    
    // Отрисовка текста
    let textY = barcodeY - mmToPt(marginTop);
    lines.forEach(line => {

        page.drawText(line, {
            x: mmToPt(widthMMNum / 9.8),
            y: textY,
            size: fontSize,
            font: fontRef,
            color: rgb(0, 0, 0)
        });
        textY -= heightMMNum < 30 ? fontSize : fontSize * 1.2;
        // Межстрочный интервал
    });

    // Знак EAC

    const addEacIcon = require('./addEacIcon')
    if (showEac === 'true') await addEacIcon(pdfDoc, page, widthMMNum, heightMMNum)

    // SVG рамка (из файла на сервере)
    const addFrame = require('./addFrame')
    if (frame && frame !== 'None') await addFrame(pdfDoc, page,frame, width, height)

    // SVG логотип (загружаемый файл)
    const addLogo = require('./addLogoOld')
    if(req.file) await addLogo(pdfDoc, page, req.file.path,logoWidth,widthMMNum,heightMMNum,logoXPercent,logoYPercent)
    

    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(__dirname, '../public', 'product.pdf');
    await fsPromises.writeFile(outPath, pdfBytes);

    if (!fs.existsSync(outPath)) {
        throw new Error('Failed to save PDF file');
    }


}


