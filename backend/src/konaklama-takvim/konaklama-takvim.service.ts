/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Musteri } from '../entities/musteri.entity';
import { DatabaseConfigService } from '../database/database-config.service';

export interface KonaklamaDetay {
  musteriAdi: string;
  odaNo: string;
  yatakNo: string;
  konaklamaTipi: string;
}

export interface OdaTipDoluluk {
  odaTipi: string;
  dolulukTarihleri: { 
    tarih: string; 
    dolu: boolean;
    konaklamaDetaylari: KonaklamaDetay[];
    bosYatakSayisi: number;
    rezervasyonSayisi?: number;
    toplamBosEksiRez?: number;
    rezervasyonDetaylari?: Array<{ hrResId: string; adSoyad: string; grsTrh: string; cksTrh: string; kanal?: string; paidStatus?: string; ulkeKodu?: string; ucret?: number; odemeDoviz?: string }>;
  }[];
  maxPlanlananTarih: string | null;
  totalRezervasyonSayisi?: number;
}

export interface KonaklamaTakvimData {
  gunler: string[]; // Tarihler array'i
  odaTipleri: OdaTipDoluluk[];
}

type AktifKonaklamaRow = {
  KnklmOdaTip: string | null;
  KnklmPlnTrh: string | null;
  MstrAdi: string | null;
  KnklmOdaNo: string | null;
  KnklmYtkNo: string | null;
  KnklmGrsTrh: string | null;
  KnklmTip: string | null;
};

@Injectable()
export class KonaklamaTakvimService {
  constructor(
    @InjectRepository(Musteri)
    private musteriRepository: Repository<Musteri>,
    private dbConfig: DatabaseConfigService,
  ) {}

  // Kat / Oda planı: Katlara göre oda numaralarını döndür
  async getKatOdaPlan(): Promise<{ floors: number[]; floorToRooms: Record<string, { odaNo: number; odaTip: string; yatak: number; dolu: number; ariza: boolean; kirli: boolean }[]>; maxCols: number }> {
    const schema = this.dbConfig.getTableSchema();
    const sql = `
      SELECT 
        odYatOdaNo as OdaNo,
        odYatOdaTip as OdaTip,
        COUNT(*) as YatakSayisi,
        SUM(CASE WHEN odYatDurum = 'DOLU' THEN 1 ELSE 0 END) as DoluSayisi,
        MAX(CASE WHEN UPPER(LTRIM(RTRIM(odYatDurum))) IN ('ARIZA', 'ARIZALI') THEN 1 ELSE 0 END) as HasAriza,
        MAX(CASE WHEN UPPER(LTRIM(RTRIM(odYatDurum))) IN ('KİRLİ', 'KIRLI', 'KIRLI ') THEN 1 ELSE 0 END) as HasKirli
      FROM ${schema}.tblOdaYatak
      WHERE odYatOdaNo IS NOT NULL AND odYatOdaNo <> ''
      GROUP BY odYatOdaNo, odYatOdaTip
    `;
    const rows: Array<{ OdaNo: string | number; OdaTip: string | null; YatakSayisi: number | string | null; DoluSayisi: number | string | null; HasAriza: number | string | null; HasKirli: number | string | null }> = await this.musteriRepository.query(sql);
    const floorToRooms: Record<string, { odaNo: number; odaTip: string; yatak: number; dolu: number; ariza: boolean; kirli: boolean }[]> = {};
    for (const r of rows) {
      const odaNoNum = Number(String(r.OdaNo).replace(/\D/g, ''));
      if (!isFinite(odaNoNum)) continue;
      const floor = String(String(odaNoNum).charAt(0));
      if (!floorToRooms[floor]) floorToRooms[floor] = [];
      const incomingTip = String(r.OdaTip || '').trim();
      const yatakSayisiRaw = r.YatakSayisi ?? 0;
      const doluSayisiRaw = r.DoluSayisi ?? 0;
      const yatak = typeof yatakSayisiRaw === 'number' ? yatakSayisiRaw : Number(yatakSayisiRaw) || 0;
      const dolu = typeof doluSayisiRaw === 'number' ? doluSayisiRaw : Number(doluSayisiRaw) || 0;
      const arizaRaw = r.HasAriza ?? 0;
      const ariza = (typeof arizaRaw === 'number' ? arizaRaw : Number(arizaRaw)) > 0;
      const kirliRaw = r.HasKirli ?? 0;
      const kirli = (typeof kirliRaw === 'number' ? kirliRaw : Number(kirliRaw)) > 0;
      const existing = floorToRooms[floor].find(x => x.odaNo === odaNoNum);
      if (!existing) {
        floorToRooms[floor].push({ odaNo: odaNoNum, odaTip: incomingTip, yatak, dolu, ariza, kirli });
      } else {
        // Aynı odaNo birden fazla OdaTip ile gelirse, tip boş olanı doldur; yatak/dolu sayısını birleştir
        if (!existing.odaTip && incomingTip) existing.odaTip = incomingTip;
        existing.yatak = Math.max(existing.yatak, yatak);
        existing.dolu = Math.max(existing.dolu, dolu);
        existing.ariza = existing.ariza || ariza;
        existing.kirli = existing.kirli || kirli;
      }
    }
    const floors: number[] = [];
    let maxCols = 0;
    for (let k = 1; k <= 9; k++) {
      const key = String(k);
      floors.push(k);
      const list = floorToRooms[key] || [];
      list.sort((a, b) => a.odaNo - b.odaNo);
      floorToRooms[key] = list;
      if (list.length > maxCols) maxCols = list.length;
    }
    return { floors, floorToRooms, maxCols };
  }

