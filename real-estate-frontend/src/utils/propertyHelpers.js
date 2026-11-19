// src/utils/propertyHelpers.js

// မြန်မာဂဏန်းများကို အင်္ဂလိပ်ဂဏန်းသို့ ပြောင်းပေးသည့် Helper
export const normalizeMyanmarDigits = (str = "") => {
  const map = {
    "၀": "0",
    "၁": "1",
    "၂": "2",
    "၃": "3",
    "၄": "4",
    "၅": "5",
    "၆": "6",
    "၇": "7",
    "၈": "8",
    "၉": "9",
  };
  return String(str).replace(/[၀-၉]/g, (ch) => map[ch] ?? ch);
};

// "12 x 55", "12.5 x 55", "ပေ ၂၅ × ၆၀" စသည်တို့မှ sqft နှင့် label တွက်ထုတ်ခြင်း
export const calculateAreaFromInput = (rawInput = "") => {
  const normalized = normalizeMyanmarDigits(String(rawInput)).trim();
  if (!normalized) {
    return { areaSqft: "", dimensionsLabel: "" };
  }

  // ရှိပြီးသား "(660 sq.ft)" စာသား ပါနေရင် ရှေ့ပိုင်းအကျယ်ကို ပြန်ယူခြင်း
  const baseInput = normalized
    .replace(/\s*\([^)]*sq\.?ft[^)]*\)\s*$/i, "")
    .trim();

  // ဂဏန်းနှစ်လုံး (width x height) ပါမပါ စစ်ဆေးခြင်း
  const match = baseInput.match(
    /(\d+(?:\.\d+)?)\s*(?:x|×|\*|by)\s*(\d+(?:\.\d+)?)/i,
  );

  if (match) {
    const w = parseFloat(match[1]);
    const h = parseFloat(match[2]);
    if (!Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0) {
      const sqft = Number((w * h).toFixed(2));
      const cleanLabel = baseInput.toLowerCase().includes("ပေ")
        ? `${baseInput} (${sqft} sq.ft)`
        : `ပေ ${w} × ${h} (${sqft} sq.ft)`;

      return {
        areaSqft: String(sqft),
        dimensionsLabel: cleanLabel,
      };
    }
  }

  // ဂဏန်းတစ်လုံးတည်း ရိုက်ထားပါက numeric areaSqft အဖြစ် တွက်ခြင်း
  const singleNum = parseFloat(baseInput.replace(/[^\d.]/g, ""));
  if (!Number.isNaN(singleNum) && singleNum > 0) {
    const sqft = Number(singleNum.toFixed(2));
    return {
      areaSqft: String(sqft),
      dimensionsLabel: baseInput.toLowerCase().includes("sq")
        ? baseInput
        : `${sqft} sq.ft`,
    };
  }

  return {
    areaSqft: "",
    dimensionsLabel: baseInput,
  };
};
