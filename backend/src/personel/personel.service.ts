import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTransactionService } from '../database/database-transaction.service';

@Injectable()
export class PersonelService {
  constructor(
    @InjectRepository(Object) // Personel entity'si yok, Object kullanıyoruz
    private readonly personelRepository: Repository<Object>,
    private readonly databaseTransactionService: DatabaseTransactionService
  ) {}

  /**
   * Aktif kullanıcının PrsnUsrNm bilgisini tblPersonel tablosundan alır
   */
  private async getAktifKullaniciAdi(): Promise<string> {
    try {
      // Şimdilik varsayılan kullanıcı olarak SAadmin kullanıyoruz
      // TODO: Gerçek authentication sistemi entegre edildiğinde bu kısım güncellenecek
      const query = `
        SELECT TOP 1 PrsnUsrNm 
        FROM tblPersonel 
        WHERE PrsnUsrNm = 'SAadmin'
      `;

      const userUnknown = (await this.personelRepository.query(query)) as unknown;
      const result = userUnknown as Array<{ PrsnUsrNm: string }>;
      const kullaniciAdi = result[0]?.PrsnUsrNm ?? 'SAadmin';

      return kullaniciAdi;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Kullanıcı bilgisi alma hatası:', message);
      return 'SAadmin'; // Fallback değer
    }
  }

    async getCalisanPersonel(sortBy?: string, sortOrder?: 'ASC' | 'DESC') {
    try {
      // Önce aktif kullanıcının yetkisini kontrol et
      const currentUsername = await this.getAktifKullaniciAdi();
      const allowedUsers = ['SAadmin', 'KADİR', 'HARUN'];

      if (!allowedUsers.includes(currentUsername)) {
        throw new Error('Bu sayfaya erişim yetkiniz bulunmamaktadır');
      }

      console.log('🔍 Backend sıralama parametreleri:', { sortBy, sortOrder });

        // Varsayılan sıralama: PrsnYetki alanına göre ASC (nvarchar olduğu için sayısal sıralama)
        let orderByClause = 'ORDER BY CAST(PrsnYetki AS INT) ASC';

       // Eğer sıralama parametreleri verilmişse, bunları kullan
       if (sortBy && sortOrder) {
         if (sortBy === 'PrsnYetki') {
           // PrsnYetki alanı nvarchar(50) olduğu için INT cast ile sayısal sıralama
           console.log('✅ PrsnYetki sütunu için INT cast sıralaması uygulanıyor (nvarchar tipi)');
           orderByClause = `ORDER BY CAST(PrsnYetki AS INT) ${sortOrder}`;
         } else {
           // Diğer alanlar için normal sıralama
           console.log('📝 Diğer sütun için normal sıralama uygulanıyor');
           orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;
         }
       }
      console.log('📋 Kullanılacak ORDER BY:', orderByClause);

      // Cari service'deki gibi direkt tablo adını kullan
      const query = `
        SELECT
          PrsnNo,
          PrsnTCN,
          PrsnAdi,
          PrsnDurum,
          PrsnTelNo,
          PrsnGrsTrh,
          PrsnCksTrh,
          PrsnGorev,
          PrsnYetki,
          PrsnMaas,
          PrsnOdGun,
          PrsnUsrNm,
          PrsnPassw,
          PrsnDuzey,
          PrsnOda,
          PrsnYtk,
          PrsnDgmTarihi,
          PrsnOkul,
          PrsnYakini,
          PrsnYknTel,
          PrsnMedeni,
          PrsnAdres,
          PrsnBilgi
        FROM tblPersonel
        WHERE PrsnDurum = 'ÇALIŞIYOR'
        ${orderByClause}
      `;
      console.log('📝 Çalıştırılan SQL sorgusu:\n', query);
      const personel = await this.personelRepository.query(query);
      console.log('📊 Çalışan personel sorgu sonucu:', personel.length, 'kayıt bulundu');
      return {
        success: true,
        data: personel,
        message: 'Çalışan personel listesi başarıyla getirildi'
      };
    } catch (error) {
      console.error('Backend personel yükleme hatası:', error);
      throw error;
    }
  }