  /**
   * Oda doluluk takvimini getirir
   * @param baslangicTarihi Başlangıç tarihi (opsiyonel, varsayılan bugün)
   * @param gunSayisi Kaç gün gösterilecek (varsayılan 32)
   */
  async getOdaDolulukTakvimi(baslangicTarihi?: string, gunSayisi: number = 32): Promise<KonaklamaTakvimData> {
    try {
      // Başlangıç tarihini belirle (bugün veya verilen tarih)
      const startDate = baslangicTarihi ? new Date(this.parseDate(baslangicTarihi)) : new Date();
      console.log(`📍 Başlangıç tarihi belirlendi: ${this.formatDate(startDate)} (parametre: ${baslangicTarihi || 'bugün'})`);
      
      // Tarih dizisini oluştur
      const gunler = this.createDateArray(startDate, gunSayisi);
      console.log(`🗓️ Takvim oluşturuluyor: ${gunSayisi} gün, ilk tarih: ${this.formatDate(startDate)}`);
      console.log(`📅 İlk tarih: ${gunler[0]}, Son tarih: ${gunler[gunler.length - 1]}, Toplam: ${gunler.length}`);
      
      // Aktif konaklamaları v_MusteriKonaklama view'ından getir
      const aktifKonaklamalar = await this.getAktifKonaklamalar();
      
      // Oda tiplerini gruplandır ve her tip için max tarih bul
      const odaTipGruplari = this.groupByOdaTipi(aktifKonaklamalar);
      
      // HR rezervasyonlarını getir ve 32 günlük pencereye göre odaTipiProj + gün bazında say
      const startISO = this.parseDate(gunler[0]);
      const endISO = this.parseDate(gunler[gunler.length - 1]);
      const rezervasyonHaritasi = await this.getRezervasyonSayilariHaritasi(startISO, endISO, gunler);
      const toplamRezHaritasi = await this.getRezervasyonToplamHaritasi();

      // Her oda tipi için doluluk durumunu hesapla
      const odaTipleri = await this.calculateOdaDoluluk(odaTipGruplari, gunler, rezervasyonHaritasi, toplamRezHaritasi);
      
      return {
        gunler,
        odaTipleri
      };
    } catch (error) {
      console.error('getOdaDolulukTakvimi hatası:', error);
      throw new Error('Konaklama takvimi alınamadı');
    }
  }

