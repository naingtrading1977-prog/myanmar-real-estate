import React, { useState, useEffect } from "react";

const PropertyDetailModal = ({
  isOpen,
  onClose,
  property,
  onPropertyUpdated,
}) => {
  const [rating, setRating] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 🔍 ပုံသီးသန့် ကြီးကြည့် (Lightbox) ပြရန်အတွက် State များ
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  // Modal ဖွင့်လိုက်တိုင်း ပုံ index ကို 0 သို့ ပြန်စရန်
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [property]);

  // ⏱️ Modal ပေါ်ရှိ Main Slider အတွက် Auto Slide Effect (၃ စက္ကန့်တစ်ကြိမ်)
  useEffect(() => {
    if (
      !isOpen ||
      !property ||
      !property.images ||
      property.images.length <= 1 ||
      isFullscreenOpen
    ) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, property, isFullscreenOpen]);

  if (!isOpen || !property) return null;

  // 🏷️ အရောင်း / အငှား ခွဲခြားသတ်မှတ်ခြင်း
  const isRent =
    property.listing_type === "Rent" || property.status === "For Rent";

  // Modal ပေါ်ရှိ ပုံပြောင်းရန် Manual Function များ
  const nextImage = (e) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1,
      );
    }
  };

  // 🔍 ပုံကို နှိပ်လိုက်၍ သီးသန့် ကြီးကြည့်မည့် Modal ဖွင့်ရန်
  const handleOpenFullscreen = (index) => {
    setFullscreenIndex(index);
    setIsFullscreenOpen(true);
  };

  // သီးသန့်ကြည့်သည့် Modal ထဲတွင် ဘယ်/ညာ ပြောင်းရန်
  const nextFullscreenImage = (e) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setFullscreenIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevFullscreenImage = (e) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setFullscreenIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1,
      );
    }
  };

  // 🌟 Rating ပေးသည့်အခါ API သို့ ပို့ဆောင်ရန်
  const handleRatingSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0 || rating === "0") {
      alert("ကျေးဇူးပြု၍ ကြယ်ပွင့် (Rating) ရွေးချယ်ပါ။");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5002/api/properties/${property.id}/rating`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: parseFloat(rating) }),
        },
      );

      const data = await response.json();
      if (response.ok) {
        alert("Rating ပေးခြင်း အောင်မြင်ပါသည်။");

        if (typeof onPropertyUpdated === "function") {
          onPropertyUpdated();
        }

        onClose();
      } else {
        alert(data.error || "Rating ပေး၍ မရပါ။");
      }
    } catch (err) {
      console.error("Failed to submit rating", err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* ပုံနှင့် Slider / ပိတ်ရန်ခလုတ် */}
          <div className="relative h-64 bg-slate-900 group cursor-pointer">
            {property.images && property.images.length > 0 ? (
              <>
                <img
                  src={`http://localhost:5002${property.images[currentImageIndex]?.url || property.images[currentImageIndex]}`}
                  alt={property.title}
                  onClick={() => handleOpenFullscreen(currentImageIndex)}
                  className="w-full h-full object-cover hover:opacity-95 transition"
                  title="ပုံကို နှိပ်၍ အကြီးကြည့်ရန်"
                />

                {/* ပုံ ၁ ပုံထက်ပိုပါက Next / Prev ခလုတ်များပြရန် */}
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 w-9 h-9 rounded-full flex items-center justify-center font-bold transition shadow-md"
                    >
                      ❮
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 w-9 h-9 rounded-full flex items-center justify-center font-bold transition shadow-md"
                    >
                      ❯
                    </button>

                    {/* ပုံအရေအတွက်ပြ Badge (ဥပမာ - 1 / 3) */}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium pointer-events-none">
                      {currentImageIndex + 1} / {property.images.length} (နှိပ်၍
                      အကြီးကြည့်ရန်)
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium bg-slate-200">
                🏠 No Image Available
              </div>
            )}

            {/* ပုံပေါ်ရှိ Top Left Badge (အရောင်း သို့မဟုတ် အငှား) */}
            <div className="absolute top-4 left-4">
              <span
                className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-md ${
                  isRent
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {isRent ? "🏠 အငှား (For Rent)" : "🏷️ အရောင်း (For Sale)"}
              </span>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-slate-900/70 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-slate-900 transition shadow-md z-10"
            >
              ✕
            </button>
          </div>

          {/* အချက်အလက်များ */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-slate-800">
                {property.title}
              </h2>
              {/* 🏷️ ဈေးနှုန်းဘေးတွင် အရောင်း/အငှား ပုံစံပြသခြင်း */}
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  isRent
                    ? "bg-blue-100 text-blue-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isRent ? "အငှား" : "အရောင်း"}
              </span>
            </div>

            <p className="text-emerald-600 font-extrabold text-xl">
              {property.price}{" "}
              <span className="text-sm font-normal text-slate-600">
                {isRent ? "သိန်း / လ" : "သိန်း"}
              </span>
            </p>

            <p className="text-slate-600 text-sm leading-relaxed">
              {property.description}
            </p>

            <div className="border-t border-slate-200 pt-4 space-y-2">
              <h3 className="font-bold text-slate-800">
                🏢 အိမ်ခြံမြေ အချက်အလက်များ
              </h3>

              {/* 🏷️ Listing Type အချက်အလက်အသစ် ထည့်သွင်းပြသခြင်း */}
              <p className="text-sm text-slate-600">
                ကြော်ငြာအမျိုးအစား:{" "}
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-xs ${
                    isRent
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isRent ? "🏠 အငှား (Rent)" : "🏷️ အရောင်း (Sale)"}
                </span>
              </p>

              <p className="text-sm text-slate-600">
                အမျိုးအစား:{" "}
                <span className="font-semibold text-slate-800">
                  {property.property_type || property.type}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                တည်နေရာ:{" "}
                <span className="font-semibold text-slate-800">
                  {property.address || property.township || "ရန်ကုန်မြို့"}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                👀 ကြည့်ရှုသူ အရေအတွက်:{" "}
                <span className="font-semibold text-emerald-600">
                  {property.views || 0} ဦး
                </span>
              </p>
            </div>

            {/* 📞 Admin သို့ တိုက်ရိုက်ဆက်သွယ်ရန် */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
              <h3 className="font-bold text-emerald-900 text-sm">
                📞 ဝယ်ယူရန်/ငှားရမ်းလိုပါက Admin သို့ ဆက်သွယ်ရန်
              </h3>
              <p className="text-xs text-emerald-700">
                အဓိက တာဝန်ခံ Admin ( Hotline: 09-784970257 | 09-773442756 /
                Viber: 09-784970257 )
              </p>
              <a
                href="tel:09784970257"
                className="inline-block bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
              >
                📞 ဖုန်းခေါ်ဆိုရန် ဆက်သွယ်ရန်
              </a>
            </div>

            {/* ⭐ Rating ပေးရန် Section */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">
                ⭐ ဤပို့စ်နှင့် ပတ်သက်၍ သုံးသပ်ချက် (Rating) ပေးရန်
              </h3>
              <form
                onSubmit={handleRatingSubmit}
                className="flex items-center gap-3"
              >
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="0">ကြယ်ပွင့် ရွေးချယ်ပါ</option>
                  <option value="5">⭐⭐⭐⭐⭐ (အကောင်းဆုံး)</option>
                  <option value="4">⭐⭐⭐⭐ (ကောင်း)</option>
                  <option value="3">⭐⭐⭐ (သင့်တော်)</option>
                  <option value="2">⭐⭐ (အားနည်း)</option>
                  <option value="1">⭐ (မကောင်းပါ)</option>
                </select>
                <button
                  type="submit"
                  className="bg-slate-800 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-900 transition"
                >
                  Rating ပေးမည်
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 ပုံသီးသန့် ကြီးကြည့်ရန် Lightbox Modal */}
      {isFullscreenOpen && property.images && property.images.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsFullscreenOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`http://localhost:5002${property.images[fullscreenIndex]?.url || property.images[fullscreenIndex]}`}
              alt={property.title}
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            {/* ပိတ်ရန် ခလုတ် */}
            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition"
            >
              ✕
            </button>

            {/* ပုံ ၁ ပုံထက်ပိုပါက ဘယ်/ညာ ခလုတ်များ */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevFullscreenImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition shadow-lg"
                >
                  ❮
                </button>
                <button
                  onClick={nextFullscreenImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition shadow-lg"
                >
                  ❯
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-1.5 rounded-full font-medium">
                  {fullscreenIndex + 1} / {property.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyDetailModal;