  async guncellePersonel(personelData: any) {
    try {
      // Önce aktif kullanıcının yetkisini kontrol et
      const currentUsername = await this.getAktifKullaniciAdi();
      const allowedUsers = ['SAadmin', 'KADİR', 'HARUN'];

      if (!allowedUsers.includes(currentUsername)) {
        throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
      }

      // Zorunlu alan kontrolü
      if (!personelData.PrsnTCN || personelData.PrsnTCN === '' || personelData.PrsnTCN === null || personelData.PrsnTCN === undefined) {
        throw new Error('TC Kimlik No alanı zorunludur');
      }

      if (!personelData.PrsnAdi || personelData.PrsnAdi === '' || personelData.PrsnAdi === null || personelData.PrsnAdi === undefined) {
        throw new Error('Adı Soyadı alanı zorunludur');
      }

      if (!personelData.PrsnGrsTrh || personelData.PrsnGrsTrh === '' || personelData.PrsnGrsTrh === null || personelData.PrsnGrsTrh === undefined) {
        throw new Error('Giriş Tarihi alanı zorunludur');
      }

      const { PrsnNo, PrsnOda, PrsnYtk, ...updateData } = personelData;

             // Mevcut personel bilgilerini al (oda-yatak durumu güncelleme için de kullanılacak)
       const mevcutPersonel = await this.personelRepository.query(
         'SELECT PrsnOda, PrsnYtk FROM tblPersonel WHERE PrsnNo = @0',
         [PrsnNo]
       );

       // Oda No ve Yatak No değişmiş mi kontrol et
       if (PrsnOda && PrsnYtk) {
         if (mevcutPersonel.length > 0) {
           const mevcut = mevcutPersonel[0];
           
           // Oda No veya Yatak No değişmiş mi kontrol et
           if (mevcut.PrsnOda !== PrsnOda || mevcut.PrsnYtk !== PrsnYtk) {
             console.log('🔍 Oda/Yatak değişikliği tespit edildi:', {
               eski: { oda: mevcut.PrsnOda, yatak: mevcut.PrsnYtk },
               yeni: { oda: PrsnOda, yatak: PrsnYtk }
             });

             // Önce oda-yatak kombinasyonunun envanterde mevcut olup olmadığını kontrol et
             const odaYatakEnvanterKontrol = await this.personelRepository.query(
               'SELECT OdYatDurum FROM tblOdaYatak WHERE OdYatOdaNo = @0 AND OdYatYtkNo = @1',
               [PrsnOda, PrsnYtk]
             );

             // Envanterde mevcut değilse hata ver
             if (odaYatakEnvanterKontrol.length === 0) {
               throw new Error(`Girdiğiniz ${PrsnOda} Oda + ${PrsnYtk} Yatak bilgisi envanterimizde bulunamamıştır!`);
             }

             // Envanterde mevcut ama DOLU ise hata ver
             if (odaYatakEnvanterKontrol[0].OdYatDurum === 'DOLU') {
               throw new Error(`Seçtiğiniz ${PrsnOda} Oda - ${PrsnYtk} Yatak DOLU durumdadır. Başka bir seçim yapınız!`);
             }

             console.log('✅ Yeni oda-yatak kombinasyonu envanterde mevcut ve müsait');
           }
         }
       }

        // Personel bilgilerini güncelle - Veri tipi uyumluluğu için CAST kullan
       const updateQuery = `
         UPDATE tblPersonel SET
           PrsnAdi = @0,
           PrsnDurum = @1,
           PrsnTelNo = @2,
           PrsnGrsTrh = @3,
           PrsnCksTrh = @4,
           PrsnGorev = @5,
           PrsnYetki = CAST(@6 AS nvarchar(50)),
           PrsnMaas = CAST(@7 AS decimal(10,2)),
           PrsnOdGun = CAST(@8 AS nvarchar(50)),
           PrsnOda = @9,
           PrsnYtk = @10,
           PrsnYakini = @11,
           PrsnDuzey = @12,
           PrsnUsrNm = @13,
           PrsnPassw = @14,
           PrsnDgmTarihi = @15,
           PrsnOkul = @16,
           PrsnMedeni = @17,
           PrsnYknTel = @18,
           PrsnAdres = @19,
           PrsnBilgi = @20
         WHERE PrsnNo = @21
       `;

      // Aylık maaş değerini handle et - boş string ise NULL yap
      const maasValue = updateData.PrsnMaas === '' || updateData.PrsnMaas === null || updateData.PrsnMaas === undefined 
        ? null 
        : updateData.PrsnMaas;

        const updateParams = [
         updateData.PrsnAdi,                    // PrsnAdi (nvarchar(50))
         updateData.PrsnDurum,                  // PrsnDurum (nvarchar(50))
         updateData.PrsnTelNo,                  // PrsnTelNo (nchar(15))
         updateData.PrsnGrsTrh,                 // PrsnGrsTrh (nchar(10))
         updateData.PrsnCksTrh,                 // PrsnCksTrh (nchar(10))
         updateData.PrsnGorev,                  // PrsnGorev (nvarchar(50))
         String(updateData.PrsnYetki),          // PrsnYetki (nvarchar(50)) - String'e çevir
         maasValue,                             // PrsnMaas (decimal(10,2))
         String(updateData.PrsnOdGun),          // PrsnOdGun (nvarchar(50)) - String'e çevir
         PrsnOda,                               // PrsnOda (nvarchar(50))
         PrsnYtk,                               // PrsnYtk (nvarchar(50))
         updateData.PrsnYakini,                 // PrsnYakini (nvarchar(50))
         updateData.PrsnDuzey,                  // PrsnDuzey (nvarchar(50))
         updateData.PrsnUsrNm,                  // PrsnUsrNm (nvarchar(50))
         updateData.PrsnPassw,                  // PrsnPassw (nvarchar(50))
         updateData.PrsnDgmTarihi,              // PrsnDgmTarihi (nchar(10))
         updateData.PrsnOkul,                   // PrsnOkul (nvarchar(50))
         updateData.PrsnMedeni,                 // PrsnMedeni (nvarchar(50))
         updateData.PrsnYknTel,                 // PrsnYknTel (nchar(15))
         updateData.PrsnAdres,                  // PrsnAdres (nvarchar(200))
         updateData.PrsnBilgi,                  // PrsnBilgi (nvarchar(50))
         PrsnNo                                 // PrsnNo (bigint)
       ];

      console.log('📝 Personel güncelleme sorgusu çalıştırılıyor:', { PrsnNo, PrsnOda, PrsnYtk });
      
      const result = await this.personelRepository.query(updateQuery, updateParams);
      
      console.log('✅ Personel başarıyla güncellendi:', result);

      // Eğer oda-yatak bilgisi girilmiş ve envanterde bulunmuşsa, OdYatDurum'u DOLU yap
      if (PrsnOda && PrsnYtk) {
        try {
          console.log('🔍 Oda-yatak durumu güncelleniyor:', { oda: PrsnOda, yatak: PrsnYtk });
          
          const odaYatakUpdateQuery = `
            UPDATE tblOdaYatak 
            SET OdYatDurum = 'DOLU' 
            WHERE OdYatOdaNo = @0 AND OdYatYtkNo = @1
          `;
          
          const odaYatakUpdateResult = await this.personelRepository.query(
            odaYatakUpdateQuery, 
            [PrsnOda, PrsnYtk]
          );
          
          console.log('✅ Oda-yatak durumu DOLU olarak güncellendi:', odaYatakUpdateResult);
          
        } catch (odaYatakUpdateError) {
          console.error('⚠️ Oda-yatak durumu güncellenirken hata oluştu:', odaYatakUpdateError);
          // Oda-yatak güncelleme hatası olsa bile personel güncelleme başarılı sayılır
          // Bu işlem transaction korumasında değil, ayrı bir işlem
        }
      } else {
        // Eğer oda-yatak bilgisi kaldırıldıysa (boş yapıldıysa), eski oda-yatak'ı BOŞ yap
        if (mevcutPersonel && mevcutPersonel.length > 0) {
          const mevcut = mevcutPersonel[0];
          if (mevcut.PrsnOda && mevcut.PrsnYtk) {
            try {
              console.log('🔍 Eski oda-yatak durumu BOŞ yapılıyor:', { oda: mevcut.PrsnOda, yatak: mevcut.PrsnYtk });
              
              const odaYatakBosUpdateQuery = `
                UPDATE tblOdaYatak 
                SET OdYatDurum = 'BOŞ' 
                WHERE OdYatOdaNo = @0 AND OdYatYtkNo = @1
              `;
              
              const odaYatakBosUpdateResult = await this.personelRepository.query(
                odaYatakBosUpdateQuery, 
                [mevcut.PrsnOda, mevcut.PrsnYtk]
              );
              
              console.log('✅ Eski oda-yatak durumu BOŞ olarak güncellendi:', odaYatakBosUpdateResult);
              
            } catch (odaYatakBosUpdateError) {
              console.error('⚠️ Eski oda-yatak durumu güncellenirken hata oluştu:', odaYatakBosUpdateError);
            }
          }
        }
      }

      return {
        success: true,
        message: 'Personel bilgileri başarıyla güncellendi'
      };

    } catch (error) {
      console.error('Backend personel güncelleme hatası:', error);
      throw error;
    }
  }