  async setOdaArizaDurum(odaNo: number, ariza: boolean) {
    if (!odaNo || !isFinite(Number(odaNo))) {
      return { success: false, message: 'Geçersiz odaNo' };
    }
    const schema = this.dbConfig.getTableSchema();
    const odaNoStr = String(odaNo);
    if (ariza) {
      // ARIZA EKLE: Odadaki tüm yatakların BOŞ olduğundan emin ol
      const kontrolQuery = `
        SELECT COUNT(*) AS cnt
        FROM ${schema}.tblOdaYatak
        WHERE odYatOdaNo = @0
          AND UPPER(LTRIM(RTRIM(odYatDurum))) <> 'BOŞ'
      `;
      const kontrol = await this.musteriRepository.query(kontrolQuery, [odaNoStr]) as Array<{ cnt: number | string }>
      const cnt = Number(kontrol?.[0]?.cnt ?? 0)
      if (cnt > 0) {
        return { success: false, message: 'ODA DURUMU = BOŞ = DEĞİL İŞLEM YAPILAMIYOR...' }
      }
      const updateQuery = `UPDATE ${schema}.tblOdaYatak SET odYatDurum = 'ARIZA' WHERE odYatOdaNo = @0`;
      await this.musteriRepository.query(updateQuery, [odaNoStr]);
      return { success: true, odaNo, ariza };
    } else {
      // ARIZA KALDIR: Odadaki tüm ARIZA yataklarını BOŞ yap
      const updateQuery = `UPDATE ${schema}.tblOdaYatak SET odYatDurum = 'BOŞ' WHERE odYatOdaNo = @0 AND UPPER(LTRIM(RTRIM(odYatDurum))) = 'ARIZA'`;
      await this.musteriRepository.query(updateQuery, [odaNoStr]);
      return { success: true, odaNo, ariza };
    }
  }

  async setOdaKirliDurum(odaNo: number, kirli: boolean) {
    if (!odaNo || !isFinite(Number(odaNo))) {
      return { success: false, message: 'Geçersiz odaNo' };
    }
    const schema = this.dbConfig.getTableSchema();
    const odaNoStr = String(odaNo);
    if (kirli) {
      // KİRLİ YAP: tüm yataklar BOŞ olmalı
      const kontrolQuery = `
        SELECT COUNT(*) AS cnt
        FROM ${schema}.tblOdaYatak
        WHERE odYatOdaNo = @0
          AND UPPER(LTRIM(RTRIM(odYatDurum))) <> 'BOŞ'
      `;
      const kontrol = await this.musteriRepository.query(kontrolQuery, [odaNoStr]) as Array<{ cnt: number | string }>
      const cnt = Number(kontrol?.[0]?.cnt ?? 0)
      if (cnt > 0) {
        return { success: false, message: 'ODA DURUMU = BOŞ = DEĞİL İŞLEM YAPILAMIYOR...' }
      }
      const updateQuery = `UPDATE ${schema}.tblOdaYatak SET odYatDurum = 'KİRLİ' WHERE odYatOdaNo = @0`;
      await this.musteriRepository.query(updateQuery, [odaNoStr]);
      return { success: true, odaNo, kirli };
    } else {
      const updateQuery = `UPDATE ${schema}.tblOdaYatak SET odYatDurum = 'BOŞ' WHERE odYatOdaNo = @0 AND UPPER(LTRIM(RTRIM(odYatDurum))) IN ('KİRLİ','KIRLI')`;
      await this.musteriRepository.query(updateQuery, [odaNoStr]);
      return { success: true, odaNo, kirli };
    }
  }

  /**
   * v_MusteriKonaklama view'ından aktif konaklamaları getirir
   */

