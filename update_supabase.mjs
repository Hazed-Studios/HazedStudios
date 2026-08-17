import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fdatiuxtxptlxgnuqcqa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYXRpdXh0eHB0bHhnbnVxY3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Mjg4MTUsImV4cCI6MjEwMTAwNDgxNX0.kJVpx7zYH_eenh3fVIa2NT7SGKD6v0EfLZt_FZ0_p74';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  console.log('Found products:', products.map(p => ({ id: p.id, name: p.name })));

  for (const product of products) {
    if (product.name.includes('Natural Linen')) {
      const visual = 'images/IMG_9233.JPG';
      const gallery = [
        'images/IMG_9233.JPG',
        'images/IMG_9236.JPG',
        'images/IMG_9238.JPG',
        'images/IMG_9239.JPG'
      ];
      console.log(`Updating ${product.name} (ID: ${product.id}) with new images...`);
      const { error: updateError } = await supabase
        .from('products')
        .update({ visual, gallery })
        .eq('id', product.id);
      
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log(`Updated ${product.name} successfully.`);
      }
    } else if (product.name.includes('Baby Blue')) {
      const visual = 'images/IMG_9252.JPG';
      const gallery = [
        'images/IMG_9252.JPG',
        'images/IMG_9247.JPG',
        'images/IMG_9248.JPG',
        'images/IMG_9251.JPG'
      ];
      console.log(`Updating ${product.name} (ID: ${product.id}) with new images...`);
      const { error: updateError } = await supabase
        .from('products')
        .update({ visual, gallery })
        .eq('id', product.id);
      
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log(`Updated ${product.name} successfully.`);
      }
    }
  }
}

main();
