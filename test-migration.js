// Test script to verify if useful_life column exists in Supabase
// Run this with: node test-migration.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = join(__dirname, '.env');
let supabaseUrl, supabaseKey;

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.error('❌ Error reading .env file:', err.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env file');
  console.log('Please make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigration() {
  console.log('🔍 Testing if useful_life column exists...\n');
  
  try {
    // Try to select with useful_life column
    const { data, error } = await supabase
      .from('assets')
      .select('id, useful_life')
      .limit(1);
    
    if (error) {
      if (error.message.includes('useful_life')) {
        console.log('❌ MIGRATION NOT RUN YET!');
        console.log('');
        console.log('The useful_life column does not exist in your database.');
        console.log('');
        console.log('📋 TO FIX THIS:');
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Open your project');
        console.log('3. Click "SQL Editor" on the left');
        console.log('4. Click "+ New Query"');
        console.log('5. Paste this SQL:');
        console.log('');
        console.log('   ALTER TABLE public.assets');
        console.log('   ADD COLUMN IF NOT EXISTS useful_life INTEGER DEFAULT 5;');
        console.log('');
        console.log('6. Click "RUN"');
        console.log('');
        return false;
      }
      throw error;
    }
    
    console.log('✅ SUCCESS! Migration has been run!');
    console.log('');
    console.log('The useful_life column exists in your database.');
    console.log('Your app will now save and load useful life values correctly.');
    console.log('');
    if (data && data.length > 0) {
      console.log('Sample data:', data[0]);
    }
    return true;
    
  } catch (err) {
    console.error('❌ Error testing migration:', err.message);
    return false;
  }
}

testMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
