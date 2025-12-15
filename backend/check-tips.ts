
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'mssql',
  host: '77.245.151.173',
  port: 1433,
  username: 'harunta',
  password: '%KmM62rcbCx&xu8g',
  database: 'gokcepansiyon2010',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});

async function run() {
  try {
    await dataSource.initialize();
    console.log('Connected!');
    
    // Check islemTip for Kredi Kartları
    const kartTips = await dataSource.query(`
      SELECT islemTip, COUNT(*) as count
      FROM dbo.tblislem 
      WHERE islemArac LIKE 'Kredi%'
      GROUP BY islemTip
    `);
    console.log('Kart Tips:', kartTips);
    
    // Check islemTip for Depozito related records
    const depozitoTips = await dataSource.query(`
      SELECT islemTip, COUNT(*) as count
      FROM dbo.tblislem 
      WHERE islemBilgi LIKE '%DEPOZİTO%'
      GROUP BY islemTip
    `);
    console.log('Depozito Tips:', depozitoTips);

    // Check actual Depozito strings again to be sure about the filter
    const depozitoStrings = await dataSource.query(`
      SELECT TOP 20 islemBilgi
      FROM dbo.tblislem 
      WHERE islemBilgi LIKE '%DEPOZİTO%'
    `);
    console.log('Depozito Strings:', depozitoStrings.map(r => r.islemBilgi));

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
