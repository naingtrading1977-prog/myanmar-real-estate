import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AgentsPage = ({ properties = [], language, onSelectAgentFilter }) => {
  const navigate = useNavigate();
  const lang = language || localStorage.getItem("app_lang") || "mm";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTownship, setSelectedTownship] = useState("");

  const t = {
    backHome: lang === "en" ? "← Back to Home" : "← ပင်မစာမျက်နှာသို့",
    title:
      lang === "en"
        ? "Real Estate Agents & Agencies"
        : "အိမ်ခြံမြေ အကျိုးဆောင်များ",
    subtitle:
      lang === "en"
        ? "Browse active agents and their listed properties across cities and townships."
        : "လက်ရှိ အိမ်ခြံမြေ ကြော်ငြာများ တင်ဆောင်ထားသော အကျိုးဆောင်များနှင့် မြို့နယ်များ။",
    namePlaceholder:
      lang === "en" ? "Agent name or ID..." : "အကျိုးဆောင်အမည် သို့မဟုတ် ID...",
    allCities:
      lang === "en" ? "All Cities / Regions" : "တိုင်းနှင့်ပြည်နယ်အားလုံး",
    allTownships: lang === "en" ? "All Townships" : "မြို့နယ်အားလုံး",
    resetBtn: lang === "en" ? "Reset" : "ရှင်းရန်",
    totalAgents: lang === "en" ? "Agents" : "အကျိုးဆောင်",
    listingsCount: lang === "en" ? "Active Listings" : "တင်ထားသော ပို့စ်",
    viewListings: lang === "en" ? "View Properties" : "အသေးစိတ်ကြည့်ရန်",
    noAgents:
      lang === "en"
        ? "No agents found matching your filter."
        : "ရွေးချယ်မှုနှင့် ကိုက်ညီသော အကျိုးဆောင် မရှိသေးပါ။",
    agentLabel: lang === "en" ? "Agent" : "အကျိုးဆောင်",
    idLabel: lang === "en" ? "ID" : "ID",
    townshipsLabel:
      lang === "en" ? "Active Townships" : "ဆောင်ရွက်နေသော မြို့နယ်များ",
    verifiedAgent: lang === "en" ? "Active Agent" : "အကျိုးဆောင်",
  };

  // properties ထဲမှ owner_id / agent အလိုက် စုစည်းခြင်း
  const agentsList = useMemo(() => {
    const map = new Map();

    properties.forEach((prop) => {
      const ownerKey = String(
        prop.owner_id || prop.user_id || prop.agent_id || prop.id,
      );
      const rawName =
        prop.owner_name ||
        prop.agent_name ||
        prop.user_name ||
        prop.contact_name ||
        "";

      const displayName = rawName.trim()
        ? rawName.trim()
        : `${t.agentLabel} (${t.idLabel}: ${ownerKey})`;

      if (!map.has(ownerKey)) {
        map.set(ownerKey, {
          id: ownerKey,
          name: displayName,
          phone: prop.contact_phone || "",
          listingsCount: 0,
          cities: new Set(),
          townships: new Set(),
          sampleAddress: prop.address || "",
        });
      }

      const entry = map.get(ownerKey);
      entry.listingsCount += 1;

      if (prop.city) {
        entry.cities.add(prop.city.trim());
      }
      if (prop.township) {
        entry.townships.add(prop.township.trim());
      }
      if (!entry.phone && prop.contact_phone) {
        entry.phone = prop.contact_phone;
      }
      if (!entry.sampleAddress && prop.address) {
        entry.sampleAddress = prop.address;
      }
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      cities: Array.from(item.cities),
      townships: Array.from(item.townships),
    }));
  }, [properties, t.agentLabel, t.idLabel]);

  const cityOptions = useMemo(() => {
    const set = new Set();
    agentsList.forEach((a) => a.cities.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [agentsList]);

  const townshipOptions = useMemo(() => {
    const set = new Set();
    agentsList.forEach((a) => {
      if (!selectedCity || a.cities.includes(selectedCity)) {
        a.townships.forEach((tw) => set.add(tw));
      }
    });
    return Array.from(set);
  }, [agentsList, selectedCity]);

  const filteredAgents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return agentsList.filter((agent) => {
      if (q) {
        const nameMatch = (agent.name || "").toLowerCase().includes(q);
        const idMatch = String(agent.id || "")
          .toLowerCase()
          .includes(q);
        const townMatch = agent.townships.some((tw) =>
          tw.toLowerCase().includes(q),
        );
        if (!nameMatch && !idMatch && !townMatch) return false;
      }

      if (selectedCity && !agent.cities.includes(selectedCity)) {
        return false;
      }

      if (selectedTownship && !agent.townships.includes(selectedTownship)) {
        return false;
      }

      return true;
    });
  }, [agentsList, searchTerm, selectedCity, selectedTownship]);

  const handleViewAgentListings = (agent) => {
    if (typeof onSelectAgentFilter === "function") {
      onSelectAgentFilter(agent);
    }
    navigate("/");
  };

  const hasFilter = Boolean(
    searchTerm.trim() || selectedCity || selectedTownship,
  );

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 mb-1 inline-block cursor-pointer"
          >
            {t.backHome}
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 border-b-2 border-emerald-500 pb-1 inline-block">
            {t.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 pt-1">{t.subtitle}</p>
        </div>

        <span className="self-start md:self-center bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full">
          {filteredAgents.length} {t.totalAgents}
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.namePlaceholder}
          className="border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <select
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setSelectedTownship("");
          }}
          className="border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">{t.allCities}</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedTownship}
          onChange={(e) => setSelectedTownship(e.target.value)}
          className="border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">{t.allTownships}</option>
          {townshipOptions.map((tw) => (
            <option key={tw} value={tw}>
              {tw}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!hasFilter}
          onClick={() => {
            setSearchTerm("");
            setSelectedCity("");
            setSelectedTownship("");
          }}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            hasFilter
              ? "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {t.resetBtn}
        </button>
      </div>

      {/* Agents List */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center text-sm text-slate-500">
          {t.noAgents}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold flex flex-col items-center justify-center shrink-0">
                  <span className="text-xl leading-none">
                    {agent.name ? agent.name.charAt(0).toUpperCase() : "A"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1">
                    #{agent.id}
                  </span>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-lg text-emerald-700 truncate">
                      {agent.name}
                    </h2>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      ✓ {t.verifiedAgent}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {agent.listingsCount} {t.listingsCount}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600">
                    <span className="font-semibold text-slate-500">
                      📍 {t.townshipsLabel}:{" "}
                    </span>
                    <span className="font-medium text-slate-800">
                      {agent.townships.length > 0
                        ? agent.townships.join("၊ ")
                        : lang === "en"
                          ? "Yangon"
                          : "ရန်ကုန်"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleViewAgentListings(agent)}
                  className="w-full md:w-auto py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                >
                  {t.viewListings} →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AgentsPage;
