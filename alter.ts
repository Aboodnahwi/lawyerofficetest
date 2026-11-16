import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://gvafdhyudvdymletqjee.supabase.co";
const supabaseAnonKey =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2YWZkaHl1ZHZkeW1sZXRxamVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMDQ3NiwiZXhwIjoyMDc3NTA2NDc2fQ.y_D64FZILeOCFwAbZZaN0TqFVcpD3VSE9nJWPt_ypCc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql_statement: "ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS audio_note TEXT;" });
  console.log(error || data);
}
run();
