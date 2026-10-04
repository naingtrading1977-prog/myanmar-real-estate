const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

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

// 👇 အထူး Routes များကို ဒိုင်နမစ် `/:id` ရဲ့ အပေါ်ဆုံးမှာ အမြဲထားရပါမည်
router.get("/", getProperties);
router.get("/nearby", getNearbyProperties); 

// Rating ပေးသည့် Route
router.post("/:id/rating", rateProperty);

// 👇 ဒိုင်နမစ် Route `:id` ကို အောက်နားသို့ ရွှေ့ပါ
router.get("/:id", getPropertyById);

router.post("/", upload.array("images"), createProperty);
router.put("/:id", upload.array("images"), updateProperty);
router.delete("/:id", deleteProperty);

module.exports = router;
