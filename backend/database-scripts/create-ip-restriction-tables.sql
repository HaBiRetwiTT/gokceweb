-- IP Kısıtlama Tablosu
-- Bu tablo maksimum 5 IP adresini saklar
USE harunta;
GO

-- IP Kısıtlama Tablosu
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tblIPKisitlama' AND xtype='U')
BEGIN
    CREATE TABLE tblIPKisitlama (
        IpKstNo BIGINT IDENTITY(1,1) PRIMARY KEY,
        IpKstAdres NVARCHAR(15) NOT NULL,
        IpKstAktif BIT DEFAULT 1,
        IpKstKytTarihi NCHAR(10) NOT NULL,
        IpKstKllnc NVARCHAR(10) NOT NULL,
        IpKstAciklama NVARCHAR(100) NULL,
        CONSTRAINT UK_IpKstAdres UNIQUE (IpKstAdres, IpKstAktif)
    );
    
    PRINT 'tblIPKisitlama tablosu oluşturuldu.';
END
ELSE
BEGIN
    PRINT 'tblIPKisitlama tablosu zaten mevcut.';
END
GO

-- Sistem Ayarları Tablosu
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tblSistemAyar' AND xtype='U')
BEGIN
    CREATE TABLE tblSistemAyar (
        SysAyrNo BIGINT IDENTITY(1,1) PRIMARY KEY,
        SysAyrAnahtar NVARCHAR(50) NOT NULL UNIQUE,
        SysAyrDeger NVARCHAR(255) NOT NULL,
        SysAyrAciklama NVARCHAR(255) NULL,
        SysAyrGncTarihi NCHAR(10) NOT NULL,
        SysAyrKllnc NVARCHAR(10) NOT NULL
    );
    
    PRINT 'tblSistemAyar tablosu oluşturuldu.';
END
ELSE
BEGIN
    PRINT 'tblSistemAyar tablosu zaten mevcut.';
END
GO

-- İlk ayarı ekle (IP kısıtlama pasif olarak)
IF NOT EXISTS (SELECT * FROM tblSistemAyar WHERE SysAyrAnahtar = 'IP_KISITLAMA_AKTIF')
BEGIN
    INSERT INTO tblSistemAyar (SysAyrAnahtar, SysAyrDeger, SysAyrAciklama, SysAyrGncTarihi, SysAyrKllnc)
    VALUES ('IP_KISITLAMA_AKTIF', '0', 'IP Kısıtlama Sistemi Aktif/Pasif Durumu', 
            FORMAT(GETDATE(), 'dd.MM.yyyy'), 'SYSTEM');
    
    PRINT 'IP kısıtlama ayarı eklendi (Pasif).';
END
ELSE
BEGIN
    PRINT 'IP kısıtlama ayarı zaten mevcut.';
END
GO

PRINT 'IP Kısıtlama sistemi tabloları hazır!';
GO

