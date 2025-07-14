# 🏨 Gökçe Web Backend API

## ⚠️ CRITICAL DATABASE RULES

### **🔒 RULE #1: SQL DATABASE ARCHITECTURE IS IMMUTABLE**

The backend connects to the **`gokcepansiyon2010`** SQL Server database which is **ACTIVELY RUNNING IN PRODUCTION**. 

**STRICT DEVELOPMENT RULES:**
- ❌ **NEVER** modify any SQL object names (tables, views, stored procedures, functions)
- ❌ **NEVER** change column names, data types, or table structures
- ❌ **NEVER** alter stored procedure parameters or logic
- ❌ **NEVER** modify schema names or database object definitions
- ✅ **ALWAYS** use the exact database structure as provided
- ✅ **ALWAYS** adapt backend code to work with existing SQL schema
- ✅ **ALWAYS** maintain production database compatibility

### **🚨 RULE #2: TRANSACTION SAFETY IS MANDATORY**

**CRITICAL DATA INTEGRITY REQUIREMENT**

All controller endpoints that perform multiple database operations **MUST** use the `DatabaseTransactionService` to ensure atomicity and prevent data corruption.

**TRANSACTION SAFETY RULES:**
- ❌ **NEVER** execute multiple database operations sequentially without transactions
- ❌ **NEVER** mix Stored Procedures + ORM + Direct queries without transaction wrapper
- ❌ **NEVER** ignore the risk of partial operation completion from network failures
- ✅ **ALWAYS** use `DatabaseTransactionService.executeInTransaction()` for multi-step operations
- ✅ **ALWAYS** implement both transaction-safe and backward-compatible service methods
- ✅ **ALWAYS** ensure atomicity: ALL operations succeed or ALL operations fail

**IMPLEMENTATION PATTERN:**
```typescript
// Controller Implementation
@Post('musteri-islem')
async createMusteriIslem(@Body() musteriData: any) {
  try {
    const result = await this.transactionService.executeInTransaction(async (queryRunner) => {
      // All operations must succeed or all will be rolled back
      const musteriResult = await this.musteriService.createMusteriIslemWithTransaction(queryRunner, musteriData);
      await this.musteriService.kaydetKonaklamaWithTransaction(queryRunner, konaklamaData, musteriResult.musteriNo);
      await this.musteriService.kaydetIslemWithTransaction(queryRunner, islemData, musteriResult.musteriNo);
      return musteriResult;
    });
    
    return { success: true, message: '✅ Tüm işlemler güvenli şekilde kaydedildi', data: result };
  } catch (error) {
    return { success: false, message: '❌ Güvenlik nedeniyle hiçbir değişiklik kaydedilmedi', error: error.message };
  }
}
```

**PROTECTED ENDPOINTS:**
- 🔒 `/musteri-islem` - Customer Registration (5 tables: tblMusteri + tblCari + tblKonaklama + tblOdaYatak + tblislem)
- 🔒 `/donem-yenileme` - Period Renewal (4 operations: sonlandır + yeni konaklama + oda değişimi + işlem kaydı)
- 🔒 `/cikis-yap` - Customer Checkout (3-4 operations: konaklama sonlandır + oda boşalt + müşteri durumu)
- 🔒 `/direkt-oda-degisikligi` - Room Changes (3 operations: konaklama güncelle + oda durumları + işlem kaydı)

**WHY TRANSACTION SAFETY IS CRITICAL:**
Network failures, server crashes, or system interruptions during multi-step operations can leave the database in an inconsistent state where some operations complete while others don't. This causes:
- 💰 Revenue loss (customers without accommodation records)
- 🏠 Room assignment conflicts (rooms marked as both occupied and empty)
- 💳 Financial discrepancies (charges without corresponding services)
- 📊 Broken business logic and reporting accuracy

**⚡ REMEMBER: Data integrity failures can destroy business operations! Transaction safety is non-negotiable!**

---

## 📋 Project Description

NestJS-based backend API for **Gökçe Pension Management System** - a comprehensive hotel/pension management solution with customer registration, room management, and pricing calculations.

### 🎯 Key Features
- **Customer Management** (Bireysel/Kurumsal)
- **Room & Bed Management** with availability tracking
- **Intelligent Pricing System** with duration-based calculations  
- **Corporate Account Management** with automated data handling
- **Hybrid Database Approach** (Stored Procedures + ORM)
- **Multi-Environment Schema Support** (Local `dbo` / Production `harunta`)

### 🏗️ Architecture Overview
- **Framework**: NestJS with TypeScript
- **Database**: SQL Server with TypeORM
- **Architecture**: Hybrid approach combining Stored Procedures and ORM
- **Schema Management**: Dynamic environment-based configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- SQL Server database
- Environment variables configured

### Installation

```bash
$ npm install
```

### Environment Configuration

Create environment variables for schema management:

**Development (.env):**
```bash
NODE_ENV=development
DB_TABLE_SCHEMA=dbo
DB_SP_SCHEMA=dbo
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=your_database
```

