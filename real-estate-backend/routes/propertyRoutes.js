const express = require("express");
const router = express.Router();

// 👈 Upload (Multer) middleware ကို import လုပ်ပါ (အကို့ project ထဲက upload config ရှိရာ လမ်းကြောင်းအတိုင်း ချိန်ရန်)
const upload = require("../middleware/uploadMiddleware"); // ဥပမာ - middleware ဖိုင်ထဲတွင် ရှိလျှင်

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

// Routes များ
router.get("/", getProperties);
router.post("/", upload.array("images"), createProperty); // ဖန်တီးသည့်အခါလည်း ပုံပါထည့်နိုင်ရန်
router.get("/nearby", getNearbyProperties);

// Rating ပေးသည့် Route
router.post("/:id/rating", rateProperty);

router.get("/:id", getPropertyById);

// 👇 updateProperty ကို propertyController.updateProperty အစား updateProperty လို့ပဲ တိုက်ရိုက်သုံးပါ
router.put("/:id", upload.array("images"), updateProperty);

router.delete("/:id", deleteProperty);

module.exports = router;
