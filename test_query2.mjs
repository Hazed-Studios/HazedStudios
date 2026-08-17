import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fdatiuxtxptlxgnuqcqa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYXRpdXh0eHB0bHhnbnVxY3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Mjg4MTUsImV4cCI6MjEwMTAwNDgxNX0.kJVpx7zYH_eenh3fVIa2NT7SGKD6v0EfLZt_FZ0_p74';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error with products:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
