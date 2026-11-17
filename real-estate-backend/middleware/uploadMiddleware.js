const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "myanmar-real-estate",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf"],
  },
});

const upload = multer({ storage: storage });

// 🔑 အရေးကြီးသည်: upload ကို export လုပ်ပေးရန် မမေ့ပါနှင့်
module.exports = upload;
