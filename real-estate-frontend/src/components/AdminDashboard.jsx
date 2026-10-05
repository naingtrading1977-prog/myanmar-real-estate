import React, { useState, useEffect } from "react";

// API Base URL (Render Backend URL)
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://myanmar-real-estate-1.onrender.com/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users"); // 'users' သို့မဟုတ် 'properties'
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🖼️ ငွေလွှဲပြေစာ (Payment Proof) ပုံကြီးကြည့်ရန် Modalအတွက် State
  const [selectedProofImg, setSelectedProofImg] = useState(null);

  // Token ယူရန်
  const getToken = () => localStorage.getItem("token");

  // 👥 User စာရင်းများကို Backend ကနေ လှမ်းဆွဲယူခြင်း
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
        setError(null);
      } else {
        setError("User စာရင်းများကို ရယူ၍မရပါ။");
      }
    } catch (err) {
      console.error(err);
      setError("Server ချိတ်ဆက်မှု အမှားအယွင်း ရှိနေပါသည်။");
    } finally {
      setLoading(false);
    }
  };

  // 🏠 Property စာရင်းများကို Backend ကနေ လှမ်းဆွဲယူခြင်း
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const result = await response.json();
      if (result && result.data) {
        setProperties(result.data);
        setError(null);
      } else if (Array.isArray(result)) {
        setProperties(result);
        setError(null);
      } else {
        setError("Property စာရင်းများကို ရယူ၍မရပါ။");
      }
    } catch (err) {
      console.error(err);
      setError("Server ချိတ်ဆက်မှု အမှားအယွင်း ရှိနေပါသည်။");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchProperties();
    }
  }, [activeTab]);

  // ⚡ User Subscription သက်တမ်းတိုးပေးခြင်း
  const handleActivate = async (userId) => {
    if (
      !window.confirm(
        "ဒီအသုံးပြုသူ၏ Subscription သက်တမ်းကို ၁ လ တိုးပေးမှာ သေချာပါသလား?",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/activate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      const result = await response.json();

      if (result.success) {
        alert("Subscription သက်တမ်း တိုးမြှင့်ခြင်း အောင်မြင်ပါသည်။");
        fetchUsers();
      } else {
        alert("သက်တမ်းတိုးရန် မအောင်မြင်ပါ။");
      }
    } catch (err) {
      console.error(err);
      alert("Server error ဖြစ်ပွားနေပါသည်။");
    }
  };

  // 🏷️ Property Status ပြောင်းလဲခြင်း
  const handleUpdatePropertyStatus = async (propertyId, newStatus) => {
    const confirmMessage =
      newStatus === "Available"
        ? "ဒီ ပို့စ်ကို ပင်မစာမျက်နှာတွင် ပြန်လည်ပြသရန် (Available) သို့ ပြောင်းမှာ သေချာပါသလား?"
        : `ဒီ ပို့စ်၏ အခြေအနေကို "${newStatus}" သို့ ပြောင်းလဲမှာ သေချာပါသလား?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const result = await response.json();

      if (response.ok) {
        alert("ပို့စ် အခြေအနေ ပြောင်းလဲခြင်း အောင်မြင်ပါသည်။");
        fetchProperties();
      } else {
        alert(result.error || "အခြေအနေ ပြောင်းလဲရန် မအောင်မြင်ပါ။");
      }
    } catch (err) {
      console.error(err);
      alert("Server error ဖြစ်ပွားနေပါသည်။");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 📂 Sidebar Navigation */}
        <div className="w-full md:w-64 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-3">
            Admin Panel
          </h2>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
              activeTab === "users"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>👥</span>
            <span>User Subscriptions</span>
          </button>

          <button
            onClick={() => setActiveTab("properties")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
              activeTab === "properties"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🏠</span>
            <span>Manage Properties</span>
          </button>
        </div>

        {/* 📊 Main Content Area */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === "users"
                ? "🛠 User Subscriptions Management"
                : "🏡 Property Listings Management"}
            </h1>
            <button
              onClick={activeTab === "users" ? fetchUsers : fetchProperties}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              ဒေတာများ ရယူနေပါသည်...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 bg-white rounded-2xl border border-slate-200">
              {error}
            </div>
          ) : activeTab === "users" ? (
            /* 👥 Users Table */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">ID</th>
                      <th className="p-4">Name / Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Payment Proof</th>
                      <th className="p-4">Expires At</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {users.map((u) => {
                      const proofUrl = u.payment_proof
                        ? u.payment_proof.startsWith("http")
                          ? u.payment_proof
                          : `${API_BASE_URL.replace("/api", "")}${u.payment_proof}`
                        : null;

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/50 transition"
                        >
                          <td className="p-4 font-medium">#{u.id}</td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-900">
                              {u.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {u.email}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-700">
                            {u.phone || "မရှိပါ။"}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                u.subscription_status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {u.subscription_status}
                            </span>
                          </td>
                          {/* 🖼️ ငွေလွှဲပြေစာ ပြသရန် ကော်လံ */}
                          <td className="p-4">
                            {proofUrl ? (
                              <button
                                onClick={() => setSelectedProofImg(proofUrl)}
                                className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg font-semibold transition"
                              >
                                🖼️ ပြေစာကြည့်ရန်
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                မရှိပါ (Trial)
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {u.subscription_expires_at
                              ? new Date(
                                  u.subscription_expires_at,
                                ).toLocaleDateString()
                              : u.trial_ends_at
                                ? `Trial: ${new Date(
                                    u.trial_ends_at,
                                  ).toLocaleDateString()}`
                                : "-"}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleActivate(u.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                            >
                              ✅ Activate (1 Month)
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 🏠 Properties Table */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">ID</th>
                      <th className="p-4">Property Title</th>
                      <th className="p-4">Type & Price</th>
                      <th className="p-4">0.5% Commission (ပွဲခ)</th>
                      <th className="p-4">Status / Listing</th>
                      <th className="p-4 text-center">Admin Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {properties.map((p) => {
                      const numericPrice = parseFloat(p.price) || 0;
                      const isRent =
                        p.listing_type === "Rent" ||
                        p.status === "For Rent" ||
                        (p.status && p.status.includes("Rent"));

                      const commissionValue = numericPrice * 0.005;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/50 transition"
                        >
                          <td className="p-4 font-medium">#{p.id}</td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {p.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              Owner ID: #{p.owner_id}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-emerald-600 font-bold">
                              {p.price} သိန်း {isRent ? "/ လ" : ""}
                            </div>
                            <div className="text-xs text-slate-500">
                              {p.property_type || p.type} (
                              {isRent ? "အငှား" : "အရောင်း"})
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-indigo-600 font-extrabold">
                              {commissionValue.toFixed(2)} သိန်း
                            </div>
                            <div className="text-[10px] text-slate-400">
                              (0.5% of {p.price} သိန်း {isRent ? "တစ်လစာ" : ""})
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                p.status === "Sold" ||
                                p.status === "Rented" ||
                                p.status === "Hidden"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {p.status || "Available"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <button
                                onClick={() =>
                                  handleUpdatePropertyStatus(p.id, "Available")
                                }
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition"
                              >
                                ✅ ပြန်ဖွင့်ရန်
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdatePropertyStatus(p.id, "Sold")
                                }
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded transition"
                              >
                                🏷 အရောင်းပြီး
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdatePropertyStatus(p.id, "Rented")
                                }
                                className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition"
                              >
                                🔑 အငှားပြီး
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdatePropertyStatus(p.id, "Hidden")
                                }
                                className="px-2.5 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold rounded transition"
                              >
                                👁️‍🗨️ ဖျောက်ရန်
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🖼️ ငွေလွှဲပြေစာ ပုံကြီးကြည့်ရန် Modal */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl max-w-lg w-full relative shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-bold text-sm">
                ငွေလွှဲပြေစာ (Payment Proof Screenshot)
              </h3>
              <button
                onClick={() => setSelectedProofImg(null)}
                className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
            <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedProofImg}
                alt="Payment Proof"
                className="object-contain max-h-[65vh] w-full"
              />
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setSelectedProofImg(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
