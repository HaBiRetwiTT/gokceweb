
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

    // Investigate Kredi Kartları
    const kartSamples = await dataSource.query(`
      SELECT DISTINCT islemArac, LEN(islemArac) as len
      FROM dbo.tblislem 
      WHERE islemArac LIKE 'Kredi%'
    `);
    console.log('Kart Samples:', kartSamples);

    // Investigate Depozito Patterns
    const depozitoSamples = await dataSource.query(`
      SELECT TOP 20 islemBilgi
      FROM dbo.tblislem 
      WHERE islemBilgi LIKE '%DEPOZİTO%'
    `);
    console.log('Depozito All Samples:', depozitoSamples.map(r => r.islemBilgi));

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
