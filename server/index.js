const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.SERVER_PORT || 3001;
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
// });
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "logo" && file.mimetype !== "image/svg+xml") {
      return cb(new Error("Only SVG files are allowed for logo"));
    }
    cb(null, true);
  },
});


// app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Эндпоинт для получения списка рамок
const framesRoute = require("./routes/frames");
app.use("/frames", framesRoute);

//Fonts
const fonts = require("./routes/fonts");
app.use("/fonts", fonts);

//PDF denetarion
const generatePDF = require("./routes/generate-pdf");
app.use("/generate-pdf", upload.single("logo"), generatePDF);

const clientBuildPath = path.join(__dirname, "../client/build");
app.use(express.static(clientBuildPath));
// app.use(express.static(path.join(__dirname, 'public')));
// app.get("/*", (req, res) => {
//   res.sendFile(path.join(clientBuildPath, "/index.html"));
// });
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
