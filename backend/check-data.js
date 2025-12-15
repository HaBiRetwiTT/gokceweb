require('dotenv').config({ path: '.env.production' });
const sql = require('mssql');

const config = {
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true
    }
};

async function run() {
    try {
        console.log('Connecting to database...');
        await sql.connect(config);
        console.log('Connected!');

        // Check PrsnDurum values
        console.log('\n--- Checking PrsnDurum Values ---');
        try {
            const durumResult = await sql.query`SELECT PrsnDurum, COUNT(*) as count FROM dbo.tblPersonel GROUP BY PrsnDurum`;
            console.table(durumResult.recordset);
        } catch (e) {
            console.log('Error querying PrsnDurum:', e.message);
        }

        // Check if there are ANY records with 'ÇALIŞIYOR' (handling case sensitivity/encoding)
        console.log('\n--- Checking for "ÇALIŞIYOR" specifically ---');
        const exactMatch = await sql.query`SELECT COUNT(*) as count FROM dbo.tblPersonel WHERE PrsnDurum = 'ÇALIŞIYOR'`;
        console.log(`Exact match 'ÇALIŞIYOR': ${exactMatch.recordset[0].count}`);
        
        const likeMatch = await sql.query`SELECT COUNT(*) as count FROM dbo.tblPersonel WHERE PrsnDurum LIKE '%ALI%'`;
        console.log(`Like match '%ALI%': ${likeMatch.recordset[0].count}`);

    } catch (err) {
        console.error('Connection Error:', err);
    } finally {
        await sql.close();
    }
}

run();
