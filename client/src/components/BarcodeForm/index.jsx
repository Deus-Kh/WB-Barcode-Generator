import React, { useEffect } from 'react';
import { handleChange, handleSubmit } from '../../utils';
import styles from './index.module.css';


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
        const res = await fetch(`/frames`);
        if (!res.ok) throw new Error('Failed to load frames');
        const frames = await res.json();
        setFrameOptions(frames);
      } catch (err) {
        setError(`Error loading frames: ${err.message}`);
      }
    };
    const fetchFonts = async () => {
      try {
        const res = await fetch(`/fonts`);
        if (!res.ok) throw new Error('Failed to load fonts');
        const fonts = await res.json();
        setFontOptions(fonts);
        for (const font of fonts) {
          try {
            const fontFace = new FontFace(font.label, `url(/fonts/${font.value})`);
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
    <>

    <form onSubmit={(e) => handleSubmit(e, false, formData, setError, setIsLoading, setPreviewUrl)}>
      <div className={styles.main}>
        <div  className={styles.formItem}>
          <label>Barcode Type: 
            <select name="barcodeType" value={formData.barcodeType} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)}>
            <option value="code128">Code128</option>
            <option value="ean13" disabled>EAN-13</option>
            <option value="ean8" disabled>EAN-8</option>
            <option value="upc" disabled>UPC</option>
          </select>
          </label>
          
        </div>
        <div  className={styles.formItem}>
          <label>Barcode Value: <input name="barcodeValue" pattern="[ -~]{1,48}" maxlength="48" type='text'  value={formData.barcodeValue} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} required /></label>
        </div>
        <div  className={styles.formItem}>
          <label>Article: <input name="article" type='text' maxLength={14} value={formData.article} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} required /></label>
        </div>
        <div  className={styles.formItem}>
          <label>Product Name: <input name="productName" maxLength={24} type='text'  value={formData.productName} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} required /></label>
        </div>
        <div  className={styles.formItem}>
          <label>Color: <input name="color" type='text' maxLength={10} value={formData.color} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div  className={styles.formItem}>
          <label>Size: <input name="size" type='text' maxLength={10}  value={formData.size} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        
        <div  className={styles.formItem}>
          <label>Seller: <input name="seller" type='text' maxLength={25} value={formData.seller} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div className={styles.formItem} style={{  display: formData.showCountry ? 'block' : 'none' }}>
          <label>Country: <input name="country" maxLength={13} type='text'  value={formData.country} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div className={styles.formItem} style={{  display: formData.showBrand ? 'block' : 'none' }}>
          <label>Brand: <input name="brand" maxLength={15} type='text'  value={formData.brand} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div className={styles.formItem} style={{  display: formData.showCustomText ? 'block' : 'none' }}>
          <label>Custom Text: <input name="customText"  maxLength={25} type='text'  value={formData.customText} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div className={styles.formItem} >
          <label>Amount: <input name="amount"  required  type="number" min={1} step={1} value={formData.amount} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /></label>
        </div>
        <div className={styles.checkBoxGroup} >
          <div >
            <label>
              <input type="checkbox" name="showCountry" checked={formData.showCountry} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include Country
            </label>
          </div>
          <div >
            <label>
              <input type="checkbox" name="showBrand" checked={formData.showBrand} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include Brand
            </label>
          </div>
          <div >
            <label>
              <input type="checkbox" name="showCustomText" checked={formData.showCustomText} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include Custom Text
            </label>
          </div>
          <div >
            <label>
              <input type="checkbox" name="showEac" checked={formData.showEac} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include EAC Mark
            </label>
          </div>
          <div >
            <label>
              <input type="checkbox" name="showNoReturn" checked={formData.showNoReturn} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /> Include "No Certification" Text
            </label>
          </div>
        </div>
        <div className={styles.group}>
          <div className={styles.formItem}>
          <label>Logo: <input style={{display:'none'}} type="file" id='logo' multiple={false} name="logo" accept="image/svg+xml" onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} /><button onClick={e=>{e.preventDefault();document.getElementById('logo').click()}}>Upload SVG</button></label>
        </div>
        {formData.logo && (
          <div className={styles.formItem}>
            <label>Logo Width (mm): <input  type="range" name="logoWidth" value={formData.logoWidth} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} min="5" max={formData.widthMm} step="0.1" /> </label>
          </div>
        )}
        </div>
        <div className={styles.group}>
          <div className={styles.formItem}>
          <label>Frame: </label>
          <select name="frame" value={formData.frame} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)}>
            {frameOptions.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.formItem}>
          <label>Font: </label>
          <select name="font" value={formData.font} style={{ fontFamily: formData.font.replace('.ttf', '').replace(/\b\w/g, c => c.toUpperCase()) }} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)}>
            {fontOptions.map((option, index) => (
              <option key={index} value={option.value} style={{ fontFamily: option.label }}>{option.label}</option>
            ))}
          </select>
        </div>
        </div>
        <div className={styles.group}>
          <div className={styles.formItem}>
          <label>Page Size (mm): </label>
          <select name="pageSize" value={`${formData.widthMm}x${formData.heightMm}`} onChange={(e) => handleChange(e, formData, setFormData, setError, setLogoPreview)} required>
            {pageSizes.map((size, index) => (
              <option key={index} value={`${size.widthMm}x${size.heightMm}`}>
                {size.widthMm} × {size.heightMm}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formItem}>
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
        </div>
        
      </div>
      <div 
      // style={{ display: 'flex', gap: '1rem' }}
      >
          <div className={styles.group}>
            <div className={styles.formItem}></div>
            <div className={styles.formItem}   style={{justifyContent:'space-evenly', flexDirection:'row'}}>
            <button type="submit" disabled={isLoading} className={styles.filledButton}>
            {isLoading ? 'Generating...' : 'Generate PDF'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true, formData, setError, setIsLoading, setPreviewUrl)}
            disabled={isLoading}
            // style={{ backgroundColor: '#4CAF50', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}
          >
            {isLoading ? 'Generating...' : 'Preview PDF'}
          </button>
          </div>
          </div>
        </div>
    </form>
    </>
    
  );
};

export default BarcodeForm;