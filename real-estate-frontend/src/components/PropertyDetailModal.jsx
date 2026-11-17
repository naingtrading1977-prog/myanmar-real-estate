import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import CustomModal from "./CustomModal";

const PropertyDetailModal = ({
  isOpen,
  onClose,
  property,
  onPropertyUpdated,
}) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 🌟 Pro Modern Custom Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // 📞 Unlocked Contact & Address States
  const [unlockedPhone, setUnlockedPhone] = useState(null);
  const [unlockedAddress, setUnlockedAddress] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  // 🔍 Lightbox Modal States
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  // 👁️ Modal ပွင့်လာသည်နှင့် View Count ကို 1 တိုးပေးမည့် function
  useEffect(() => {
    if (isOpen && property && property.id) {
      const incrementView = async () => {
        try {
          await API.put(`/properties/${property.id}/view`);
          if (typeof onPropertyUpdated === "function") {
            onPropertyUpdated();
          }
        } catch (err) {
          console.error("Failed to increment view count:", err);
        }
      };

      incrementView();
    }
  }, [isOpen, property?.id]);

  // ⏱️ Auto Slide Effect
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

  const isRent =
    property.listing_type === "Rent" || property.status === "For Rent";

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

  const handleOpenFullscreen = (index) => {
    setFullscreenIndex(index);
    setIsFullscreenOpen(true);
  };

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

  // 🪙 Click လိုက်တာနဲ့ Token ရှိမရှိစစ်မည်၊ မရှိလျှင် Custom Modal ဖြင့် သတိပေးပြီး Login သို့ ပို့မည်
  const handleUnlockContact = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setModalConfig({
        isOpen: true,
        title: "အကောင့်ဝင်ရန် လိုအပ်ပါသည်",
        message:
          "ကျေးဇူးပြု၍ ဖုန်းနံပါတ်နှင့် လိပ်စာ ကြည့်ရှုရန် အကောင့်ဝင်ပါ (သို့မဟုတ်) အကောင့်အသစ်ဖွင့်ပါ။",
        type: "info",
      });
      return;
    }

    try {
      setUnlocking(true);
      const response = await API.post(`/properties/${property.id}/unlock`);
      if (response.data.success) {
        setUnlockedPhone(response.data.contact_phone || property.contact_phone);
        setUnlockedAddress(
          response.data.address || property.address || property.township,
        );
        if (typeof onPropertyUpdated === "function") {
          onPropertyUpdated();
        }
      }
    } catch (err) {
      console.error("Unlock error:", err);
      setModalConfig({
        isOpen: true,
        title: "လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
        message:
          err.response?.data?.error ||
          "Coins မလုံလောက်ပါ သို့မဟုတ် အမှားအယွင်းရှိနေပါသည်။",
        type: "error",
      });
    } finally {
      setUnlocking(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || rating === "0") {
      setModalConfig({
        isOpen: true,
        title: "အချက်အလက် လိုအပ်နေပါသည်",
        message: "ကျေးဇူးပြု၍ ကြယ်ပွင့် (Rating) ရွေးချယ်ပါ။",
        type: "warning",
      });
      return;
    }

    try {
      await API.post(`/properties/${property.id}/rating`, {
        rating: parseFloat(rating),
      });
      setModalConfig({
        isOpen: true,
        title: "အောင်မြင်ပါသည်။",
        message: "Rating ပေးခြင်း အောင်မြင်ပါသည်။",
        type: "success",
      });
      if (typeof onPropertyUpdated === "function") {
        onPropertyUpdated();
      }
      onClose();
    } catch (err) {
      console.error("Failed to submit rating", err);
      setModalConfig({
        isOpen: true,
        title: "အမှားအယွင်း ရှိနေပါသည်",
        message: err.response?.data?.error || "Rating ပေး၍ မရပါ။",
        type: "error",
      });
    }
  };

  const getImageUrl = (imgObj) => {
    const imgPath = imgObj?.url || imgObj;
    if (!imgPath) return "";
    if (imgPath.startsWith("http")) return imgPath;
    const backendUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "http://localhost:5002";
    return `${backendUrl}${imgPath}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-slate-100">
          {/* Slider Header */}
          <div className="relative h-72 bg-slate-900 group cursor-pointer overflow-hidden">
            {property.images && property.images.length > 0 ? (
              <>
                <img
                  src={getImageUrl(property.images[currentImageIndex])}
                  alt={property.title}
                  onClick={() => handleOpenFullscreen(currentImageIndex)}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  title="ပုံကို နှိပ်၍ အကြီးကြည့်ရန်"
                />

                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 w-10 h-10 rounded-full flex items-center justify-center font-bold transition shadow-lg backdrop-blur-sm"
                    >
                      ❮
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 w-10 h-10 rounded-full flex items-center justify-center font-bold transition shadow-lg backdrop-blur-sm"
                    >
                      ❯
                    </button>

                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium pointer-events-none">
                      📸 {currentImageIndex + 1} / {property.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium bg-slate-100">
                🏠 No Image Available
              </div>
            )}

            <div className="absolute top-4 left-4">
              <span
                className={`text-xs px-3.5 py-1.5 rounded-full font-bold shadow-lg tracking-wider ${
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
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold transition shadow-lg backdrop-blur-sm z-10"
            >
              ✕
            </button>
          </div>

          {/* Property Details Content */}
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {property.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  📍 မြို့နယ်:{" "}
                  <span className="font-bold text-slate-700">
                    {property.township || "ရန်ကုန်"}
                  </span>{" "}
                  | ပို့စ်အမှတ်: #{property.id}
                </p>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  isRent
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {isRent ? "Rent" : "Sale"}
              </span>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">
                  သတ်မှတ်ဈေးနှုန်း
                </p>
                <h3 className="text-emerald-600 font-extrabold text-2xl mt-0.5">
                  {property.price}{" "}
                  <span className="text-sm font-normal text-slate-600">
                    {isRent ? "သိန်း / လ" : "သိန်း"}
                  </span>
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium uppercase">
                  ကြည့်ရှုသူ
                </p>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                  👀 {property.views || 0} ဦး
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {property.description || "အသေးစိတ် ဖော်ပြချက် မရှိပါ။"}
            </p>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block">
                  အမျိုးအစား (Type)
                </span>
                <span className="font-bold text-slate-800">
                  {property.property_type || property.type || "Apartment"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block">
                  ပိုင်ဆိုင်မှု စာရွက်စာတမ်း
                </span>
                <span className="font-bold text-slate-800">
                  {property.ownership_document || "ဂရန်"}
                </span>
              </div>
            </div>

            {/* 📞 Contact & Address Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                  <span>📞</span> အကြိုးဆောင် / ပိုင်ရှင် ဆက်သွယ်ရန်
                  ဖုန်းနံပါတ်နှင့် လိပ်စာ
                </h3>
              </div>

              {unlockedPhone ? (
                <div className="bg-white p-4 rounded-xl border border-emerald-300 space-y-2 shadow-sm animate-fadeIn">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      ဆက်သွယ်ရန် ဖုန်းနံပါတ်
                    </p>
                    <a
                      href={`tel:${unlockedPhone}`}
                      className="text-lg font-mono font-extrabold text-emerald-700 hover:underline"
                    >
                      📞 {unlockedPhone}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      တိကျသည့် လိပ်စာ အပြည့်အစုံ
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      📍{" "}
                      {unlockedAddress ||
                        property.address ||
                        property.township ||
                        "ရန်ကုန်မြို့"}
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={`tel:${unlockedPhone}`}
                      className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md"
                    >
                      ဖုန်းခေါ်ဆိုရန်
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-slate-500">
                    အကြိုးဆောင်၏ ဆက်သွယ်ရန် ဖုန်းနံပါတ်နှင့် တိကျသည့် လိပ်စာကို
                    ကြည့်ရှုရန် အောက်ပါခလုတ်ကို နှိပ်ပါ။
                  </p>
                  <button
                    onClick={handleUnlockContact}
                    disabled={unlocking}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <span>🔑</span>{" "}
                    {unlocking
                      ? "ဖွင့်လှစ်နေပါသည်..."
                      : "ဖုန်းနံပါတ်နှင့် လိပ်စာ အပြည့်အစုံ ကြည့်မည်"}
                  </button>
                </div>
              )}
            </div>

            {/* Rating Section */}
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
                  className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-md"
                >
                  Rating ပေးမည်
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isFullscreenOpen && property.images && property.images.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={() => setIsFullscreenOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(property.images[fullscreenIndex])}
              alt={property.title}
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/30 text-white w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg transition backdrop-blur-sm"
            >
              ✕
            </button>

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

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full font-medium">
                  {fullscreenIndex + 1} / {property.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🌟 Pro Modern Custom Modal Component */}

      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          setModalConfig({ ...modalConfig, isOpen: false });
          // အကယ်၍ အကောင့်ဝင်ရန် လိုအပ်၍ ပိတ်လိုက်ပါက Login စာမျက်နှာသို့ ပို့ပေးမည်
          if (modalConfig.title === "အကောင့်ဝင်ရန် လိုအပ်ပါသည်") {
            onClose();
            navigate("/login");
          }
        }}
      />
    </>
  );
};

export default PropertyDetailModal; // (သို့မဟုတ် export default PropertyDetailModal;)
