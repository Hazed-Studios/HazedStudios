import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('d:/hazedstudios-website/.env', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const i = line.indexOf('=');
  if (i > 0) {
    acc[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const stockRows = [
    { product_id: 100, size: 'S - Baby Blue', quantity: 20 },
    { product_id: 100, size: 'M - Baby Blue', quantity: 20 },
    { product_id: 100, size: 'L - Baby Blue', quantity: 10 },
    { product_id: 100, size: 'S - Natural Linen', quantity: 20 },
    { product_id: 100, size: 'M - Natural Linen', quantity: 20 },
    { product_id: 100, size: 'L - Natural Linen', quantity: 10 },
  ];

  // First delete any existing stock for product_id 100 to avoid duplicates
  await supabase.from('product_stock').delete().eq('product_id', 100);

  const { data, error } = await supabase.from('product_stock').insert(stockRows).select('*');
  if (error) {
    console.error('Error inserting stock:', error);
  } else {
    console.log('Successfully inserted stock:', data);
  }
}

main();
