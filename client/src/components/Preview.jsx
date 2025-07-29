import React, { useRef, useEffect } from "react";
import bwipjs from "bwip-js";
import { handleDragOver, handleDrop } from "../utils";

const Preview = ({ formData, logoPreview, previewUrl, setFormData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const mmToPt = (mm) => mm * 3.7795275591;
    const scaleFactor = 3.7795275591;
    const widthPx = formData.widthMm * scaleFactor;
    const heightPx = formData.heightMm * scaleFactor;
    canvas.width = widthPx;
    canvas.height = heightPx;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, widthPx, heightPx);

    const renderFrame = () =>
      new Promise((resolve) => {
        if (formData.frame === "None") return resolve();
        const frameImg = new Image();
        frameImg.src = `${process.env.REACT_APP_SERVER_URL}/frames/${formData.frame}`;
        frameImg.onload = () => {
          ctx.drawImage(frameImg, 0, 0, widthPx, heightPx);
          resolve();
        };
        frameImg.onerror = () => {
          console.error("Frame load error:", formData.frame);
          resolve();
        };
      });

    const renderBarcode = async () => {
      //   const barcodeScale = formData.heightMm < 30 ? 0.625 : 1;
      let linesLenght = 0;
      const lines = [];
      if (formData.showSeller && formData.seller) lines.push(formData.seller);
      if (formData.productName) lines.push(formData.productName);
      if (formData.showArticle && formData.article)
        lines.push(`Article: ${formData.article}`);
      if (
        (formData.showColor && formData.color) ||
        (formData.showSize === "true" && formData.size)
      ) {
        lines.push(
          formData.color && formData.size
            ? `Color: ${formData.color} / Size: ${formData.size}`
            : formData.color
            ? `Color: ${formData.color}`
            : `Size: ${formData.size}`
        );
      }
      if (formData.showCountry && formData.country)
        lines.push(`Country: ${formData.country}`);
      if (formData.showBrand && formData.brand)
        lines.push(`Brand: ${formData.brand}`);
      if (formData.showCustomText && formData.customText)
        lines.push(formData.customText);
      if (formData.showNoReturn) {
        if (formData.heightMMNum < 28) {
          linesLenght += 3;
        } else {
          linesLenght += 2;
        }
      }

    //   const lineCount = lines.length;
      linesLenght += lines.length;
      const marginTop = Math.min(
        8,
        Math.max(2, Math.floor(formData.heightMm) / (linesLenght + 2))
      );

      if (!formData.barcodeValue) return 2;

      const tempCanvas = document.createElement("canvas");
      try {
        bwipjs.toCanvas(tempCanvas, {
          bcid: formData.barcodeType,
          text: formData.barcodeValue,
          scale: 15,
          height: 10,
          includetext: true,
          textxalign: "center",
          textsize: 10,
        });
        const barcodeDims =
          formData.heightMm < 30
            ? { width: 60, height: 24.66 }
            : { width: 96, height: 39.46 };
        const barcodeY = mmToPt(marginTop);
        // const barcodeYPx = 2 * scaleFactor;
        ctx.drawImage(
          tempCanvas,
          widthPx / 2 - barcodeDims.width / 2,
          barcodeY,
          barcodeDims.width,
          barcodeDims.height
        );
        return barcodeY + barcodeDims.height;
      } catch (err) {
        console.error("Barcode render error:", err);
        return 2;
      }
    };

    const renderText = (barcodeBottomY) => {
      let linesLenght = 0;
      const lines = [];
      if (formData.showSeller && formData.seller) lines.push(formData.seller);
      if (formData.productName) lines.push(formData.productName);
      if (formData.showArticle && formData.article)
        lines.push(`Article: ${formData.article}`);
      if (
        (formData.showColor && formData.color) ||
        (formData.showSize === "true" && formData.size)
      ) {
        lines.push(
          formData.color && formData.size
            ? `Color: ${formData.color} / Size: ${formData.size}`
            : formData.color
            ? `Color: ${formData.color}`
            : `Size: ${formData.size}`
        );
      }
      if (formData.showCountry && formData.country)
        lines.push(`Country: ${formData.country}`);
      if (formData.showBrand && formData.brand)
        lines.push(`Brand: ${formData.brand}`);
      if (formData.showCustomText && formData.customText)
        lines.push(formData.customText);
      if (formData.showNoReturn) {
        if (formData.heightMMNum < 28) {
          linesLenght += 3;
        } else {
          linesLenght += 2;
        }
      }
      linesLenght += lines.length;
      //   if (formData.showNoReturn) lines.push('Товар не подлежит обязательной сертификации');

      // const marginTop = Math.min(7, Math.max(2, formData.heightMm / lineCount));
      // const marginTop = Math.min(8, Math.max(2, formData.heightMm / (linesLenght + 2)));
      // const availableHeight = mmToPt(formData.heightMm) - barcodeBottomY;

      const fontSize =
        formData.heightMm < 30
          ? 5
          : Math.max(
              5,
              Math.min(
                8,
                (mmToPt(formData.heightMm) - barcodeBottomY) /
                  ((linesLenght + 2) / 0.75)
              )
            );
    //   console.log("font Size", fontSize);
    //   console.log("aviable", mmToPt(formData.heightMm) - barcodeBottomY);

      ctx.font = `normal ${fontSize}pt  ${formData.font
        .replace(".ttf", "")
        .replace(/\b\w/g, (c) => c.toUpperCase())}`;

      ctx.fillStyle = "black";
      let textY = barcodeBottomY + mmToPt(fontSize / 2);
    //   console.log("textY:", textY);

      function wrapText(text, x, y, maxWidth) {
        const words = text.split(" ");
        let line = "";

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + " ";
            y += fontSize * 1.2;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
      }

      lines.forEach((line) => {
        if (textY + fontSize < mmToPt(formData.heightMm)) {
          wrapText(
            line,
            (widthPx / 100) * 12,
            textY,
            mmToPt(formData.widthMm) * 0.55
          );
        }
        textY += fontSize * 1.2;
      });

      if (formData.showNoReturn) {
        let noRet = [];
        if (formData.heightMm < 28 || formData.heightMm === 35) {
          noRet.push("Товар не подлежит ");
          noRet.push("обязательной ");
          noRet.push("сертификации");
        } else {
          noRet.push("Товар не подлежит");
          noRet.push("обязательной сертификации");
        }
        if (textY + noRet.length * fontSize < mmToPt(formData.heightMm)) {
          noRet.forEach((noRetElem) => {
            wrapText(
              noRetElem,
              (widthPx / 100) * 12,
              textY,
              mmToPt(formData.widthMm) * 0.55
            );
            textY += fontSize * 1.2;
          });
        }
      }
    };

    const renderEacAndLogo = () =>
      new Promise((resolve) => {
        let loaded = 0;
        const checkDone = () => {
          if (
            ++loaded ===
            (formData.showEac && formData.logo
              ? 2
              : formData.showEac || formData.logo
              ? 1
              : 0)
          )
            resolve();
        };

        if (formData.showEac) {
          const eacImg = new Image();
          eacImg.src = "./eac.svg";
          eacImg.onload = () => {
            const eacX = widthPx * 0.7;
            const eacY = heightPx * 0.9 - mmToPt(10) / 2;
            ctx.drawImage(eacImg, eacX, eacY, mmToPt(10) / 2, mmToPt(10) / 2);
            checkDone();
          };
          eacImg.onerror = () => {
            console.error("EAC load error");
            checkDone();
          };
        }

        if (!formData.showEac && !formData.logo) resolve();
      });

    (async () => {
      await renderFrame();
      const barcodeBottomY = await renderBarcode();
      renderText(barcodeBottomY);
      await renderEacAndLogo();
    })();
  }, [formData]);

  return (
    <div style={{ flex: 1 }}>
      <h2>Live Preview</h2>
      <div
        style={{
          width: `${formData.widthMm * 3.7795275591}px`,
          height: `${formData.heightMm * 3.7795275591}px`,
          border: "1px solid #ccc",
          position: "relative",
          backgroundColor: "#f9f9f9",
          overflow: "hidden",
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, formData, setFormData)}
      >
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        {logoPreview && (
          <img
            src={logoPreview}
            alt="Logo"
            style={{
              width: `${formData.logoWidth * 3.7795275591}px`,
              position: "absolute",
              left: `${
                (formData.logoXPercent * formData.widthMm * 3.7795275591) / 100
              }px`,
              bottom: `${
                (formData.logoYPercent * formData.heightMm * 3.7795275591) / 100
              }px`,
              cursor: "move",
              filter: "grayscale(100%)",
            }}
            draggable
          />
        )}
      </div>
      {formData.logo && (
        <p>
          Logo Position: X={formData.logoXPercent.toFixed(2)}%, Y=
          {formData.logoYPercent.toFixed(2)}%, Width=
          {formData.logoWidth.toFixed(2)}mm
        </p>
      )}
      {previewUrl && (
        <div style={{ marginTop: "2rem" }}>
          <h2>PDF Preview</h2>
          <iframe
            src={previewUrl}
            style={{ width: "100%", height: "500px", border: "1px solid #ccc" }}
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  );
};

export default Preview;
