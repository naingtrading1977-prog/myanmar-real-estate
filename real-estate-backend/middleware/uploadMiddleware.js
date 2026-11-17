const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom Cloudinary Storage for v2
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "myanmar_real_estate",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf"],
    resource_type: "auto",
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
});

module.exports = upload;
