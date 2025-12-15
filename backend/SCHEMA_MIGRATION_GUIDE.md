# Database Schema Migration Guide

## 🔧 Problem Statement

**Lokal Geliştirme Ortamı:**
- Tablolar: `dbo.tblMusteri`, `dbo.tblOdaYatak`, vb.
- Stored Procedures: `dbo.spr_MusteriEkle`, `dbo.spr_CariEkle`, vb.

**Production Ortamı:**
- Tablolar: `harunta.tblMusteri`, `harunta.tblOdaYatak`, vb.
- Stored Procedures: `dbo.spr_MusteriEkle`, `dbo.spr_CariEkle`, vb.

## ✅ Çözüm: Dynamic Schema Configuration

### 1. Environment Variables

Aşağıdaki environment variables'ları tanımlayın:

**Lokal (.env.development):**
```bash
NODE_ENV=development
DB_TABLE_SCHEMA=dbo
DB_SP_SCHEMA=dbo
```

**Production (.env.production):**
```bash
NODE_ENV=production
DB_TABLE_SCHEMA=harunta
DB_SP_SCHEMA=dbo
```

### 2. Backend Configuration

`DatabaseConfigService` otomatik olarak environment'a göre schema'ları belirler:

```typescript
// Kullanım örnekleri:
const tables = this.dbConfig.getTables();
const storedProcedures = this.dbConfig.getStoredProcedures();

// Dinamik sorgu oluşturma:
const query = `SELECT * FROM ${tables.musteri} WHERE MstrTCN = @0`;
const spQuery = `EXEC ${storedProcedures.musteriEkle} @param1 = @0`;
```

### 3. Deployment Instructions

#### Development Environment:
```bash
# Set environment variables
set DB_TABLE_SCHEMA=dbo
set DB_SP_SCHEMA=dbo
set NODE_ENV=development

# Start application
npm run start:dev
```

#### Production Environment:
```bash
# Set environment variables
set DB_TABLE_SCHEMA=harunta
set DB_SP_SCHEMA=dbo
set NODE_ENV=production

# Start application
npm run start:prod
```

### 4. Docker Deployment

#### docker-compose.yml:
```yaml
version: '3.8'
services:
  backend:
    build: .
    environment:
      - NODE_ENV=production
      - DB_TABLE_SCHEMA=harunta
      - DB_SP_SCHEMA=dbo
      - DB_HOST=your_remote_host
      - DB_PORT=1433
      - DB_USERNAME=production_user
      - DB_PASSWORD=production_password
      - DB_DATABASE=production_database
```

### 5. Automatic Schema Resolution

**Tables resolving:**
- Lokal: `[dbo].[tblMusteri]` 
- Production: `[harunta].[tblMusteri]`

**Stored Procedures resolving:**
- Lokal: `[dbo].[spr_MusteriEkle]`
- Production: `[dbo].[spr_MusteriEkle]` (aynı)

### 6. Verification

Application başladığında console'da schema configuration'ını göreceksiniz:

```
Database Schema Configuration: Tables=harunta, StoredProcedures=dbo
```

## 🚨 Important Notes

1. **Environment Variables Required**: Production'da mutlaka `DB_TABLE_SCHEMA=harunta` set edin
2. **Stored Procedures**: Her iki ortamda da `dbo` schema'sında kalır
3. **Backward Compatibility**: Eski kod çalışmaya devam eder, sadece production'da hata verir
4. **Testing**: Her iki ortamda da test edin

## 🔄 Migration Steps

1. ✅ Backend'de `DatabaseConfigService` implementasyonu yapıldı
2. ✅ Tüm SQL sorgularında dynamic schema kullanımı eklendi  
3. ⚠️ Environment variables'ları production sunucuda set edin
4. ⚠️ Application'ı yeniden başlatın
5. ⚠️ Schema çözümlemesini loglardan kontrol edin

## 📝 Todo for Production Deployment

- [ ] Production server'da `DB_TABLE_SCHEMA=dbo` environment variable set et
- [ ] Production server'da `DB_SP_SCHEMA=dbo` environment variable set et  
- [ ] Application restart yap
- [ ] Console loglarından schema configuration'ını verify et
- [ ] Tüm CRUD operasyonlarını test et 