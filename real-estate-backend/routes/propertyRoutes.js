const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware"); // 🔑 Auth Middleware ကို ခေါ်ယူခြင်း

const {
  createProperty,
  getProperties,
  getNearbyProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  uploadPropertyFiles,
  rateProperty,
} = require("../controllers/propertyController");

// 👇 အထူး Routes များကို ဒိုင်နမစ် `/:id` ရဲ့ အပေါ်ဆုံးတွင် ထားရှိခြင်း
router.get("/", getProperties);
router.get("/nearby", getNearbyProperties);

// Rating ပေးသည့် Route (Login ဝင်ထားရန် protect ထည့်ပေးခြင်း)
router.post("/:id/rating", protect, rateProperty);

// 👇 ဒိုင်နမစ် Route `:id`
router.get("/:id", getPropertyById);

// 🔑 Post အသစ်တင်ရန် (protect ထည့်ထားသဖြင့် owner_id အလိုအလျောက် ဝင်ပါမည်)
router.post("/", protect, upload.array("images"), createProperty);

// 🔑 Edit နှင့် Delete လုပ်ရန်လည်း protect ထည့်ထားခြင်း
router.put("/:id", protect, upload.array("images"), updateProperty);
router.delete("/:id", protect, deleteProperty);

module.exports = router;
