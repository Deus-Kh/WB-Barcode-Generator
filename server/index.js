const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
// const dotenv = require('dotenv');
// dotenv.config();

const app = express();
const PORT = 3001;


// Проверка и создание папки uploads
const uploadDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}




const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'logo' && file.mimetype !== 'image/svg+xml') {
      return cb(new Error('Only SVG files are allowed for logo'));
    }
    cb(null, true);
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Эндпоинт для получения списка рамок
const framesRoute = require('./routes/frames')
app.use('/frames', framesRoute);

//PDF denetarion
const generatePDF = require('./routes/generate-pdf')
app.use('/generate-pdf', upload.single('logo'), generatePDF)


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));