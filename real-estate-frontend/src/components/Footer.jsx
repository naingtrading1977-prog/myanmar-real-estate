import React from "react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* 1. Company Info */}
        <div className="space-y-4">
          <h3 className="text-white text-xl font-bold flex items-center gap-2">
            🏠 <span className="text-emerald-500">Win Win Aung</span>
          </h3>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            ( အိမ်ခြံမြေ အကျိုးဆောင် )
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            ရန်ကုန်မြို့နှင့် အခြားမြို့နယ်များရှိ အကောင်းဆုံး အိမ်ခြံမြေ၊
            တိုက်ခန်း၊ ကွန်ဒိုနှင့် မြေကွက်များကို ယုံကြည်စိတ်ချစွာ ဝယ်ယူ၊
            ငှားရမ်းနိုင်ပါသည်။
          </p>

          {/* Social Media & Viber Icons */}
          <div className="flex space-x-3 pt-2">
            {/* Website */}
            <a
              href="#"
              className="w-9 h-9 bg-slate-800 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition shadow-md"
              title="Website"
            >
              🌐
            </a>
            {/* Facebook */}
            <a
              href="#"
              className="w-9 h-9 bg-slate-800 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition shadow-md"
              title="Facebook"
            >
              📘
            </a>
            {/* Viber (Pro Purple Style with SVG) */}
            <a
              href="viber://chat?number=%2B959784970257"
              className="w-9 h-9 bg-slate-800 hover:bg-[#7360f2] text-white rounded-full flex items-center justify-center transition shadow-md"
              title="Viber: 09-784970257"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M21.56 7.16c-.35-1.52-1.76-2.66-3.37-2.66h-12.38c-1.61 0-3.02 1.14-3.37 2.66-.41 1.76-.41 3.58 0 5.34.35 1.52 1.76 2.66 3.37 2.66h1.25v2.75c0 .32.38.5.63.28l3.12-2.75h7.38c1.61 0 3.02-1.14 3.37-2.66.41-1.76.41-3.58 0-5.34zm-4.56 4.34c-.21.19-.51.24-.77.13-.26-.11-1.42-.64-1.64-.73-.22-.09-.38-.13-.54.11-.16.24-.62.77-.76.93-.14.16-.28.18-.54.05-.26-.13-1.1-.41-2.1-1.3-1-.89-1.67-1.99-1.87-2.33-.2-.34-.02-.52.11-.69.12-.15.26-.38.39-.57.13-.19.17-.32.26-.54.09-.22.04-.41-.02-.57-.06-.16-.54-1.31-.74-1.79-.2-.48-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62 2.41 1.04 2.41.69 2.85.65.44-.04 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.43-.26z" />
              </svg>
            </a>
          </div>
        </div>

        {/* 2. Quick Links */}
        <div>
          <h4 className="text-white font-semibold text-base mb-4 border-l-4 border-emerald-500 pl-3">
            အမြန်လင့်ခ်များ
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="#" className="hover:text-emerald-400 transition">
                ပင်မစာမျက်နှာ (Home)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-emerald-400 transition">
                ရရှိနိုင်သော စာရင်းများ (Listings)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-emerald-400 transition">
                တည်နေရာ မြေပုံ (Map View)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-emerald-400 transition">
                ကျွန်ုပ်တို့အကြောင်း (About Us)
              </a>
            </li>
          </ul>
        </div>

        {/* 3. Property Types */}
        <div>
          <h4 className="text-white font-semibold text-base mb-4 border-l-4 border-emerald-500 pl-3">
            အိမ်ခြံမြေ အမျိုးအစားများ
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="#" className="hover:text-emerald-400 transition">
                တိုက်ခန်းများနှင့် ကွန်ဒိုများ (Apartments)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-emerald-400 transition">
                မြေကွက်များ (Land Plots)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-emerald-400 transition">
                လုံးချင်းအိမ်များ (Villas / Houses)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-emerald-400 transition">
                အငှားများ (Rentals)
              </a>
            </li>
          </ul>
        </div>

        {/* 4. Contact Info */}
        <div>
          <h4 className="text-white font-semibold text-base mb-4 border-l-4 border-emerald-500 pl-3">
            ဆက်သွယ်ရန်
          </h4>
          <div className="space-y-3 text-sm text-slate-400">
            <p className="flex items-start gap-2">
              <span>📍</span> <span>ရန်ကုန်မြို့၊ မြန်မာနိုင်ငံ။</span>
            </p>
            <p className="flex items-start gap-2">
              <span>📞</span> <span>09-784970257 / 09-773442756</span>
            </p>
            <p className="flex items-center gap-2 text-purple-400 font-medium">
              <span>🟣</span> <span>Viber: 09-784970257</span>
            </p>
            <p className="flex items-start gap-2">
              <span>📧</span> <span>ttnaing001@gmail.com</span>
            </p>
            <p className="flex items-start gap-2">
              <span>⏰</span> <span>နံနက် ၉:၀၀ မှ ညနေ ၅:၀၀ ထိ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Copyright Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Win Win Aung Real Estate. All rights reserved.</p>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-slate-400 transition">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-slate-400 transition">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
