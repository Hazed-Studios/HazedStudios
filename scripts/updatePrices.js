import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fdatiuxtxptlxgnuqcqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYXRpdXh0eHB0bHhnbnVxY3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Mjg4MTUsImV4cCI6MjEwMTAwNDgxNX0.kJVpx7zYH_eenh3fVIa2NT7SGKD6v0EfLZt_FZ0_p74';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePrices() {
  console.log('Updating prices in Supabase to 700 (sale from 1200)...');
  const { data, error } = await supabase
    .from('products')
    .update({ price: 700, old_price: 1200 })
    .eq('name', 'Polo Linen Shirt — Natural Linen')
    .select();

  if (error) {
    console.error('Error updating Natural Linen:', error.message);
  } else {
    console.log('Updated Natural Linen:', data);
  }

  const { data2, error2 } = await supabase
    .from('products')
    .update({ price: 700, old_price: 1200 })
    .eq('name', 'Polo Linen Shirt — Baby Blue')
    .select();

  if (error2) {
    console.error('Error updating Baby Blue:', error2.message);
  } else {
    console.log('Updated Baby Blue:', data2);
  }

  // Also catch all rows
  const { data: allData, error: allError } = await supabase
    .from('products')
    .update({ price: 700, old_price: 1200 })
    .neq('id', 0)
    .select();
    
  if (allError) {
    console.error('Error updating all:', allError.message);
  } else {
    console.log('Updated all products to 700:', allData);
  }
}

updatePrices();
