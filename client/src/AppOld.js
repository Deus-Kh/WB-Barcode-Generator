import React, { useState, useEffect, useRef } from 'react';
import bwipjs from 'bwip-js';
// import dotenv from 'dotenv';

// dotenv.config();

const REACT_APP_SERVER_URL = process.env.REACT_APP_SERVER_URL;
// Таблица размеров страницы
const pageSizes = [
  { widthMm: 38, heightMm: 21.2 },
  { widthMm: 43, heightMm: 25 },
  { widthMm: 48.5, heightMm: 25.4 },
  { widthMm: 52, heightMm: 28.5 },
  { widthMm: 52, heightMm: 34 },
  { widthMm: 52.5, heightMm: 29.7 },
  { widthMm: 52.5, heightMm: 35 },
  { widthMm: 58, heightMm: 40 },
  { widthMm: 70, heightMm: 37 },
  { widthMm: 64, heightMm: 33.4 },
  { widthMm: 64.6, heightMm: 33.8 },
  { widthMm: 64.6, heightMm: 34.8 },
  { widthMm: 66.7, heightMm: 46 },
  { widthMm: 70, heightMm: 42 },
  { widthMm: 70, heightMm: 42.3 },
  { widthMm: 70, heightMm: 49.5 },
  { widthMm: 105, heightMm: 48 },
];

