import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

// Parse URL to get hostname
const urlObj = new URL(url);
const hostname = urlObj.hostname;
const protocol = url.startsWith('https') ? 'https' : 'http';

console.log(`📍 Executing migration on: ${url}`);

// Read migration file and parse individual statements
const migrationSQL = fs.readFileSync('./supabase-migration.sql', 'utf8');
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`📝 Found ${statements.length} SQL statements`);

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          // Might not be JSON, but that's ok for DDL statements
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(body);
          }
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('🚀 Starting migration...\n');
    
    let succeeded = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      process.stdout.write(`   [${i + 1}/${statements.length}] ${stmt.substring(0, 45)}... `);
      
      try {
        await executeSQL(stmt);
        console.log('✅');
        succeeded++;
      } catch (err) {
        console.log(`⚠️  (${err.message.substring(0, 30)})`);
        // Continue anyway - some errors might be benign
      }
    }
    
    console.log(`\n✅ Migration attempts complete (${succeeded}/${statements.length} succeeded)`);
    console.log('\n⏳ Verifying database connection...');
    
    // Use the original Supabase client to verify
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);
    
    const { data, error } = await supabase.from('users').select('count');
    if (error) {
      console.error(`❌ Verification failed: ${error.message}`);
      process.exit(1);
    }
    
    console.log('✅ Database verified - users table exists!');
    console.log('✅ Ready to restart server - run: npm run dev');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
})();
