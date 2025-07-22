const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const pdfBuilder = require('../services/pdfBuilder');
const dotenv = require('dotenv')

dotenv.config()
const baseURL= process.env.BASE_URL||"http://localhost:3001"
console.log("Base url",baseURL);

router.post('/', async (req, res) => {
    try {
        await pdfBuilder(req);
        res.json({ url: `${baseURL}/product.pdf` });

    } catch (err) {
        console.error('PDF generation error:', err.message, err.stack);
        res.status(500).send(`PDF generation failed: ${err.message}`);
    }
}
)


module.exports = router;