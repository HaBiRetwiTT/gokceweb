
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function debugMusteriBakiye() {
  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST || '77.245.151.173',
    port: Number(process.env.DB_PORT) || 1433,
    username: process.env.DB_USERNAME || 'harunta',
    password: process.env.DB_PASSWORD || '%KmM62rcbCx&xu8g',
    database: process.env.DB_DATABASE || 'gokcepansiyon2010',
    options: {
      enableArithAbort: true,
      trustServerCertificate: true,
      encrypt: false,
    },
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    // 1. Find Customer Code from tblIslem
     const islemCheck = await dataSource.query(`
       SELECT DISTINCT islemCrKod FROM tblIslem WHERE islemCrKod LIKE '%1182956'
     `);
     console.log('Found cariKods in Islem:', islemCheck);

     let cariKod = 'MK1182956';
     if (islemCheck.length > 0) {
        cariKod = islemCheck[0].islemCrKod;
     }
     console.log('Using cariKod:', cariKod);

     // 2. Fetch raw rows
      const rawRows = await dataSource.query(`
        SELECT islemTip, islemBilgi, islemTutar, islemCrKod
        FROM tblIslem
        WHERE islemCrKod = '${cariKod}'
      `);
    console.log('Raw Rows:', rawRows);

    // 3. Test CURRENT dashboard.service.ts logic (No Wildcards)
    const currentQuery = `
        SELECT 
          SUM(CASE WHEN LTRIM(RTRIM(UPPER(islemTip))) IN ('GELİR', 'ÇIKAN') THEN islemTutar ELSE 0 END) -
          SUM(CASE WHEN LTRIM(RTRIM(UPPER(islemTip))) IN ('GİDER', 'GİREN') THEN islemTutar ELSE 0 END) as MusteriBakiye
        FROM tblIslem
        WHERE islemCrKod = '${cariKod}'
    `;
    const currentResult = await dataSource.query(currentQuery);
    console.log('Current Logic Result:', currentResult);

    // 4. Test PROPOSED logic (With Wildcards)
    const proposedQuery = `
      SELECT 
        SUM(CASE WHEN LTRIM(RTRIM(UPPER(islemTip))) LIKE 'GEL%R' OR LTRIM(RTRIM(UPPER(islemTip))) = 'ÇIKAN' THEN islemTutar ELSE 0 END) -
        SUM(CASE WHEN LTRIM(RTRIM(UPPER(islemTip))) LIKE 'G%DER' OR LTRIM(RTRIM(UPPER(islemTip))) LIKE 'G%REN' THEN islemTutar ELSE 0 END) as MusteriBakiye
      FROM tblIslem
      WHERE islemCrKod = '${cariKod}'
    `;
    const proposedResult = await dataSource.query(proposedQuery);
    console.log('Proposed Logic Result:', proposedResult);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

debugMusteriBakiye();
