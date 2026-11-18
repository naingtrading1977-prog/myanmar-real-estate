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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple rapid clicks
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
      setError(err.message || "အကောင့်ဖွင့်ရာတွင် အမှားအယွင်း ရှိပါသည်။");
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
