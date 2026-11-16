const AboutUsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100">
        {/* Header Hero Section - Padding ကို ပိုမိုလွတ်လပ်စွာ ချိန်ညှိထားပါသည် */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden border-b border-slate-800 flex-shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                About Our Platform
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                🏠 Win Win Aung{" "}
                <span className="text-emerald-400">Real Estate</span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
                ရန်ကုန်မြို့နှင့် မြန်မာနိုင်ငံတစ်ဝှမ်းရှိ အိမ်ခြံမြေ ဝယ်ယူသူ၊
                ရောင်းချသူနှင့် အကျိုးဆောင်များအကြား ခေတ်မီနည်းပညာဖြင့်
                ယုံကြည်စိတ်ချစွာ တိုက်ရိုက်ချိတ်ဆက်ပေးနေသော ဒစ်ဂျစ်တယ်
                ပလက်ဖောင်း။
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white w-9 h-9 rounded-full flex items-center justify-center font-bold transition shadow-md flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-700 bg-slate-50/50">
          {/* 3 Core Values / Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-xl font-bold">
                📍
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                တိကျသော မြေပုံစနစ်
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                အိမ်ခြံမြေ တည်နေရာများကို မြေပုံ (Interactive Map) ပေါ်တွင်
                အတိအကျ ကြည့်ရှုစစ်ဆေးနိုင်ခြင်း။
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-xl font-bold">
                🤝
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                တိုက်ရိုက် ချိတ်ဆက်မှု
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                ပိုင်ရှင်နှင့် အကျိုးဆောင်များ၏ ဖုန်းနံပါတ်နှင့်
                လိပ်စာအပြည့်အစုံကို လွယ်ကူလျင်မြန်စွာ ရယူဆက်သွယ်နိုင်ခြင်း။
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xl font-bold">
                🛡️
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                စိတ်ချယုံကြည်ရမှု
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                စာရင်းသွင်းထားသော အချက်အလက်များ မှန်ကန်စေရန် စိစစ်ပေးခြင်းနှင့်
                အသုံးပြုသူများ၏ သုံးသပ်ချက် (Rating) စနစ် ပါဝင်ခြင်း။
              </p>
            </div>
          </div>

          {/* Our Services */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="font-extrabold text-emerald-950 text-base flex items-center gap-2">
              <span>✨</span> ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုများ
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-800 font-semibold">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✔</span>{" "}
                တိုက်ခန်းနှင့် ကွန်ဒို အရောင်း/အငှား ဝန်ဆောင်မှု
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✔</span>{" "}
                လုံးချင်းအိမ်နှင့် မြေကွက် အရောင်း/အငှား ဝန်ဆောင်မှု
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✔</span> အိမ်ခြံမြေ
                ကြော်ငြာများ ကိုယ်တိုင် တင်သွင်းနိုင်မှု
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✔</span>{" "}
                မြို့နယ်နှင့် ဈေးနှုန်းအလိုက် အလွယ်တကူ ရှာဖွေနိုင်မှု
              </li>
            </ul>
          </div>

          {/* Office Contact Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 bg-white p-4 rounded-2xl shadow-sm">
            <div className="text-xs text-slate-600 space-y-1 text-center sm:text-left font-medium">
              <p className="font-bold text-slate-900 text-sm">
                ရုံးခန်းလိပ်စာနှင့် ဆက်သွယ်ရန်
              </p>
              <p>
                📍 ရန်ကုန်မြို့၊ မြန်မာနိုင်ငံ။ | ⏰ နံနက် ၉:၀၀ မှ ညနေ ၅:၀၀ ထိ
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="tel:09784970257"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                📞 ဖုန်းခေါ်ရန်
              </a>
              <a
                href="viber://chat?number=%2B959784970257"
                className="px-4 py-2.5 bg-[#7360f2] hover:bg-[#5e4ad6] text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                💬 Viber ဖြင့်မေးရန်
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsModal;
