const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const pdfBuilder = require('../services/pdfBuilder');



router.post('/', async (req, res) => {
    try {
        await pdfBuilder(req);
        res.json({ url: `${req.protocol}://${req.get('host')}/product.pdf` });

    } catch (err) {
        console.error('PDF generation error:', err.message, err.stack);
        res.status(500).send(`PDF generation failed: ${err.message}`);
    }
}
)
module.exports = router;