  private async getAktifKonaklamalar(): Promise<AktifKonaklamaRow[]> {
    try {
      const views = this.dbConfig.getViews();
      
      // 🔥 CTE OPTİMİZASYONU: Aktif konaklamaları daha verimli getir
      const query = `
        WITH AktifKonaklamalar AS (
          -- Ana aktif konaklama verileri
          SELECT 
            v.KnklmOdaTip,
            v.KnklmPlnTrh,
            v.MstrAdi,
            v.KnklmOdaNo,
            v.KnklmYtkNo,
            v.KnklmGrsTrh,
            v.KnklmTip,
            v.MstrTCN,
            v.knklmNo,
            ROW_NUMBER() OVER (PARTITION BY v.MstrTCN ORDER BY v.knklmNo DESC) as rn
          FROM ${views.musteriKonaklama} v
          WHERE v.MstrDurum = 'KALIYOR' 
            AND (v.KnklmCksTrh = '' OR v.KnklmCksTrh IS NULL)
            AND LEFT(v.MstrAdi, 9) <> 'PERSONEL '
            AND v.KnklmPlnTrh IS NOT NULL
            AND v.KnklmPlnTrh <> ''
        ),
        SonKonaklamalar AS (
          -- Her müşteri için en son konaklama kaydı
          SELECT 
            KnklmOdaTip,
            KnklmPlnTrh,
            MstrAdi,
            KnklmOdaNo,
            KnklmYtkNo,
            KnklmGrsTrh,
            KnklmTip
          FROM AktifKonaklamalar
          WHERE rn = 1
        )
        SELECT 
          KnklmOdaTip,
          KnklmPlnTrh,
          MstrAdi,
          KnklmOdaNo,
          KnklmYtkNo,
          KnklmGrsTrh,
          KnklmTip
        FROM SonKonaklamalar
        ORDER BY KnklmOdaTip,
                 CASE KnklmTip 
                   WHEN 'GÜNLÜK' THEN 1
                   WHEN 'HAFTALIK' THEN 2  
                   WHEN 'AYLIK' THEN 3
                   ELSE 4
                 END,
                 KnklmOdaNo ASC, 
                 KnklmYtkNo ASC
      `;
      
      const result = (await this.musteriRepository.query(query)) as unknown as AktifKonaklamaRow[];
      console.log('Aktif konaklamalar:', result.length, 'kayıt bulundu');
      
      // Debug için ilk birkaç kaydı logla
      if (result.length > 0) {
        console.log('İlk 3 aktif konaklama kaydı:', result.slice(0, 3));
      }
      
      return result;
    } catch (error) {
      console.error('getAktifKonaklamalar hatası:', error);
      return [];
    }
  }

