BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[tblMusteri] (
    [MstrNo] BIGINT NOT NULL IDENTITY(1,1),
    [mKytTarihi] NCHAR(10) NOT NULL,
    [MstrKllnc] NVARCHAR(10) NOT NULL,
    [MstrHspTip] NVARCHAR(10) NOT NULL,
    [MstrTCN] NVARCHAR(17) NOT NULL,
    [MstrAdi] NVARCHAR(50) NOT NULL,
    [MstrDgmTarihi] NCHAR(10),
    [MstrTelNo] NVARCHAR(15),
    [MstrTel2] NVARCHAR(15),
    [MstrEposta] NVARCHAR(30),
    [MstrMeslek] NVARCHAR(20),
    [MstrYakini] NVARCHAR(20),
    [MstrYknTel] NVARCHAR(15),
    [MstrDurum] NVARCHAR(10),
    [MstrFirma] NVARCHAR(50),
    [MstrVD] NVARCHAR(25),
    [MstrVno] NVARCHAR(11),
    [MstrFrmTel] NVARCHAR(15),
    [MstrFrmMdr] NVARCHAR(20),
    [MstrMdrTel] NVARCHAR(15),
    [MstrAdres] NVARCHAR(200),
    [MstrResim] VARBINARY(max),
    [MstrNot] NVARCHAR(max),
    CONSTRAINT [tblMusteri_pkey] PRIMARY KEY CLUSTERED ([MstrNo])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
