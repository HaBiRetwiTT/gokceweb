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
        console.log('Connecting...');
        await sql.connect(config);

        const result = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLLATION_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tblPersonel' AND COLUMN_NAME = 'PrsnDurum'
        `;
        console.table(result.recordset);
        
        // Check actual length of values
        const lenResult = await sql.query`
            SELECT TOP 5 PrsnDurum, LEN(PrsnDurum) as Length, DATALENGTH(PrsnDurum) as ByteLength 
            FROM dbo.tblPersonel 
            WHERE PrsnDurum LIKE '%ALI%'
        `;
        console.table(lenResult.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

run();
