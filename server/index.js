const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const sharp = require('sharp');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const bwipjs = require('bwip-js');

const app = express();
const PORT = 3001;

const mmToPt = mm => mm * 2.8346456693;

// Проверка и создание папки uploads
const uploadDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Проверка и создание папки frames
const framesDir = path.join(__dirname, 'public', 'frames');
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'logo' && file.mimetype !== 'image/svg+xml') {
      return cb(new Error('Only SVG files are allowed for logo'));
    }
    cb(null, true);
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Эндпоинт для получения списка рамок
app.get('/frames', async (req, res) => {
  try {
    const files = await fsPromises.readdir(framesDir);
    const svgFiles = files
      // .filter(file => file.endsWith('.svg'))
      .map(file => ({
        value: file,
        label: file.replace('.svg', '').replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }));
    res.json([{ value: 'None', label: 'No Frame' }, ...svgFiles]);
  } catch (err) {
    console.error('Error reading frames directory:', err);
    res.status(500).send('Failed to load frames');
  }
});

app.post('/generate-pdf', upload.single('logo'), async (req, res) => {
  try {
    const {
      barcodeValue,
      barcodeType = 'code128',
      productName,
      article,
      seller,
      color,
      size,
      expirationDate,
      country,
      brand,
      customText,
      font = 'Helvetica',
      widthMm,
      heightMm,
      showColor,
      showSize,
      showExpirationDate,
      showCountry,
      showBrand,
      showArticle,
      showSeller,
      showEac,
      showNoReturn,
      logoXPercent,
      logoYPercent,
      logoWidth,
      frame
    } = req.body;

    // Валидация входных данных
    const widthMMNum = parseFloat(widthMm);
    const heightMMNum = parseFloat(heightMm);
    const logoXNum = parseFloat(logoXPercent) || 0;
    const logoYNum = parseFloat(logoYPercent) || 0;
    if (isNaN(widthMMNum) || isNaN(heightMMNum) || widthMMNum <= 0 || heightMMNum <= 0) {
      throw new Error('Invalid page dimensions');
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([mmToPt(widthMMNum), mmToPt(heightMMNum)]);
    const { width, height } = page.getSize();

    // Используем стандартный шрифт Helvetica
    const fontRef = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Штрихкод с динамической высотой, сохраняя пропорции
    const supportedBarcodeTypes = ['code128', 'qrcode', 'ean13'];
    if (!supportedBarcodeTypes.includes(barcodeType)) {
      throw new Error(`Unsupported barcode type: ${barcodeType}`);
    }
    const barcodeHeight = heightMMNum < 30 ? 0.25 : 0.4; // 0.3 при heightMm < 30, иначе 0.4
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: barcodeType,
      text: barcodeValue,
      scale: 2, 
      height: 10,
      includetext: true,
      textxalign: 'center',
      textsize: 10 
    });
    const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
    const barcodeDims = barcodeImage.scale(barcodeHeight);
const lines = [];
    if (showSeller === 'true' && seller) lines.push(seller);
    if (productName) lines.push(productName);
    if (showArticle === 'true' && article) lines.push(`Article: ${article}`);
    if ((showColor === 'true' && color) || (showSize === 'true' && size)) {
      lines.push((color && size) ? `Color: ${color} / Size: ${size}` : (color ? `Color: ${color}` : `Size: ${size}`));
    }
    if (showExpirationDate === 'true' && expirationDate) lines.push(`Expiration date: ${expirationDate}`);
    if (showCountry === 'true' && country) lines.push(`Country: ${country}`);
    if (showBrand === 'true' && brand) lines.push(`Brand: ${brand}`);
    if (showNoReturn === 'true') lines.push('Товар не подлежит возврату');
    if (customText) lines.push(customText);

    
    const lineCount = lines.length;
    const marginTop = Math.min(5, Math.max(2, heightMMNum / (lineCount + 1)));
    const marginBottom = req.file || showEac === 'true' ? mmToPt(15) : mmToPt(5); 
console.log("Top:", marginTop);


    const barcodeY = heightMMNum < 30 ? height - mmToPt(marginTop)/2.25 - barcodeDims.height : height - mmToPt(marginTop) - barcodeDims.height ;
    console.log(barcodeY);
    
    page.drawImage(barcodeImage, {
      x: width / 2 - barcodeDims.width / 2,
      y: barcodeY,
      width: barcodeDims.width,
      height: barcodeDims.height
    });

    // Текст (только латинские символы)
    
    const availableHeight = height - barcodeY - mmToPt(marginTop); // Доступная высота для текста
    const fontSize = heightMMNum<30? Math.max(5, Math.min(10, availableHeight / (lineCount))): Math.min(8, availableHeight / (lineCount)*1.2); // Мин 6pt, макс 10pt
    console.log("fontSize",fontSize);
    
    // Отрисовка текста
    let textY = barcodeY - mmToPt(marginTop);
    lines.forEach(line => {
      
      page.drawText(line, {
        x: mmToPt(widthMMNum/10),
        y: textY,
        size: fontSize,
        font: fontRef,
        color: rgb(0, 0, 0)
      });
      textY -= heightMMNum<30? fontSize :fontSize * 1.2;
       // Межстрочный интервал
    });

    // Знак EAC
    if (showEac === 'true') {
      const eacPath = path.join(__dirname, 'public', 'eac.svg');
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
          x: mmToPt(widthMMNum/100*70),
          y: mmToPt(heightMMNum/10),
          width: dims.width,
          height: dims.height
        });
      } catch (err) {
        console.error('Error processing EAC:', err);
        throw new Error(`Failed to process EAC: ${err.message}`);
      }
    }

    // SVG рамка (из файла на сервере)
    if (frame && frame !== 'None') {
      const framePath = path.join(__dirname, 'public', 'frames', frame);
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
        page.drawImage(image, { x: 0, y: 0, width, height });
      } catch (err) {
        console.error('Error processing frame:', err);
        throw new Error(`Failed to process frame: ${err.message}`);
      }
    }

    // SVG логотип (загружаемый файл)
    if (req.file) {
      const svgPath = req.file.path;
      try {
        const pngBuffer = await sharp(svgPath)
          .resize({ width: Math.round(mmToPt(logoWidth)) }) // 10 мм
          .png()
          .toBuffer();
        const image = await pdfDoc.embedPng(pngBuffer);
        const dims = image.scale(1);
        console.log("logo",widthMMNum/100*logoXPercent);
        
        
        page.drawImage(image, {
          x: mmToPt(widthMMNum/100*logoXPercent),
          y: mmToPt(heightMMNum/100*logoYPercent),
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

    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(__dirname, 'public', 'product.pdf');
    await fsPromises.writeFile(outPath, pdfBytes);

    if (!fs.existsSync(outPath)) {
      throw new Error('Failed to save PDF file');
    }

    res.json({ url: `http://localhost:${PORT}/product.pdf` });
  } catch (err) {
    console.error('PDF generation error:', err.message, err.stack);
    res.status(500).send(`PDF generation failed: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));