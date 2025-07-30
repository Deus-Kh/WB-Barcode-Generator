export const pageSizes = [
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

export const handleChange = (e, formData, setFormData, setError, setLogoPreview) => {
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
    console.log("pageSize",);
    
    const [widthMm, heightMm] = value.split('x');
    setFormData({ ...formData, widthMm: parseFloat(widthMm), heightMm: parseFloat(heightMm), logoXPercent: 0, logoYPercent: 0 });
  } else if (name === 'logoWidth') {
    const logoWidth = parseFloat(value) || 10;
    setFormData({ ...formData, logoWidth: Math.max(5, Math.min(logoWidth, formData.widthMm)) });
  } 
  // else if (type === 'number') {
    
  //   setFormData({ ...formData, [name]: value<1?1:Math.floor(value) });
  // }
  else {
    setFormData({ ...formData, [name]: value });
  }
  
};

export const handleDragOver = (e) => {
  e.preventDefault();
};

export const handleDrop = (e, formData, setFormData) => {
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

export const handleSubmit = async (e, isPreview, formData, setError, setIsLoading, setPreviewUrl) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);
  if (isPreview) setPreviewUrl(null);

  if (!formData.barcodeValue) {
    setError('Barcode value is required');
    setIsLoading(false);
    return;
  }
  if (!formData.article) {
    setError('Article value is required');
    setIsLoading(false);
    return;
  }
  if (!formData.productName) {
    setError('Product name value is required');
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
  if (!formData.amount || formData.amount <= 0||!Number.isInteger(formData.amount)) {
    setError('Amount must be a positive integer number');
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

  try {
    const res = await fetch(`/generate-pdf`, {
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


