import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://btmhluwebgcvytmghtfq.supabase.co', 'sb_publishable_v4A30CSjpwlYk-RZb2yX2g_axVIYXMz');
async function run() {
  const { data, error } = await supabase.from('assets').select('id, image_url, assigned_invoice, warranty').limit(1);
  if (error) {
    console.error("Error fetching:", error);
  } else {
    console.log("Success:", data);
  }
}
run();
