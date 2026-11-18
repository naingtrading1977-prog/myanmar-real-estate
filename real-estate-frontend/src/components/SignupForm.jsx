import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export default function SignupForm({ onSignupSuccess, switchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "client",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatPhoneNumber = (inputPhone) => {
    let cleaned = inputPhone.trim().replace(/[^0-9+]/g, "");

    if (cleaned.startsWith("+95")) {
      return cleaned;
    }
    if (cleaned.startsWith("09")) {
      return "+95" + cleaned.substring(1);
    }
    if (cleaned.startsWith("9")) {
      return "+95" + cleaned;
    }
    return "+95" + cleaned;
  };

  const handleAutoGenerate = () => {
    if (!formData.name || !formData.phone) {
      setError(
        "ကျေးဇူးပြု၍ ပထမဦးစွာ 'နာမည်' နှင့် 'ဖုန်းနံပါတ်' ကို ထည့်သွင်းပါ။",
      );
      return;
    }
    setError("");

    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    const last4Digits = cleanPhone.slice(-4) || "1234";

    let formattedName = formData.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (!formattedName || formattedName.length < 2) {
      formattedName = "broker";
    }

    const autoEmail = `${formattedName}_${last4Digits}@gmail.com`;
    const autoPassword = `${formattedName}@${last4Digits}`;

    setFormData({
      ...formData,
      email: autoEmail,
      password: autoPassword,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const formattedPhone = formatPhoneNumber(formData.phone);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const firebaseUser = userCredential.user;

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formattedPhone,
          role: formData.role,
          firebaseUid: firebaseUser.uid,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          "အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ ကျေးဇူးပြု၍ Login ဝင်ပါ။",
        );
        setTimeout(() => {
          if (onSignupSuccess) onSignupSuccess(data);
          else if (switchToLogin) switchToLogin();
        }, 1500);
      } else {
        setError(
          data.message || data.error || "အကောင့်ဖွင့်ခြင်း မအောင်မြင်ပါ။",
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError(
          "ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပြီးသား ဖြစ်နေပါသည်။ Auto-generate ကို ထပ်နှိပ်ပါ သို့မဟုတ် ကိုယ်ပိုင် Email ပြောင်းသုံးပါ။",
        );
      } else {
        setError(err.message || "အကောင့်ဖွင့်ရာတွင် အမှားအယွင်း ရှိပါသည်။");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-xl max-w-xl w-full mx-auto border border-slate-800">
      <h2 className="text-2xl font-bold mb-1 text-center text-white">
        အကောင့်အသစ်ဖွင့်ရန်
      </h2>
      <p className="text-xs md:text-sm text-slate-400 text-center mb-6">
        အချက်အလက်များဖြည့်၍ အလွယ်တကူ အကောင့်ဖွင့်လိုက်ပါ။
      </p>

      {successMessage && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center text-sm font-medium">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">နာမည်</label>
            <input
              type="text"
              name="name"
              required
              maxLength={50}
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="သင့်နာမည်ထည့်ပါ"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              ဖုန်းနံပါတ် (ဥပမာ - 09XXXXXXXXX)
            </label>
            <input
              type="text"
              name="phone"
              required
              maxLength={15}
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="09784970257"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs text-slate-300">
              အီးမေးလ် (Email)
            </label>
            <button
              type="button"
              onClick={handleAutoGenerate}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 transition"
              title="နာမည်နှင့် ဖုန်းနံပါတ်မှ အီးမေးလ်နှင့် စကားဝှက် အလိုအလျောက် ဖန်တီးရန်"
            >
              ⚡ Auto Generate
            </button>
          </div>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            placeholder="example@gmail.com (သို့) Auto Generate နှိပ်ပါ"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-300 mb-1">
            စကားဝှက် (Password)
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 pr-11 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
            {/* 👁️ အလယ်တည့်တည့်သို့ အზუსဆုံး ချိန်ညှိပေးထားသော မျက်လုံး Icon ခလုတ် */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white flex items-center justify-center focus:outline-none transition"
              title={showPassword ? "စကားဝှက် ဝှက်ရန်" : "စကားဝှက် ပြရန်"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-300 mb-1">
            အကောင့်အမျိုးအစား (Role)
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="client">
              🏠 အိမ်ရှာသူ (Client - ပို့စ်ကြည့်ရန်နှင့် ဆက်သွယ်ရန်)
            </option>
            <option value="agent">
              🤝 အိမ်ခြံမြေ အကျိုးဆောင် (Agent - ပို့စ်တင်ရန်)
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow-lg mt-2 text-sm disabled:opacity-50"
        >
          {loading ? "အကောင့်ဖွင့်နေသည်..." : "အကောင့်ဖွင့်မည် (Register)"}
        </button>
      </form>

      <div className="text-center mt-5 pt-3 border-t border-slate-800 text-sm text-slate-400">
        အကောင့်ရှိပြီးသားလား?{" "}
        <button
          onClick={switchToLogin}
          className="text-emerald-400 hover:underline font-semibold ml-1"
        >
          အကောင့်ဝင်ရန် (Login)
        </button>
      </div>
    </div>
  );
}
