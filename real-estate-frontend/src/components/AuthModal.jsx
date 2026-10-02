import React, { useState } from "react";
import SignupForm from "./SignupForm";

export default function AuthModal({ isOpen, onClose }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5002/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();

      if (response.ok) {
        // 🛠️ Fix: Token နှင့်အတူ User အချက်အလက်ကိုပါ LocalStorage သို့ သိမ်းဆည်းခြင်း
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        window.location.reload();
      } else {
        setError(
          data.error || data.message || "အကောင့်ဝင်ရောက်ခြင်း မအောင်မြင်ပါ။",
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("ဆာဗာသို့ ချိတ်ဆက်၍ မရပါ။");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 text-xl font-bold bg-slate-800/50 w-8 h-8 rounded-full flex items-center justify-center transition"
        >
          ✕
        </button>

        {isLoginView ? (
          <div className="bg-slate-900 text-slate-100 p-8 rounded-2xl shadow-xl border border-slate-800">
            <h2 className="text-2xl font-bold mb-2 text-center text-white">
              အကောင့်ဝင်ရန် (Login)
            </h2>
            <p className="text-sm text-slate-400 text-center mb-6">
              အိမ်ခြံမြေများကို ကြည့်ရှုရန်နှင့် တင်ရန် အကောင့်ဝင်ပါ။
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  အီးမေးလ် (Email)
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="example@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  စကားဝှက် (Password)
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-lg mt-2"
              >
                {loading ? "စစ်ဆေးနေသည်..." : "အကောင့်ဝင်မည်"}
              </button>
            </form>

            <div className="text-center mt-4 text-sm text-slate-400">
              အကောင့်မရှိသေးဘူးလား?{" "}
              <button
                onClick={() => setIsLoginView(false)}
                className="text-emerald-400 hover:underline font-medium"
              >
                အကောင့်အသစ်ဖွင့်ရန် (Signup)
              </button>
            </div>
          </div>
        ) : (
          <SignupForm
            onSignupSuccess={(data) => {
              alert(
                "အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ ကျေးဇူးပြု၍ Login ဝင်ပါ။",
              );
              setIsLoginView(true);
            }}
            switchToLogin={() => setIsLoginView(true)}
          />
        )}
      </div>
    </div>
  );
}
