const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('Reading SQL migration file...')
    const sqlPath = path.join(__dirname, '..', 'supabase', 'schema-no-auth.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Running migration on Supabase...')
    console.log('Note: You need to run this SQL directly in the Supabase SQL Editor')
    console.log('\n=== SQL TO RUN ===\n')
    console.log(sql)
    console.log('\n=== END SQL ===\n')
    console.log('Instructions:')
    console.log('1. Go to https://supabase.com/dashboard/project/_/sql')
    console.log('2. Copy the SQL above')
    console.log('3. Paste it into the SQL Editor')
    console.log('4. Click "Run"')
    console.log('\nThis will recreate all tables without authentication requirements.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runMigration()
