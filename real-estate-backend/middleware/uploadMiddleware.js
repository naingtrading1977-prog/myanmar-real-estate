const multer = require("multer");
const path = require("path");

// Disk Storage ကို အသုံးပြု၍ uploads/ folder ထဲသို့ တိုက်ရိုက်သိမ်းဆည်းခြင်း
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // uploads folder ထဲသို့ သိမ်းမည်
  },
  filename: function (req, file, cb) {
    // နာမည်တူ ထပ်မသွားစေရန် ရှေ့က လက်ရှိအချိန် (Timestamp) ကို ခံမည်
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File Type Filter (Images & PDFs သာ လက်ခံရန်)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Images and PDF documents are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maximum File Size: 10MB
});

module.exports = upload;