  async eklePersonel(personelData: any) {
    try {
      // Yetki kontrolü
      const aktifKullanici = await this.getAktifKullaniciAdi();
      if (!['SAadmin', 'KADİR', 'HARUN'].includes(aktifKullanici)) {
        throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
      }

      // Zorunlu alan kontrolü
      if (!personelData.PrsnTCN || personelData.PrsnTCN === '' || personelData.PrsnTCN === null || personelData.PrsnTCN === undefined) {
        throw new Error('TC Kimlik No alanı zorunludur');
      }

      if (!personelData.PrsnAdi || personelData.PrsnAdi === '' || personelData.PrsnAdi === null || personelData.PrsnAdi === undefined) {
        throw new Error('Adı Soyadı alanı zorunludur');
      }

      if (!personelData.PrsnGrsTrh || personelData.PrsnGrsTrh === '' || personelData.PrsnGrsTrh === null || personelData.PrsnGrsTrh === undefined) {
        throw new Error('Giriş Tarihi alanı zorunludur');
      }

      // Bugünün tarihini DD.MM.YYYY formatında al
      const bugun = new Date();
      const gun = String(bugun.getDate()).padStart(2, '0');
      const ay = String(bugun.getMonth() + 1).padStart(2, '0');
      const yil = bugun.getFullYear();
      const bugunTarihi = `${gun}.${ay}.${yil}`;

      // Oda-Yatak kontrolü (eğer girilmişse)
      if (personelData.PrsnOda && personelData.PrsnYtk) {
        // Envanter kontrolü
        const odaYatakEnvanterKontrol = await this.personelRepository.query(
          'SELECT OdYatDurum FROM tblOdaYatak WHERE OdYatOdaNo = @0 AND OdYatYtkNo = @1',
          [personelData.PrsnOda, personelData.PrsnYtk]
        );

        if (odaYatakEnvanterKontrol.length === 0) {
          throw new Error(`Girdiğiniz ${personelData.PrsnOda} Oda + ${personelData.PrsnYtk} Yatak bilgisi envanterimizde bulunamamıştır!`);
        }

        if (odaYatakEnvanterKontrol[0].OdYatDurum === 'DOLU') {
          throw new Error(`Seçtiğiniz ${personelData.PrsnOda} Oda - ${personelData.PrsnYtk} Yatak DOLU durumdadır. Başka bir seçim yapınız!`);
        }
      }

             // INSERT sorgusu - Veri tipi uyumluluğu için CAST kullan
       const insertQuery = `
         INSERT INTO tblPersonel (
           pKytTarihi, PrsnKllnc, PrsnTCN, PrsnAdi, PrsnDurum, PrsnTelNo, 
           PrsnGrsTrh, PrsnCksTrh, PrsnGorev, PrsnYetki, PrsnMaas, PrsnOdGun,
           PrsnUsrNm, PrsnPassw, PrsnDuzey, PrsnOda, PrsnYtk, PrsnDgmTarihi,
           PrsnOkul, PrsnYakini, PrsnYknTel, PrsnMedeni, PrsnAdres, PrsnBilgi
         ) VALUES (
           @0, @1, @2, @3, @4, @5, @6, @7, @8, CAST(@9 AS nvarchar(50)), CAST(@10 AS decimal(10,2)), CAST(@11 AS nvarchar(50)), @12, @13, @14,
           @15, @16, @17, @18, @19, @20, @21, @22, @23
         )
       `;

      // Maaş alanını NULL olarak ayarla (eğer boşsa)
      const maas = personelData.PrsnMaas && personelData.PrsnMaas !== '' ? personelData.PrsnMaas : null;

        const insertParams = [
         bugunTarihi,                    // pKytTarihi - Bugünün tarihi (nchar(10))
         aktifKullanici,                 // PrsnKllnc - Aktif kullanıcı (nvarchar(50))
         personelData.PrsnTCN,           // PrsnTCN (nchar(11))
         personelData.PrsnAdi,           // PrsnAdi (nvarchar(50))
         personelData.PrsnDurum || 'ÇALIŞIYOR', // PrsnDurum (nvarchar(50))
         personelData.PrsnTelNo || '',   // PrsnTelNo (nchar(15))
         personelData.PrsnGrsTrh || '',  // PrsnGrsTrh (nchar(10))
         personelData.PrsnCksTrh || '',  // PrsnCksTrh (nchar(10))
         personelData.PrsnGorev || '',   // PrsnGorev (nvarchar(50))
         String(personelData.PrsnYetki || 0),    // PrsnYetki (nvarchar(50)) - String'e çevir
         maas,                           // PrsnMaas (decimal(10,2))
         String(personelData.PrsnOdGun || 1),    // PrsnOdGun (nvarchar(50)) - String'e çevir
         personelData.PrsnUsrNm || '',   // PrsnUsrNm (nvarchar(50))
         personelData.PrsnPassw || '',   // PrsnPassw (nvarchar(50))
         personelData.PrsnDuzey || '',   // PrsnDuzey (nvarchar(50))
         personelData.PrsnOda || '',     // PrsnOda (nvarchar(50))
         personelData.PrsnYtk || '',     // PrsnYtk (nvarchar(50))
         personelData.PrsnDgmTarihi || '', // PrsnDgmTarihi (nchar(10))
         personelData.PrsnOkul || '',    // PrsnOkul (nvarchar(50))
         personelData.PrsnYakini || '',  // PrsnYakini (nvarchar(50))
         personelData.PrsnYknTel || '',  // PrsnYknTel (nchar(15))
         personelData.PrsnMedeni || '',  // PrsnMedeni (nvarchar(50))
         personelData.PrsnAdres || '',   // PrsnAdres (nvarchar(200))
         personelData.PrsnBilgi || ''    // PrsnBilgi (nvarchar(50))
       ];

      console.log('🔍 Personel ekleme sorgusu:', insertQuery);
      console.log('🔍 Parametreler:', insertParams);

      const result = await this.personelRepository.query(insertQuery, insertParams);

      console.log('✅ Personel başarıyla eklendi:', result);

      // Eğer oda-yatak bilgisi girilmişse, OdYatDurum'u DOLU yap
      if (personelData.PrsnOda && personelData.PrsnYtk) {
        try {
          console.log('🔍 Oda-yatak durumu DOLU yapılıyor:', { oda: personelData.PrsnOda, yatak: personelData.PrsnYtk });

          const odaYatakUpdateQuery = `
            UPDATE tblOdaYatak
            SET OdYatDurum = 'DOLU'
            WHERE OdYatOdaNo = @0 AND OdYatYtkNo = @1
          `;

          const odaYatakUpdateResult = await this.personelRepository.query(
            odaYatakUpdateQuery,
            [personelData.PrsnOda, personelData.PrsnYtk]
          );

          console.log('✅ Oda-yatak durumu DOLU olarak güncellendi:', odaYatakUpdateResult);

        } catch (odaYatakUpdateError) {
          console.error('⚠️ Oda-yatak durumu güncellenirken hata oluştu:', odaYatakUpdateError);
          // Oda-yatak güncelleme hatası olsa bile personel ekleme başarılı sayılır
        }
      }

      return { success: true, message: 'Personel başarıyla eklendi' };

    } catch (error) {
      console.error('Backend personel ekleme hatası:', error);
      throw error;
    }
  }
}
