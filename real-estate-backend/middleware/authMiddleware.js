const jwt = require("jsonwebtoken");

// Token စစ်ဆေးပေးသည့် Middleware
exports.protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ error: "Not authorized to access this route" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token is invalid or expired" });
  }
};

// Role-based Access Control Middleware (Admin/Agent ထိန်းချုပ်ရန်)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// 👑 Admin သို့မဟုတ် Subscription ရှိမရှိ စစ်ဆေးပေးသည့် Middleware
exports.checkSubscription = (req, res, next) => {
  // အကယ်၍ Login ဝင်ထားသူသည် Admin ဖြစ်ပါက သက်တမ်းစစ်ဆေးခြင်းကို ကျော်မည် (Bypass)
  if (req.user && req.user.role === "admin") {
    return next();
  }

  // တခြား User တွေအတွက် Subscription သက်တမ်း စစ်ဆေးသည့် Logic (ဥပမာ - Database မှ စစ်ဆေးခြင်း)
  // ဥပမာ: if (req.user.subscription_status !== 'active') { return res.status(403).json({ error: "Subscription expired" }); }

  next();
};