  /**
   * Belirli oda tipi için toplam yatak sayısını getirir (BOŞ + DOLU)
   */
  private async getToplamYatakSayisi(odaTipi: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as toplamYatakSayisi
        FROM tblOdaYatak 
        WHERE odYatOdaTip = @0 AND odYatDurum IN ('BOŞ', 'DOLU')
      `;
      
      const result = (await this.musteriRepository.query(query, [odaTipi])) as unknown as Array<{ toplamYatakSayisi: number | string | null }>;
      const val = result[0]?.toplamYatakSayisi ?? 0;
      return typeof val === 'number' ? val : Number(val) || 0;
    } catch (error) {
      console.error('getToplamYatakSayisi hatası:', error);
      return 0;
    }
  }

  /**
   * Belirli oda tipi için anlık BOŞ yatak sayısını getirir (yalnızca 'BOŞ')
   */
  private async getBosYatakSayisi(odaTipi: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as bosYatakSayisi
        FROM tblOdaYatak
        WHERE odYatOdaTip = @0 AND odYatDurum = 'BOŞ'
      `;

      const result = (await this.musteriRepository.query(query, [odaTipi])) as unknown as Array<{ bosYatakSayisi: number | string | null }>;
      const val = result[0]?.bosYatakSayisi ?? 0;
      return typeof val === 'number' ? val : Number(val) || 0;
    } catch (error) {
      console.error('getBosYatakSayisi hatası:', error);
      return 0;
    }
  }

  /**
   * Oda tipi isimlerini karşılaştırma için normalize eder:
   * - trim, fazla boşlukları tek boşluğa indirger
   * - TR yerelinde uppercase
   * - Unicode diakritiklerini kaldırır (Ç→C, Ş→S, Ğ→G, Ü→U, Ö→O, İ/ı→I)
   */
  private normalizeRoomTypeName(input: string | null | undefined): string {
    if (!input) return '';
    let s = String(input).trim().replace(/\s+/g, ' ');
    // Önce TR yereline göre uppercase
    s = s.toLocaleUpperCase('tr-TR');
    // Diakritikleri kaldır
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s;
  }

  /**
   * HR rezervasyonlarını (tblHRzvn) okuyup odaTipiProj + gün bazında sayıları döndürür
   * Yalnızca durum='confirmed' kayıtlar dahil edilir.
   * @returns Map<odaTipiProj, Map<DD.MM.YYYY, number>>
   */
  private async getRezervasyonSayilariHaritasi(startISO: string, endISO: string, gunler: string[]): Promise<Map<string, Map<string, string | number>>> {
    const schema = this.dbConfig.getTableSchema();
    const resultMap = new Map<string, Map<string, string | number>>();

    // Güvenli tarih parametreleri oluştur
    const startParam = startISO; // YYYY-MM-DD
    const endParam = endISO;     // YYYY-MM-DD

    const sql = `
      SELECT 
        hrResId,
        adSoyad,
        kanal,
        paidStatus,
        ulkeKodu,
        ucret,
        odemeDoviz,
        odaTipiProj,
        grsTrh,
        cksTrh
      FROM ${schema}.tblHRzvn
      WHERE durum = 'confirmed'
        AND odaTipiProj IS NOT NULL AND LTRIM(RTRIM(odaTipiProj)) <> ''
        AND TRY_CONVERT(date, grsTrh, 104) IS NOT NULL
        AND TRY_CONVERT(date, cksTrh, 104) IS NOT NULL
    `;

    const rows = await this.musteriRepository.query(sql) as Array<{ hrResId: string | null; adSoyad: string | null; kanal: string | null; paidStatus: string | null; ulkeKodu: string | null; ucret: number | string | null; odemeDoviz: string | null; odaTipiProj: string | null; grsTrh: string | null; cksTrh: string | null }>;

    // Günler set'i oluştur (DD.MM.YYYY)
    const validGunler = new Set(gunler);

    for (const r of rows) {
      const tip = this.normalizeRoomTypeName((r.odaTipiProj || ''));
      if (!tip) continue;
      const girisISO = this.parseDate(r.grsTrh || '');
      const cikisISO = this.parseDate(r.cksTrh || '');
      const giris = new Date(girisISO);
      const cikis = new Date(cikisISO);
      if (isNaN(giris.getTime()) || isNaN(cikis.getTime())) continue;

      // Pencereye göre clamp et
      const pencereBas = new Date(startISO);
      const pencereBit = new Date(endISO);
      // Checkout gününü DAHİL ET (inclusive)
      const cikisIncl = new Date(cikis.getFullYear(), cikis.getMonth(), cikis.getDate());
      const bas = giris > pencereBas ? giris : pencereBas;
      // bit = min(cikisIncl, pencereBit) ve iterasyonda <= kullanacağız
      const bit = (cikisIncl < pencereBit ? cikisIncl : pencereBit);
      if (bas > bit) continue; // Pencereyle kesişmiyor
      
      // Gün gün dolaş ve sayaçları artır
      for (
        let d = new Date(bas.getFullYear(), bas.getMonth(), bas.getDate());
        d <= bit;
        d.setDate(d.getDate() + 1)
      ) {
        const key = this.formatDateForDisplay(d); // DD.MM.YYYY
        if (!validGunler.has(key)) continue;
        let tipMap = resultMap.get(tip);
        if (!tipMap) {
          tipMap = new Map<string, string | number>();
          resultMap.set(tip, tipMap);
        }
        const countKey = `${key}__COUNT`;
        const listKey = `${key}__LIST`;
        const prev = Number(tipMap.get(countKey) || 0);
        tipMap.set(countKey, prev + 1);
        // Listeyi JSON string olarak sakla
        const detay = {
          hrResId: r.hrResId || '',
          adSoyad: r.adSoyad || '',
          grsTrh: r.grsTrh || '',
          cksTrh: r.cksTrh || '',
          kanal: r.kanal || '',
          paidStatus: r.paidStatus || '',
          ulkeKodu: (r.ulkeKodu || '').toString().trim(),
          ucret: typeof r.ucret === 'number' ? r.ucret : Number(r.ucret) || 0,
          odemeDoviz: r.odemeDoviz || ''
        };
        const prevList = String(tipMap.get(listKey) || '[]');
        const arr = JSON.parse(prevList) as any[];
        arr.push(detay);
        tipMap.set(listKey, JSON.stringify(arr));
      }
    }

    return resultMap;
  }

  /**
   * Oda tipi bazında (odaTipiProj) tüm confirmed rezervasyonların TEKİL SAYISINI döndürür
   * Map<odaTipiProj, totalCount>
   */
  private async getRezervasyonToplamHaritasi(): Promise<Map<string, number>> {
    const schema = this.dbConfig.getTableSchema();
    const sql = `
      SELECT 
        odaTipiProj,
        SUM(
          CASE 
            WHEN TRY_CONVERT(date, grsTrh, 104) IS NOT NULL 
             AND TRY_CONVERT(date, cksTrh, 104) IS NOT NULL 
            THEN 
              CASE 
                WHEN DATEDIFF(day, TRY_CONVERT(date, grsTrh, 104), TRY_CONVERT(date, cksTrh, 104)) >= 0 
                THEN DATEDIFF(day, TRY_CONVERT(date, grsTrh, 104), TRY_CONVERT(date, cksTrh, 104)) + 1 
                ELSE 0 
              END
            ELSE 0 
          END
        ) AS cnt
      FROM ${schema}.tblHRzvn
      WHERE durum = 'confirmed' 
        AND odaTipiProj IS NOT NULL 
        AND LTRIM(RTRIM(odaTipiProj)) <> ''
      GROUP BY odaTipiProj
    `;
    const rows = await this.musteriRepository.query(sql) as Array<{ odaTipiProj: string | null; cnt: number | string | null }>;
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = this.normalizeRoomTypeName(r.odaTipiProj || '');
      if (!key) continue;
      const n = typeof r.cnt === 'number' ? r.cnt : Number(r.cnt) || 0;
      map.set(key, n);
    }
    return map;
  }

  /**
   * Konaklamaları oda tipine göre gruplandırır
   */
  private groupByOdaTipi(konaklamalar: AktifKonaklamaRow[]): { [odaTipi: string]: AktifKonaklamaRow[] } {
    const grup: { [odaTipi: string]: AktifKonaklamaRow[] } = {};
    
    konaklamalar.forEach(konaklama => {
      const odaTipi = konaklama.KnklmOdaTip || 'Belirtilmemiş';
      if (!grup[odaTipi]) {
        grup[odaTipi] = [];
      }
      grup[odaTipi].push(konaklama);
    });
    
    console.log('Oda tipi grupları:', Object.keys(grup));
    return grup;
  }

  /**
   * Her oda tipi için doluluk durumunu hesaplar
   */
  private async calculateOdaDoluluk(
    odaTipGruplari: { [odaTipi: string]: AktifKonaklamaRow[] },
    gunler: string[],
    rezervasyonHaritasi: Map<string, Map<string, string | number>>,
    toplamRezHaritasi: Map<string, number>,
  ): Promise<OdaTipDoluluk[]> {
    const odaTipleri: OdaTipDoluluk[] = [];

    // Tüm oda tiplerini envanterden al; aktif konaklaması olmayan tipler de listelenecek
    const tumOdaTipleri = await this.getTumOdaTipleri();
    const aktifOdaTipleri = Object.keys(odaTipGruplari);
    const birlesikOdaTipleri = Array.from(new Set([...tumOdaTipleri, ...aktifOdaTipleri]));

    for (const odaTipi of birlesikOdaTipleri) {
      const konaklamalar = odaTipGruplari[odaTipi];
      
      // Aktif kaydı yoksa boş diziyle devam et
      const konaklamalarList = Array.isArray(konaklamalar) ? konaklamalar : [];
      
      // Bu oda tipindeki en büyük planlanan çıkış tarihini bul
      let maxPlanlananTarih: Date | null = null;
      
      konaklamalarList.forEach(konaklama => {
        if (konaklama.KnklmPlnTrh) {
          const planTarih = this.parseDate(konaklama.KnklmPlnTrh);
          const tarihObj = new Date(planTarih);
          
           if (!maxPlanlananTarih || tarihObj > maxPlanlananTarih) {
            maxPlanlananTarih = tarihObj;
          }
        }
      });
      
      // Doluluk durumunu hesapla - her gün için kontrol et
      const tipKey = this.normalizeRoomTypeName(odaTipi);
      const dolulukTarihleri = gunler.map(gunTarihi => {
        // DD.MM.YYYY formatını ISO'ya çevir
        const gunDate = new Date(this.parseDate(gunTarihi));
        
        // Bu günde konaklama yapan müşterileri bul
        const konaklamaDetaylari: KonaklamaDetay[] = [];
        
        konaklamalarList.forEach(konaklama => {
          if (!konaklama.KnklmGrsTrh || !konaklama.KnklmPlnTrh) return;
          
          try {
             const girisTarih = new Date(this.parseDate(konaklama.KnklmGrsTrh));
             const cikisTarih = new Date(this.parseDate(konaklama.KnklmPlnTrh));
            
            // Tarih parse edilemezse skip et
            if (isNaN(girisTarih.getTime()) || isNaN(cikisTarih.getTime())) {
              console.warn('Tarih parse hatası:', konaklama.KnklmGrsTrh, konaklama.KnklmPlnTrh);
              return;
            }
            
            // Gün, giriş ve çıkış (çıkarılış günü dahil olacak biçimde +1 gün) arasında mı?
            const cikisPlusOne = new Date(cikisTarih);
            cikisPlusOne.setDate(cikisPlusOne.getDate() + 1);
            if (gunDate >= girisTarih && gunDate < cikisPlusOne) {
              konaklamaDetaylari.push({
                musteriAdi: konaklama.MstrAdi || 'Bilinmeyen',
                odaNo: konaklama.KnklmOdaNo || '-',
                yatakNo: konaklama.KnklmYtkNo || '-',
                konaklamaTipi: konaklama.KnklmTip || 'Belirtilmemiş'
              });
              
              // Debug için
              if (gunTarihi === this.formatDateForDisplay(new Date())) {
                console.log('Bugün konaklama bulundu:', {
                  odaTipi,
                  musteriAdi: konaklama.MstrAdi,
                  odaNo: konaklama.KnklmOdaNo,
                  yatakNo: konaklama.KnklmYtkNo,
                  girisTarih: this.formatDate(girisTarih),
                  cikisTarih: this.formatDate(cikisTarih),
                  gunTarihi
                });
              }
            }
          } catch (error) {
            console.error('Tarih karşılaştırma hatası:', error, konaklama);
          }
        });
        
        // Konaklama tipine göre, sonra oda-yatak no'ya göre sırala
        konaklamaDetaylari.sort((a, b) => {
          // 1. Konaklama tipine göre sırala
          const tipA = a.konaklamaTipi || '';
          const tipB = b.konaklamaTipi || '';
          
          const tipPriorityA = tipA === 'GÜNLÜK' ? 1 : tipA === 'HAFTALIK' ? 2 : tipA === 'AYLIK' ? 3 : 4;
          const tipPriorityB = tipB === 'GÜNLÜK' ? 1 : tipB === 'HAFTALIK' ? 2 : tipB === 'AYLIK' ? 3 : 4;
          
          if (tipPriorityA !== tipPriorityB) {
            return tipPriorityA - tipPriorityB;
          }
          
          // 2. Oda numarasına göre sırala
          const odaA = parseInt(a.odaNo) || 0;
          const odaB = parseInt(b.odaNo) || 0;
          
          if (odaA === odaB) {
            // 3. Yatak numarasına göre sırala
            const yatakA = parseInt(a.yatakNo) || 0;
            const yatakB = parseInt(b.yatakNo) || 0;
            return yatakA - yatakB;
          }
          
          return odaA - odaB;
        });
        
        const tipMap = rezervasyonHaritasi.get(tipKey);
        const rSayisi = Number(tipMap?.get(`${gunTarihi}__COUNT`) || 0);
        const listJson = String(tipMap?.get(`${gunTarihi}__LIST`) || '[]');
        const rezervasyonDetaylari = JSON.parse(listJson) as Array<{ hrResId: string; adSoyad: string; grsTrh: string; cksTrh: string; kanal?: string; paidStatus?: string }>;
        return {
          tarih: gunTarihi,
          dolu: konaklamaDetaylari.length > 0,
          konaklamaDetaylari,
          bosYatakSayisi: -1, // placeholder, hemen aşağıda gerçek değerle güncellenecek
          rezervasyonSayisi: rSayisi,
          toplamBosEksiRez: 0,
          rezervasyonDetaylari
        };
      });
      
      // İlk gün (tablodaki ilk tarih) için BOŞ sayısını dinamik olarak al
      const bosIlkGun = await this.getBosYatakSayisi(odaTipi);
      const ilkGunDolu = dolulukTarihleri[0]?.konaklamaDetaylari.length ?? 0;
      
      // Kapasiteyi cache'le: İlk gün için hesaplanan D + B
      const kapasite = bosIlkGun + ilkGunDolu;

      // Her gün için B hesabı: i=0 ise dinamik BOŞ; diğer günlerde B = kapasite - D
      dolulukTarihleri.forEach((doluluk, index) => {
        if (index === 0) {
          doluluk.bosYatakSayisi = bosIlkGun;
        } else {
          const hesaplananBos = kapasite - doluluk.konaklamaDetaylari.length;
          doluluk.bosYatakSayisi = hesaplananBos < 0 ? 0 : hesaplananBos;
        }
        const r = doluluk.rezervasyonSayisi || 0;
        const t = doluluk.bosYatakSayisi - r;
        doluluk.toplamBosEksiRez = t < 0 ? 0 : t;
      });
      
      odaTipleri.push({
        odaTipi,
        dolulukTarihleri,
        maxPlanlananTarih: maxPlanlananTarih ? this.formatDate(maxPlanlananTarih) : null,
        totalRezervasyonSayisi: toplamRezHaritasi.get(tipKey) || 0
      });
    }
    
    // Oda tiplerini alfabetik sırala
    odaTipleri.sort((a, b) => a.odaTipi.localeCompare(b.odaTipi, 'tr'));
    
    return odaTipleri;
  }

  /**
   * Envanterdeki tüm oda tiplerini döndürür (aktif konaklaması olmasa da)
   */
  private async getTumOdaTipleri(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT odYatOdaTip AS odaTipi
        FROM tblOdaYatak
        WHERE odYatOdaTip IS NOT NULL AND LTRIM(RTRIM(odYatOdaTip)) <> ''
      `;
      const result = (await this.musteriRepository.query(query)) as Array<{ odaTipi: string }>;
      return result.map(r => r.odaTipi).filter(Boolean);
    } catch (error) {
      console.error('getTumOdaTipleri hatası:', error);
      return [];
    }
  }

  /**
   * Tarih dizisi oluşturur
   */
  private createDateArray(startDate: Date, gunSayisi: number): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    console.log(`🏁 Tarih dizisi başlangıç: ${this.formatDate(currentDate)}, hedef gün sayısı: ${gunSayisi}`);
    
    for (let i = 0; i < gunSayisi; i++) {
      const dateToAdd = new Date(currentDate);
      const formattedDate = this.formatDateForDisplay(dateToAdd);
      dates.push(formattedDate);
      
      if (i < 3 || i >= gunSayisi - 3) {
        console.log(`📅 Gün ${i + 1}: ${formattedDate}`);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`✅ Tarih dizisi tamamlandı: ${dates.length} gün oluşturuldu`);
    return dates;
  }

  /**
   * DD.MM.YYYY formatındaki tarihi ISO formatına çevirir
   */
  private parseDate(dateStr: string): string {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      // DD.MM.YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  }

  /**
   * Date objesini DD.MM.YYYY formatına çevirir
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Date objesini display için formatlar (DD.MM.YYYY)
   */
  private formatDateForDisplay(date: Date): string {
    return this.formatDate(date);
  }
}