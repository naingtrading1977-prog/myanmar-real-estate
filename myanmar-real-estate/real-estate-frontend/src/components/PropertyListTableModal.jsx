import React, { useState } from "react";

const PropertyListTableModal = ({
  isOpen,
  onClose,
  properties,
  onSelectProperty,
}) => {
  const [filterType, setFilterType] = useState("all"); // 'all', 'apartment', 'land'
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedTownship, setSelectedTownship] = useState("all");

  if (!isOpen) return null;

  // မြို့နယ်စာရင်းများကို properties ထဲမှ ယူနစ်များအလိုက် အလိုအလျောက် ထုတ်ယူရန်
  const townships = [
    ...new Set(properties.map((p) => p.township).filter(Boolean)),
  ];

  // Filter များနှင့် Search များကို အခြေခံ၍ စစ်ထုတ်ခြင်း
  const filteredProperties = properties.filter((item) => {
    const type = (item.property_type || item.type || "").toLowerCase();

    // Type Filter
    if (
      filterType === "apartment" &&
      !(type.includes("apartment") || type.includes("တိုက်ခန်း"))
    )
      return false;
    if (
      filterType === "land" &&
      !(
        type.includes("land") ||
        type.includes("မြေကွက်") ||
        type.includes("plot")
      )
    )
      return false;

    // Township Filter
    if (selectedTownship !== "all" && item.township !== selectedTownship)
      return false;

    // Price Filter (Max Price ထက် ငယ်သည် သို့မဟုတ် ညီသည်)
    if (maxPrice && Number(item.price) > Number(maxPrice)) return false;

    // Search Query (ခေါင်းစဉ်၊ ဖော်ပြချက် သို့မဟုတ် ဈေးနှုန်းတို့တွင် ရှာဖွေရန်)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = (item.title || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const priceStr = String(item.price || "");
      if (
        !title.includes(query) &&
        !desc.includes(query) &&
        !priceStr.includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <span>📋</span> တိုက်ခန်းနှင့် မြေကွက် ရရှိနိုင်သော စာရင်းများ
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ရန်ကုန်မြို့တွင်း အိမ်ခြံမြေ အရောင်း/အငှား တရားဝင် ဈေးနှုန်းနှင့်
              အချက်အလက်ဇယား
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white w-10 h-10 rounded-full flex items-center justify-center font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Control Panel */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Category Tabs */}
            <div className="flex gap-2 items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">
                အမျိုးအစား:
              </span>
              <button
                onClick={() => setFilterType("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterType === "all"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                အားလုံး ({properties.length})
              </button>
              <button
                onClick={() => setFilterType("apartment")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterType === "apartment"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                🏢 တိုက်ခန်းများ
              </button>
              <button
                onClick={() => setFilterType("land")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterType === "land"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                🏞️ မြေကွက်များ
              </button>
            </div>

            {/* Keyword Search Input */}
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="🔍 အမည်၊ အကျယ်အဝန်း ဖြင့် ရှာရန်..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {/* Advanced Filters: Township & Max Price */}
          <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                မြို့နယ်:
              </span>
              <select
                value={selectedTownship}
                onChange={(e) => setSelectedTownship(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">မြို့နယ် အားလုံး</option>
                {townships.map((t, idx) => (
                  <option key={idx} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                အမြင့်ဆုံးဈေးနှုန်း (သိန်း):
              </span>
              <input
                type="number"
                placeholder="ဥပမာ - 1500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {(searchQuery ||
              maxPrice ||
              selectedTownship !== "all" ||
              filterType !== "all") && (
              <button
                onClick={() => {
                  setFilterType("all");
                  setSearchQuery("");
                  setMaxPrice("");
                  setSelectedTownship("all");
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold underline ml-auto"
              >
                စစ်ထုတ်မှုများ ဖျက်မည် (Reset)
              </button>
            )}
          </div>
        </div>

        {/* Table Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              ရှာဖွေမှုနှင့် ကိုက်ညီသော အိမ်ခြံမြေ စာရင်း မရှိပါ။
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-bold text-center w-16">စဉ်</th>
                    <th className="p-4 font-bold">ခေါင်းစဉ်နှင့် အကျယ်အဝန်း</th>
                    <th className="p-4 font-bold">အမျိုးအစား</th>
                    <th className="p-4 font-bold">တည်နေရာ / မြို့နယ်</th>
                    <th className="p-4 font-bold text-right">
                      သတ်မှတ်ဈေးနှုန်း
                    </th>
                    <th className="p-4 font-bold text-center">အခြေအနေ</th>
                    <th className="p-4 font-bold text-center">လုပ်ဆောင်ချက်</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredProperties.map((item, index) => {
                    const isRent =
                      item.listing_type === "Rent" ||
                      item.status === "For Rent";
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-emerald-50/40 transition cursor-pointer"
                        onClick={() => {
                          onSelectProperty(item);
                          onClose();
                        }}
                      >
                        <td className="p-4 text-center font-bold text-slate-400 text-xs">
                          {index + 1}
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 line-clamp-1 hover:text-emerald-600">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {item.description || "အသေးစိတ်ဖော်ပြချက် မရှိပါ။"}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-bold">
                            {item.property_type || item.type || "Apartment"}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-600">
                          📍 {item.township || "ရန်ကုန်"}
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-emerald-600 font-extrabold text-base">
                            {item.price}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {isRent ? "သိန်း / လ" : "သိန်း"}
                            </span>
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full ${
                              isRent
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isRent ? "အငှား" : "အရောင်း"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProperty(item);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                          >
                            ကြည့်မည် 🔍
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>
            တွေ့ရှိသော စာရင်း: <strong>{filteredProperties.length}</strong> ခု
            (စုစုပေါင်း {properties.length} ခုမှ)
          </span>
          <span>✨ Win Win Aung Real Estate Platform</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyListTableModal;
