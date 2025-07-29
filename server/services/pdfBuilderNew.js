const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const bwipjs = require("bwip-js");
const PDFDocument = require("pdfkit");
const SVGtoPDF = require("svg-to-pdfkit");
const mmToPt = (mm) => mm * 2.8346456693;

module.exports = async function pdfBuilder(req) {
  const {
    barcodeValue,
    barcodeType = "code128",
    productName,
    article,
    seller,
    color,
    size,
    amount = 1,
    country,
    brand,
    customText,
    font,
    widthMm,
    heightMm,
    showColor,
    showSize,
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
    paper = "single",
  } = req.body;

  const widthMMNum = parseFloat(widthMm);
  const heightMMNum = parseFloat(heightMm);
  const labelWidthPt = mmToPt(widthMMNum);
  const labelHeightPt = mmToPt(heightMMNum);
  const a4WidthPt = mmToPt(210);
  const a4HeightPt = mmToPt(297);
  const marginPt = paper === "a4" ? 1 : 0; // отступы только для A4

  const fontPath = path.join(__dirname, "../public", `/fonts/${font}`);

  const generateBarcodeSVG = () => {
    return bwipjs.toSVG({
      bcid: barcodeType,
      text: barcodeValue,
      monochrome: true,
      scale: 20,
      height: 10,
      includetext: true,
      textxalign: "center",
      textsize: 10,
      backgroundcolor: "FFFFFF",
      padding: 0,
    });
  };

  const renderLabel = (doc, x, y, barcodeSvg) => {
    doc.save();
    doc.translate(x, y);

    // рамка
    if (paper === "a4")
      doc.rect(0, 0, labelWidthPt, labelHeightPt).lineWidth(1).stroke();

    const lines = [];
    let linesLenght = 0;
    if (showSeller === "true" && seller) lines.push(seller);
    if (productName) lines.push(productName);
    if (showArticle === "true" && article) lines.push(`Article: ${article}`);
    if ((showColor === "true" && color) || (showSize === "true" && size)) {
      lines.push(
        color && size
          ? `Color: ${color} / Size: ${size}`
          : color
          ? `Color: ${color}`
          : `Size: ${size}`
      );
    }
    if (showCountry === "true" && country) lines.push(`Country: ${country}`);
    if (showBrand === "true" && brand) lines.push(`Brand: ${brand}`);
    if (showCustomText === "true" && customText) lines.push(customText);
    if (showNoReturn === "true") {
      if (heightMMNum < 28) {
        linesLenght += 3;
      } else {
        linesLenght += 2;
      }
    }

    linesLenght += lines.length;

    const marginTop = Math.min(8, Math.max(2, heightMMNum / (linesLenght + 2)));
    const barcodeDims =
      heightMMNum < 30
        ? { width: 45, height: 18.5 }
        : { width: 72, height: 29.6 };
    const barcodeY = mmToPt(marginTop);

    SVGtoPDF(
      doc,
      barcodeSvg,
      labelWidthPt / 2 - barcodeDims.width / 2,
      barcodeY,
      { width: barcodeDims.width, height: barcodeDims.height }
    );

    let fontSize =
      heightMMNum < 30
        ? 5
        : Math.floor(
            Math.max(
              5,
              Math.min(
                8,
                (labelHeightPt - barcodeDims.height - barcodeY) /
                  (linesLenght + 2)
              )
            )
          );
        
          
    // const fontSize =   (labelHeightPt - barcodeY) / (lines.length + 3)
    // if (linesLenght>7&&heightMMNum <=40) {
    //     fontSize=5
    // }
    // else if (linesLenght>5||heightMMNum <= 30) {
    //     fontSize=heightMMNum <= 35 ? 5:7
    // }
    doc.font(fontPath).fontSize(fontSize);
    let textY = barcodeY + barcodeDims.height + fontSize / 2;
    lines.forEach((line) => {
      if (textY + fontSize < labelHeightPt) {
        doc.text(line, (labelWidthPt / 100) * 12, textY, {
          width: labelWidthPt * 0.7,
          lineBreak: false,
          lineGap: 0,
        });
        textY += heightMMNum <= 30 ? fontSize : fontSize * 1;
      }
    });

    if (showNoReturn === "true") {
      let noRet = [];
      if (heightMMNum < 28||heightMMNum ==35) {
        noRet.push("Товар не подлежит ");
        noRet.push("обязательной ");
        noRet.push("сертификации");
      } else {
        noRet.push("Товар не подлежит");
        noRet.push("обязательной сертификации");
      }
      if (textY + noRet.length * fontSize < labelHeightPt) {
        noRet.forEach((noRetElem) => {
          doc.text(noRetElem, (labelWidthPt / 100) * 12, textY, {
            width: labelWidthPt * 0.55,
            // lineBreak: false,
            lineGap: 0,
            paragraphGap :0
          });
          textY += fontSize;
        });
      }
    }

    if (frame && frame !== "None") {
      const framePath = path.join(__dirname, "../public/frames", frame);
      const frameSVG = fs
        .readFileSync(framePath)
        .toString()
        .replace(/width="[^"]*"/i, "")
        .replace(/height="[^"]*"/i, "")
        .replace(/fill="(#ffffff|white|#fff)"/gi, 'fill="none"')
        .replace(/<svg[^>]+/, (match) => {
          return match.includes("preserveAspectRatio")
            ? match.replace(
                /preserveAspectRatio="[^"]*"/i,
                'preserveAspectRatio="none"'
              )
            : match.replace(/<svg/i, '<svg preserveAspectRatio="none"');
        });

      SVGtoPDF(doc, frameSVG, 0, 0, {
        width: mmToPt(widthMMNum),
        height: mmToPt(heightMMNum),
      });
    }
    if (showEac === "true") {
      let eacSVG = fs.readFileSync("./public/eac.svg").toString();
      const widthMatch = eacSVG.match(/width="([\d.]+)"/i);
      const heightMatch = eacSVG.match(/height="([\d.]+)"/i);
      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);

        // Удаляем width и height
        eacSVG = eacSVG
          .replace(/width="[^"]*"/i, "")
          .replace(/height="[^"]*"/i, "");

        // Добавляем viewBox
        eacSVG = eacSVG.replace(
          /<svg/i,
          `<svg viewBox="0 0 ${width} ${height}"`
        );
      }
      SVGtoPDF(
        doc,
        eacSVG,
        (mmToPt(widthMm) / 10) * 7,
        mmToPt(heightMm) * 0.9 - 13,
        { width: 14, height: 13 }
      );
    }
    const addLogo = require("./addLogo");
    if (req.file)
      addLogo(
        doc,
        req.file.buffer,
        logoWidth,
        widthMMNum,
        heightMMNum,
        logoXPercent,
        logoYPercent
      );
    doc.restore();
  };

  const docOptions =
    paper === "a4"
      ? { size: [a4WidthPt, a4HeightPt], margin: 1 }
      : { size: [labelWidthPt, labelHeightPt], margin: 1 };

  const doc = new PDFDocument(docOptions);
  const outPath = path.join(__dirname, "../public", "product.pdf");
  doc.pipe(fs.createWriteStream(outPath));

  const barcodeSvg = generateBarcodeSVG().toString();
  if (amount<1) {
    amount=1
  }
  if (paper === "thermal") {
    for (let i = 0; i < amount; i++) {
      renderLabel(doc, 0, 0, barcodeSvg);
      if (i < amount - 1)
        doc.addPage({ size: [labelWidthPt, labelHeightPt], margin: 0 });
    }
  } else {
    const cols = Math.floor((a4WidthPt - 2 * marginPt) / labelWidthPt);
    const rows = Math.floor((a4HeightPt - 2 * marginPt) / labelHeightPt);
    const perPage = cols * rows;

    for (let i = 0; i < amount; i++) {
      const pageIndex = Math.floor(i / perPage);
      const indexInPage = i % perPage;
      const col = indexInPage % cols;
      const row = Math.floor(indexInPage / cols);
      const x = marginPt + col * labelWidthPt;
      const y = marginPt + row * labelHeightPt;

      if (i > 0 && indexInPage === 0)
        doc.addPage({ size: [a4WidthPt, a4HeightPt], margin: 0 });
      renderLabel(doc, x, y, barcodeSvg);
    }
  }

  doc.end();
};
