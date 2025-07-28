import React, { useState } from 'react';
import {BarcodeForm,Preview} from './components';
import { pageSizes } from './utils';

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
    country: '',
    brand: '',
    customText: '',
    showArticle: true,
    showSeller: true,
    showColor: true,
    showSize: true,
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
    paper: 'thermal'
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [frameOptions, setFrameOptions] = useState([{ value: 'None', label: 'No Frame' }]);
  const [fontOptions, setFontOptions] = useState([{ value: "arial.ttf", label: "Arial" }]);
  const [logoPreview, setLogoPreview] = useState(null);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', display: 'flex', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <h1>PDF Generator</h1>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <BarcodeForm
          formData={formData}
          setFormData={setFormData}
          error={error}
          setError={setError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
          frameOptions={frameOptions}
          setFrameOptions={setFrameOptions}
          fontOptions={fontOptions}
          setFontOptions={setFontOptions}
          logoPreview={logoPreview}
          setLogoPreview={setLogoPreview}
          pageSizes={pageSizes}
        />
      </div>
      <Preview
        formData={formData}
        logoPreview={logoPreview}
        previewUrl={previewUrl}
        setFormData={setFormData}
      />
    </div>
  );
}

export default App;