merhaba... firmam Gökçe Pansiyon için web tabanlı fullstack bir proje geliştirdim. backend nestJS, frontend Quasar/Vue tabanlı çalışıldı. ms-sql veri tabanı uzun zamandır sizin sunucularınızda barındırılıyor. şu anda proje backend railway, frontend versel üzerinde test ediliyor. sorunsuz bir çalışma ortamı sağlandı. backend ve frontend sevisleri de turhost'a taşımak istiyoruz. konunun 
bu kısmının teknik detaylarına yeterince hakim olmadığımızı da dikkate alarak, bize nasıl yardımcı olabilirsiniz?

.\.prod.bat
.\.dev.bat
========================================================================
npm install 
git add vercel.json
git add package.json package-lock.json
==============================================
cd backend; npm run build; npm run start:prod
cd..
cd frontend; npm run build; npm run dev

taskkill /f /im node.exe
==============================================
  cd C:\Users\habir\GOKCE\gokceweb; git switch master;
  cd backend; npm run build; cd ..;
  cd frontend; npm version patch; npm run build; cd ..;
  git add .; git commit -m "Sistem Sürüm Düzenlemeleri (auto)"; git push origin master
  =========================================================================
  YENİ VPS DEPLOYMENT WORKFLOW:
  =========================================================================
  YEREL BİLGİSAYARDA:
  1. .\deploy.ps1                    # Backend + Frontend build + Git push
  2. .\frontend\deploy-frontend-vps.ps1  # Frontend'i VPS'e kopyala (opsiyonel)
  
  VPS'TE:
  1. cd C:\gokce-backend
  2. .\deploy-vps.ps1                 # Backend git pull + build + PM2 restart
  3. Frontend: RDP ile manuel kopyala veya deploy-frontend-vps.ps1 kullan
  4. iisreset                         # IIS restart
========================================================================
netstat -ano | findstr :3000
# Çiktidaki PID'yi kullanin:
taskkill /PID <PID> /F
========================================================================
Bilgisayar\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\.NETFramework\.........
image.png
-- Tablo yapısını al
SELECT 
    'CREATE TABLE ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + ' (' + CHAR(13) + CHAR(10) +
    STUFF((
        SELECT CHAR(13) + CHAR(10) + '    , ' + QUOTENAME(c.name) + ' ' + 
            CASE 
                WHEN c.is_computed = 1 THEN 'AS ' + OBJECT_DEFINITION(c.object_id, c.column_id)
                ELSE 
                    t.name + 
                    CASE 
                        WHEN t.name IN ('varchar', 'char', 'nvarchar', 'nchar') THEN '(' + CASE WHEN c.max_length = -1 THEN 'MAX' ELSE CAST(c.max_length AS VARCHAR(5)) END + ')'
                        WHEN t.name IN ('decimal', 'numeric') THEN '(' + CAST(c.precision AS VARCHAR(5)) + ',' + CAST(c.scale AS VARCHAR(5)) + ')'
                        ELSE ''
                    END +
                    CASE WHEN c.is_nullable = 1 THEN ' NULL' ELSE ' NOT NULL' END +
                    CASE WHEN dc.definition IS NOT NULL THEN ' DEFAULT ' + dc.definition ELSE '' END
            END
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        LEFT JOIN sys.default_constraints dc ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE c.object_id = o.object_id
        ORDER BY c.column_id
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 6, '    ') + CHAR(13) + CHAR(10) + ');'
FROM sys.objects o
WHERE o.type = 'U' 
AND o.name = 'tblPersonel'  -- Tablo adını buraya yaz
AND SCHEMA_NAME(o.schema_id) = 'dbo';  -- Schema adını buraya yaz