**Production:**
```bash
NODE_ENV=production
DB_TABLE_SCHEMA=harunta
DB_SP_SCHEMA=dbo
DB_HOST=production_host
DB_PORT=1433
DB_USERNAME=prod_username
DB_PASSWORD=prod_password
DB_DATABASE=prod_database
```

### Run the application

```bash
# development
$ npm run start

# watch mode (recommended for development)
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 🏗️ Hybrid Database Architecture

This project implements a **hybrid approach** combining the best of both worlds:

### 🔧 Stored Procedures (Critical Operations)

Used for complex business logic and critical operations:

```typescript
// Customer registration with business rules
async createMusteri(data: CreateMusteriDto) {
  const storedProcedures = this.dbConfig.getStoredProcedures();
  return await this.repository.query(
    `EXEC ${storedProcedures.musteriEkle}`, 
    parameters
  );
}

// Automatic cari account creation
async createCariRecord(musteriData: CreateMusteriDto, mstrNo: number) {
  return await this.repository.query(
    `EXEC ${storedProcedures.cariEkle}`, 
    parameters
  );
}
```

**When to use Stored Procedures:**
- ✅ Customer registration & cari account creation
- ✅ Complex business logic operations
- ✅ Multi-table transactions
- ✅ Operations shared with desktop application
- ✅ Performance-critical operations

### 🎯 TypeORM (Simple Operations)

Used for straightforward CRUD operations:

```typescript
// Simple queries
async findByTC(tcNo: string) {
  return await this.musteriRepository.findOne({ 
    where: { MstrTCN: tcNo } 
  });
}

// List operations with pagination
async getMusteriList(page: number, limit: number) {
  return await this.musteriRepository.find({
    skip: (page - 1) * limit,
    take: limit,
    order: { MstrNo: 'DESC' }
  });
}
```

**When to use TypeORM:**
- ✅ Simple CRUD operations
- ✅ List and pagination queries
- ✅ Basic filtering
- ✅ Operations specific to web application

### 🔍 Query Builder (Dynamic Operations)

Used for dynamic search and filtering:

```typescript
// Dynamic search functionality
async searchMusteri(searchTerm: string) {
  return await this.musteriRepository
    .createQueryBuilder('musteri')
    .where('musteri.MstrAdi LIKE :term OR musteri.MstrTCN LIKE :term', 
           { term: `%${searchTerm}%` })
    .orderBy('musteri.MstrNo', 'DESC')
    .getMany();
}

// Advanced filtering
async findMusteriWithFilters(filters: MusteriFilters) {
  const qb = this.musteriRepository.createQueryBuilder('m');
  
  if (filters.name) {
    qb.andWhere('m.MstrAdi LIKE :name', { name: `%${filters.name}%` });
  }
  
  if (filters.hspTip) {
    qb.andWhere('m.MstrHspTip = :hspTip', { hspTip: filters.hspTip });
  }
  
  return qb.getMany();
}
```

**When to use Query Builder:**
- ✅ Dynamic search functionality
- ✅ Advanced filtering with multiple criteria
- ✅ Complex JOIN operations
- ✅ Conditional query building

## 🌍 Multi-Environment Schema Management

This application supports **automatic schema resolution** for different environments:

### Development Environment
- **Tables**: `dbo.tblMusteri`, `dbo.tblOdaYatak`, etc.
- **Stored Procedures**: `dbo.spr_MusteriEkle`, `dbo.spr_CariEkle`

### Production Environment  
- **Tables**: `harunta.tblMusteri`, `harunta.tblOdaYatak`, etc.
- **Stored Procedures**: `dbo.spr_MusteriEkle`, `dbo.spr_CariEkle` (same schema)

### How it works

The `DatabaseConfigService` automatically resolves schema names based on environment variables:

```typescript
// DatabaseConfigService automatically determines:
const tables = this.dbConfig.getTables();
const storedProcedures = this.dbConfig.getStoredProcedures();

