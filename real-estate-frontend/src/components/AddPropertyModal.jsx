import { useState, useEffect } from "react";
import API from "../api/axios";
import { useSelector } from "react-redux"; // 👈 Redux မှ user အချက်အလက်ယူရန်
import { createProperty } from "../api/propertyApi";

const AddPropertyModal = ({ isOpen, onClose, onPropertyAdded }) => {
  const { user } = useSelector((state) => state.auth); // 👈 Login ဝင်ထားသော user ကို ခေါ်ယူခြင်း

  // 🛠️ LocalStorage ထဲမှ Coins အသစ်ကို ပါ တစ်ခါတည်း ချိန်ကိုက်ဖတ်ရှုရန်
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const fetchLatestUserData = async () => {
        try {
          const response = await API.get("/auth/me"); // 👈 Backend တွင် အသစ်ရေးခဲ့သော /me endpoint
          if (response.data.success && response.data.user) {
            setUserCoins(response.data.user.coins ?? 0);

            // LocalStorage ထဲက user အချက်အလက်ကိုပါ ချိန်ကိုက် update လုပ်လိုပါက
            const localUser = JSON.parse(localStorage.getItem("user") || "{}");
            localUser.coins = response.data.user.coins;
            localStorage.setItem("user", JSON.stringify(localUser));
          }
        } catch (err) {
          console.error("Failed to fetch latest user coins:", err);
          // အကယ်၍ API မရပါက Redux / LocalStorage ထဲကဟာကို ယာယီသုံးရန်
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          setUserCoins(
            storedUser.coins !== undefined
              ? storedUser.coins
              : (user?.coins ?? 0),
          );
        }
      };

      fetchLatestUserData();
    }
  }, [isOpen, user]);

  const requiredCoins = 30; // ပို့စ်တင်ရန် ကျသင့်မည့် Coins
  const hasEnoughCoins = userCoins >= requiredCoins;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    type: "Apartment",
    listing_type: "Sale", // 🏷️ အရောင်း (Sale) သို့မဟုတ် အငှား (Rent)
    township: "", // 📍 တည်နေရာ (Township) အတွက် State အသစ်ထည့်သွင်းခြင်း
    lat: "",
    lng: "",
    contact_phone: "",
    ownership_document: "ဂရန် (Grant)", // 📄 Default ပိုင်ဆိုင်မှု စာရွက်စာတမ်း အမျိုးအစား
    building_status: "BCC ကျပြီး / လူနေထိုင်ခွင့် ကျပြီး",
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🪙 Coins မလုံလောက်ပါက တားဆီးရန်
    if (!hasEnoughCoins) {
      setError(
        "သင့်တွင် ကြော်ငြာတင်ရန် Coins မလုံလောက်ပါ။ (အနည်းဆုံး 30 Coins လိုအပ်ပါသည်။)",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("description", formData.description);
      uploadData.append("price", formData.price);

      // 🛠️ Backend Database Schema နှင့် ချိန်ကိုက်ခြင်း
      uploadData.append("property_type", formData.type);
      uploadData.append("listing_type", formData.listing_type); // 🏷️ အရောင်း/အငှား ပို့ပေးခြင်း
      uploadData.append(
        "status",
        formData.listing_type === "Rent" ? "For Rent" : "For Sale",
      );

      // 📍 Township ထည့်သွင်းခြင်း
      uploadData.append("township", formData.township || "Bahan");
      uploadData.append("city", "Yangon");
      uploadData.append("latitude", formData.lat);
      uploadData.append("longitude", formData.lng);
      uploadData.append("contact_phone", formData.contact_phone);
      uploadData.append("ownership_document", formData.ownership_document);
      uploadData.append("building_status", formData.building_status);
      uploadData.append("owner_id", user?.id || user?._id || 1); // 👈 User ID အမှန်ကို ပို့ပေးခြင်း

      // ပုံများ/Document ဖိုင်များ တင်ခြင်း
      for (let i = 0; i < files.length; i++) {
        uploadData.append("images", files[i]);
      }

      await createProperty(uploadData);
      setLoading(false);
      onPropertyAdded(); // Property စာရင်း ပြန် refresh ရန်
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || "Failed to post property");
    }
  };

  const activeUserId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "{}")?.id ||
    "2";

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-2 text-slate-800">
          Post New Property
        </h2>

        {/* 🪙 Coins Balance & Cost Info Box */}
        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl mb-4 flex items-center justify-between text-xs shadow-inner border border-slate-800">
          <div>
            <span className="text-slate-400">သင့်လက်ကျန် Coins: </span>
            <span className="text-emerald-400 font-bold text-sm">
              {userCoins} Coins
            </span>
          </div>
          <div>
            <span className="text-slate-400">ကျသင့်ငွေ: </span>
            <span className="text-amber-400 font-bold">
              -{requiredCoins} Coins / Post
            </span>
          </div>
        </div>

        {/* Coins မလုံလောက်ပါက Warning နှင့် Top-up ညွှန်ကြားချက်ပြရန် */}
        {!hasEnoughCoins && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs mb-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between font-semibold text-amber-900">
              <span>⚠️ သင့်တွင် Coins မလုံလောက်ပါ။ (လိုအပ်သည်: 30 Coins)</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1.5">
              <p className="font-bold text-slate-800 flex items-center gap-1">
                🪙 Coins အလိုအလျောက် ဖြည့်သွင်းရန် (Auto Top-up)
              </p>
              <p className="text-slate-700">
                KBZPay / AYA Pay:{" "}
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  09784970257
                </span>{" "}
                (Tun Tun Naing)
              </p>
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded text-emerald-900 font-medium">
                💡 ငွေလွှဲသည့်အခါ Note (သို့) Message တွင်{" "}
                <span className="underline font-bold text-red-600">
                  user_{activeUserId}
                </span>{" "}
                ဟု မိမိ၏ ID ဖြင့် မဖြစ်မနေ ထည့်သွင်းပေးပါ။ (ဥပမာ -{" "}
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border font-bold text-emerald-700">
                  user_{activeUserId}
                </span>
                )
              </div>
              <p className="text-[11px] text-slate-500">
                ငွေလွှဲပြီးပါက စက္ကန့်ပိုင်းအတွင်း သင့်အကောင့်ထဲသို့ Coins များ
                အလိုအလျောက် ဝင်ရောက်လာမည် ဖြစ်ပါသည်။
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Property Title (ခေါင်းစဉ်)
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Yankin Luxury Condo"
              className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* 🏷️ Listing Type (အရောင်း / အငှား) နှင့် Property Type (အမျိုးအစား) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Listing Type (ကြော်ငြာအမျိုးအစား)
              </label>
              <select
                name="listing_type"
                value={formData.listing_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-emerald-700 bg-emerald-50/50"
              >
                <option value="Sale">🏷️ အရောင်း (For Sale)</option>
                <option value="Rent">🏠 အငှား (For Rent)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Property Type (အိမ်ခြံမြေ အမျိုးအစား)
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1"
              >
                <option value="Apartment">Apartment / Condo</option>
                <option value="Land">Land Plot</option>
                <option value="Villa">Villa / House</option>
              </select>
            </div>
          </div>

          {/* 💰 Price နှင့် 📍 Township (တည်နေရာ) ထည့်ရန် Field များ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price (
                {formData.listing_type === "Rent"
                  ? "တစ်လ (ကျပ်/သိန်း)"
                  : "သိန်း"}
                )
              </label>
              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                placeholder={
                  formData.listing_type === "Rent"
                    ? "e.g. 5 (သိန်း)"
                    : "e.g. 2500"
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Township / Location (တည်နေရာ/မြို့နယ်)
              </label>
              <input
                type="text"
                name="township"
                required
                value={formData.township}
                onChange={handleChange}
                placeholder="ဥပမာ - ဗဟန်း (ወይም တောင်ဒဂုံ)"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Latitude (မြေပုံ မျဉ်းပြိုင်)
              </label>
              <input
                type="number"
                step="any"
                name="lat"
                required
                value={formData.lat}
                onChange={handleChange}
                placeholder="e.g. 16.8409"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Longitude (မြေပုံ မျဉ်းထောင်)
              </label>
              <input
                type="number"
                step="any"
                name="lng"
                required
                value={formData.lng}
                onChange={handleChange}
                placeholder="e.g. 96.1735"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact Phone (ဆက်သွယ်ရန် ဖုန်း)
            </label>
            <input
              type="text"
              name="contact_phone"
              required
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="e.g. 09784970257"
              className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            {/* 📄 Ownership Document Select Box */}
            <label className="block text-sm font-medium text-gray-700">
              Ownership Document (ပိုင်ဆိုင်မှု စာရွက်စာတမ်း)
            </label>
            <select
              name="ownership_document"
              value={formData.ownership_document}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="ဂရန် (Grant)">ဂရန် (Grant)</option>
              <option value="ပါမစ် (Permit)">ပါမစ် (Permit)</option>
              <option value="ဘိုးဘွားပိုင်မြေ (Freehold)">
                ဘိုးဘွားပိုင်မြေ (Freehold)
              </option>
              <option value="ဂရန်အမည်ပေါက် (Grant Name Transfer)">
                ဂရန်အမည်ပေါက်
              </option>
              <option value="အခြား (Other)">အခြား (Other)</option>
            </select>
          </div>

          {/* Type က Apartment ဖြစ်မှသာ Building Status ကို ပြရန် */}
          {formData.type === "Apartment" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Building Status (BCC နှင့် လူနေထိုင်ခွင့် အခြေအနေ)
              </label>
              <select
                name="building_status"
                value={formData.building_status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="BCC ကျပြီး / လူနေထိုင်ခွင့် ကျပြီး">
                  BCC ကျပြီး / လူနေထိုင်ခွင့် ကျပြီး
                </option>
                <option value="BCC မကျသေး / လူနေထိုင်ခွင့် ကျပြီး">
                  BCC မကျသေး / လူနေထိုင်ခွင့် ကျပြီး
                </option>
                <option value="BCC ကျပြီး / လူနေထိုင်ခွင့် ဆောင်ရွက်ဆဲ">
                  BCC ကျပြီး / လူနေထိုင်ခွင့် ဆောင်ရွက်ဆဲ
                </option>
                <option value="ဆောက်လုပ်ဆဲ (Under Construction)">
                  ဆောက်လုပ်ဆဲ (Under Construction)
                </option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description (အသေးစိတ် ဖော်ပြချက်)
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="အသေးစိတ် ရေးသားရန်..."
              className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Images/Documents (ပုံများ တင်ရန်)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !hasEnoughCoins}
            className={`w-full text-white font-medium py-2.5 rounded-lg transition duration-200 shadow-md ${
              hasEnoughCoins
                ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading
              ? "Uploading & Posting..."
              : hasEnoughCoins
                ? "Post Property (30 Coins ကျသင့်မည်)"
                : "Coins မလုံလောက်ပါ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;
