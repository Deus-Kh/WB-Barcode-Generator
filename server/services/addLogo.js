const SVGtoPDF = require("svg-to-pdfkit");
const mmToPt = (mm) => mm * 2.8346456693;

function convertSvgToGrayscaleAdvanced(svgContent) {
  function rgbToGray(r, g, b) {
    const gray = Math.round(0.3 * r + 0.59 * g + 0.11 * b);
    return `rgb(${gray},${gray},${gray})`;
  }

  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  svgContent = svgContent.replace(
    /(fill|stroke)="([^"]+)"/gi,
    (match, attr, color) => {
      if (color === "none") return match;

      let grayColor = color;
      if (color.startsWith("#")) {
        const { r, g, b } = hexToRgb(color);
        grayColor = rgbToGray(r, g, b);
      } else if (color.startsWith("rgb")) {
        const parts = color.match(/\d+/g);
        if (parts) {
          const [r, g, b] = parts.map(Number);
          grayColor = rgbToGray(r, g, b);
        }
      } else {
        grayColor = "rgb(0,0,0)";
      }

      return `${attr}="${grayColor}"`;
    }
  );

  svgContent = svgContent.replace(
    /(fill|stroke):\s*([^;"\}]+)/gi,
    (match, attr, color) => {
      if (color === "none") return match;

      let grayColor = color;
      if (color.startsWith("#")) {
        const { r, g, b } = hexToRgb(color);
        grayColor = rgbToGray(r, g, b);
      } else if (color.startsWith("rgb")) {
        const parts = color.match(/\d+/g);
        if (parts) {
          const [r, g, b] = parts.map(Number);
          grayColor = rgbToGray(r, g, b);
        }
      } else {
        grayColor = "rgb(0,0,0)";
      }

      return `${attr}: ${grayColor}`;
    }
  );

  svgContent = svgContent.replace(/stop-color="([^"]+)"/gi, (match, color) => {
    let grayColor = color;

    if (color.startsWith("#")) {
      const { r, g, b } = hexToRgb(color);
      grayColor = rgbToGray(r, g, b);
    } else if (color.startsWith("rgb")) {
      const parts = color.match(/\d+/g);
      if (parts) {
        const [r, g, b] = parts.map(Number);
        grayColor = rgbToGray(r, g, b);
      }
    } else {
      grayColor = "rgb(0,0,0)";
    }

    return `stop-color="${grayColor}"`;
  });

  return svgContent;
}

module.exports = function addLogo(
  doc,
  svgPath,
  logoWidth,
  widthMMNum,
  heightMMNum,
  logoXPercent,
  logoYPercent
) {
  try {
    let logoSVG = svgPath.toString();

    const hasViewBox = /viewBox="[^"]*"/i.test(logoSVG);

    if (!hasViewBox) {
      const widthMatch = logoSVG.match(/width="([\d.]+)([a-z]*)"/i);
      const heightMatch = logoSVG.match(/height="([\d.]+)([a-z]*)"/i);

      logoSVG = logoSVG.replace(
        /<svg/i,
        `<svg viewBox="0 0 ${widthMatch} ${heightMatch}"`
      );
    }
    logoSVG = logoSVG
      .replace(/width="[^"]*"/i, "")
      .replace(/height="[^"]*"/i, "");

    SVGtoPDF(
      doc,
      convertSvgToGrayscaleAdvanced(logoSVG),
      mmToPt((widthMMNum / 100) * logoXPercent),
      mmToPt((heightMMNum / 100) * (100 - logoYPercent)) - mmToPt(logoWidth),
      { width: mmToPt(logoWidth), height: mmToPt(logoWidth) }
    );
  } catch (err) {
    console.error("Error processing logo:", err);

    throw new Error(`Failed to process logo: ${err.message}`);
  }
};
