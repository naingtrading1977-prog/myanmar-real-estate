const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

// File Buffer မှတစ်ဆင့် Supabase Storage Bucket သို့ တိုက်ရိုက် Upload တင်ပေးမည့် Helper
const uploadToSupabase = async (fileBuffer, fileName, mimeType) => {
  const uniqueName = `${Date.now()}_${fileName}`;

  const { data, error } = await supabase.storage
    .from("real-estate-media")
    .upload(uniqueName, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  // File Upload အဆင်ပြေပါက Public URL ရယူခြင်း
  const { data: publicUrlData } = supabase.storage
    .from("real-estate-media")
    .getPublicUrl(uniqueName);

  return publicUrlData.publicUrl;
};

module.exports = { supabase, uploadToSupabase };
