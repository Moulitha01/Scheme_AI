import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import fs from "fs";

const router = express.Router();

// storage config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// POST route
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    const result = await Tesseract.recognize(
      imagePath,
      "eng",
      {
        logger: m => console.log(m),
      }
    );

    // delete file after processing
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      text: result.data.text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "OCR failed",
    });
  }
});

export default router;