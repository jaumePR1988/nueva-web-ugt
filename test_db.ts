
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load env vars
// We need to resolve the path to .env, assuming we run this with tsx or similar from project root
const envPath = '.env';
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTable(tableName: string) {
    console.log(`Testing table: ${tableName}...`);
    try {
        const { data, error, status, statusText } = await supabase.from(tableName).select('*').limit(1);
        if (error) {
            console.error(`[FAIL] ${tableName}: ${status} ${statusText} - ${error.message}`);
            console.error(error);
        } else {
            console.log(`[OK] ${tableName}: Status ${status}`);
        }
    } catch (e) {
        console.error(`[EXCEPTION] ${tableName}:`, e);
    }
}

async function run() {
    console.log('Starting diagnostics...');
    await testTable('newsletter_subscribers');
    await testTable('newsletter_content');
    await testTable('newsletter_editions');
    await testTable('newsletter_config');
    console.log('Diagnostics finished.');
}

run();
