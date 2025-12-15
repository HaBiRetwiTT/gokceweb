
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
    
    // Check exact islemArac strings
    const aracTypes = await dataSource.query(`
      SELECT islemArac, COUNT(*) as count
      FROM dbo.tblislem 
      WHERE islemArac LIKE '%Kredi%' OR islemArac LIKE '%Kart%'
      GROUP BY islemArac
    `);
    console.log('Arac Types:', aracTypes);

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();