const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const dotenv = require('dotenv');

// Load production environment variables
const envPath = path.join(__dirname, '../.env.production');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.error('.env.production file not found!');
  process.exit(1);
}

// Check required variables
const config = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
  }
};

if (!config.user || !config.password || !config.server || !config.database) {
  console.error('Missing database configuration in .env.production');
  console.error('Required: DB_USERNAME, DB_PASSWORD, DB_HOST, DB_DATABASE');
  process.exit(1);
}

async function runScript() {
  let pool = null;
  try {
    console.log(`Connecting to database ${config.database} on ${config.server}...`);
    pool = await sql.connect(config);
    console.log('Connected successfully.');

    const scriptPath = path.join(__dirname, '../database-scripts/create-ip-restriction-tables.sql');
    if (!fs.existsSync(scriptPath)) {
      console.error(`Script file not found: ${scriptPath}`);
      process.exit(1);
    }

    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Split script by 'GO' command (case insensitive, on its own line)
    // Regex explanation:
    // ^\s*GO\s*$ -> Matches lines containing only "GO" (with optional whitespace)
    // m -> Multiline mode
    // i -> Case insensitive
    const batches = scriptContent.split(/^\s*GO\s*$/mi);

    console.log(`Found ${batches.length} batches to execute.`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        console.log(`Executing batch ${i + 1}/${batches.length}...`);
        try {
          await pool.request().query(batch);
          console.log(`Batch ${i + 1} executed successfully.`);
        } catch (err) {
          console.error(`Error executing batch ${i + 1}:`, err.message);
          // Optional: decide whether to stop or continue. Usually DDL scripts should stop on error.
          // But "IF NOT EXISTS" logic might be inside, so errors like "Table exists" shouldn't happen if script is well-written.
          // However, syntax errors should stop it.
          throw err;
        }
      }
    }

    console.log('Database initialization completed successfully.');

  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runScript();