// Development: [dbo].[tblMusteri]
// Production:  [harunta].[tblMusteri]
const query = `SELECT * FROM ${tables.musteri} WHERE MstrTCN = @0`;
```

**Console Output on Startup:**
```
Database Schema Configuration: Tables=dbo, StoredProcedures=dbo        # Development
Database Schema Configuration: Tables=harunta, StoredProcedures=dbo    # Production
```

## 🚀 API Endpoints

### Customer Management
```
POST /musteri-ekle          # Register new customer (SP)
GET  /firma-listesi         # Get company list (ORM)
GET  /firma-detay/:name     # Get company details (ORM)  
POST /firma-guncelle        # Update company info (Raw SQL)
```

### Room & Accommodation
```
GET  /oda-tipleri           # Get room types (ORM)
GET  /bos-odalar/:odaTipi   # Get available rooms (ORM)
GET  /oda-tip-fiyatlari/:odaTipi  # Get room pricing (Raw SQL)
```

### Example API Usage

**Customer Registration:**
```json
POST /musteri-ekle
{
  "MstrAdi": "Ahmet Yılmaz",
  "MstrHspTip": "Bireysel",
  "MstrTCN": "12345678901",
  "MstrTelNo": "5551234567",
  "OdaTipi": "Tek Kişilik Camlı+TV",
  "KonaklamaSuresi": 7,
  "ToplamBedel": 4500
}
```

**Room Pricing Response:**
```json
GET /oda-tip-fiyatlari/Tek%20Kişilik%20Camlı+TV
{
  "OdTipNo": "10003",
  "OdTipAdi": "Tek Kişilik Camlı+TV",
  "OdLfytGun": "750",
  "OdLfytHft": "4500", 
  "OdLfytAyl": "11000",
  "OdDpzt": "200"
}
```

## 🔧 Development Guidelines

### Adding New Features

#### For Critical Operations (Use Stored Procedures):
1. Create/use existing stored procedure in database
2. Add to `DatabaseConfigService.getStoredProcedures()`
3. Implement in service using `repository.query()`

```typescript
async newCriticalOperation(data: SomeDto) {
  const sp = this.dbConfig.getStoredProcedures();
  return await this.repository.query(
    `EXEC ${sp.newOperation}`, 
    parameters
  );
}
```

#### For Simple Operations (Use TypeORM):
1. Use existing entity repositories
2. Implement using repository methods

```typescript
async getSimpleList() {
  return await this.repository.find({
    order: { id: 'DESC' },
    take: 10
  });
}
```

#### For Dynamic Operations (Use Query Builder):
1. Build dynamic queries based on conditions
2. Use TypeORM QueryBuilder

```typescript
async advancedSearch(criteria: SearchCriteria) {
  const qb = this.repository.createQueryBuilder('entity');
  
  if (criteria.name) {
    qb.andWhere('entity.name LIKE :name', { name: `%${criteria.name}%` });
  }
  
  return qb.getMany();
}
```

## 📦 Deployment

### Production Deployment Steps

1. **Set Environment Variables:**
```bash
set DB_TABLE_SCHEMA=harunta
set DB_SP_SCHEMA=dbo
set NODE_ENV=production
```

2. **Build and Deploy:**
```bash
npm run build
npm run start:prod
```

3. **Verify Schema Configuration:**
Check console logs for:
```
Database Schema Configuration: Tables=harunta, StoredProcedures=dbo
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_TABLE_SCHEMA=harunta
      - DB_SP_SCHEMA=dbo
      - DB_HOST=your_sql_server
      - DB_USERNAME=your_username
      - DB_PASSWORD=your_password
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── database/
│   │   └── database-config.service.ts    # Schema management
│   ├── entities/
│   │   ├── musteri.entity.ts            # Customer entity
│   │   ├── cari.entity.ts               # Account entity
│   │   └── oda-yatak.entity.ts          # Room & bed entity
│   ├── dto/
│   │   └── create-musteri.dto.ts        # Customer registration DTO
│   ├── musteri/
│   │   ├── musteri.controller.ts        # API endpoints
│   │   ├── musteri.service.ts           # Business logic (Hybrid)
│   │   └── musteri.module.ts            # Module configuration
│   └── main.ts                          # Application entry point
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── migrations/                      # Database migrations
└── SCHEMA_MIGRATION_GUIDE.md           # Schema configuration guide
```

## 🔗 Related Documentation

- **Schema Migration Guide**: See `SCHEMA_MIGRATION_GUIDE.md` for detailed schema configuration
- **Frontend Integration**: Check `../frontend/README.md` for Vue.js frontend setup
- **Database Entities**: Review entity files in `src/entities/` for data model
- **API Testing**: Use tools like Postman with endpoints documented above

## 📝 Best Practices

### Database Operations
1. **Use Stored Procedures** for complex business logic and operations shared with desktop app
2. **Use TypeORM** for simple CRUD operations and web-specific features
3. **Use Query Builder** for dynamic search and filtering requirements
4. **Always validate** input data using DTOs and validation pipes

### Environment Management
1. **Set correct schema variables** for each environment
2. **Verify schema configuration** in console logs on startup
3. **Test database operations** after environment changes
4. **Use environment-specific** configuration files

### Code Organization
1. **Keep business logic** in service files
2. **Use controllers** only for request/response handling
3. **Implement proper error handling** with try-catch blocks
4. **Add logging** for debugging and monitoring

## 🐛 Troubleshooting

### Common Issues

**Schema Resolution Problems:**
```
Invalid object name 'dbo.tblMusteri'
```
**Solution:** Check `DB_TABLE_SCHEMA` environment variable

**Stored Procedure Errors:**
```
Could not find stored procedure 'dbo.spr_MusteriEkle'
```
**Solution:** Verify stored procedures exist in database and check `DB_SP_SCHEMA`

**Connection Issues:**
```
Login failed for user
```
**Solution:** Verify database credentials in environment variables

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## 📞 Support & Resources

- **NestJS Documentation**: [https://docs.nestjs.com](https://docs.nestjs.com)
- **TypeORM Documentation**: [https://typeorm.io](https://typeorm.io)
- **SQL Server Documentation**: [Microsoft SQL Server Docs](https://docs.microsoft.com/en-us/sql/)

## 📄 License

This project is licensed under the MIT License.
