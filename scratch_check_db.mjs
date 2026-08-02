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
  console.log('Fetching products...');
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  if (pErr) console.error('Products Error:', pErr);
  console.log('Products:', products);

  console.log('Fetching stock...');
  const { data: stock, error: sErr } = await supabase.from('product_stock').select('*');
  if (sErr) console.error('Stock Error:', sErr);
  console.log('Stock:', stock);
}

main();