function App() {
  const [formData, setFormData] = useState({
    barcodeType: 'code128',
    barcodeValue: '',
    seller: '',
    productName: '',
    article: '',
    color: '',
    size: '',
    amount: 1,
    // expirationDate: '',
    country: '',
    brand: '',
    customText: '',

    showArticle: true,
    showSeller: true,
    showColor: true,
    showSize: true,
    // showExpirationDate: true,
    showCountry: false,
    showBrand: false,
    showCustomText: false,
    showEac: false,
    showNoReturn: false,
    logo: null,
    logoXPercent: 0,
    logoYPercent: 0,
    logoWidth: 10,
    frame: 'None',
    font: 'arial.ttf',
    widthMm: 58,
    heightMm: 40,
    paper:'thermal'
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [frameOptions, setFrameOptions] = useState([{ value: 'None', label: 'No Frame' }]);
  const [fontOptions, setFontOptions] = useState([{ value: "arial.ttf", label: "Arial" }]);
  const [logoPreview, setLogoPreview] = useState(null);
  const canvasRef = useRef(null);

  // Загрузка списка рамок
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await fetch(REACT_APP_SERVER_URL + '/frames');
        if (!res.ok) throw new Error('Failed to load frames');
        const frames = await res.json();
        setFrameOptions(frames);
      } catch (err) {
        setError(`Error loading frames: ${err.message}`);
      }
    };
    const fetchFonts = async () => {
      try {
        const res = await fetch(REACT_APP_SERVER_URL + '/fonts');
        if (!res.ok) throw new Error('Failed to load fonts');
        const fonts = await res.json();
        setFontOptions(fonts);
        for (const font of fonts) {
          try {
            // console.log("FONT:::",`url(${REACT_APP_SERVER_URL}/fonts/${font.value})`);

            const fontFace = new FontFace(font.label, `url(${REACT_APP_SERVER_URL}/fonts/${font.value})`);
            await fontFace.load();
            // console.log("FontFace", font);

            document.fonts.add(fontFace);
          } catch (fontErr) {
            console.error(`Failed to load font ${font.name}:`, fontErr);
          }
        }
      } catch (err) {
        setError(`Error loading fonts: ${err.message}`);
      }
    };
    fetchFrames();
    fetchFonts();
  }, []);


  // Live Preview рендеринг
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const mmToPt = mm => mm * 3.7795275591; // 72 DPI
    const scaleFactor = 3.7795275591; // Реальный размер PDF
    const widthPx = formData.widthMm * scaleFactor;
    const heightPx = formData.heightMm * scaleFactor;
    canvas.width = widthPx;
    canvas.height = heightPx;

    // Очистка canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, widthPx, heightPx);

    // Рендеринг рамки
    const renderFrame = () => new Promise(resolve => {
      if (formData.frame === 'None') return resolve();
      const frameImg = new Image();
      frameImg.src = `${REACT_APP_SERVER_URL}/frames/${formData.frame}`;
      frameImg.onload = () => {
        ctx.drawImage(frameImg, 0, 0, widthPx, heightPx);
        console.log('Frame rendered:', formData.frame);
        resolve();
      };
      frameImg.onerror = () => {
        console.error('Frame load error:', formData.frame);
        resolve();
      };
    });

    // Рендеринг штрихкода
    const renderBarcode = async () => {
      const barcodeScale = formData.heightMm < 30 ? 0.625 : 1; // Увеличено

      // console.log("MY SCALE", formData.heightMm);
      const lines = [];
      if (formData.showSeller === true && formData.seller) lines.push(formData.seller);
      if (formData.productName) lines.push(formData.productName);
      if (formData.showArticle === true && formData.article) lines.push(`Article: ${formData.article}`);
      if ((formData.showColor === true && formData.color) || (formData.showSize === true && formData.size)) {
        lines.push((formData.color && formData.size) ? `Color: ${formData.color} / Size: ${formData.size}` : (formData.color ? `Color: ${formData.color}` : `Size: ${formData.size}`));
      }
      // if (formData.showExpirationDate === true && formData.expirationDate) lines.push(`Expiration date: ${formData.expirationDate}`);
      if (formData.showCountry === true && formData.country) lines.push(`Country: ${formData.country}`);
      if (formData.showBrand === true && formData.brand) lines.push(`Brand: ${formData.brand}`);
      if (formData.showCustomText === true && formData.customText) lines.push(formData.customText);
      if (formData.showNoReturn === true) lines.push('Товар не подлежит обязательной сертификации');


      const lineCount = lines.length;
      const marginTop = Math.min(9, Math.max(2, formData.heightMm / (lineCount + 2)));
      // console.log("Margin top:::", marginTop);


      if (!formData.barcodeValue) {
        // console.log('No barcode value');
        return 2; // Отступ сверху 2 мм
      }
      const tempCanvas = document.createElement('canvas');
      try {
        await bwipjs.toCanvas(tempCanvas, {
          bcid: formData.barcodeType,
          text: formData.barcodeValue,
          scale: 1,
          height: 10,
          includetext: true,
          textxalign: 'center',
          textsize: 10,
        });
        const barcodeDims = { width: tempCanvas.width * barcodeScale, height: tempCanvas.height * barcodeScale };
        // console.log("MY BARCODE DIMS", barcodeDims);
        const barcodeY = formData.heightMm < 30 ? mmToPt(marginTop) : mmToPt(marginTop); // Увеличено
        // console.log("MY BARCODE Y", barcodeY);
        const barcodeYPx = 2 * scaleFactor; // Штрихкод сверху с отступом 2 мм
        // console.log('Barcode: dims=', barcodeDims, 'yPx=', barcodeYPx, 'canvasHeight=', heightPx);
        ctx.drawImage(tempCanvas, widthPx / 2 - barcodeDims.width / 2, barcodeY, barcodeDims.width, barcodeDims.height);
        return barcodeYPx + barcodeDims.height;
        // if (barcodeY >= 0 && barcodeY + barcodeDims.height <= barcodeY) {

        //   return (barcodeYPx + barcodeDims.height) ; // Нижняя граница штрихкода в мм
        // } else {
        //   console.error('Barcode out of bounds:', { yPx: barcodeYPx, height: barcodeDims.height });
        //   return 2;
        // }
      } catch (err) {
        console.error('Barcode render error:', err);
        return 2;
      }
    };

    // Рендеринг текста
    const renderText = (barcodeBottomY) => {
      const lines = [];
      if (formData.showSeller === true && formData.seller) lines.push(formData.seller);
      if (formData.productName) lines.push(formData.productName);
      if (formData.showArticle === true && formData.article) lines.push(`Article: ${formData.article}`);
      if ((formData.showColor === true && formData.color) || (formData.showSize === true && formData.size)) {
        lines.push((formData.color && formData.size) ? `Color: ${formData.color} / Size: ${formData.size}` : (formData.color ? `Color: ${formData.color}` : `Size: ${formData.size}`));
      }
      // if ( formData.expirationDate) lines.push(`Expiration date: ${formData.expirationDate}`);
      if (formData.showCountry === true && formData.country) lines.push(`Country: ${formData.country}`);
      if (formData.showBrand === true && formData.brand) lines.push(`Brand: ${formData.brand}`);
      if (formData.showCustomText === true && formData.customText) lines.push(formData.customText);
      // console.log("barcodeBottomY:::", barcodeBottomY);
      if (formData.showNoReturn === true) lines.push('Товар не подлежит обязательной сертификации');

      const lineCount = lines.length;
      // const marginTop = Math.min(2, Math.max(1, formData.heightMm / (lineCount + 2)));
      const marginTop = Math.min(7, Math.max(2, formData.heightMm / (lineCount)));
      // const marginBottom = formData.logo || formData.showEac ? 8 : 3;
      // const availableHeight = formData.heightMm - barcodeBottomY - marginTop ;
      const availableHeight = mmToPt(formData.heightMm) - barcodeBottomY;
      // const fontSize = Math.max(5, Math.min(8, availableHeight / (lineCount * 1)));
      const fontSize = formData.heightMm < 30 ? 6 : Math.max(5, Math.min(8, availableHeight / (lineCount) * 1.2));
      console.log("Font Size:",fontSize);

      ctx.font = `${fontSize}px Helvetica`;
      ctx.fillStyle = 'black';
      // let textY = barcodeBottomY * scaleFactor + marginTop * scaleFactor;
      let textY = barcodeBottomY + marginTop * scaleFactor + fontSize / scaleFactor;
      // console.log('Text: y=', textY, 'fontSize=', fontSize, 'lines=', lines, 'availableHeight=', availableHeight, 'marginTop=', marginTop, "x=", 5 * scaleFactor);
      lines.forEach(line => {
        ctx.fillText(line, widthPx / 9.8, textY);
        textY += formData.heightMm < 30 ? fontSize : fontSize * 1.2;;
      });
      //   if (availableHeight > 0 && textY + fontSize * scaleFactor * 1.2 * lineCount <= heightPx) {

      //   } else {
      //     console.error('Text out of bounds:', { textY, fontSize, lineCount, availableHeight });
      //   }
    };

    // Рендеринг EAC и логотипа
    const renderEacAndLogo = () => new Promise(resolve => {
      let loaded = 0;
      const checkDone = () => {
        if (++loaded === (formData.showEac && formData.logo ? 2 : formData.showEac || formData.logo ? 1 : 0)) resolve();
      };

      if (formData.showEac) {
        const eacImg = new Image();
        eacImg.src = './eac.svg';
        eacImg.onload = () => {
          const eacX = widthPx * 0.7;
          const eacY = (heightPx * 0.9) - (mmToPt(10) / 2);
          ctx.drawImage(eacImg, eacX, eacY, mmToPt(10) / 2, mmToPt(10) / 2);
          console.log('EAC rendered at:', { x: eacX, y: eacY });
          checkDone();
        };
        eacImg.onerror = () => {
          console.error('EAC load error');
          checkDone();
        };
      }



      if (!formData.showEac && !formData.logo) resolve();
    });

    // Последовательный рендеринг
    (async () => {
      await renderFrame();
      const barcodeBottomY = await renderBarcode();
      renderText(barcodeBottomY);
      await renderEacAndLogo();
    })();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      if (files[0] && files[0].type !== 'image/svg+xml') {
        setError('Please upload a valid SVG file');
        return;
      }
      setFormData({ ...formData, [name]: files[0], logoXPercent: 0, logoYPercent: 0 });
      setLogoPreview(files[0] ? URL.createObjectURL(files[0]) : null);
    } else if (name === 'pageSize') {
      const [widthMm, heightMm] = value.split('x')
      // .map(parseFloat);
      setFormData({ ...formData, widthMm, heightMm, logoXPercent: 0, logoYPercent: 0 });
    } else if (name === 'logoWidth') {
      const logoWidth = parseFloat(value) || 10;
      setFormData({ ...formData, logoWidth: Math.max(5, Math.min(logoWidth, formData.widthMm)) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const widthPx = formData.widthMm * 3.7795275591;
    const heightPx = formData.heightMm * 3.7795275591;
    const logoXPercent = (x / widthPx) * 100;
    const logoYPercent = ((heightPx - y) / heightPx) * 100;
    const logoWidthPx = formData.logoWidth * 3.7795275591;
    setFormData({
      ...formData,
      logoXPercent: Math.max(0, Math.min(logoXPercent, 100 - (logoWidthPx / widthPx) * 100)),
      logoYPercent: Math.max(0, Math.min(logoYPercent, 100 - (logoWidthPx / heightPx) * 100)),
    });
  };

  const handleSubmit = async (e, isPreview = false) => {
    e.preventDefault();
    // console.log(formData);

    setError(null);
    setIsLoading(true);
    if (isPreview) setPreviewUrl(null);

    if (!formData.barcodeValue) {
      setError('Barcode value is required');
      setIsLoading(false);
      return;
    }
    if (!formData.widthMm || formData.widthMm <= 0) {
      setError('Width must be a positive number');
      setIsLoading(false);
      return;
    }
    if (!formData.heightMm || formData.heightMm <= 0) {
      setError('Height must be a positive number');
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    for (let key in formData) {
      if (formData[key] instanceof File) {
        data.append(key, formData[key]);
      } else if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    }

    // for (let [key, value] of data.entries()) {
    //   console.log(`FormData: ${key} = ${value}`);
    // }

    try {
      const res = await fetch(REACT_APP_SERVER_URL + '/generate-pdf', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      const { url } = await res.json();
      if (isPreview) {
        setPreviewUrl(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', display: 'flex', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <h1>PDF Generator Old</h1>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Barcode Type: </label>
              <select name="barcodeType" value={formData.barcodeType} onChange={handleChange}>
                <option value="code128">Code128</option>
                <option value="ean13">EAN-13</option>
                <option value="ean8">EAN-8</option>
                <option value="upc">UPC</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Barcode Value*: <input name="barcodeValue" placeholder="Barcode value" value={formData.barcodeValue} onChange={handleChange} required /></label>
            </div>


            <div style={{ marginBottom: '1rem' }}>
              <label>Article: <input name="article" placeholder="Article" value={formData.article} onChange={handleChange} /></label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Color: <input name="color" placeholder="Color" value={formData.color} onChange={handleChange} /></label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Size: <input name="size" placeholder="Size" value={formData.size} onChange={handleChange} /></label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Product Name: <input name="productName" placeholder="Product name" value={formData.productName} onChange={handleChange} /></label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Seller: <input name="seller" placeholder="Seller" value={formData.seller} onChange={handleChange} /></label>
            </div>

            <div style={{ marginBottom: '1rem', display: `${formData.showCountry === true ? 'block' : 'none'}` }}  >
              <label>Country: <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} /></label>
            </div>
            <div style={{ marginBottom: '1rem', display: `${formData.showBrand === true ? 'block' : 'none'}` }}>
              <label>Brand: <input name="brand" placeholder="Brand" value={formData.brand} onChange={handleChange} /></label>
            </div>
            <div style={{ marginBottom: '1rem', display: `${formData.showCustomText === true ? 'block' : 'none'}` }}>
              <label>Custom Text: <input name="customText" placeholder="Custom text" value={formData.customText} onChange={handleChange} /></label>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Amount*: <input name="amount" required={true} placeholder="Amount" type='number' value={formData.amount} onChange={handleChange} /></label>
          </div>
          <div style={{ display: 'flex', gap: '1em' }}>
            {/* <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showSeller" checked={formData.showSeller} onChange={handleChange} /> Include Seller
              </label>
            </div> */}
            {/* <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showArticle" checked={formData.showArticle} onChange={handleChange} /> Include Article
              </label>
            </div> */}
            {/* <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showColor" checked={formData.showColor} onChange={handleChange} /> Include Color
              </label>
            </div> */}
            {/* <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showSize" checked={formData.showSize} onChange={handleChange} /> Include Size
              </label>
            </div> */}
            {/* <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showExpirationDate" checked={formData.showExpirationDate} onChange={handleChange} /> Include Expiration Date
              </label>
            </div> */}
            <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showCountry" checked={formData.showCountry} onChange={handleChange} /> Include Country
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showBrand" checked={formData.showBrand} onChange={handleChange} /> Include Brand
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showCustomText" checked={formData.showCustomText} onChange={handleChange} /> Include Custom Text
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showEac" checked={formData.showEac} onChange={handleChange} /> Include EAC Mark
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                <input type="checkbox" name="showNoReturn" checked={formData.showNoReturn} onChange={handleChange} /> Include "The product is not subject to mandatory certification" Text
              </label>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>SVG Logo: <input type="file" name="logo" accept="image/svg+xmimage/svg+xml" onChange={handleChange} /></label>
          </div>
          {formData.logo && (
            <div style={{ marginBottom: '1rem' }}>
              <label>Logo Width (mm): <input type="range" name="logoWidth" value={formData.logoWidth} onChange={handleChange} min="5" max={formData.widthMm} step="0.1" /></label>
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label>Frame: </label>
            <select name="frame" value={formData.frame} onChange={handleChange}>
              {frameOptions.map((option, index) => (
                <option key={index} value={option.value}
                // style={{fontFamily:`./fonts/${option.value}.ttf`}}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Font: </label>
            <select name="font" value={formData.font} style={{ fontFamily: formData.font.replace('.ttf', '').replace(/\b\w/g, c => c.toUpperCase()) }} onChange={handleChange}>
              {fontOptions.map((option, index) => (
                <option key={index} value={option.value} style={{ fontFamily: option.label }}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Page Size (mm): </label>
            <select
              name="pageSize"
              value={`${formData.widthMm}x${formData.heightMm}`}
              onChange={handleChange}
              required
            >
              {pageSizes.map((size, index) => (
                <option key={index} value={`${size.widthMm}x${size.heightMm}`}>
                  {size.widthMm} × {size.heightMm}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Type of paper:</label>
            <div>
              <input type="radio" name="paper" value="thermal" checked={formData.paper==='thermal'} onChange={handleChange} />
              <label for="paper">Thermal</label>
            </div>

            <div>
              <input type="radio"  name="paper" value="a4" checked={formData.paper==='a4'}  onChange={handleChange}/>
              <label for="paper">A4</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate PDF'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isLoading}
              style={{ backgroundColor: '#4CAF50', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}
            >
              {isLoading ? 'Generating...' : 'Preview PDF'}
            </button>
          </div>
        </form>
      </div>
      <div style={{ flex: 1 }}>
        <h2>Live Preview</h2>
        <div
          style={{
            width: `${formData.widthMm * 3.7795275591}px`,
            height: `${formData.heightMm * 3.7795275591}px`,
            border: '1px solid #ccc',
            position: 'relative',
            backgroundColor: '#f9f9f9',
            overflow: 'hidden'
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo"
              
              style={{
                width: `${formData.logoWidth * 3.7795275591}px`,

                position: 'absolute',
                left: `${(formData.logoXPercent * formData.widthMm * 3.7795275591) / 100}px`,
                bottom: `${(formData.logoYPercent * formData.heightMm * 3.7795275591) / 100}px`,
                cursor: 'move',
                filter: 'grayscale(100%)'
              }}
              draggable
            />
          )}
        </div>
        {formData.logo && (
          <p>Logo Position: X={formData.logoXPercent.toFixed(2)}%, Y={formData.logoYPercent.toFixed(2)}%, Width={formData.logoWidth.toFixed(2)}mm</p>
        )}
        {previewUrl && (
          <div style={{ marginTop: '2rem' }}>
            <h2>PDF Preview</h2>
            <iframe
              src={previewUrl}
              style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}
              title="PDF Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;