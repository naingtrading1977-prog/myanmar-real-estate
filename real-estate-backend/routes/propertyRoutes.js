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
  unlockPropertyContact,
  incrementPropertyView, // 👁️ View တိုးပေးမည့် Controller (နာမည်တူပါက သုံးပါ)
} = require("../controllers/propertyController");

// 👇 အထူး Routes များကို ဒိုင်နမစ် `/:id` ရဲ့ အပေါ်ဆုံးတွင် ထားရှိခြင်း
router.get("/", getProperties);
router.get("/nearby", getNearbyProperties);

// 👁️ ဝင်ရောက်ကြည့်ရှုသူ (Views) တိုးပေးမည့် Route (Login မလိုဘဲ ဝင်ကြည့်တိုင်း တိုးရန် protect ဖြုတ်ထားသည်)
router.put("/:id/view", incrementPropertyView);

// Rating ပေးသည့် Route (Login ဝင်ထားရန် protect ထည့်ပေးခြင်း)
// 🏠 Property အသစ်တင်သည့် Route တွင် Role နှင့် Approval စစ်ဆေးခြင်း
router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user.id; // Token မှ ရလာသော user id

    // User ၏ Role နှင့် is_approved ကို Database မှ စစ်ဆေးမည်
    const userResult = await pool.query(
      "SELECT role, is_approved FROM users WHERE id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const { role, is_approved } = userResult.rows[0];

    // အကယ်၍ Admin မဟုတ်ဘဲ, (Client ဖြစ်နေလျှင် သို့မဟုတ် Agent ဖြစ်သော်လည်း is_approved က false ဖြစ်နေလျှင်)
    if (role !== "admin" && (role !== "agent" || !is_approved)) {
      return res.status(403).json({
        success: false,
        error:
          "ခွင့်ပြုချက် မရှိပါ။ Agent အကောင့်ဖြင့် Admin ၏ အတည်ပြုချက် (Approval) ရရှိထားမှသာ ပို့စ်တင်နိုင်ပါသည်။",
      });
    }

    // --- ကျန်ရှိနေသော Property Create ပြုလုပ်သည့် Logic များ ဆက်သွားမည် ---
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// 👇 ဒိုင်နမစ် Route `:id`
router.get("/:id", getPropertyById);

// 🔑 Post အသစ်တင်ရန် (protect ထည့်ထားသဖြင့် owner_id အလိုအလျောက် ဝင်ပါမည်)
router.post("/", protect, upload.array("images"), createProperty);

// 🔑 Edit နှင့် Delete လုပ်ရန်လည်း protect ထည့်ထားခြင်း
router.put("/:id", protect, upload.array("images"), updateProperty);
router.delete("/:id", protect, deleteProperty);
router.post("/:id/unlock", protect, unlockPropertyContact);

module.exports = router;
