import { useState } from "react";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export default function SignupForm({ onSignupSuccess, switchToLogin }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "client",
  });
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        },
      );
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;

      let rawPhone = formData.phone.trim();
      if (rawPhone.startsWith("0")) {
        rawPhone = rawPhone.substring(1);
      }
      const formattedPhoneNumber = rawPhone.startsWith("+")
        ? rawPhone
        : `+95${rawPhone}`;

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        appVerifier,
      );
      setConfirmationResult(confirmation);
      setStep(2);
    } catch (err) {
      console.error("OTP send error:", err);
      setError(
        "OTP ပို့၍မရပါ။ ဖုန်းနံပါတ်ကို ပြန်စစ်ပါ။ သို့မဟုတ် Page ကို Refresh လုပ်ပါ။",
      );

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseUser = result.user;

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
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
      console.error("Verification error:", err);
      setError(
        "ထည့်သွင်းလိုက်သော OTP ကုဒ် မမှန်ကန်ပါ သို့မဟုတ် ဆာဗာချိတ်ဆက်၍ မရပါ။",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-xl max-w-xl w-full mx-auto border border-slate-800 max-h-[85vh] overflow-y-auto custom-scrollbar relative">
      <h2 className="text-2xl font-bold mb-1 text-center text-white">
        အကောင့်အသစ်ဖွင့်ရန်
      </h2>
      <p className="text-xs md:text-sm text-slate-400 text-center mb-6">
        ဖုန်းနံပါတ်ဖြင့် အလွယ်တကူ အကောင့်ဖွင့်ပြီး{" "}
        <span className="text-emerald-400 font-bold">Free 100 Coins</span>{" "}
        ရယူလိုက်ပါ။
      </p>

      {successMessage && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center text-sm font-medium animate-pulse">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div id="recaptcha-container"></div>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">နာမည်</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="သင့်နာမည်ထည့်ပါ"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                ဖုန်းနံပါတ်
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="09XXXXXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">
              အီးမေးလ် (Email)
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">
              စကားဝှက် (Password)
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow-lg mt-2 text-sm"
          >
            {loading ? "OTP ပို့နေသည်..." : "OTP ကုဒ်ရယူရန် (Send OTP)"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndRegister} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              SMS ဖြင့် ရောက်လာသော OTP ကုဒ် (၆ လုံး)
            </label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tracking-widest text-center text-lg font-bold"
              placeholder="123456"
            />
            <p className="text-xs text-slate-400 mt-2 text-center">
              (Test နံပါတ်သုံးထားလျှင်{" "}
              <span className="text-emerald-400 font-bold">123456</span> ကို
              ထည့်ပါ)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow-lg mt-2 text-sm"
          >
            {loading ? "အတည်ပြုနေသည်..." : "အတည်ပြုပြီး အကောင့်ဖွင့်မည်"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
              }
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl transition text-xs"
          >
            ← ဖုန်းနံပါတ် ပြန်ပြင်ရန်
          </button>
        </form>
      )}

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
