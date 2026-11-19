const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
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
  unlockPropertyContact,
  incrementPropertyView, // 👁️ View တိုးပေးမည့် Controller
} = require("../controllers/propertyController");

// 👇 အထူး Routes များကို ဒိုင်နမစ် `/:id` ရဲ့ အပေါ်ဆုံးတွင် ထားရှိခြင်း
router.get("/", getProperties);
router.get("/nearby", getNearbyProperties);

// 👁️ ဝင်ရောက်ကြည့်ရှုသူ (Views) တိုးပေးမည့် Route
router.put("/:id/view", incrementPropertyView);

// 🔑 Post အသစ်တင်ရန် (Admin သို့မဟုတ် Approved Agent သာ ခွင့်ပြုမည်)
router.post(
  "/",
  protect,
  upload.array("images"),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userResult = await pool.query(
        "SELECT role, is_approved FROM users WHERE id = $1",
        [userId],
      );

      if (userResult.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const { role, is_approved } = userResult.rows[0];

      if (role !== "admin" && (role !== "agent" || !is_approved)) {
        return res.status(403).json({
          success: false,
          error:
            "ခွင့်ပြုချက် မရှိပါ။ Agent အကောင့်ဖြင့် Admin ၏ အတည်ပြုချက် (Approval) ရရှိထားမှသာ ပို့စ်တင်နိုင်ပါသည်။",
        });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Server Error" });
    }
  },
  createProperty,
);

// 👇 ဒိုင်နမစ် Route `:id`
router.get("/:id", getPropertyById);

// 🔑 Edit, Delete, Unlock & Rating Routes
router.put("/:id", protect, upload.array("images"), updateProperty);
router.delete("/:id", protect, deleteProperty);
router.post("/:id/unlock", protect, unlockPropertyContact);
if (typeof rateProperty === "function") {
  router.post("/:id/rating", protect, rateProperty);
}
if (typeof uploadPropertyFiles === "function") {
  router.post(
    "/:id/files",
    protect,
    upload.array("files"),
    uploadPropertyFiles,
  );
}

module.exports = router;
