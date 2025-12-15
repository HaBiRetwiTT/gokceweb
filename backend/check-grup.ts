
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
    
    // Check islemGrup for Kredi Kartları
    const kartGrups = await dataSource.query(`
      SELECT islemGrup, COUNT(*) as count
      FROM dbo.tblislem 
      WHERE islemArac = 'Kredi Kartları'
      GROUP BY islemGrup
    `);
    console.log('Kart Grups:', kartGrups);

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();