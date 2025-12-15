-- SCHEMA MIGRATION SCRIPT: harunta -> dbo
-- Bu script, 'harunta' şemasındaki tüm tabloları, view'ları ve stored procedure'leri 'dbo' şemasına taşır.
-- Çalıştırmadan önce veritabanı yedeği almanız önerilir.
-- Hedef veritabanını seçtiğinizden emin olun (örn: USE [gokcepansiyon2010])

DECLARE @sql NVARCHAR(MAX) = N'';

-- 1. TABLOLARI TAŞI
SELECT @sql += N'IF OBJECT_ID(''dbo.' + t.name + ''', ''U'') IS NULL ' +
               N'ALTER SCHEMA dbo TRANSFER ' + s.name + N'.' + t.name + N';' + CHAR(13)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = 'harunta';

-- 2. VIEW'LARI TAŞI
SELECT @sql += N'IF OBJECT_ID(''dbo.' + v.name + ''', ''V'') IS NULL ' +
               N'ALTER SCHEMA dbo TRANSFER ' + s.name + N'.' + v.name + N';' + CHAR(13)
FROM sys.views v
JOIN sys.schemas s ON v.schema_id = s.schema_id
WHERE s.name = 'harunta';

-- 3. STORED PROCEDURE'LERİ TAŞI
SELECT @sql += N'IF OBJECT_ID(''dbo.' + p.name + ''', ''P'') IS NULL ' +
               N'ALTER SCHEMA dbo TRANSFER ' + s.name + N'.' + p.name + N';' + CHAR(13)
FROM sys.procedures p
JOIN sys.schemas s ON p.schema_id = s.schema_id
WHERE s.name = 'harunta';

-- 4. FUNCTION'LARI TAŞI (Varsa)
SELECT @sql += N'IF OBJECT_ID(''dbo.' + o.name + ''', ''FN'') IS NULL ' +
               N'ALTER SCHEMA dbo TRANSFER ' + s.name + N'.' + o.name + N';' + CHAR(13)
FROM sys.objects o
JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE s.name = 'harunta' AND o.type IN ('FN', 'IF', 'TF');

-- Scripti çalıştır
IF LEN(@sql) > 0
BEGIN
    PRINT 'Nesneler taşınıyor...';
    EXEC sp_executesql @sql;
    PRINT 'Taşıma işlemi tamamlandı.';
END
ELSE
BEGIN
    PRINT 'Harunta şemasında taşınacak nesne bulunamadı.';
END
