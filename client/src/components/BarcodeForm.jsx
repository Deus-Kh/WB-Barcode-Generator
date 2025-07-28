import React, { useEffect } from 'react';
import { handleChange, handleSubmit } from '../utils';

const REACT_APP_SERVER_URL = process.env.REACT_APP_SERVER_URL;

const BarcodeForm = ({
  formData,
  setFormData,
  error,
  setError,
  isLoading,
  setIsLoading,
  previewUrl,
  setPreviewUrl,
  frameOptions,
  setFrameOptions,
  fontOptions,
  setFontOptions,
  logoPreview,
  setLogoPreview,
  pageSizes
}) => {
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await fetch(`${REACT_APP_SERVER_URL}/frames`);
        if (!res.ok) throw new Error('Failed to load frames');
        const frames = await res.json();
        setFrameOptions(frames);
      } catch (err) {
        setError(`Error loading frames: ${err.message}`);
      }
    };
    const fetchFonts = async () => {
      try {
        const res = await fetch(`${REACT_APP_SERVER_URL}/fonts`);
        if (!res.ok) throw new Error('Failed to load fonts');
        const fonts = await res.json();
        setFontOptions(fonts);
        for (const font of fonts) {
          try {
            const fontFace = new FontFace(font.label, `url(${REACT_APP_SERVER_URL}/fonts/${font.value})`);
            await fontFace.load();
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
  }, [setError, setFrameOptions, setFontOptions]);

  return (
    <form onSubmit={(e) => handleSubmit(e, false, formData, setError, setIsLoading, setPreviewUrl)}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Barcode Type: </label>
          <select name="barcodeType" value={formData.barcodeType} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)}>
            <option value="code128">Code128</option>
            <option value="ean13">EAN-13</option>
            <option value="ean8">EAN-8</option>
            <option value="upc">UPC</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Barcode Value*: <input name="barcodeValue" placeholder="Barcode value" value={formData.barcodeValue} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} required /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Article: <input name="article" placeholder="Article" value={formData.article} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Color: <input name="color" placeholder="Color" value={formData.color} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Size: <input name="size" placeholder="Size" value={formData.size} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Product Name: <input name="productName" placeholder="Product name" value={formData.productName} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Seller: <input name="seller" placeholder="Seller" value={formData.seller} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ marginBottom: '1rem', display: formData.showCountry ? 'block' : 'none' }}>
          <label>Country: <input name="country" placeholder="Country" value={formData.country} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ marginBottom: '1rem', display: formData.showBrand ? 'block' : 'none' }}>
          <label>Brand: <input name="brand" placeholder="Brand" value={formData.brand} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ marginBottom: '1rem', display: formData.showCustomText ? 'block' : 'none' }}>
          <label>Custom Text: <input name="customText" placeholder="Custom text" value={formData.customText} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Amount*: <input name="amount" required placeholder="Amount" type="number" value={formData.amount} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div style={{ display: 'flex', gap: '1em' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              <input type="checkbox" name="showCountry" checked={formData.showCountry} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include Country
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              <input type="checkbox" name="showBrand" checked={formData.showBrand} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include Brand
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              <input type="checkbox" name="showCustomText" checked={formData.showCustomText} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include Custom Text
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              <input type="checkbox" name="showEac" checked={formData.showEac} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include EAC Mark
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              <input type="checkbox" name="showNoReturn" checked={formData.showNoReturn} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include "No Certification" Text
            </label>
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>SVG Logo: <input type="file" name="logo" accept="image/svg+xml" onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        {formData.logo && (
          <div style={{ marginBottom: '1rem' }}>
            <label>Logo Width (mm): <input type="range" name="logoWidth" value={formData.logoWidth} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} min="5" max={formData.widthMm} step="0.1" /></label>
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label>Frame: </label>
          <select name="frame" value={formData.frame} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)}>
            {frameOptions.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Font: </label>
          <select name="font" value={formData.font} style={{ fontFamily: formData.font.replace('.ttf', '').replace(/\b\w/g, c => c.toUpperCase()) }} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)}>
            {fontOptions.map((option, index) => (
              <option key={index} value={option.value} style={{ fontFamily: option.label }}>{option.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Page Size (mm): </label>
          <select name="pageSize" value={`${formData.widthMm}x${formData.heightMm}`} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} required>
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
            <input type="radio" name="paper" value="thermal" checked={formData.paper === 'thermal'} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} />
            <label htmlFor="paper">Thermal</label>
          </div>
          <div>
            <input type="radio" name="paper" value="a4" checked={formData.paper === 'a4'} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} />
            <label htmlFor="paper">A4</label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate PDF'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true, formData, setError, setIsLoading, setPreviewUrl)}
            disabled={isLoading}
            style={{ backgroundColor: '#4CAF50', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}
          >
            {isLoading ? 'Generating...' : 'Preview PDF'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BarcodeForm;