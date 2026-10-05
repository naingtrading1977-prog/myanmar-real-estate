const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Storage ထဲသို့ write ဖို့ service role key သုံးပါ

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
