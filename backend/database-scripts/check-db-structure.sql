-- DIAGNOSTIC SCRIPT: Check Table Locations
-- Bu script, veritabanındaki tüm tabloların hangi şemada olduğunu listeler.
-- Uygulamanın "Invalid object name" hatasının nedenini bulmak için kullanılır.

PRINT '--- DATABASE INFO ---';
SELECT 
    @@SERVERNAME AS ServerName,
    DB_NAME() AS CurrentDatabase,
    CURRENT_USER AS CurrentUser,
    SCHEMA_NAME() AS DefaultSchema;
GO

PRINT '--- SEARCHING FOR tblSistemAyar ---';
SELECT 
    s.name AS SchemaName,
    t.name AS TableName,
    t.create_date,
    t.modify_date
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE t.name = 'tblSistemAyar';
GO

PRINT '--- ALL TABLES SUMMARY ---';
SELECT 
    s.name AS SchemaName,
    COUNT(*) as TableCount
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
GROUP BY s.name;
GO

PRINT '--- TOP 50 TABLES ---';
SELECT TOP 50
    s.name AS SchemaName,
    t.name AS TableName
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
ORDER BY s.name, t.name;
GO
