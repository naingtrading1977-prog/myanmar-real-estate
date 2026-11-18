import { useState, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5002/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState(null);

  // Modals States
  const [selectedUserForCoins, setSelectedUserForCoins] = useState(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinActionType, setCoinActionType] = useState("add");

  const [editingUser, setEditingUser] = useState(null);
  const [updatedRole, setUpdatedRole] = useState("user");

  const [editingProperty, setEditingProperty] = useState(null);
  const [propertyForm, setPropertyForm] = useState({
    title: "",
    price: "",
    status: "Available",
  });

  const [selectedProofImg, setSelectedProofImg] = useState(null);

  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const getToken = () => localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || result.users || []);
        setError(null);
      } else {
        setError("User စာရင်းများကို ရယူ၍မရပါ။");
      }
    } catch (err) {
      console.error(err);
      setError("Server ချိတ်ဆက်မှု အမှားအယွင်း ရှိနေပါသည်။");
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await response.json();

      const propertyData = result.data || result.properties || result || [];
      setProperties(Array.isArray(propertyData) ? propertyData : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Property စာရင်းများကို ရယူ၍မရပါ။");
    }
  };

  const fetchUsersSilent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || result.users || []);
      }
    } catch (err) {
      console.error("Silent sync error:", err);
    }
  };

  const fetchPropertiesSilent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await response.json();
      if (result && result.data) {
        setProperties(result.data);
      } else if (Array.isArray(result)) {
        setProperties(result);
      }
    } catch (err) {
      console.error("Silent sync error:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const token = getToken();

        const userRes = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userResult = await userRes.json();
        if (isMounted && userResult.success) {
          setUsers(userResult.data || userResult.users || []);
        }

        const propRes = await fetch(`${API_BASE_URL}/properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const propResult = await propRes.json();
        const propertyData =
          propResult.data || propResult.properties || propResult || [];
        if (isMounted) {
          setProperties(Array.isArray(propertyData) ? propertyData : []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (isMounted) {
          setError("ဒေတာများ ရယူရာတွင် အမှားအယွင်း ရှိနေပါသည်။");
        }
      }
    };

    loadInitialData();

    const interval = setInterval(() => {
      fetchUsersSilent();
      fetchPropertiesSilent();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 🪙 Coins ချက်ချင်းပြောင်းလဲရန်
  const handleUpdateCoins = async (e) => {
    e.preventDefault();
    if (!selectedUserForCoins || !coinAmount) return;
    const parsedAmount = parseInt(coinAmount);
    const finalAmount = coinActionType === "add" ? parsedAmount : -parsedAmount;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${selectedUserForCoins.id}/coins`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ coins: finalAmount }),
        },
      );
      const result = await response.json();
      if (response.ok && result.success) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u.id === selectedUserForCoins.id) {
              const currentCoins = parseInt(u.coins || 0);
              const updatedCoins =
                coinActionType === "add"
                  ? currentCoins + parsedAmount
                  : Math.max(0, currentCoins - parsedAmount);
              return { ...u, coins: updatedCoins };
            }
            return u;
          }),
        );

        setSelectedUserForCoins(null);
        setCoinAmount("");
      } else {
        alert(result.error || "Coins ပြင်ဆင်ရန် မအောင်မြင်ပါ။");
      }
    } catch (err) {
      console.error(err);
      alert("Server error ဖြစ်ပွားနေပါသည်။");
    }
  };

  const handleUpdateUserRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${editingUser.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ role: updatedRole }),
        },
      );
      const result = await response.json();
      if (response.ok && result.success) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === editingUser.id ? { ...u, role: updatedRole } : u,
          ),
        );
        setEditingUser(null);
      } else {
        alert(result.error || "Role ပြောင်းလဲရန် မအောင်မြင်ပါ။");
      }
    } catch (err) {
      console.error(err);
      alert("Server error ဖြစ်ပွားနေပါသည်။");
    }
  };

  // 🤝 Agent အတည်ပြုပေးရန် (Approve / Reject)
  const handleApproveAgent = async (userId, status) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/users/${userId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ is_approved: status }),
        },
      );
      const result = await response.json();
      if (response.ok && result.success) {
        // 🔑 အဓိကပြင်ဆင်ချက်: State ထဲရှိ users စာရင်းကို ချက်ချင်း update လုပ်ပေးပါ (Polling ကို မစောင့်တော့ဘဲ UI မှာ ချက်ချင်းပြောင်းသွားစေရန်)
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === userId ? { ...u, is_approved: status } : u,
          ),
        );
      } else {
        alert(result.error || "အပြောင်းအလဲလုပ်ရန် မအောင်မြင်ပါ။");
      }
    } catch (err) {
      console.error(err);
      alert("Server error ဖြစ်ပွားနေပါသည်။");
    }
  };

  // 🔑 User Password အသစ်ပြောင်းလဲရန်
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/users/${resetPasswordUser.id}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ newPassword }),
        },
      );
      const result = await response.json();
      if (response.ok && result.success) {
        alert("Password အသစ် ပြောင်းလဲခြင်း အောင်မြင်ပါသည်။");
        setResetPasswordUser(null);
        setNewPassword("");
      } else {
        alert(result.error || "Password ပြောင်းလဲရန် မအောင်မြင်ပါ။");
      }
    } catch (err) {
      console.error(err);
      alert("Server error ဖြစ်ပွားနေပါသည်။");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("ဒီ User အကောင့်ကို ဖျက်ပစ်မှာ သေချာပါသလား?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePropertyStatus = async (propertyId, newStatus) => {
    if (
      !window.confirm(
        `ဒီ ပို့စ်၏ အခြေအနေကို "${newStatus}" သို့ ပြောင်းမည်မှာ သေချာပါသလား?`,
      )
    )
      return;
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
      if (response.ok) {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === propertyId ? { ...p, status: newStatus } : p,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm("ဒီ ပို့စ်ကို ဖျက်ပစ်မှာ သေချာပါသလား?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePropertyDetails = async (e) => {
    e.preventDefault();
    if (!editingProperty) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${editingProperty.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(propertyForm),
        },
      );
      if (response.ok) {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === editingProperty.id ? { ...p, ...propertyForm } : p,
          ),
        );
        setEditingProperty(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Total Users
            </p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
              {users.length}
            </h3>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl text-2xl border border-emerald-100">
            👥
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Total Properties
            </p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
              {properties.length}
            </h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-2xl text-2xl border border-blue-100">
            🏠
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              System Status
            </p>
            <h3 className="text-lg font-extrabold text-emerald-600 mt-1 flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
              Online (Active)
            </h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl text-2xl border border-amber-100">
            ⚡
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-3">
            Admin Navigation
          </h2>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm ${
              activeTab === "users"
                ? "bg-emerald-600 text-white shadow-emerald-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>👥</span>
            <span>Users & Coins Control</span>
          </button>

          <button
            onClick={() => setActiveTab("properties")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm ${
              activeTab === "properties"
                ? "bg-emerald-600 text-white shadow-emerald-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🏠</span>
            <span>Properties CRUD</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                {activeTab === "users"
                  ? "🪙 Users Management & Coin Balances"
                  : "🏡 Properties Complete Management"}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time control panel for platform administration
              </p>
            </div>
            <button
              onClick={activeTab === "users" ? fetchUsers : fetchProperties}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              🔄 Refresh Data
            </button>
          </div>

          {error ? (
            <div className="p-12 text-center text-red-500 bg-white rounded-2xl border border-slate-200">
              {error}
            </div>
          ) : activeTab === "users" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-bold">ID</th>
                      <th className="p-4 font-bold">User Profile</th>
                      <th className="p-4 font-bold">Phone</th>
                      <th className="p-4 font-bold">Role & Approval</th>
                      <th className="p-4 font-bold">Coins</th>
                      <th className="p-4 font-bold">Proof</th>
                      <th className="p-4 font-bold text-center">Actions</th>
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
                          className="hover:bg-slate-50/60 transition"
                        >
                          <td className="p-4 font-semibold text-slate-400 text-xs">
                            #{u.id}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">
                              {u.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {u.email}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-600">
                            {u.phone || "မရှိပါ။"}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                                  u.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : u.role === "agent"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {u.role}
                              </span>
                              {u.role === "agent" && (
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                    u.is_approved
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700 animate-pulse"
                                  }`}
                                >
                                  {u.is_approved ? "Approved" : "Pending"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center w-fit gap-1">
                              🪙 {u.coins || 0}
                            </span>
                          </td>
                          <td className="p-4">
                            {proofUrl ? (
                              <button
                                onClick={() => setSelectedProofImg(proofUrl)}
                                className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1"
                              >
                                🖼️ ကြည့်ရန်
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {u.role === "agent" && !u.is_approved && (
                                <button
                                  onClick={() => handleApproveAgent(u.id, true)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                                >
                                  ✅ Approve
                                </button>
                              )}
                              {u.role === "agent" && u.is_approved && (
                                <button
                                  onClick={() =>
                                    handleApproveAgent(u.id, false)
                                  }
                                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition"
                                >
                                  ❌ Revoke
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedUserForCoins(u);
                                  setCoinAmount("");
                                  setCoinActionType("add");
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1"
                              >
                                🪙 Coins
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setUpdatedRole(u.role);
                                }}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
                              >
                                🛡️ Role
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold rounded-lg transition border border-red-200"
                              >
                                🗑️
                              </button>
                              <button
                                onClick={() => {
                                  setResetPasswordUser(u);
                                  setNewPassword("");
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white text-xs font-bold rounded-lg transition border border-amber-200"
                                title="Password ပြောင်းရန်"
                              >
                                🔑
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
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-bold">ID</th>
                      <th className="p-4 font-bold">Property Title</th>
                      <th className="p-4 font-bold">Price & Type</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-center">
                        Management Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {properties.map((p) => {
                      const isRent =
                        p.listing_type === "Rent" || p.status?.includes("Rent");
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/60 transition"
                        >
                          <td className="p-4 font-semibold text-slate-400 text-xs">
                            #{p.id}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900 line-clamp-1">
                              {p.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              Owner ID: #{p.owner_id}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-emerald-600 font-extrabold">
                              {p.price} သိန်း {isRent ? "/လ" : ""}
                            </div>
                            <div className="text-xs text-slate-400">
                              {p.property_type || p.type}
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 text-xs font-bold rounded-full ${
                                p.status === "Sold" ||
                                p.status === "Rented" ||
                                p.status === "Hidden"
                                  ? "bg-red-50 text-red-700 border border-red-200/60"
                                  : "bg-blue-50 text-blue-700 border border-blue-200/60"
                              }`}
                            >
                              {p.status || "Available"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() =>
                                  handleUpdatePropertyStatus(p.id, "Available")
                                }
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold rounded-lg transition border border-emerald-200"
                              >
                                ✅ ပြန်ဖွင့်
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdatePropertyStatus(p.id, "Sold")
                                }
                                className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white text-xs font-bold rounded-lg transition border border-amber-200"
                              >
                                🏷 အရောင်းပြီး
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdatePropertyStatus(p.id, "Hidden")
                                }
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-700 hover:text-white text-xs font-bold rounded-lg transition"
                              >
                                👁️‍🗨️ ဖျောက်
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProperty(p);
                                  setPropertyForm({
                                    title: p.title,
                                    price: p.price,
                                    status: p.status || "Available",
                                  });
                                }}
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-lg transition border border-indigo-200"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProperty(p.id)}
                                className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold rounded-lg transition border border-red-200"
                              >
                                🗑️
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

      {/* Modals */}
      {selectedUserForCoins && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-slate-800 font-bold text-base mb-1">
              🪙 Coins စီမံခန့်ခွဲရန်
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {selectedUserForCoins.name} ({selectedUserForCoins.email})
            </p>
            <form onSubmit={handleUpdateCoins} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  အမျိုးအစား
                </label>
                <select
                  value={coinActionType}
                  onChange={(e) => setCoinActionType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                >
                  <option value="add">➕ Coins ပေါင်းထည့်ရန်</option>
                  <option value="deduct">➖ Coins ဖြတ်တောက်ရန်</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ပမာဏ
                </label>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  placeholder="ဥပမာ - 50"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForCoins(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                >
                  ပိတ်မည်
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-200"
                >
                  အတည်ပြုမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-slate-800 font-bold text-base mb-1">
              🛡️ User Role ပြောင်းလဲရန်
            </h3>
            <p className="text-xs text-slate-400 mb-4">{editingUser.name}</p>
            <form onSubmit={handleUpdateUserRole} className="space-y-4">
              <select
                value={updatedRole}
                onChange={(e) => setUpdatedRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value="user">User / Client</option>
                <option value="agent">Agent / Lister</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-200"
                >
                  ပြောင်းလဲမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-slate-800 font-bold text-base mb-1">
              🔑 User Password အသစ်သတ်မှတ်ရန်
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {resetPasswordUser.name} ({resetPasswordUser.email})
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Password အသစ်
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password အသစ် ထည့်ပါ"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                >
                  ပိတ်မည်
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-200"
                >
                  ပြောင်းလဲမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Edit Modal */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-slate-800 font-bold text-base mb-4">
              ✏️ Property အချက်အလက် ပြင်ဆင်ရန် (အသေးစိတ်)
            </h3>
            <form onSubmit={handleUpdatePropertyDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ခေါင်းစဉ်
                </label>
                <input
                  type="text"
                  value={propertyForm.title}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, title: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ဈေးနှုန်း (သိန်း)
                  </label>
                  <input
                    type="text"
                    value={propertyForm.price}
                    onChange={(e) =>
                      setPropertyForm({
                        ...propertyForm,
                        price: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    အိမ်ခြံမြေ အမျိုးအစား (Type)
                  </label>
                  {/* Dropdown အဖြစ် ပြောင်းလဲထားပါသည် */}
                  <select
                    value={propertyForm.propertyType || "Apartment"}
                    onChange={(e) =>
                      setPropertyForm({
                        ...propertyForm,
                        propertyType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800 font-medium"
                  >
                    <option value="Apartment">Apartment (တိုက်ခန်း)</option>
                    <option value="Condo">Condo (ကွန်ဒို)</option>
                    <option value="House">House (အိမ်)</option>
                    <option value="Land">Land (ခြံမြေ)</option>
                    <option value="Commercial">
                      Commercial (ဆိုင်ခန်း/ရုံးခန်း)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  အခြေအနေ
                </label>
                <select
                  value={propertyForm.status}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                >
                  <option value="Available">Available (ပြသရန်)</option>
                  <option value="Sold">Sold (အရောင်းပြီး)</option>
                  <option value="Rented">Rented (အငှားပြီး)</option>
                  <option value="Hidden">Hidden (ဝှက်ထားရန်)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  အသေးစိတ် ဖော်ပြချက် (Description)
                </label>
                <textarea
                  rows="3"
                  value={propertyForm.description || ""}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="အိမ်အကြောင်းအရာ အသေးစိတ်..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                >
                  ပိတ်မည်
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-200"
                >
                  သိမ်းဆည်းမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl max-w-lg w-full relative shadow-2xl">
            <div className="flex justify-between items-center mb-3 px-2">
              <h3 className="text-white font-bold text-sm">
                ငွေလွှဲပြေစာ ပုံရိပ် (Payment Proof)
              </h3>
              <button
                onClick={() => setSelectedProofImg(null)}
                className="text-slate-400 hover:text-white font-bold text-base bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
            <div className="bg-black/50 rounded-2xl overflow-hidden flex items-center justify-center p-2 max-h-[70vh]">
              <img
                src={selectedProofImg}
                alt="Payment Proof"
                className="object-contain max-h-[65vh] w-full rounded-xl"
              />
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setSelectedProofImg(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
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
